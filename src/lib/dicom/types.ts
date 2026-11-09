// A DICOM study as RinVita stores it: the files live in storage, and a manifest
// (one JSON file per study) lists every series and instance in viewing order.

export interface DicomInstance {
  sop: string;          // SOP Instance UID
  path: string;         // storage path (or, once signed, a URL)
  num: number;          // Instance Number (0 when missing)
  frames: number;       // Number of Frames (1 for single-frame)
  size: number;         // bytes
  pos?: number;         // position along the slice normal (mm), for sorting
}

export interface DicomSeries {
  uid: string;
  number: number | null;
  modality: string;
  description: string;
  bodyPart?: string;
  rows?: number;
  columns?: number;
  sliceThickness?: number;
  /** A stack of parallel slices that can be shown as MPR and 3D. */
  volumetric: boolean;
  instances: DicomInstance[];
}

export interface DicomManifest {
  version: 1;
  studyUid: string;
  patientName?: string;
  patientId?: string;
  patientBirthDate?: string;
  studyDate?: string;   // YYYY-MM-DD
  description?: string;
  institution?: string;
  accession?: string;
  bodyPart?: string;
  modalities: string[];
  series: DicomSeries[];
}

/** A study read from files on this device, before upload. */
export interface PendingStudy {
  manifest: DicomManifest;
  files: Map<string, Blob>;   // SOP Instance UID -> file
  sizeBytes: number;
  instanceCount: number;
}

export interface IngestResult {
  studies: PendingStudy[];
  skipped: { name: string; reason: string }[];
}

export const VOLUME_MODALITIES = new Set(["CT", "MR", "PT", "NM"]);
export const DICOMDIR_SOP_CLASS = "1.2.840.10008.1.3.10";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
