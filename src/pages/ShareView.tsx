import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, AlertTriangle, Pill, Droplets, ScanLine } from "lucide-react";

interface SharedBrief {
  token: string;
  scope: string;
  expires_at: string;
  blood_results: any[];
  medications: any[];
  allergies: any[];
  imaging_results: any[];
  created_at: string;
}

const ShareView = () => {
  const { token } = useParams<{ token: string }>();
  const [brief, setBrief] = useState<SharedBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [submittingAccept, setSubmittingAccept] = useState(false);

  const handleAccept = async () => {
    if (!token) return;
    setSubmittingAccept(true);
    setLoading(true);
    try {
      // Best-effort audit log (timestamp + IP captured server-side)
      void supabase.functions
        .invoke("log-share-acceptance", { body: { token } })
        .catch(() => undefined);

      const { data, error } = await supabase
        .from("shared_briefs")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        setExpired(true);
      } else if (new Date(data.expires_at) < new Date()) {
        setExpired(true);
      } else {
        setBrief(data as SharedBrief);
        setAccepted(true);
      }
    } finally {
      setLoading(false);
      setSubmittingAccept(false);
    }
  };

  useEffect(() => {
    if (!brief) return;
    const update = () => {
      const diff = new Date(brief.expires_at).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeRemaining(`${h}h ${m}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [brief]);

  if (declined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h1 className="font-heading text-2xl text-foreground mb-2">Access declined</h1>
          <p className="text-sm text-muted-foreground">Please contact the person who shared these records.</p>
        </div>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-xl text-foreground">Clinician access agreement</h1>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            You are about to access health records shared by a RinVita user. By proceeding you confirm that:
          </p>
          <ol className="text-sm text-foreground/80 leading-relaxed mb-5 space-y-2 list-decimal pl-5">
            <li>You are a qualified healthcare professional accessing these records for clinical purposes only;</li>
            <li>You will not store, share or process this data beyond the clinical purpose intended;</li>
            <li>You acknowledge this data is protected under UK GDPR and you accept responsibility for handling it lawfully.</li>
          </ol>
          <p className="text-xs text-muted-foreground mb-6">
            Your acceptance, including timestamp and IP address, is logged for audit purposes.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeclined(true)}
              className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={submittingAccept}
              className="flex-[2] py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submittingAccept ? "Loading…" : "I Accept"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading health brief…</div>
      </div>
    );
  }

  if (expired || !brief) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h1 className="font-heading text-2xl text-foreground mb-2">Link Expired or Invalid</h1>
          <p className="text-sm text-muted-foreground">This health brief link has expired or does not exist. Please request a new link from the patient.</p>
        </div>
      </div>
    );
  }

  const bloodResults = (brief.blood_results || []) as any[];
  const medications = (brief.medications || []) as any[];
  const allergies = (brief.allergies || []) as any[];
  const imagingResults = (brief.imaging_results || []) as any[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-heading text-xl text-foreground">RinVita Health Brief</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-card border border-primary/20 rounded-lg p-5 text-sm text-foreground/80 leading-relaxed">
          <p className="font-medium text-foreground mb-1.5">For the receiving clinician</p>
          <p>
            This is a patient-curated medical summary. Records have been organised and translated by AI from original documents at the patient's request. All source documents are accessible below. This is not a substitute for clinical records from the originating institution.
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm text-primary">
          Scope: {brief.scope || "Full Health History"} · Created {new Date(brief.created_at).toLocaleDateString()}
        </div>

        {allergies.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="font-heading text-lg text-foreground">Known Allergies</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a: any, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium">
                  {a.substance} — {a.reaction}
                </span>
              ))}
            </div>
          </section>
        )}

        {medications.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-primary" />
              <h2 className="font-heading text-lg text-foreground">Medications</h2>
            </div>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {medications.map((m: any, i: number) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.dose} · {m.frequency}</p>
                  </div>
                  {m.active && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {bloodResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-4 h-4 text-primary" />
              <h2 className="font-heading text-lg text-foreground">Lab Results</h2>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Marker</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Value</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Range</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bloodResults.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-4 text-sm text-foreground">{b.marker}</td>
                      <td className="p-4 text-sm text-foreground">{b.value} {b.unit}</td>
                      <td className="p-4 text-xs text-muted-foreground">{b.range}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          b.status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          b.status === "flagged" ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {imagingResults.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ScanLine className="w-4 h-4 text-primary" />
              <h2 className="font-heading text-lg text-foreground">Imaging Findings</h2>
            </div>
            <div className="space-y-3">
              {imagingResults.map((im: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">{im.type} — {im.region}</p>
                  <p className="text-sm text-foreground/80">{im.finding}</p>
                  <p className="text-xs text-muted-foreground mt-2">{im.facility} · {im.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
          Generated securely by RinVita · This link will expire automatically
        </div>
      </main>
    </div>
  );
};

export default ShareView;
