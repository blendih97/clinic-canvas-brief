import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { checkAdminAccess } from "@/lib/admin";

type AdminStatus = "unknown" | "admin" | "not_admin" | "error";

export function useAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<AdminStatus>("unknown");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const refreshAdminAccess = useCallback(async () => {
    const currentUser = user;
    const reqId = ++requestIdRef.current;

    if (!currentUser) {
      setStatus("not_admin");
      setLoading(false);
      return;
    }

    if (authLoading) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allowed = await checkAdminAccess(currentUser.id);
      // ignore stale responses if user changed
      if (reqId !== requestIdRef.current) return;
      setStatus(allowed ? "admin" : "not_admin");
    } catch {
      if (reqId !== requestIdRef.current) return;
      setStatus("error");
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    // Reset to unknown when the signed-in user changes so we never show
    // a stale admin/not-admin result from a previous session.
    requestIdRef.current += 1;
    setStatus("unknown");

    if (authLoading) {
      setLoading(false);
      return;
    }

    void refreshAdminAccess();
  }, [authLoading, user?.id, refreshAdminAccess]);

  return {
    isAdmin: status === "admin",
    status,
    loading: authLoading || loading,
    refreshAdminAccess,
  };
}
