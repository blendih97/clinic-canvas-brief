// Patients confirm they're happy for RinVita to store their health records (explicit consent
// for health data). New patients tick a box at sign-up. People who signed up before that box
// existed, or through Google, see a small card in the corner of the app until they confirm.
// It doesn't block the app. The consent time is recorded by the database, not the browser.
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

export function needsHealthConsent(profile: { health_data_consent?: boolean | null } | null | undefined, pathname: string) {
  return !!profile && profile.health_data_consent !== true && !pathname.startsWith("/app/settings");
}

export default function HealthConsentGate({ children }: { children: React.ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLocale();
  const { pathname } = useLocation();
  const [ticked, setTicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = needsHealthConsent(profile as never, pathname);

  const confirm = async () => {
    if (!ticked) { setError(t("healthConsent.required")); return; }
    setSaving(true); setError(null);
    const { error: e } = await supabase.rpc("record_health_data_consent" as never);
    if (e) { setSaving(false); setError(t("healthConsent.saveError")); return; }
    await refreshProfile();
    setSaving(false);
  };

  return (
    <>
      {children}
      {show && (
        <div role="region" aria-label={t("healthConsent.promptTitle")} data-testid="health-consent-gate"
          className="fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] rounded-xl border border-border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium text-foreground">{t("healthConsent.promptTitle")}</p>
          <label className="mt-2 flex items-start gap-2.5 text-sm leading-snug text-foreground cursor-pointer">
            <input type="checkbox" checked={ticked} onChange={(e) => { setTicked(e.target.checked); setError(null); }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" />
            <span>{t("healthConsent.tick")}</span>
          </label>
          {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link to="/privacy" target="_blank" rel="noopener" className="text-xs text-muted-foreground underline hover:text-foreground">{t("healthConsent.settingsNote")}</Link>
            <button type="button" onClick={confirm} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {t("healthConsent.continue")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
