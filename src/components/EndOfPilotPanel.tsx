// End of a partner-sponsored pilot: three choices. Shown only when switched on (admin_settings.end_of_pilot_enabled).
// No answer is never a deletion: the patient simply moves to the free plan with every record kept.
import { useState } from "react";
import { CreditCard, Leaf, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { usePilotStatus, shouldShowEndOfPilot } from "@/hooks/usePilotStatus";
import CloseAccountDialog from "@/components/CloseAccountDialog";
import { formatSponsorshipDate } from "@/lib/sponsorship";

export default function EndOfPilotPanel() {
  const { t, isRTL } = useLocale();
  const { status, choose } = usePilotStatus();
  const [busy, setBusy] = useState<"paid" | "free" | null>(null);
  const [closing, setClosing] = useState(false);
  if (!status || !shouldShowEndOfPilot(status)) return null;

  const partner = status.partner ?? "";
  const pick = async (choice: "paid" | "free") => {
    setBusy(choice);
    try {
      await choose(choice);
      // Paid: open plans. Nothing is charged until the patient completes checkout there.
      if (choice === "paid") window.dispatchEvent(new CustomEvent("navigate-section", { detail: "billing" }));
    } catch {
      toast.error(t("endOfPilot.saveError"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-primary/30 bg-card p-5" dir={isRTL ? "rtl" : "ltr"} data-testid="end-of-pilot">
      <div className="flex items-center gap-3">
        {status.partner_logo && <img src={status.partner_logo} alt={partner} className="h-8 w-auto max-w-[96px] object-contain" />}
        <h2 className="font-heading text-2xl text-foreground">
          {status.ended ? t("endOfPilot.endedTitle", { partner }) : t("endOfPilot.soonTitle", { partner, date: formatSponsorshipDate(status.ends_at) })}
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("endOfPilot.intro")}</p>
      {status.choice === "paid" && <p className="mt-2 text-sm text-foreground">{t("endOfPilot.paidChosen")}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4 flex flex-col">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="mt-2 font-medium text-foreground">{t("endOfPilot.paidTitle")}</h3>
          <p className="mt-1 text-xs text-muted-foreground flex-1">{t("endOfPilot.paidBody")}</p>
          <Button className="mt-3" onClick={() => pick("paid")} disabled={!!busy}>
            {busy === "paid" && <Loader2 className="w-4 h-4 me-2 animate-spin" />}{t("endOfPilot.paidAction")}
          </Button>
        </div>
        <div className="rounded-lg border border-border p-4 flex flex-col">
          <Leaf className="w-5 h-5 text-primary" />
          <h3 className="mt-2 font-medium text-foreground">{t("endOfPilot.freeTitle")}</h3>
          <p className="mt-1 text-xs text-muted-foreground flex-1">
            {t("endOfPilot.freeBody", { limit: status.free_limit ?? 3 })}
            {status.over_free_limit && <span className="block mt-1 text-foreground">{t("endOfPilot.freeOverLimit", { count: status.documents ?? 0 })}</span>}
          </p>
          <Button className="mt-3" variant="outline" onClick={() => pick("free")} disabled={!!busy}>
            {busy === "free" && <Loader2 className="w-4 h-4 me-2 animate-spin" />}{t("endOfPilot.freeAction")}
          </Button>
        </div>
        <div className="rounded-lg border border-border p-4 flex flex-col">
          <Trash2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="mt-2 font-medium text-foreground">{t("endOfPilot.closeTitle")}</h3>
          <p className="mt-1 text-xs text-muted-foreground flex-1">{t("endOfPilot.closeBody")}</p>
          <Button className="mt-3" variant="outline" onClick={() => setClosing(true)} disabled={!!busy}>{t("endOfPilot.closeAction")}</Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("endOfPilot.noAnswer")}</p>
      <CloseAccountDialog open={closing} onOpenChange={setClosing} source="end_of_pilot" />
    </section>
  );
}
