import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rv_session_id";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Skip noisy/internal paths
    if (location.pathname.startsWith("/admin")) return;

    const track = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Exclude admins from tracking so the data reflects real visitors
        if (user?.id) {
          const { data: isAdmin } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin",
          });
          if (isAdmin) return;
        }

        await supabase.from("page_views").insert({
          session_id: getSessionId(),
          user_id: user?.id ?? null,
          path: location.pathname + location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        });
      } catch {
        // silent fail — analytics must never break the app
      }
    };

    void track();
  }, [location.pathname, location.search]);
}
