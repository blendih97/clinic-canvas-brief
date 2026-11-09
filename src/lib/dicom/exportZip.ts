// Packs studies as a CD-style folder (DICOMDIR + DICOM/STxxxx/SExxxx/IMxxxxxx) inside a ZIP,
// so a clinic can import it into its PACS or open it in any DICOM viewer.
import { zip, type Zippable } from "fflate";
import { buildDicomDir, type DicomDirEntry } from "./dicomdir";

export interface ExportSeries { instances: Uint8Array[] }
export interface ExportStudy { series: ExportSeries[] }

const pad = (n: number, w: number) => String(n).padStart(w, "0");

export function layoutStudies(studies: ExportStudy[]): DicomDirEntry[] {
  const entries: DicomDirEntry[] = [];
  studies.forEach((st, a) => st.series.forEach((se, b) => se.instances.forEach((bytes, c) => {
    entries.push({ fileId: ["DICOM", `ST${pad(a + 1, 4)}`, `SE${pad(b + 1, 4)}`, `IM${pad(c + 1, 6)}`], bytes });
  })));
  return entries;
}

const README = `This folder holds medical images in DICOM format, exported from RinVita.

To view or import them:
- Most PACS systems and DICOM viewers can import this folder directly. Point the import at the DICOMDIR file or at this whole folder.
- The DICOMDIR file is an index of every image, as on a hospital CD.

The images are exactly as the patient received them. RinVita has not changed them.
`;

export function buildExportZip(studies: ExportStudy[]): Promise<Uint8Array> {
  const entries = layoutStudies(studies);
  const files: Zippable = {
    DICOMDIR: [buildDicomDir(entries), { level: 0 }],
    "README.txt": new TextEncoder().encode(README),
  };
  for (const e of entries) files[e.fileId.join("/")] = [e.bytes, { level: 0 }];
  return new Promise((resolve, reject) => zip(files, (err, out) => (err ? reject(err) : resolve(out))));
}
