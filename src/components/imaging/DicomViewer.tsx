// Browser DICOM viewer built on Cornerstone3D (the engine behind OHIF).
// Image bytes are fetched only through the authorised imaging-stream function.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RenderingEngine, Enums as CoreEnums, init as coreInit, metaData, eventTarget, type Types,
} from "@cornerstonejs/core";
import * as csTools from "@cornerstonejs/tools";
import dicomImageLoader from "@cornerstonejs/dicom-image-loader";
import {
  Contrast, Move, ZoomIn, Layers, RotateCcw, Maximize2, Minimize2, Play, Pause, SunMoon, Download, X, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { authHeaders, streamUrl, type ImagingAuth, type ViewerSeries, type ViewerStudy, formatStudyDate } from "@/lib/imaging/api";

const { WindowLevelTool, PanTool, ZoomTool, StackScrollTool, ToolGroupManager, Enums: ToolEnums } = csTools;

let initialised: Promise<void> | null = null;
let currentAuth: ImagingAuth = { mode: "owner" };

function ensureInit() {
  initialised ??= (async () => {
    coreInit();
    dicomImageLoader.init({
      maxWebWorkers: Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 2) / 2))),
      beforeSend: async () => authHeaders(currentAuth),
      // The v5 'naturalized' wadouri path failed to find pixel data for valid files
      // in testing; the long-standing provider decodes all fixtures correctly.
      useLegacyMetadataProvider: true,
    });
    csTools.init();
    [WindowLevelTool, PanTool, ZoomTool, StackScrollTool].forEach(t => { try { csTools.addTool(t); } catch { /* already added */ } });
  })();
  return initialised;
}

type ToolName = "scroll" | "contrast" | "zoom" | "pan";
const TOOL_CLASS: Record<ToolName, string> = {
  scroll: StackScrollTool.toolName, contrast: WindowLevelTool.toolName, zoom: ZoomTool.toolName, pan: PanTool.toolName,
};

/** Builds one image id per frame so multi-frame files scroll like a stack. */
function imageIdsFor(series: ViewerSeries): string[] {
  const ids: string[] = [];
  for (const inst of series.instances) {
    if (!inst.viewable || inst.mime !== "application/dicom") continue;
    const base = `wadouri:${streamUrl(inst.id)}`;
    if (inst.frames > 1) for (let f = 1; f <= inst.frames; f++) ids.push(`${base}&frame=${f}`);
    else ids.push(base);
  }
  return ids;
}

/** Patient orientation letters for the screen edges from the image plane. */
function orientationLabels(imageId: string): { left: string; top: string } | null {
  const plane = metaData.get("imagePlaneModule", imageId) as { rowCosines?: number[]; columnCosines?: number[] } | undefined;
  if (!plane?.rowCosines || !plane?.columnCosines) return null;
  const letter = (v: number[], negate: boolean) => {
    const [x, y, z] = negate ? v.map(n => -n) : v;
    const ax = [Math.abs(x), Math.abs(y), Math.abs(z)];
    const i = ax.indexOf(Math.max(...ax));
    return i === 0 ? (x > 0 ? "L" : "R") : i === 1 ? (y > 0 ? "P" : "A") : (z > 0 ? "H" : "F");
  };
  return { left: letter(plane.rowCosines, true), top: letter(plane.columnCosines, true) };
}

type Props = {
  study: ViewerStudy;
  auth: ImagingAuth;
  onClose?: () => void;
  onDownload?: () => void;
  downloading?: string | null;
};

export default function DicomViewer({ study, auth, onClose, onDownload, downloading }: Props) {
  currentAuth = auth;
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const ids = useMemo(() => ({ engine: `rv-engine-${study.id}`, viewport: `rv-vp-${study.id}`, group: `rv-tg-${study.id}` }), [study.id]);
  const viewable = useMemo(() => study.series.filter(s => imageIdsFor(s).length > 0), [study]);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [tool, setTool] = useState<ToolName>("scroll");
  const [voi, setVoi] = useState<{ wc: number; ww: number } | null>(null);
  const [orient, setOrient] = useState<{ left: string; top: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const series = viewable[seriesIndex];

  const viewport = () => engineRef.current?.getViewport(ids.viewport) as Types.IStackViewport | undefined;

  // Engine + tool group lifecycle
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureInit();
      if (cancelled || !elementRef.current) return;
      const engine = new RenderingEngine(ids.engine);
      engineRef.current = engine;
      engine.enableElement({ viewportId: ids.viewport, type: CoreEnums.ViewportType.STACK, element: elementRef.current, defaultOptions: { background: [0, 0, 0] as Types.Point3 } });
      const group = ToolGroupManager.createToolGroup(ids.group)!;
      [WindowLevelTool, PanTool, ZoomTool, StackScrollTool].forEach(t => group.addTool(t.toolName));
      group.addViewport(ids.viewport, ids.engine);
      group.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }, { mouseButton: ToolEnums.MouseBindings.Wheel }] });
      group.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }] });
      group.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
      group.setToolPassive(WindowLevelTool.toolName);
      setCount(c => c); // trigger stack load effect
    })().catch(() => setError("The viewer could not start in this browser."));
    return () => {
      cancelled = true;
      try { ToolGroupManager.destroyToolGroup(ids.group); } catch { /* noop */ }
      try { engineRef.current?.destroy(); } catch { /* noop */ }
      engineRef.current = null;
    };
  }, [ids]);

  // Load the selected series
  useEffect(() => {
    if (!series) return;
    let cancelled = false;
    const load = async () => {
      await ensureInit();
      for (let i = 0; i < 50 && !viewport(); i++) await new Promise(r => setTimeout(r, 50));
      const vp = viewport(); if (!vp || cancelled) return;
      setLoading(true); setError(null); setPlaying(false);
      const imageIds = imageIdsFor(series);
      setCount(imageIds.length);
      const start = Math.floor(imageIds.length / 2);
      try {
        await vp.setStack(imageIds, start);
        if (cancelled) return;
        vp.render();
        setIndex(start);
        setOrient(orientationLabels(imageIds[start]));
        const p = vp.getProperties(); const r = p.voiRange;
        if (r) setVoi({ ww: Math.round(r.upper - r.lower), wc: Math.round((r.upper + r.lower) / 2) });
      } catch {
        if (!cancelled) setError("These images can't be displayed in the browser. The original files are kept safely and can still be downloaded.");
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [series, ids]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep slice index / contrast readouts in sync with tool interaction
  useEffect(() => {
    const el = elementRef.current; if (!el) return;
    const onNew = () => { const vp = viewport(); if (vp) setIndex(vp.getCurrentImageIdIndex()); };
    const onVoi = () => { const r = viewport()?.getProperties().voiRange; if (r) setVoi({ ww: Math.round(r.upper - r.lower), wc: Math.round((r.upper + r.lower) / 2) }); };
    el.addEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onNew);
    el.addEventListener(CoreEnums.Events.VOI_MODIFIED, onVoi);
    const onFail = () => setError("Some images in this series could not be decoded. The original files are kept and can be downloaded.");
    eventTarget.addEventListener(CoreEnums.Events.IMAGE_LOAD_FAILED, onFail);
    return () => {
      el.removeEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onNew);
      el.removeEventListener(CoreEnums.Events.VOI_MODIFIED, onVoi);
      eventTarget.removeEventListener(CoreEnums.Events.IMAGE_LOAD_FAILED, onFail);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Primary-button tool selection (important on touch screens)
  useEffect(() => {
    const group = ToolGroupManager.getToolGroup(ids.group); if (!group) return;
    (Object.keys(TOOL_CLASS) as ToolName[]).forEach(t => group.setToolPassive(TOOL_CLASS[t]));
    group.setToolActive(TOOL_CLASS[tool], { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] });
    group.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }, ...(tool === "scroll" ? [{ mouseButton: ToolEnums.MouseBindings.Primary }] : [])] });
    if (tool !== "pan") group.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }] });
    if (tool !== "zoom") group.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] });
  }, [tool, ids]);

  // Cine playback for multi-frame / long series
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const vp = viewport(); if (!vp) return;
      const n = vp.getImageIds().length; const next = (vp.getCurrentImageIdIndex() + 1) % n;
      void vp.setImageIdIndex(next);
    }, 80);
    return () => clearInterval(t);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize with container / full-screen
  useEffect(() => {
    const ro = new ResizeObserver(() => { try { engineRef.current?.resize(true, true); } catch { /* noop */ } });
    if (containerRef.current) ro.observe(containerRef.current);
    const onFs = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => { ro.disconnect(); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const goTo = useCallback((i: number) => { const vp = viewport(); if (vp && count) void vp.setImageIdIndex(Math.max(0, Math.min(count - 1, i))); }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = () => { const vp = viewport(); if (!vp) return; vp.resetCamera(); vp.resetProperties(); vp.render(); };
  const invert = () => { const vp = viewport(); if (!vp) return; vp.setProperties({ invert: !vp.getProperties().invert }); vp.render(); };
  const toggleFs = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void containerRef.current?.requestFullscreen?.(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); goTo(index + 1); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); goTo(index - 1); }
  };

  const ToolBtn = ({ name, icon: Icon, label }: { name: ToolName; icon: typeof Contrast; label: string }) => (
    <button type="button" onClick={() => setTool(name)} aria-pressed={tool === name}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[11px] ${tool === name ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  if (!viewable.length) {
    return (
      <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground flex gap-3">
        <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
        <div>This study has no images that can be shown in the browser (for example, it contains only structured reports or an unsupported format).
          {onDownload && <> The original files are kept: <button className="underline text-primary" onClick={onDownload}>download the original study</button>.</>}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-black text-white rounded-lg overflow-hidden h-full min-h-[480px]" data-testid="dicom-viewer">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{study.label}</p>
          <p className="text-[11px] text-white/60">{formatStudyDate(study.study_date)} · {viewable.length} series</p>
        </div>
        <div className="flex items-center gap-1">
          {onDownload && (
            <button type="button" onClick={onDownload} disabled={!!downloading} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-60">
              <Download className="w-3.5 h-3.5" />{downloading ?? "Download original"}
            </button>
          )}
          <button type="button" onClick={toggleFs} aria-label={fullscreen ? "Exit full screen" : "Full screen"} className="p-2 rounded-md hover:bg-white/10">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && <button type="button" onClick={onClose} aria-label="Close viewer" className="p-2 rounded-md hover:bg-white/10"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Series list */}
        <div className="md:w-48 shrink-0 flex md:flex-col gap-1 overflow-auto p-2 border-b md:border-b-0 md:border-r border-white/10">
          {viewable.map((s, i) => (
            <button key={s.id} type="button" onClick={() => setSeriesIndex(i)} data-testid="series-button"
              className={`text-left rounded-md px-2.5 py-2 text-xs shrink-0 ${i === seriesIndex ? "bg-white/15" : "hover:bg-white/10 text-white/80"}`}>
              <span className="block font-medium truncate max-w-[160px]">{s.description || `Series ${s.series_number ?? i + 1}`}</span>
              <span className="text-white/50">{imageIdsFor(s).length} images</span>
            </button>
          ))}
        </div>

        {/* Viewport */}
        <div className="relative flex-1 min-h-[360px]" tabIndex={0} onKeyDown={onKey} aria-label="Scan image. Use arrow keys to move between images.">
          <div ref={elementRef} className="absolute inset-0" onContextMenu={e => e.preventDefault()} data-testid="viewport" />
          {orient && (<>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-amber-300/90 pointer-events-none">{orient.left}</span>
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-amber-300/90 pointer-events-none">{orient.top}</span>
          </>)}
          <div className="absolute bottom-2 left-2 text-[11px] text-white/80 pointer-events-none" data-testid="slice-indicator">
            Image {count ? index + 1 : 0} / {count}{voi && <> · W {voi.ww} L {voi.wc}</>}
          </div>
          {loading && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70 pointer-events-none">Loading images…</div>}
          {error && <div className="absolute top-2 left-2 right-2 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-100 text-xs p-2" role="alert" data-testid="viewer-error">{error}</div>}
          {count > 1 && (
            <div className="absolute right-2 top-10 bottom-10 flex flex-col items-center gap-1">
              <button type="button" aria-label="Previous image" onClick={() => goTo(index - 1)} className="p-1 rounded bg-white/10"><ChevronLeft className="w-3 h-3 rotate-90" /></button>
              <input type="range" min={0} max={count - 1} value={index} onChange={e => goTo(Number(e.target.value))} aria-label="Image position"
                className="flex-1 accent-amber-400" style={{ writingMode: "vertical-lr" as React.CSSProperties["writingMode"] }} data-testid="slice-slider" />
              <button type="button" aria-label="Next image" onClick={() => goTo(index + 1)} className="p-1 rounded bg-white/10"><ChevronRight className="w-3 h-3 rotate-90" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-1 flex-wrap px-2 py-1.5 border-t border-white/10">
        <ToolBtn name="scroll" icon={Layers} label="Scroll" />
        <ToolBtn name="contrast" icon={Contrast} label="Contrast" />
        <ToolBtn name="zoom" icon={ZoomIn} label="Zoom" />
        <ToolBtn name="pan" icon={Move} label="Pan" />
        <button type="button" onClick={invert} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[11px] text-white/70 hover:bg-white/10"><SunMoon className="w-4 h-4" />Invert</button>
        <button type="button" onClick={reset} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[11px] text-white/70 hover:bg-white/10"><RotateCcw className="w-4 h-4" />Reset</button>
        {count > 1 && (
          <button type="button" onClick={() => setPlaying(p => !p)} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md text-[11px] text-white/70 hover:bg-white/10">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{playing ? "Pause" : "Play"}
          </button>
        )}
      </div>
      <p className="px-3 pb-2 text-[10px] text-white/40 text-center">For viewing only. Not a diagnostic workstation; confirm findings on the original images and the radiologist's report.</p>
    </div>
  );
}
