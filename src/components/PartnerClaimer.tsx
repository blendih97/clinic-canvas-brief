import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { refreshClaimAccess } from "@/lib/sponsorship";
import { PARTNER_ACCESS_CHANGED } from "@/hooks/usePartnerAccess";
import { capturePartnerParams, claimPartner, clearPendingPartner, readPendingPartner, savePendingPartner } from "@/lib/partners";

/**
 * Captures ?partner= / ?invite= / ?staff=1 from any URL into localStorage, then,
 * once a user is signed in, calls partner-claim exactly once and clears it.
 * Signup metadata is a fallback when confirmation happens on another device.
 */
const PartnerClaimer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => { capturePartnerParams(location.search); }, [location.search]);

  useEffect(() => {
    if (!user || running.current) return;
    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    if (typeof meta.partner_slug === "string" || typeof meta.partner_invite === "string") {
      const doneKey = `rinvita_partner_meta_done_${user.id}`;
      if (!localStorage.getItem(doneKey)) {
        savePendingPartner({ slug: meta.partner_slug as string, token: meta.partner_invite as string });
        localStorage.setItem(doneKey, "1");
      }
    }
    // With no pending invite in this browser (e.g. the confirmation email was opened on another
    // device), still check once per session: a confirmed email that matches a staff invitation
    // joins that partner portal. The server only matches the account's own verified email.
    const sessionKey = `rinvita_partner_checked_${user.id}`;
    let pending = readPendingPartner();
    if (!pending) {
      try { if (sessionStorage.getItem(sessionKey)) return; sessionStorage.setItem(sessionKey, "1"); } catch { return; }
      pending = {};
    }
    running.current = true;
    void (async () => {
      const res = await claimPartner(pending);
      if (!res) { running.current = false; return; } // keep pending; retry next load
      await refreshClaimAccess(res.status, refreshProfile, () => queryClient.invalidateQueries());
      clearPendingPartner();
      running.current = false;
      if (res.staff_joined) {
        window.dispatchEvent(new Event(PARTNER_ACCESS_CHANGED));
        toast.success("You've joined your organisation's partner portal.");
        navigate("/partner");
      }
      if (res.status === "joined") {
        toast.success(`Welcome to RinVita. Your account is set up through ${res.partner}.`);
      } else if (res.status === "seats_full") {
        toast.message(`${res.partner}'s places are full right now. Your account is ready on the free plan; please contact ${res.partner}.`, { duration: 9000 });
      } else if (["partner_unavailable", "invalid_invite", "invite_revoked", "invite_used", "sponsorship_revoked"].includes(res.status)) {
        toast.message("That partner invitation is no longer active. Your free account is ready.");
      }
    })();
  }, [user, location.pathname, refreshProfile, navigate, queryClient]);

  return null;
};

export default PartnerClaimer;
