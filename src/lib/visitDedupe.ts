// Imaging dedupe: merge two imaging rows if they share modality + region + facility
// AND their dates are within 2 days. The first row in the input wins; the duplicate
// is recorded as a "linkedSourceId" for transparency. Manual unlink overrides
// (stored in imaging_link_overrides) prevent specific pairs from being merged.

import type { ImagingResult } from "@/store/vaultStore";

export interface ImagingLinkOverride {
  imaging_id_a: string;
  imaging_id_b: string;
}

export interface DedupedImaging extends ImagingResult {
  duplicateIds: string[]; // ids of imaging rows merged into this one
}

const DAY_MS = 86_400_000;
const TOLERANCE_DAYS = 2;

function norm(s: string | undefined | null): string {
  return (s || "").trim().toLowerCase();
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (Number.isNaN(da) || Number.isNaN(db)) return Infinity;
  return Math.abs(da - db) / DAY_MS;
}

function isOverridden(
  a: string,
  b: string,
  overrides: ImagingLinkOverride[],
): boolean {
  return overrides.some(
    (o) =>
      (o.imaging_id_a === a && o.imaging_id_b === b) ||
      (o.imaging_id_a === b && o.imaging_id_b === a),
  );
}

export function dedupeImaging(
  rows: ImagingResult[],
  overrides: ImagingLinkOverride[] = [],
): DedupedImaging[] {
  const out: DedupedImaging[] = [];

  for (const row of rows) {
    const match = out.find((existing) => {
      if (norm(existing.type) !== norm(row.type)) return false;
      if (norm(existing.region) !== norm(row.region)) return false;
      if (norm(existing.facility) !== norm(row.facility)) return false;
      if (daysBetween(existing.date, row.date) > TOLERANCE_DAYS) return false;
      if (isOverridden(existing.id, row.id, overrides)) return false;
      // also check against any already-merged duplicates so a manual unlink
      // anywhere in the cluster respects the user's intent.
      if (existing.duplicateIds.some((dup) => isOverridden(dup, row.id, overrides))) {
        return false;
      }
      return true;
    });

    if (match) {
      match.duplicateIds.push(row.id);
      // prefer the longer finding string when merging
      if ((row.finding?.length || 0) > (match.finding?.length || 0)) {
        match.finding = row.finding;
      }
    } else {
      out.push({ ...row, duplicateIds: [] });
    }
  }

  return out;
}
