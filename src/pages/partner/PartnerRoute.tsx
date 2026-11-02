import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PartnerPortalPage from "./PartnerPortalPage";
import { claimPartner, readPendingPartner } from "@/lib/partners";

/** Guard for /partner: only active partner_members (RLS returns only their own org rows). */
const PartnerRoute = () => {
  const { user, loading } = useAuth();
  const [state, setState] = useState<{ status: "loading" | "ok" | "none"; orgs: any[]; members: any[] }>({ status: "loading", orgs: [], members: [] });

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data: members } = await supabase.from("partner_members").select("*").eq("user_id", user.id).eq("status", "active");
      const ids = (members || []).map((m) => m.org_id);
      const { data: orgs } = ids.length ? await supabase.from("partner_orgs").select("*").in("id", ids).order("name") : { data: [] };
      if (alive) setState({ status: orgs && orgs.length ? "ok" : "none", orgs: orgs || [], members: members || [] });
    };
    // Existing account opening a staff invite: claim first (idempotent), then load.
    const pending = readPendingPartner();
    const pre = pending?.staff ? claimPartner(pending).catch(() => null) : Promise.resolve(null);
    // A just-accepted staff invite may still be processing: retry once.
    void pre.then(load).then(() => setTimeout(() => { if (alive) void load(); }, 2500));
    return () => { alive = false; };
  }, [user]);

  if (loading || (user && state.status === "loading")) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/auth?next=/partner" replace />;
  if (state.status === "none") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
        <p className="text-sm text-muted-foreground max-w-md">The account you're signed in as ({user.email}) isn't part of a partner organisation. If you were invited, sign in with the email address the invitation was sent to.</p>
        <a href="/app" className="rounded-md border border-border px-4 py-2 text-sm">Go to my records</a>
      </div>
    );
  }
  return <PartnerPortalPage orgs={state.orgs} myMemberships={state.members} />;
};

export default PartnerRoute;
