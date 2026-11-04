import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PartnerAccess {
  /** Active member of at least one partner organisation. */
  isPartner: boolean;
  /** Also a patient: has their own documents or a partner-sponsored plan. */
  hasOwnRecords: boolean;
}

export const PARTNER_ACCESS_CHANGED = "rinvita:partner-access-changed";

/** undefined while loading, then the signed-in user's partner/patient roles. */
export function usePartnerAccess(): PartnerAccess | undefined {
  const { user } = useAuth();
  const [access, setAccess] = useState<PartnerAccess | undefined>(undefined);

  useEffect(() => {
    if (!user) { setAccess({ isPartner: false, hasOwnRecords: false }); return; }
    let alive = true;
    const load = async () => {
      const [members, docs, sponsor] = await Promise.all([
        supabase.from("partner_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.rpc("get_my_partner_sponsorship"),
      ]);
      if (!alive) return;
      const sponsored = Array.isArray(sponsor.data) ? sponsor.data.length > 0 : !!sponsor.data;
      setAccess({
        // On a lookup error, fall back to the patient app rather than locking anyone out.
        isPartner: !members.error && (members.count ?? 0) > 0,
        hasOwnRecords: (docs.count ?? 0) > 0 || (!sponsor.error && sponsored),
      });
    };
    void load();
    const onChange = () => { void load(); };
    window.addEventListener(PARTNER_ACCESS_CHANGED, onChange);
    return () => { alive = false; window.removeEventListener(PARTNER_ACCESS_CHANGED, onChange); };
  }, [user]);

  return access;
}

const RECORDS_KEY = "rinvita.partnerViewingRecords";

/** Partner staff who are also patients chose "My records" this session. */
export function partnerChoseRecords(): boolean {
  try { return sessionStorage.getItem(RECORDS_KEY) === "1"; } catch { return false; }
}
export function setPartnerChoseRecords(on: boolean) {
  try { if (on) sessionStorage.setItem(RECORDS_KEY, "1"); else sessionStorage.removeItem(RECORDS_KEY); } catch { /* ignore */ }
}
