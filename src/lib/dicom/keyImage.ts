// Renders one representative image of a study (the middle slice of its largest series) as a PNG,
// for the scan card and the Health Brief PDF. Uses the viewer's engine, so it is lazy-loaded.
import { core, imageIdsFor, startCornerstone } from "./engine";
import type { DicomManifest } from "./types";

export async function renderKeyImage(signed: DicomManifest, size = 512): Promise<Blob | null> {
  await startCornerstone();
  const series = [...signed.series].sort((a, b) => b.instances.length - a.instances.length)[0];
  if (!series) return null;
  const ids = imageIdsFor(series);
  const id = ids[Math.floor(ids.length / 2)];
  if (!id) return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  await core.utilities.loadImageToCanvas({ canvas, imageId: id, imageAspect: true });
  // Square black frame, image centred.
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / canvas.width, size / canvas.height);
  const w = canvas.width * scale, h = canvas.height * scale;
  ctx.drawImage(canvas, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve) => out.toBlob((b) => resolve(b), "image/png"));
}
