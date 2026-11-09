// Test page for the DICOM viewer, built only in "lab" mode (never in production).
import { Suspense, lazy, useEffect, useState } from "react";
import type { DicomManifest } from "@/lib/dicom/types";

const DicomViewer = lazy(() => import("@/components/dicom/DicomViewer"));

export default function DicomLabPage() {
  const [manifest, setManifest] = useState<DicomManifest | null>(null);
  useEffect(() => {
    const which = new URLSearchParams(location.search).get("study") || "0";
    fetch(`/__lab/manifest-${which}.json`).then((r) => r.json()).then(setManifest);
  }, []);
  if (!manifest) return <p>Loading…</p>;
  return <Suspense fallback={<p>Loading viewer…</p>}><DicomViewer manifest={manifest} onClose={() => {}} onDownload={() => {}} /></Suspense>;
}
