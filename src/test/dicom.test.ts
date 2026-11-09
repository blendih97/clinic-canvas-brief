import { describe, expect, it } from "vitest";
import { dicomDate, personName, studyTitle } from "@/lib/dicom/ingest";
import { mergeManifests, summarise } from "@/lib/dicom/storage";
import { isDicomCandidate } from "@/lib/dicom/requestUpload";
import type { DicomManifest } from "@/lib/dicom/types";

const base = (sops: [string, number][]): DicomManifest => ({
  version: 1, studyUid: "1.2.3", modalities: ["CT"], description: "CT CHEST",
  series: [{ uid: "1.2.3.1", number: 1, modality: "CT", description: "Axial", volumetric: true,
    instances: sops.map(([sop, pos]) => ({ sop, path: `p/${sop}`, num: 0, frames: 1, size: 100, pos })) }],
});

describe("DICOM helpers", () => {
  it("formats DICOM dates and names", () => {
    expect(dicomDate("20250312")).toBe("2025-03-12");
    expect(dicomDate("")).toBeUndefined();
    expect(personName("DOE^JANE^^^")).toBe("Jane Doe");
  });

  it("titles studies readably", () => {
    expect(studyTitle({ description: "CT CHEST WITH CONTRAST", modalities: ["CT"] })).toBe("CT chest with contrast");
    expect(studyTitle({ modalities: ["MR"], bodyPart: "KNEE" })).toBe("MRI knee");
  });

  it("merges a second upload of the same study without duplicates, keeping slice order", () => {
    const merged = mergeManifests(base([["a", 10], ["b", 5]]), base([["b", 5], ["c", 7.5]]));
    expect(merged.series[0].instances.map((i) => i.sop)).toEqual(["a", "c", "b"]);
    expect(summarise(merged).instance_count).toBe(3);
  });

  it("recognises scan files from hospital CDs", () => {
    expect(isDicomCandidate({ name: "CD/DICOM/IM000001" })).toBe(true);
    expect(isDicomCandidate({ name: "study.zip" })).toBe(true);
    expect(isDicomCandidate({ name: "scan.dcm" })).toBe(true);
    expect(isDicomCandidate({ name: "report.pdf" })).toBe(false);
  });
});
