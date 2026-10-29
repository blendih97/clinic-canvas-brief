import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { refreshClaimAccess } from "@/lib/sponsorship";
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
    const pending = readPendingPartner();
    if (!pending) return;
    running.current = true;
    void (async () => {
      const res = await claimPartner(pending);
      if (!res) { running.current = false; return; } // keep pending; retry next load
      await refreshClaimAccess(res.status, refreshProfile, () => queryClient.invalidateQueries());
      clearPendingPartner();
      running.current = false;
      if (res.staff_joined) {
        toast.success("You've joined your organisation's partner portal.");
        navigate("/partner");
      }
      if (res.status === "joined") {
        toast.success(`${res.partner} is now sponsoring your RinVita plan.`);
      } else if (res.status === "seats_full") {
        toast.message(`${res.partner}'s sponsored places are full right now. Your free account is ready — you can still use RinVita on the free plan.`, { duration: 9000 });
      } else if (["partner_unavailable", "invalid_invite", "invite_revoked", "invite_used", "sponsorship_revoked"].includes(res.status)) {
        toast.message("That partner invitation is no longer active. Your free account is ready.");
      }
    })();
  }, [user, location.pathname, refreshProfile, navigate, queryClient]);

  return null;
};

export default PartnerClaimer;
