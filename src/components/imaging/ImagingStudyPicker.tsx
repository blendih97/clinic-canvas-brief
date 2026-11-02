import { ScanLine } from "lucide-react";
import { formatStudyDate, type ImagingStudy } from "@/lib/imaging/api";

/** Lets the patient choose which scans a doctor can open, and whether originals may be downloaded. */
export default function ImagingStudyPicker({ studies, selected, onChange, allowDownload, onAllowDownload }: {
  studies: ImagingStudy[]; selected: string[]; onChange: (ids: string[]) => void;
  allowDownload: boolean; onAllowDownload: (v: boolean) => void;
}) {
  const ready = studies.filter(s => s.status === "ready" || s.status === "partial");
  if (!ready.length) return null;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div className="space-y-2" data-testid="imaging-picker">
      <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><ScanLine className="w-3.5 h-3.5 text-primary" />Scans the doctor can open in their browser</p>
      {ready.map(s => (
        <label key={s.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/20">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 rounded border-border text-primary" aria-label={`Include ${s.label}`} />
            <div>
              <p className="text-sm text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{formatStudyDate(s.study_date)} · {s.image_count} {s.image_count === 1 ? "image" : "images"}</p>
            </div>
          </div>
        </label>
      ))}
      {selected.length > 0 && (
        <label className="flex items-center justify-between p-3 bg-background border border-border rounded-lg cursor-pointer">
          <div>
            <p className="text-sm text-foreground">Allow the doctor to download the original files</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Useful if they need to pass the scan to their hospital's radiology team. Off by default.</p>
          </div>
          <input type="checkbox" checked={allowDownload} onChange={e => onAllowDownload(e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
        </label>
      )}
    </div>
  );
}
