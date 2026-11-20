import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PilotStatus {
  enabled: boolean;
  pilot_patient: boolean;
  partner?: string;
  partner_logo?: string | null;
  ends_at?: string | null;
  ended?: boolean;
  ending_soon?: boolean;
  paid?: boolean;
  choice?: "paid" | "free" | null;
  documents?: number;
  free_limit?: number;
  over_free_limit?: boolean;
  deletion_status?: string | null;
}

/** When the end-of-pilot screen should show: switched on, a partner patient, ending within 14 days or ended,
 * not on their own paid plan, and not already on the free plan by choice. */
export function shouldShowEndOfPilot(s: PilotStatus | null): boolean {
  if (!s?.enabled || !s.pilot_patient || s.paid || s.deletion_status) return false;
  if (!s.ended && !s.ending_soon) return false;
  return s.choice !== "free";
}

/** The signed-in patient's pilot status. Null when unavailable (signed out, or the backend doesn't have it yet). */
export function usePilotStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PilotStatus | null>(null);
  const refresh = useCallback(async () => {
    if (!user) { setStatus(null); return; }
    const { data, error } = await supabase.rpc("get_my_pilot_status" as never);
    setStatus(error ? null : (data as unknown as PilotStatus));
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);

  const choose = useCallback(async (choice: "paid" | "free") => {
    const { data, error } = await supabase.rpc("record_pilot_choice" as never, { _choice: choice } as never);
    if (error) throw error;
    setStatus(data as unknown as PilotStatus);
  }, []);

  return { status, refresh, choose };
}
