// RinVita's DICOM viewer: 2D stacks, multi-plane (MPR) and 3D for CT and MRI.
// For viewing and sharing only, not for primary diagnosis. Lazy-loaded (Cornerstone3D is large).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Contrast, Move, ZoomIn, Ruler, Triangle, Crosshair, Layers, Box, Square, Play, Pause, RotateCw,
  FlipHorizontal2, RefreshCcw, Info, Maximize2, Minimize2, X, Download, Eraser, Pipette, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { core, tools, imageIdsFor, prefetchMetadata, startCornerstone } from "@/lib/dicom/engine";
import { studyTitle } from "@/lib/dicom/ingest";
import type { DicomManifest, DicomSeries } from "@/lib/dicom/types";

type Mode = "2d" | "mpr" | "3d";
type ToolName = "wl" | "pan" | "zoom" | "length" | "angle" | "probe" | "crosshairs" | "rotate";

const { Enums: CEnums, RenderingEngine, utilities: cUtils, metaData, cache, volumeLoader, setVolumesForViewports } = core;
const { ToolGroupManager, Enums: TEnums } = tools;
const MB = TEnums.MouseBindings;

const TOOL_CLASS: Record<ToolName, string> = {
  wl: tools.WindowLevelTool.toolName, pan: tools.PanTool.toolName, zoom: tools.ZoomTool.toolName,
  length: tools.LengthTool.toolName, angle: tools.AngleTool.toolName, probe: tools.ProbeTool.toolName,
  crosshairs: tools.CrosshairsTool.toolName, rotate: tools.TrackballRotateTool.toolName,
};

const CT_PRESETS = [
  { label: "Soft tissue", ww: 400, wc: 40 },
  { label: "Lung", ww: 1500, wc: -600 },
  { label: "Bone", ww: 1800, wc: 400 },
  { label: "Brain", ww: 80, wc: 40 },
  { label: "Liver", ww: 150, wc: 30 },
  { label: "Mediastinum", ww: 350, wc: 50 },
];
const VR_PRESETS_CT = ["CT-Bone", "CT-Soft-Tissue", "CT-Lung", "CT-Chest-Contrast-Enhanced", "CT-Cardiac", "CT-MIP"];
const VR_PRESETS_MR = ["MR-Default", "MR-Angio", "MR-MIP", "MR-T2-Brain"];

export interface DicomViewerProps {
  /** Manifest whose instance paths are fetchable URLs (signed). */
  manifest: DicomManifest;
  onClose?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
  /** Shown under the title, e.g. "Shared by Jane Doe". */
  subtitle?: string;
}

let viewerSeq = 0;

export default function DicomViewer({ manifest, onClose, onDownload, downloading, subtitle }: DicomViewerProps) {
  const uid = useMemo(() => `rv${++viewerSeq}`, []);
  const engineId = `${uid}-engine`;
  const rootRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const axRef = useRef<HTMLDivElement>(null);
  const sagRef = useRef<HTMLDivElement>(null);
  const corRef = useRef<HTMLDivElement>(null);
  const vrRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<InstanceType<typeof RenderingEngine> | null>(null);

  const series = manifest.series;
  const [seriesIdx, setSeriesIdx] = useState(() => {
    // Open on the largest series; usually the main one.
    let best = 0;
    series.forEach((s, i) => { if (s.instances.length > series[best].instances.length) best = i; });
    return best;
  });
  const current: DicomSeries = series[seriesIdx];
  const canVolume = current?.volumetric === true;
  const isCT = current?.modality === "CT";

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("2d");
  const [tool, setTool] = useState<ToolName>("wl");
  const [loading, setLoading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [voi, setVoi] = useState<{ ww: number; wc: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [vrPreset, setVrPreset] = useState<string>("");
  const [probeValue, setProbeValue] = useState<string | null>(null);
  const [showSeries, setShowSeries] = useState(true);

  useEffect(() => {
    let alive = true;
    startCornerstone().then(() => alive && setReady(true)).catch(() => alive && setError("The viewer could not start in this browser."));
    return () => { alive = false; };
  }, []);

  // Engine lifetime.
  useEffect(() => {
    if (!ready) return;
    const engine = new RenderingEngine(engineId);
    engineRef.current = engine;
    return () => {
      for (const id of [`${uid}-2d`, `${uid}-mpr`, `${uid}-3d`]) {
        try { ToolGroupManager.destroyToolGroup(id); } catch { /* none */ }
      }
      try { engine.destroy(); } catch { /* gone */ }
      engineRef.current = null;
      try { cache.purgeCache(); } catch { /* ignore */ }
    };
  }, [ready, engineId, uid]);

  const imageIds = useMemo(() => (current ? imageIdsFor(current) : []), [current]);

  const toolGroupId = `${uid}-${mode}`;
  const viewportIds = useMemo(() => (
    mode === "2d" ? [`${uid}-stack`] : mode === "mpr" ? [`${uid}-ax`, `${uid}-sag`, `${uid}-cor`] : [`${uid}-vr`]
  ), [mode, uid]);

  const setupTools = useCallback((groupId: string, vps: string[], m: Mode) => {
    try { ToolGroupManager.destroyToolGroup(groupId); } catch { /* none */ }
    const group = ToolGroupManager.createToolGroup(groupId)!;
    const names = m === "3d"
      ? [tools.TrackballRotateTool, tools.PanTool, tools.ZoomTool]
      : [tools.WindowLevelTool, tools.PanTool, tools.ZoomTool, tools.StackScrollTool, tools.LengthTool, tools.AngleTool, tools.ProbeTool, ...(m === "mpr" ? [tools.CrosshairsTool] : [])];
    for (const T of names) {
      if (T === tools.CrosshairsTool) {
        group.addTool(T.toolName, { getReferenceLineColor: () => "rgb(200, 160, 60)", viewportIndicators: true });
      } else group.addTool(T.toolName);
    }
    vps.forEach((id) => group.addViewport(id, engineId));
    if (m === "3d") {
      group.setToolActive(tools.TrackballRotateTool.toolName, { bindings: [{ mouseButton: MB.Primary }] });
    } else {
      group.setToolActive(tools.WindowLevelTool.toolName, { bindings: [{ mouseButton: MB.Primary }] });
      group.setToolActive(tools.StackScrollTool.toolName, { bindings: [{ mouseButton: MB.Wheel }] });
      for (const n of [tools.LengthTool, tools.AngleTool, tools.ProbeTool]) group.setToolPassive(n.toolName);
    }
    group.setToolActive(tools.PanTool.toolName, { bindings: [{ mouseButton: MB.Auxiliary }, { numTouchPoints: 3 }] });
    group.setToolActive(tools.ZoomTool.toolName, { bindings: [{ mouseButton: MB.Secondary }, { numTouchPoints: 2 }] });
    return group;
  }, [engineId]);

  // Build viewports for the current series and mode.
  useEffect(() => {
    const engine = engineRef.current;
    if (!ready || !engine || !current || imageIds.length === 0) return;
    let cancelled = false;
    setError(null);
    setPlaying(false);
    setInverted(false);
    setProbeValue(null);
    setTool(mode === "3d" ? "rotate" : "wl");

    const run = async () => {
      for (const vp of engine.getViewports()) engine.disableElement(vp.id);

      if (mode === "2d") {
        const el = stackRef.current!;
        engine.enableElement({ viewportId: `${uid}-stack`, type: CEnums.ViewportType.STACK, element: el, defaultOptions: { background: [0, 0, 0] } });
        setupTools(toolGroupId, viewportIds, mode);
        const vp = engine.getViewport(`${uid}-stack`) as core.Types.IStackViewport;
        setTotal(imageIds.length);
        const start = Math.floor(imageIds.length / 2);
        setLoading({ done: 0, total: 1 });
        await vp.setStack(imageIds, imageIds.length > 1 ? start : 0);
        if (cancelled) return;
        setIndex(vp.getCurrentImageIdIndex());
        vp.render();
        setLoading(null);
        readVoi(vp);
        // Load the rest of the stack in the background so scrolling is smooth.
        tools.utilities.stackPrefetch.enable(el);
        return;
      }

      // MPR and 3D need every slice's position first.
      setLoading({ done: 0, total: imageIds.length });
      await prefetchMetadata(imageIds, (done, t) => !cancelled && setLoading({ done, total: t }));
      if (cancelled) return;
      const volumeId = `cornerstoneStreamingImageVolume:${uid}-${current.uid}`;
      const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });
      if (cancelled) return;

      if (mode === "mpr") {
        const O = CEnums.OrientationAxis;
        const inputs = [
          { viewportId: `${uid}-ax`, element: axRef.current!, orientation: O.AXIAL },
          { viewportId: `${uid}-sag`, element: sagRef.current!, orientation: O.SAGITTAL },
          { viewportId: `${uid}-cor`, element: corRef.current!, orientation: O.CORONAL },
        ].map((v) => ({ ...v, type: CEnums.ViewportType.ORTHOGRAPHIC, defaultOptions: { orientation: v.orientation, background: [0, 0, 0] as core.Types.Point3 } }));
        engine.setViewports(inputs);
        setupTools(toolGroupId, viewportIds, mode);
        (volume as unknown as { load: () => void }).load();
        await setVolumesForViewports(engine, [{ volumeId }], viewportIds);
        if (cancelled) return;
        engine.renderViewports(viewportIds);
        setTotal(0);
        readVoi(engine.getViewport(`${uid}-ax`));
      } else {
        // Seen from the front (coronal), like a standing patient.
        engine.enableElement({ viewportId: `${uid}-vr`, type: CEnums.ViewportType.VOLUME_3D, element: vrRef.current!, defaultOptions: { background: [0.02, 0.02, 0.03], orientation: CEnums.OrientationAxis.CORONAL } });
        setupTools(toolGroupId, viewportIds, mode);
        (volume as unknown as { load: () => void }).load();
        await setVolumesForViewports(engine, [{ volumeId }], viewportIds);
        if (cancelled) return;
        const preset = isCT ? "CT-Bone" : "MR-Default";
        setVrPreset(preset);
        const vp = engine.getViewport(`${uid}-vr`) as core.Types.IVolumeViewport;
        vp.setProperties({ preset });
        vp.render();
        setTotal(0);
      }
      setLoading(null);
    };

    run().catch((e) => {
      console.error("DICOM viewer", e);
      if (!cancelled) { setLoading(null); setError("These images could not be displayed. You can still download the original files."); }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, seriesIdx, imageIds]);

  // Keep the overlay in sync with scrolling and window/level changes.
  const readVoi = (vp?: core.Types.IViewport) => {
    const props = (vp as core.Types.IStackViewport | undefined)?.getProperties?.();
    const range = props?.voiRange;
    if (range) {
      const { windowWidth, windowCenter } = cUtils.windowLevel.toWindowLevel(range.lower, range.upper);
      setVoi({ ww: Math.round(windowWidth), wc: Math.round(windowCenter) });
    }
  };
  useEffect(() => {
    if (!ready) return;
    const els = [stackRef.current, axRef.current, sagRef.current, corRef.current].filter(Boolean) as HTMLDivElement[];
    const onImage = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (typeof d?.imageIdIndex === "number") setIndex(d.imageIdIndex);
    };
    const onVoi = (e: Event) => {
      const r = (e as CustomEvent).detail?.range;
      if (r) {
        const { windowWidth, windowCenter } = cUtils.windowLevel.toWindowLevel(r.lower, r.upper);
        setVoi({ ww: Math.round(windowWidth), wc: Math.round(windowCenter) });
      }
    };
    const onAnno = (e: Event) => {
      const a = (e as CustomEvent).detail?.annotation;
      if (a?.metadata?.toolName !== tools.ProbeTool.toolName) return;
      const stats = Object.values(a.data?.cachedStats || {})[0] as { value?: number; modalityUnit?: string } | undefined;
      if (stats?.value !== undefined) setProbeValue(`${Math.round(stats.value)} ${stats.modalityUnit || ""}`.trim());
    };
    els.forEach((el) => {
      el.addEventListener(CEnums.Events.STACK_NEW_IMAGE, onImage);
      el.addEventListener(CEnums.Events.VOI_MODIFIED, onVoi);
    });
    core.eventTarget.addEventListener(TEnums.Events.ANNOTATION_MODIFIED, onAnno);
    core.eventTarget.addEventListener(TEnums.Events.ANNOTATION_COMPLETED, onAnno);
    return () => {
      els.forEach((el) => {
        el.removeEventListener(CEnums.Events.STACK_NEW_IMAGE, onImage);
        el.removeEventListener(CEnums.Events.VOI_MODIFIED, onVoi);
      });
      core.eventTarget.removeEventListener(TEnums.Events.ANNOTATION_MODIFIED, onAnno);
      core.eventTarget.removeEventListener(TEnums.Events.ANNOTATION_COMPLETED, onAnno);
    };
  }, [ready, mode]);

  // Resize with the window and with full screen.
  useEffect(() => {
    const onResize = () => engineRef.current?.resize(true, true);
    const ro = new ResizeObserver(onResize);
    if (rootRef.current) ro.observe(rootRef.current);
    const onFs = () => { setFullscreen(!!document.fullscreenElement); setTimeout(onResize, 50); };
    document.addEventListener("fullscreenchange", onFs);
    return () => { ro.disconnect(); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const group = () => ToolGroupManager.getToolGroup(toolGroupId);
  const viewports = () => viewportIds.map((id) => engineRef.current?.getViewport(id)).filter(Boolean) as core.Types.IViewport[];

  const chooseTool = (t: ToolName) => {
    const g = group();
    if (!g) return;
    const prev = TOOL_CLASS[tool];
    if (prev && g.hasTool(prev)) {
      if (["length", "angle", "probe"].includes(tool)) g.setToolPassive(prev);
      else if (tool === "crosshairs") g.setToolDisabled(prev);
      else if (tool !== "pan" && tool !== "zoom") g.setToolPassive(prev);
    }
    // Pan and zoom keep their own buttons; restore their default bindings when leaving them.
    g.setToolActive(tools.PanTool.toolName, { bindings: [{ mouseButton: MB.Auxiliary }, { numTouchPoints: 3 }] });
    g.setToolActive(tools.ZoomTool.toolName, { bindings: [{ mouseButton: MB.Secondary }, { numTouchPoints: 2 }] });
    const next = TOOL_CLASS[t];
    if (g.hasTool(next)) {
      const extra = t === "pan" ? [{ mouseButton: MB.Auxiliary }, { numTouchPoints: 3 }] : t === "zoom" ? [{ mouseButton: MB.Secondary }, { numTouchPoints: 2 }] : [];
      g.setToolActive(next, { bindings: [{ mouseButton: MB.Primary }, ...extra] });
    }
    setTool(t);
  };

  const applyPreset = (ww: number, wc: number) => {
    for (const vp of viewports()) {
      (vp as core.Types.IStackViewport).setProperties({ voiRange: cUtils.windowLevel.toLowHighRange(ww, wc) });
      vp.render();
    }
    setVoi({ ww, wc });
  };

  const applyVrPreset = (p: string) => {
    const vp = engineRef.current?.getViewport(`${uid}-vr`) as core.Types.IVolumeViewport | undefined;
    if (!vp) return;
    vp.setProperties({ preset: p });
    vp.render();
    setVrPreset(p);
  };

  const toggleInvert = () => {
    const next = !inverted;
    for (const vp of viewports()) {
      (vp as core.Types.IStackViewport).setProperties({ invert: next });
      vp.render();
    }
    setInverted(next);
  };

  const rotate = () => {
    for (const vp of viewports()) {
      const v = vp as core.Types.IStackViewport;
      const r = (v.getViewPresentation?.().rotation ?? 0) + 90;
      v.setViewPresentation({ rotation: r % 360 });
      v.render();
    }
  };

  const flip = () => {
    for (const vp of viewports()) {
      const cam = vp.getCamera();
      vp.setCamera({ flipHorizontal: !cam.flipHorizontal });
      vp.render();
    }
  };

  const reset = () => {
    for (const vp of viewports()) {
      const v = vp as core.Types.IStackViewport;
      v.resetCamera?.();
      v.resetProperties?.();
      v.render();
    }
    setInverted(false);
    readVoi(viewports()[0]);
  };

  const clearMeasurements = () => {
    tools.annotation.state.removeAllAnnotations();
    setProbeValue(null);
    engineRef.current?.render();
  };

  const togglePlay = () => {
    const el = stackRef.current;
    if (!el || mode !== "2d") return;
    if (playing) tools.utilities.cine.stopClip(el);
    else tools.utilities.cine.playClip(el, { framesPerSecond: total > 60 ? 20 : 10, loop: true });
    setPlaying(!playing);
  };

  const jumpTo = async (i: number) => {
    const vp = engineRef.current?.getViewport(`${uid}-stack`) as core.Types.IStackViewport | undefined;
    if (!vp) return;
    await vp.setImageIdIndex(i);
    setIndex(i);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  };

  // Keyboard: arrows scroll, space plays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT") return;
      if (mode !== "2d") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); void jumpTo(Math.min(total - 1, index + 1)); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); void jumpTo(Math.max(0, index - 1)); }
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "Escape" && !document.fullscreenElement) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const info = useInfo(current, imageIds[index] || imageIds[0], showInfo);
  const title = studyTitle(manifest);

  const ToolBtn = ({ t, icon: Icon, label }: { t: ToolName; icon: typeof Contrast; label: string }) => (
    <button type="button" onClick={() => chooseTool(t)} title={label} aria-label={label} aria-pressed={tool === t}
      className={`shrink-0 inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] ${tool === t ? "bg-[#c8a03c]/20 text-[#e6c46a]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );
  const ActBtn = ({ onClick, icon: Icon, label, active, disabled }: { onClick: () => void; icon: typeof Contrast; label: string; active?: boolean; disabled?: boolean }) => (
    <button type="button" onClick={onClick} title={label} aria-label={label} disabled={disabled}
      className={`shrink-0 inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] disabled:opacity-30 ${active ? "bg-[#c8a03c]/20 text-[#e6c46a]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  const vpBox = "bg-black overflow-hidden min-h-0 min-w-0";
  const corner = "absolute text-[10px] leading-tight text-white/80 pointer-events-none select-none font-mono";

  return (
    <div ref={rootRef} className="fixed inset-0 z-[80] bg-[#0b0c0f] text-white flex flex-col" data-testid="dicom-viewer">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-[11px] text-white/50 truncate">
            {[manifest.studyDate && new Date(`${manifest.studyDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), manifest.institution, subtitle].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="hidden md:inline text-[10px] uppercase tracking-wider text-white/40">For viewing and sharing. Not for primary diagnosis.</span>
        {onDownload && (
          <button type="button" onClick={onDownload} disabled={downloading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}<span className="hidden sm:inline">Download DICOM</span>
          </button>
        )}
        <button type="button" onClick={toggleFullscreen} aria-label="Full screen" className="p-1.5 rounded-md hover:bg-white/10 hidden sm:block">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {onClose && <button type="button" onClick={onClose} aria-label="Close viewer" className="p-1.5 rounded-md hover:bg-white/10"><X className="w-5 h-5" /></button>}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 overflow-x-auto">
        <div className="flex items-center gap-1 pr-2 mr-1 border-r border-white/10">
          <ActBtn onClick={() => setMode("2d")} icon={Square} label="2D" active={mode === "2d"} />
          <ActBtn onClick={() => setMode("mpr")} icon={Layers} label="MPR" active={mode === "mpr"} disabled={!canVolume} />
          <ActBtn onClick={() => setMode("3d")} icon={Box} label="3D" active={mode === "3d"} disabled={!canVolume} />
        </div>
        {mode === "3d" ? (
          <>
            <ToolBtn t="rotate" icon={RotateCw} label="Rotate" />
            <ToolBtn t="pan" icon={Move} label="Pan" />
            <ToolBtn t="zoom" icon={ZoomIn} label="Zoom" />
            <select value={vrPreset} onChange={(e) => applyVrPreset(e.target.value)} aria-label="3D preset"
              className="ml-1 bg-white/10 text-xs text-white rounded-md px-2 py-1.5 border border-white/10">
              {(isCT ? VR_PRESETS_CT : VR_PRESETS_MR).map((p) => <option key={p} value={p} className="text-black">{p.replace(/^(CT|MR)-/, "").replace(/-/g, " ")}</option>)}
            </select>
          </>
        ) : (
          <>
            <ToolBtn t="wl" icon={Contrast} label="Contrast" />
            <ToolBtn t="pan" icon={Move} label="Pan" />
            <ToolBtn t="zoom" icon={ZoomIn} label="Zoom" />
            <ToolBtn t="length" icon={Ruler} label="Length" />
            <ToolBtn t="angle" icon={Triangle} label="Angle" />
            <ToolBtn t="probe" icon={Pipette} label={isCT ? "HU" : "Value"} />
            {mode === "mpr" && <ToolBtn t="crosshairs" icon={Crosshair} label="Crosshairs" />}
            <div className="w-px h-8 bg-white/10 mx-1" />
            {isCT && (
              <select onChange={(e) => { const p = CT_PRESETS[Number(e.target.value)]; if (p) applyPreset(p.ww, p.wc); e.target.value = ""; }} defaultValue=""
                aria-label="Window preset" className="bg-white/10 text-xs text-white rounded-md px-2 py-1.5 border border-white/10">
                <option value="" disabled className="text-black">Window</option>
                {CT_PRESETS.map((p, i) => <option key={p.label} value={i} className="text-black">{p.label}</option>)}
              </select>
            )}
            <ActBtn onClick={toggleInvert} icon={Contrast} label="Invert" active={inverted} />
            {mode === "2d" && <ActBtn onClick={rotate} icon={RotateCw} label="Rotate" />}
            <ActBtn onClick={flip} icon={FlipHorizontal2} label="Flip" />
            {mode === "2d" && total > 1 && <ActBtn onClick={togglePlay} icon={playing ? Pause : Play} label={playing ? "Pause" : "Cine"} active={playing} />}
            <ActBtn onClick={clearMeasurements} icon={Eraser} label="Clear" />
          </>
        )}
        <ActBtn onClick={reset} icon={RefreshCcw} label="Reset" />
        <ActBtn onClick={() => setShowInfo(!showInfo)} icon={Info} label="Details" active={showInfo} />
      </div>

      <div className="flex-1 flex flex-col-reverse md:flex-row min-h-0">
        {/* Series */}
        {series.length > 0 && (
          <div className={`md:w-44 shrink-0 border-t md:border-t-0 md:border-r border-white/10 ${showSeries ? "" : "md:w-8"}`}>
            <button type="button" onClick={() => setShowSeries(!showSeries)} className="hidden md:flex w-full items-center justify-between px-2 py-1.5 text-[10px] uppercase tracking-wider text-white/50 hover:text-white">
              {showSeries && <span>Series ({series.length})</span>}{showSeries ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showSeries && (
              <div className="flex md:flex-col gap-2 p-2 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-150px)]">
                {series.map((s, i) => (
                  <SeriesThumb key={s.uid} series={s} active={i === seriesIdx} ready={ready}
                    onClick={() => { if (i !== seriesIdx) { setSeriesIdx(i); if (!s.volumetric) setMode("2d"); } }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Viewports */}
        <div className="relative flex-1 min-h-0 min-w-0">
          {mode === "2d" && (
            <div className={`${vpBox} absolute inset-0`} onContextMenu={(e) => e.preventDefault()}>
              <div ref={stackRef} className="absolute inset-0" />
              <div className={`${corner} top-2 left-2`}>
                <div>{current?.description || current?.modality}</div>
                <div>{manifest.patientName}</div>
              </div>
              <div className={`${corner} top-2 right-2 text-right`}>
                {total > 0 && <div>Image {index + 1} / {total}</div>}
                {current?.sliceThickness ? <div>Thickness {current.sliceThickness} mm</div> : null}
              </div>
              <div className={`${corner} bottom-2 left-2`}>
                {voi && <div>W {voi.ww} · L {voi.wc}</div>}
                {probeValue && <div>Value: {probeValue}</div>}
              </div>
            </div>
          )}
          {mode === "mpr" && (
            <div className="absolute inset-0 grid grid-cols-1 grid-rows-3 md:grid-cols-2 md:grid-rows-2 gap-px bg-white/10" onContextMenu={(e) => e.preventDefault()}>
              {[["Axial", axRef, "md:row-span-2"], ["Sagittal", sagRef, ""], ["Coronal", corRef, ""]].map(([label, ref, cls]) => (
                <div key={label as string} className={`relative ${vpBox} ${cls}`}>
                  <div ref={ref as React.RefObject<HTMLDivElement>} className="absolute inset-0" />
                  <div className={`${corner} top-2 left-2 text-[#e6c46a]`}>{label as string}</div>
                </div>
              ))}
              {voi && <div className={`${corner} bottom-2 right-2`}>W {voi.ww} · L {voi.wc}</div>}
            </div>
          )}
          {mode === "3d" && (
            <div className={`${vpBox} absolute inset-0`} onContextMenu={(e) => e.preventDefault()}>
              <div ref={vrRef} className="absolute inset-0" />
              <div className={`${corner} top-2 left-2`}>3D · drag to rotate</div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#e6c46a]" />
                <p className="mt-2 text-xs text-white/70">
                  {loading.total > 1 ? `Loading images ${loading.done} of ${loading.total}` : "Loading images"}
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="max-w-sm text-center text-sm text-white/80">{error}</p>
            </div>
          )}

          {showInfo && <InfoPanel rows={info} onClose={() => setShowInfo(false)} />}
        </div>
      </div>

      {/* Slice slider (2D) */}
      {mode === "2d" && total > 1 && (
        <div className="px-3 py-2 border-t border-white/10 flex items-center gap-3">
          <input type="range" min={0} max={total - 1} value={index} onChange={(e) => void jumpTo(Number(e.target.value))} aria-label="Image" className="flex-1 accent-[#c8a03c]" />
          <span className="text-[11px] text-white/60 w-16 text-right">{index + 1} / {total}</span>
        </div>
      )}
      <p className="md:hidden px-3 pb-2 text-[10px] text-white/40">For viewing and sharing. Not for primary diagnosis.</p>
    </div>
  );
}

function SeriesThumb({ series, active, ready, onClick }: { series: DicomSeries; active: boolean; ready: boolean; onClick: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const ids = imageIdsFor(series);
    const id = ids[Math.floor(ids.length / 2)];
    if (!id) return;
    cUtils.loadImageToCanvas({ canvas: ref.current, imageId: id, thumbnail: true, imageAspect: true }).catch(() => { /* leave blank */ });
  }, [ready, series]);
  const frames = series.instances.reduce((n, i) => n + i.frames, 0);
  return (
    <button type="button" onClick={onClick} className={`shrink-0 w-28 md:w-full text-left rounded-md overflow-hidden border ${active ? "border-[#c8a03c]" : "border-white/10 hover:border-white/30"}`}>
      <div className="w-full aspect-square bg-black flex items-center justify-center"><canvas ref={ref} width={160} height={160} className="max-w-full max-h-full block" /></div>
      <div className="px-1.5 py-1">
        <p className="text-[10px] text-white truncate">{series.description || series.modality}</p>
        <p className="text-[10px] text-white/50">{series.modality} · {frames} {frames === 1 ? "image" : "images"}</p>
      </div>
    </button>
  );
}

function useInfo(series: DicomSeries | undefined, imageId: string | undefined, enabled: boolean) {
  const [rows, setRows] = useState<[string, string][]>([]);
  useEffect(() => {
    if (!enabled || !imageId) return;
    const get = (m: string) => (metaData.get(m, imageId) || {}) as Record<string, unknown>;
    const p = get("patientModule"), st = get("generalStudyModule"), se = get("generalSeriesModule"), plane = get("imagePlaneModule"), px = get("imagePixelModule"), eq = get("generalEquipmentModule");
    const fmt = (v: unknown) => (v === undefined || v === null || v === "" ? "" : Array.isArray(v) ? v.map((x) => (typeof x === "number" ? Math.round(x * 100) / 100 : x)).join(" × ") : typeof v === "object" && v && "Alphabetic" in (v as object) ? String((v as { Alphabetic: string }).Alphabetic) : String(v));
    const all: [string, unknown][] = [
      ["Patient", p.patientName], ["Patient ID", p.patientId], ["Study", st.studyDescription], ["Study date", st.studyDate],
      ["Accession", st.accessionNumber], ["Series", se.seriesDescription ?? series?.description], ["Modality", se.modality ?? series?.modality],
      ["Series number", se.seriesNumber], ["Body part", se.bodyPartExamined ?? series?.bodyPart], ["Manufacturer", eq.manufacturer],
      ["Model", eq.manufacturerModelName], ["Matrix", px.rows && px.columns ? `${px.columns} × ${px.rows}` : ""],
      ["Pixel spacing (mm)", plane.pixelSpacing ?? plane.rowPixelSpacing], ["Slice thickness (mm)", plane.sliceThickness ?? series?.sliceThickness],
      ["Slice location", plane.sliceLocation], ["Bits stored", px.bitsStored], ["Photometric", px.photometricInterpretation],
    ];
    setRows(all.map(([k, v]) => [k, fmt(v)] as [string, string]).filter(([, v]) => v));
  }, [enabled, imageId, series]);
  return rows;
}

function InfoPanel({ rows, onClose }: { rows: [string, string][]; onClose: () => void }) {
  return (
    <div className="absolute top-2 right-2 bottom-2 w-72 max-w-[85%] bg-[#14161b]/95 border border-white/10 rounded-lg overflow-y-auto z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 sticky top-0 bg-[#14161b]">
        <p className="text-xs font-medium">Image details</p>
        <button type="button" onClick={onClose} aria-label="Close details" className="p-1 hover:bg-white/10 rounded"><X className="w-3.5 h-3.5" /></button>
      </div>
      <dl className="px-3 py-2 space-y-1.5">
        {rows.length === 0 && <p className="text-xs text-white/50">No details available for this image.</p>}
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-[11px]">
            <dt className="text-white/50">{k}</dt><dd className="text-white break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
