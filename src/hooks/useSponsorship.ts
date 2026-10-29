import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Sponsorship { org_name: string; logo_url: string | null; comped_plan: string | null; comped_until: string | null; active: boolean }

/** The signed-in patient's partner sponsorship (joined link to an active org), if any. */
export function useSponsorship() {
  const { user, profile } = useAuth();
  const [s, setS] = useState<Sponsorship | null>(null);
  useEffect(() => {
    if (!user) { setS(null); return; }
    let cancelled = false;
    const refresh = () => { void supabase.rpc("get_my_partner_sponsorship").then(({ data }) => {
      if (cancelled) return;
      const row = Array.isArray(data) ? data[0] : null;
      setS(row ? { ...row, active: !!row.comped_until && new Date(row.comped_until) > new Date() } as Sponsorship : null);
    }); };
    refresh();
    const interval = setInterval(refresh, 5_000);
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [user, profile?.comped_plan, profile?.comped_until]);
  return s;
}
