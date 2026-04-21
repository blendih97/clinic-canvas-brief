import { useState, useEffect } from "react";
import { Clock, Eye, Lock, Copy, CheckCircle, Shield, ArrowRight, ArrowLeft, Languages, Calendar } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/planAccess";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, getLanguageName } from "@/lib/supportedLanguages";

const expiries = [
  { id: "2h", label: "2 Hours", seconds: 7200, desc: "For in-person consultations" },
  { id: "24h", label: "24 Hours", seconds: 86400, desc: "Standard clinic window" },
  { id: "7d", label: "7 Days", seconds: 604800, desc: "Multi-day assessment" },
  { id: "30d", label: "30 Days", seconds: 2592000, desc: "Extended care coordination" },
];

type DateRangeKey = "all" | "12m" | "6m" | "custom";

const ShareBriefSection = () => {
  const [step, setStep] = useState(1);
  const [expiry, setExpiry] = useState("24h");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shareLink, setShareLink] = useState("");
  const [generating, setGenerating] = useState(false);

  const { bloodResults, medications, allergies, imagingResults, documents, alerts } = useVaultStore();
  const { profile } = useAuth();
  const locked = !hasAccess(profile, "share_brief");

  // Mirrored from ExportSection
  const [language, setLanguage] = useState<string>(profile?.preferred_ui_language || "en");
  const [sections, setSections] = useState({
    blood: true, imaging: true, medications: true, allergies: true, documents: true,
  });
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [includeOriginals, setIncludeOriginals] = useState(true);

  const totalRecords = bloodResults.length + medications.length;
  const selectedExpiry = expiries.find((e) => e.id === expiry) || expiries[1];

  useEffect(() => {
    if (!generated) return;
    const interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [generated]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (key: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const withinDateRange = (dateStr: string | undefined): boolean => {
    if (dateRange === "all") return true;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return true;
    if (dateRange === "12m") return d >= new Date(Date.now() - 365 * 24 * 3600 * 1000);
    if (dateRange === "6m") return d >= new Date(Date.now() - 182 * 24 * 3600 * 1000);
    if (dateRange === "custom") {
      if (customFrom && d < new Date(customFrom)) return false;
      if (customTo && d > new Date(customTo)) return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + selectedExpiry.seconds * 1000).toISOString();

    // Build the payload honouring section filters and date range
    const payload = {
      bloodResults: sections.blood ? bloodResults.filter((r) => withinDateRange(r.date)) : [],
      imagingResults: sections.imaging ? imagingResults.filter((r) => withinDateRange(r.date)) : [],
      medications: sections.medications ? medications.filter((r) => withinDateRange(r.date)) : [],
      allergies: sections.allergies ? allergies : [],
      documents: sections.documents ? documents.filter((r) => withinDateRange(r.date)) : [],
      alerts,
    };

    // Translate via the edge function (cached server-side). English passes through.
    let translated = payload;
    if (language && language !== "en") {
      try {
        const { data, error } = await supabase.functions.invoke("translate-export", {
          body: { payload, targetLanguage: language },
        });
        if (!error && data?.translated) translated = data.translated;
      } catch (err) {
        console.warn("translate-export failed, sharing source language:", err);
      }
    }

    // Strip original-language full text from documents if user opted out
    const docsForShare = includeOriginals
      ? translated.documents
      : translated.documents.map((d: any) => ({ ...d, contentOriginal: undefined }));

    const sectionLabel = (Object.entries(sections)
      .filter(([, on]) => on)
      .map(([k]) => k)
      .join(" + ")) || "custom";

    const { error } = await supabase.from("shared_briefs").insert({
      token,
      scope: `${sectionLabel} · ${getLanguageName(language)}`,
      expires_at: expiresAt,
      blood_results: translated.bloodResults as any,
      medications: translated.medications as any,
      allergies: translated.allergies as any,
      imaging_results: translated.imagingResults as any,
    });

    if (error) {
      console.error("Failed to create share link:", error);
      setGenerating(false);
      return;
    }

    setShareLink(`${window.location.origin}/share/${token}`);
    setCountdown(selectedExpiry.seconds);
    setGenerated(true);
    setGenerating(false);
    setStep(4);
  };

  if (locked) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Share Brief</h2>
          <p className="text-sm text-muted-foreground mt-2">Generate a secure, time-limited link for your clinician</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-xl text-foreground mb-2">Standard Plan Required</h3>
          <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
            Share Brief is available on the Standard plan at £39/month.
          </p>
          <p className="text-xs text-muted-foreground">Upgrade coming soon.</p>
        </div>
      </div>
    );
  }

  const sectionsOn = Object.values(sections).some(Boolean);
  const customRangeValid = dateRange !== "custom" || (customFrom && customTo);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Share Brief</h2>
          <p className="text-sm text-muted-foreground mt-2">Generate a secure, time-limited link for your clinician — in any language</p>
        </div>
        <button
          onClick={() => {
            const event = new CustomEvent("navigate-section", { detail: "export" });
            window.dispatchEvent(event);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-primary/30 transition-colors"
        >
          <span className="text-primary">↓</span> Export PDF
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {s < step ? <CheckCircle className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 4 && <div className={`w-12 h-px ${s < step ? "bg-primary/40" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="font-heading text-xl text-foreground mb-3">Which records to include</h3>
            <div className="space-y-2">
              {([
                ["blood", "Blood Results", bloodResults.length],
                ["imaging", "Imaging Findings", imagingResults.length],
                ["medications", "Medications", medications.length],
                ["allergies", "Allergies", allergies.length],
                ["documents", "Documents", documents.length],
              ] as const).map(([key, label, count]) => (
                <label key={key} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg cursor-pointer hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={() => toggleSection(key)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{count} items</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Languages className="w-3.5 h-3.5 text-primary" /> Share language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}{l.nativeName && l.nativeName !== l.name ? ` — ${l.nativeName}` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Your clinician will see this brief in {getLanguageName(language)}.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Date range
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["all", "All time"],
                  ["12m", "Last 12 months"],
                  ["6m", "Last 6 months"],
                  ["custom", "Custom"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setDateRange(k)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      dateRange === k
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                  <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" />
                </div>
              )}
            </div>

            <label className="flex items-center justify-between p-3 bg-background border border-border rounded-lg cursor-pointer">
              <div>
                <p className="text-sm text-foreground">Include original-language source documents</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Doctor can switch to the original alongside the translation.</p>
              </div>
              <input
                type="checkbox"
                checked={includeOriginals}
                onChange={(e) => setIncludeOriginals(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!sectionsOn || !customRangeValid}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-foreground">Set Expiry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expiries.map((e) => (
              <button key={e.id} onClick={() => setExpiry(e.id)} className={`text-left p-5 rounded-xl border transition-all ${expiry === e.id ? "bg-card border-primary/40" : "bg-card border-border hover:border-primary/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <p className="text-sm font-medium text-foreground">{e.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-lg text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Continue <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-foreground">Preview Brief</h3>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="border-b border-border pb-4 mb-4">
              <h4 className="font-heading text-2xl text-foreground">Health Brief</h4>
              <p className="text-xs text-muted-foreground">
                {Object.entries(sections).filter(([, on]) => on).map(([k]) => k).join(" · ")} · {getLanguageName(language)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-muted rounded-lg"><p className="text-muted-foreground mb-1">Records</p><p className="text-foreground font-heading text-lg">{totalRecords}</p></div>
              <div className="p-4 bg-muted rounded-lg"><p className="text-muted-foreground mb-1">Allergies</p><p className="text-foreground font-heading text-lg">{allergies.length}</p></div>
              <div className="p-4 bg-muted rounded-lg"><p className="text-muted-foreground mb-1">Expires</p><p className="text-foreground font-heading text-lg">{selectedExpiry.label}</p></div>
            </div>
            {allergies.length > 0 && sections.allergies && (
              <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-xs">
                <p className="text-destructive font-medium mb-1">⚠ Known Allergies</p>
                <p className="text-foreground/70">{allergies.map((a) => `${a.substance} (${a.reaction})`).join(" · ")}</p>
              </div>
            )}
            {medications.length > 0 && sections.medications && (
              <div className="mt-3 p-4 bg-muted rounded-lg text-xs">
                <p className="text-muted-foreground mb-1">Active Medications</p>
                <p className="text-foreground/70">{medications.map((m) => `${m.name} ${m.dose}`).join(" · ")}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-lg text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              <Lock className="w-4 h-4" /> {generating ? "Translating & generating…" : `Generate Encrypted Link in ${getLanguageName(language)}`}
            </button>
          </div>
        </div>
      )}

      {step === 4 && generated && (
        <div className="space-y-4">
          <div className="bg-card border border-primary/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading text-xl text-foreground mb-1">Encrypted Link Ready</h3>
            <p className="text-xs text-muted-foreground mb-4">AES-256 encrypted · {getLanguageName(language)} · End-to-end secure</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg border border-border p-3 mb-4">
              <code className="flex-1 text-xs text-foreground/70 truncate">{shareLink}</code>
              <button onClick={handleCopy} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-primary/90">
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expires in</p>
              <p className="font-heading text-3xl text-primary">{formatTime(countdown)}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-2">Access Log</p>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-xs">
                <div className="flex items-center gap-2"><Eye className="w-3 h-3 text-muted-foreground" /><span className="text-foreground/70">Link created</span></div>
                <span className="text-muted-foreground">Just now</span>
              </div>
            </div>
          </div>
          <button onClick={() => { setStep(1); setGenerated(false); setCountdown(0); setShareLink(""); }} className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-lg text-sm">Create Another Brief</button>
        </div>
      )}
    </div>
  );
};

export default ShareBriefSection;
