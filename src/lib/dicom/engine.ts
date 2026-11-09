// Starts Cornerstone3D (rendering, tools and the DICOM loader) once per page.
// Imported only by the viewer, which is lazy-loaded, so the rest of the app stays light.
import * as core from "@cornerstonejs/core";
import * as tools from "@cornerstonejs/tools";
import * as loader from "@cornerstonejs/dicom-image-loader";
import type { DicomInstance, DicomSeries } from "./types";

let started: Promise<void> | null = null;

export function startCornerstone(): Promise<void> {
  if (!started) {
    started = (async () => {
      await core.init();
      loader.init({
        maxWebWorkers: Math.min(4, Math.max(1, Math.floor((navigator.hardwareConcurrency || 2) / 2))),
      } as Parameters<typeof loader.init>[0]);
      core.volumeLoader.registerVolumeLoader(
        "cornerstoneStreamingImageVolume",
        core.cornerstoneStreamingImageVolumeLoader as unknown as Parameters<typeof core.volumeLoader.registerVolumeLoader>[1],
      );
      tools.init();
      for (const T of [
        tools.WindowLevelTool, tools.PanTool, tools.ZoomTool, tools.StackScrollTool, tools.LengthTool,
        tools.AngleTool, tools.ProbeTool, tools.CrosshairsTool, tools.TrackballRotateTool,
      ]) {
        try { tools.addTool(T); } catch { /* already added */ }
      }
    })().catch((e) => {
      started = null;
      throw e;
    });
  }
  return started;
}

/** One image id per frame, in viewing order. `url` must already be a fetchable URL. */
export function imageIdsFor(series: DicomSeries): string[] {
  const ids: string[] = [];
  for (const i of series.instances as DicomInstance[]) {
    if (i.frames > 1) for (let f = 1; f <= i.frames; f++) ids.push(`wadouri:${i.path}${i.path.includes("?") ? "&" : "?"}frame=${f}`);
    else ids.push(`wadouri:${i.path}`);
  }
  return ids;
}

/** Downloads and parses every file, so volume loading has each slice's position. */
export async function prefetchMetadata(imageIds: string[], onProgress?: (done: number, total: number) => void): Promise<void> {
  let done = 0;
  const urls = [...new Set(imageIds.map((id) => id.replace(/^wadouri:/, "").replace(/[?&]frame=\d+$/, "")))];
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift()!;
      await loader.wadouri.dataSetCacheManager.load(url, undefined as never, url);
      done++;
      onProgress?.(done, urls.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, worker));
}

export { core, tools, loader };
