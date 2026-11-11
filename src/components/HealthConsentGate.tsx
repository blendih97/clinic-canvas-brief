// Patients must give explicit consent before RinVita stores and processes their health
// information. People who signed up before the sign-up tick box existed (or through Google)
// are asked once here; the consent time is recorded by the database, not the browser.
// Settings stays reachable so someone who doesn't agree can download or delete their records.
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

export function needsHealthConsent(profile: { health_data_consent?: boolean | null } | null | undefined, pathname: string) {
  return !!profile && profile.health_data_consent !== true && !pathname.startsWith("/app/settings");
}

export default function HealthConsentGate({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile, signOut } = useAuth();
  const { t } = useLocale();
  const { pathname } = useLocation();
  const [ticked, setTicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!needsHealthConsent(profile as never, pathname)) return <>{children}</>;

  const agree = async () => {
    if (!ticked) { setError(t("healthConsent.required")); return; }
    setSaving(true); setError(null);
    const { error: e } = await supabase.rpc("record_health_data_consent" as never);
    if (e) { setSaving(false); setError(t("healthConsent.saveError")); return; }
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="health-consent-gate">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ShieldCheck className="w-8 h-8 text-primary" aria-hidden />
        <h1 className="mt-3 font-heading text-2xl text-foreground">{t("healthConsent.promptTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("healthConsent.promptBody")}</p>
        <label className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-foreground cursor-pointer">
          <input type="checkbox" checked={ticked} onChange={(e) => { setTicked(e.target.checked); setError(null); }}
            className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
          <span>{t("healthConsent.tick")}</span>
        </label>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <button type="button" onClick={agree} disabled={saving}
          className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {t("healthConsent.continue")}
        </button>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link to="/app/settings" className="underline hover:text-foreground">{t("healthConsent.settingsNote")}</Link>
          <button type="button" onClick={() => signOut()} className="shrink-0 underline hover:text-foreground">{t("healthConsent.signOut")}</button>
        </div>
      </div>
    </div>
  );
}
