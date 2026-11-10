// A read-only tour of a fictional patient's RinVita account, opened from a demo link
// (/demo/:token). Nothing the visitor changes is saved, and their own account is never touched.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  LayoutDashboard, Droplets, ScanLine, Pill, FileText, Stethoscope, Loader2, ShieldAlert, ArrowRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthContextType, type Profile } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import OverviewSection from "@/components/sections/OverviewSection";
import BloodResultsSection from "@/components/sections/BloodResultsSection";
import MedicationsSection from "@/components/sections/MedicationsSection";
import SharedScans, { type SharedStudy } from "@/components/share/SharedScans";
import SharedDocuments, { type SharedDoc } from "@/components/share/SharedDocuments";
import ShareView, { type SharedBrief } from "@/pages/ShareView";
import SEO from "@/components/SEO";

type Tab = "overview" | "blood" | "imaging" | "medications" | "documents" | "doctor";

interface DemoData {
  label: string;
  expiresAt: string | null;
  profile: Partial<Profile>;
  vault: Record<string, unknown[]>;
  scans: SharedStudy[];
  brief: SharedBrief;
}

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "blood", label: "Lab results", icon: Droplets },
  { id: "imaging", label: "Imaging", icon: ScanLine },
  { id: "medications", label: "Medications & allergies", icon: Pill },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "doctor", label: "What a doctor sees", icon: Stethoscope },
];

const notInDemo = () => toast("This is a demo patient, so nothing can be uploaded or sent here. Create your own account to try it with real records.");

export default function DemoPatientPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<DemoData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "gone">("loading");
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    let alive = true;
    supabase.functions.invoke("get-demo-profile", { body: { token } }).then(({ data: res, error }) => {
      if (!alive) return;
      const demo = (res as { demo?: DemoData } | null)?.demo;
      if (error || !demo) { setState("gone"); return; }
      useVaultStore.getState().startDemo(demo.vault as never);
      setData(demo);
      setState("ready");
    });
    return () => {
      alive = false;
      // Leave the store clean so a signed-in visitor's own account loads normally afterwards.
      useVaultStore.setState({ demoMode: false });
      useVaultStore.getState().clearData();
    };
  }, [token]);

  // The sections read "the signed-in patient": here that is the fictional demo patient.
  const auth = useMemo<AuthContextType | null>(() => {
    if (!data) return null;
    const now = new Date().toISOString();
    const profile = { id: "demo", plan: "standard", created_at: now, updated_at: now, phone: null, emergency_contact_name: null,
      emergency_contact_phone: null, avatar_url: null, stripe_customer_id: null, stripe_subscription_id: null,
      full_name: null, date_of_birth: null, nationality: null, blood_type: null, ...data.profile } as Profile;
    const noop = async () => { /* demo */ };
    return {
      user: { id: "demo" } as AuthContextType["user"], session: null, profile, loading: false,
      refreshSession: noop, refreshProfile: noop, signOut: noop,
      signIn: async () => ({ error: new Error("demo") }),
      signUp: async () => ({ error: new Error("demo"), session: null }),
    };
  }, [data]);

  if (state === "loading") {
    return <div className="min-h-screen flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading the demo patient…</div>;
  }
  if (state === "gone" || !data || !auth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
          <h1 className="mt-3 font-heading text-2xl text-foreground">This demo link has expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask RinVita for a new link, or <Link to="/clinics" className="text-primary underline">see how RinVita works with clinics</Link>.</p>
        </div>
      </div>
    );
  }

  const name = data.profile.full_name?.replace(/\s*\(demo\)\s*/i, "") || "the demo patient";

  return (
    <AuthContext.Provider value={auth}>
      <div className="min-h-screen bg-background" data-testid="demo-patient">
        <SEO title="RinVita demo patient" description="A read-only tour of a fictional patient's RinVita account." path={`/demo/${token}`} noindex />
        <div className="bg-[#1F2933] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-sm flex-1 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-[#e6c46a] shrink-0" />
              <span>You're exploring <strong>{name}</strong>, a fictional patient. Look around freely: anything you change here isn't saved.</span>
            </p>
            <Link to="/auth?mode=signup" className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8a03c] text-black text-xs font-medium">
              Create your own account <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <header className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-2xl tracking-[0.2em] text-primary">RinVita</p>
              <p className="text-xs text-muted-foreground">Demo patient · {name}</p>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto -mb-px" aria-label="Demo sections">
              {TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }} aria-current={tab === t.id ? "page" : undefined}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 ${tab === t.id ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {tab === "doctor" ? (
          <div>
            <div className="max-w-3xl mx-auto px-6 pt-6">
              <p className="text-sm text-muted-foreground">When {name} shares her records, her doctor opens a secure link and sees this page. It's view only: the doctor can't download anything, and the link expires or can be revoked at any time.</p>
            </div>
            <ShareView demo={{ token: token!, brief: data.brief }} />
          </div>
        ) : (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {tab === "overview" && (
              <OverviewSection
                onNavigate={(s) => setTab(s === "share" ? "doctor" : (["blood", "imaging", "medications", "documents"].includes(s) ? s : "overview") as Tab)}
                onUpload={notInDemo} onRequestRecords={notInDemo} />
            )}
            {tab === "blood" && <BloodResultsSection />}
            {tab === "medications" && <MedicationsSection />}
            {tab === "imaging" && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-heading text-3xl text-foreground">Imaging</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Full scans, viewable in 2D, multi-plane and 3D. Patients add them from a CD, USB stick or download, or the hospital sends them through a secure link.</p>
                </div>
                {data.scans.length ? <SharedScans fn="get-demo-profile" token={token!} studies={data.scans} />
                  : <p className="text-sm text-muted-foreground">No scans in this demo.</p>}
              </div>
            )}
            {tab === "documents" && (
              <div className="space-y-4">
                <div>
                  <h1 className="font-heading text-3xl text-foreground">Documents</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Every original, with RinVita's reading and translation beside it.</p>
                </div>
                <SharedDocuments fn="get-demo-profile" token={token!} documents={data.brief.documents as SharedDoc[]} />
              </div>
            )}
            <p className="mt-10 text-[11px] text-muted-foreground">Fictional demo patient. The documents are invented for demonstration; the scans are anonymised public research images, labelled as such.</p>
          </main>
        )}
      </div>
    </AuthContext.Provider>
  );
}
