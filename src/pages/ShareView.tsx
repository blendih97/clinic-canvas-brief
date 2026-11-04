import { Fragment, useEffect, useState } from "react";
import { displayRange } from "@/lib/referenceRanges";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SharedDocuments, { type SharedDoc } from "@/components/share/SharedDocuments";
import { Shield, Clock, AlertTriangle, Pill, Droplets, ScanLine, Globe } from "lucide-react";
import { SHARE_GATE_LANGUAGES, findShareGateLanguage, initialShareGateLanguage, saveShareGateLanguage } from "@/components/share/shareGateText";

interface SharedBrief {
  token: string;
  scope: string;
  expires_at: string;
  blood_results: any[];
  medications: any[];
  allergies: any[];
  imaging_results: any[];
  documents?: SharedDoc[];
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
  const [gateLang, setGateLang] = useState(() => initialShareGateLanguage());
  const g = gateLang.text;

  const handleAccept = async () => {
    if (!token) return;
    setSubmittingAccept(true);
    setLoading(true);
    try {
      // Best-effort audit log (timestamp + IP captured server-side)
      void supabase.functions
        .invoke("log-share-acceptance", { body: { token } })
        .catch(() => undefined);

      // Token-gated lookup via secure edge function (no broad anon RLS).
      const { data, error } = await supabase.functions.invoke("get-shared-brief", {
        body: { token },
      });
      const brief = (data as any)?.brief;
      const isExpired = (data as any)?.expired;

      if (error || !brief || isExpired) {
        setExpired(true);
        setAccepted(true);
      } else if (brief.expires_at && new Date(brief.expires_at) < new Date()) {
        setExpired(true);
        setAccepted(true);
      } else {
        setBrief(brief as SharedBrief);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6" lang={gateLang.code} dir={gateLang.dir}>
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h1 className="font-heading text-2xl text-foreground mb-2">{g.declinedTitle}</h1>
          <p className="text-sm text-muted-foreground">{g.declinedBody}</p>
        </div>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm" lang={gateLang.code} dir={gateLang.dir}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <h1 className="font-heading text-xl text-foreground">{g.title}</h1>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground" dir="ltr">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">{g.language}</span>
              <select
                id="share-gate-language"
                aria-label={g.language}
                value={gateLang.code}
                onChange={(e) => {
                  const next = findShareGateLanguage(e.target.value);
                  if (next) { setGateLang(next); saveShareGateLanguage(next.code); }
                }}
                className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SHARE_GATE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-foreground leading-relaxed mb-3">{g.intro}</p>
          <p className="text-sm text-foreground/80 leading-relaxed mb-6">{g.body}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAccept}
              disabled={submittingAccept}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submittingAccept ? g.loading : g.open}
            </button>
            <button
              onClick={() => setDeclined(true)}
              className="self-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              {g.notForMe}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">{g.logged}</p>
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
  // Newest results first, grouped by the date the sample was taken (original order kept within a date).
  const labGroups = bloodResults.reduce((acc: { date: string; rows: any[] }[], b: any) => {
    const date = b.date || "";
    const g = acc.find((x) => x.date === date);
    if (g) g.rows.push(b); else acc.push({ date, rows: [b] });
    return acc;
  }, []).sort((a, b) => b.date.localeCompare(a.date));
  const fmtLabDate = (d: string) => {
    if (!d) return "Date not stated";
    const t = new Date(d + "T00:00:00");
    return isNaN(t.getTime()) ? d : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const medications = (brief.medications || []) as any[];
  const allergies = (brief.allergies || []) as any[];
  const imagingResults = (brief.imaging_results || []) as any[];
  const sharedDocuments = (brief.documents || []) as SharedDoc[];

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
            This is a patient-curated medical summary. Records have been organised and translated by AI from original documents at the patient's request. {sharedDocuments.length > 0 ? "The documents the patient chose to share are listed below, with the originals where provided." : "The patient did not include source documents in this brief."} This is not a substitute for clinical records from the originating institution.
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm text-primary">
          Scope: {brief.scope || "Full Health History"} · Created {new Date(brief.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
              {[...medications].sort((a: any, b: any) => Number(b.active !== false) - Number(a.active !== false)).map((m: any, i: number) => (
                <div key={i} className={`p-4 flex items-center justify-between gap-3 ${m.active === false ? "bg-muted/30" : ""}`}>
                  <div>
                    <p className={`text-sm font-medium ${m.active === false ? "text-muted-foreground" : "text-foreground"}`}>{m.name}</p>
                    <p className="text-xs text-muted-foreground">{[m.dose, m.frequency].filter(Boolean).join(" · ")}{m.date ? ` · ${m.date}` : ""}</p>
                  </div>
                  {m.active === false
                    ? <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Past</span>
                    : <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Current</span>}
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
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Marker</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Value</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Range</th>
                    <th className="p-4 text-xs text-muted-foreground uppercase font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labGroups.map((g) => (
                    <Fragment key={g.date || "undated"}>
                      <tr className="bg-muted/40 border-b border-border/50">
                        <td colSpan={4} className="px-4 py-2 text-xs font-medium text-foreground">
                          Sample date: {fmtLabDate(g.date)} <span className="text-muted-foreground font-normal">· {g.rows.length} result{g.rows.length === 1 ? "" : "s"}</span>
                        </td>
                      </tr>
                      {g.rows.map((b: any, i: number) => (
                    <tr key={`${g.date}-${i}`} className="border-b border-border/50">
                      <td className="p-4 text-sm text-foreground">{b.marker}</td>
                      <td className="p-4 text-sm text-foreground">{b.value} {b.unit}</td>
                      <td className="p-4 text-xs text-muted-foreground">{(() => { const d = displayRange(b); return d ? (d.typical ? <>{d.text}<span className="block text-[10px]">Typical UK adult range, not printed on the report</span></> : d.text) : "—"; })()}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          b.status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          b.status === "flagged" ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                      ))}
                    </Fragment>
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

        {token && <SharedDocuments token={token} documents={sharedDocuments} cover={{ allergies, medications, bloodResults, createdAt: brief.created_at }} />}

        <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border space-y-2">
          <p>Generated securely by RinVita · This link will expire automatically</p>
          <p>
            This brief was created with RinVita —{" "}
            <a
              href="/?utm_source=share_brief&utm_medium=product&utm_campaign=viral"
              className="text-primary underline underline-offset-2"
            >
              keep your own medical history organised and translated
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
};

export default ShareView;
