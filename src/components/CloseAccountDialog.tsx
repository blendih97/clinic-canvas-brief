// Close an account: the patient is offered a full download first, then confirms by typing DELETE.
import { useState } from "react";
import { Download, Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { buildDataExport, type ExportResult } from "@/lib/dataExport";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; source: "settings" | "end_of_pilot" }

export default function CloseAccountDialog({ open, onOpenChange, source }: Props) {
  const { user, signOut } = useAuth();
  const { t, isRTL } = useLocale();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<ExportResult["counts"] | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [closing, setClosing] = useState(false);

  const download = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { blob, counts } = await buildDataExport(supabase as never, user.id);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `rinvita-records-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
      setExported(counts);
    } catch {
      toast.error(t("closeAccount.downloadError"));
    } finally {
      setExporting(false);
    }
  };

  const close = async () => {
    if (confirm !== "DELETE") return;
    setClosing(true);
    const { data, error } = await supabase.functions.invoke("close-account", { body: { action: "request", confirmation: "DELETE", source } });
    setClosing(false);
    if (error && !data) { toast.error(t("closeAccount.error")); return; }
    toast.success((data as { status?: string })?.status === "completed" ? t("closeAccount.done") : t("closeAccount.pending"));
    onOpenChange(false);
    await signOut();
  };

  const ready = !!exported || skipped;
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!closing) { onOpenChange(o); if (!o) setConfirm(""); } }}>
      <DialogContent className="max-w-lg" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{t("closeAccount.title")}</DialogTitle>
          <DialogDescription className="sr-only">{t("closeAccount.whatHappens")}</DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">{t("closeAccount.step1")}</h3>
          <p className="text-xs text-muted-foreground">{t("closeAccount.step1Body")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={download} disabled={exporting} variant={exported ? "outline" : "default"}>
              {exporting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : exported ? <Check className="w-4 h-4 me-2" /> : <Download className="w-4 h-4 me-2" />}
              {exporting ? t("closeAccount.preparing") : t("closeAccount.download")}
            </Button>
            {!exported && !skipped && (
              <button type="button" onClick={() => setSkipped(true)} className="text-xs text-muted-foreground underline">{t("closeAccount.skipDownload")}</button>
            )}
          </div>
          {exported && <p className="text-xs text-foreground">{t("closeAccount.downloaded", { originals: exported.originals, scans: exported.scanFiles })}</p>}
          {exported && exported.missing.length > 0 && (
            <p className="text-xs text-destructive flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{t("closeAccount.downloadMissing", { count: exported.missing.length })}</p>
          )}
        </section>

        {ready && (
          <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground">{t("closeAccount.step2")}</h3>
            <p className="text-xs text-muted-foreground">{t("closeAccount.whatHappens")}</p>
            <ul className="list-disc ps-5 text-xs text-foreground space-y-1">
              <li>{t("closeAccount.bullet1")}</li>
              <li>{t("closeAccount.bullet2")}</li>
              <li>{t("closeAccount.bullet3")}</li>
              <li>{t("closeAccount.bullet4")}</li>
            </ul>
            <p className="text-xs text-muted-foreground">{t("closeAccount.keptNote")}</p>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t("closeAccount.typeDelete")} aria-label={t("closeAccount.typeDelete")} autoComplete="off" dir="ltr" />
            <Button variant="destructive" className="w-full" onClick={close} disabled={confirm !== "DELETE" || closing}>
              {closing ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("closeAccount.closing")}</> : t("closeAccount.confirm")}
            </Button>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
