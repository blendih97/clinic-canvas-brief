import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { checkAdminAccess } from "@/lib/admin";

export function useAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshAdminAccess = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const allowed = await checkAdminAccess(user.id);
    setIsAdmin(allowed);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshAdminAccess();
  }, [authLoading, refreshAdminAccess]);

  return {
    isAdmin,
    loading: authLoading || loading,
    refreshAdminAccess,
  };
}