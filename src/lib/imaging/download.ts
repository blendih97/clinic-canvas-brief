// "Download original study": fetches each original file through the authorised
// stream and zips it in the browser without touching the bytes (STORE, no recompression).
import { downloadZip } from "client-zip";
import { authHeaders, streamUrl, type ImagingAuth, type ViewerStudy } from "./api";

const slug = (s: string) => s.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "study";

export async function downloadOriginalStudy(study: ViewerStudy, auth: ImagingAuth, onProgress?: (done: number, total: number) => void) {
  const headers = await authHeaders(auth);
  const all = study.series.flatMap((s, si) => s.instances.map((inst, ii) => ({ inst, si, ii, s })));
  let done = 0; let first = true;
  async function* files() {
    for (const { inst, si, ii, s } of all) {
      const purpose = "download";
      const url = `${streamUrl(inst.id, purpose)}${first ? "&first=1" : ""}`;
      first = false;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 403 ? "not_permitted" : "download_failed");
      const ext = inst.mime === "image/jpeg" ? "jpg" : inst.mime === "image/png" ? "png" : "dcm";
      const folder = `${slug(study.label)}/${String(si + 1).padStart(2, "0")}_${slug(s.description ?? `series_${si + 1}`)}`;
      yield { name: `${folder}/IM${String(ii + 1).padStart(5, "0")}.${ext}`, input: res, lastModified: new Date() };
      done += 1; onProgress?.(done, all.length);
    }
  }
  const blob = await downloadZip(files()).blob();
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = `${slug(study.label)}_${study.study_date ?? "undated"}_original.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
}
