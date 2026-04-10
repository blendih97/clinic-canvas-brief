import { useState, useEffect } from "react";
import { Share2, Clock, Eye, Lock, Copy, CheckCircle, Shield, ArrowRight, ArrowLeft } from "lucide-react";

const scopes = [
  { id: "full", label: "Full Health History", desc: "Complete medical records across all categories" },
  { id: "cardio", label: "Cardiology Brief", desc: "Heart-related results, imaging, medications" },
  { id: "recent", label: "Last 6 Months", desc: "All records from the past 6 months" },
  { id: "meds", label: "Medications Only", desc: "Current prescriptions and known allergies" },
];

const expiries = [
  { id: "2h", label: "2 Hours", desc: "For in-person consultations" },
  { id: "24h", label: "24 Hours", desc: "Standard clinic window" },
  { id: "7d", label: "7 Days", desc: "Multi-day assessment" },
  { id: "30d", label: "30 Days", desc: "Extended care coordination" },
];

const ShareBriefSection = () => {
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState("full");
  const [expiry, setExpiry] = useState("24h");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(86400);

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
    navigator.clipboard.writeText("https://vault.health/share/enc_7f8a9b3c");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    setGenerated(true);
    setStep(4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-cream">Share Brief</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate a secure, time-limited link for your clinician</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              {s < step ? <CheckCircle className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 4 && <div className={`w-12 h-px ${s < step ? "bg-primary/40" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Scope */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-cream">Select Scope</h3>
          <div className="grid grid-cols-2 gap-3">
            {scopes.map((s) => (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  scope === s.id ? "bg-card border-primary/40" : "bg-card/50 border-border hover:border-primary/20"
                }`}
              >
                <p className="text-sm font-medium text-cream">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium mt-4 hover:bg-primary/90 transition-colors">
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Expiry */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-cream">Set Expiry</h3>
          <div className="grid grid-cols-2 gap-3">
            {expiries.map((e) => (
              <button
                key={e.id}
                onClick={() => setExpiry(e.id)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  expiry === e.id ? "bg-card border-primary/40" : "bg-card/50 border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <p className="text-sm font-medium text-cream">{e.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{e.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-cream">Preview Brief</h3>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="border-b border-border pb-4 mb-4">
              <h4 className="font-heading text-2xl text-cream">Health Brief</h4>
              <p className="text-xs text-muted-foreground">Prepared for Alexander Hayes · {scopes.find(s => s.id === scope)?.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-1">Records Included</p>
                <p className="text-cream font-heading text-lg">47</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-1">Active Flags</p>
                <p className="text-primary font-heading text-lg">3</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded">
                <p className="text-muted-foreground mb-1">Expires</p>
                <p className="text-cream font-heading text-lg">{expiries.find(e => e.id === expiry)?.label}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded text-xs">
              <p className="text-destructive font-medium mb-1">⚠ Known Allergies</p>
              <p className="text-cream/70">Penicillin (Anaphylaxis) · Shellfish (Urticaria)</p>
            </div>
            <div className="mt-3 p-3 bg-secondary/20 rounded text-xs">
              <p className="text-muted-foreground mb-1">Active Medications</p>
              <p className="text-cream/70">Atorvastatin 20mg · Vitamin D3 4000 IU · Omeprazole 20mg · Amlodipine 5mg · Aspirin 75mg · Melatonin 3mg</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              <Lock className="w-4 h-4" /> Generate Encrypted Link
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generated */}
      {step === 4 && generated && (
        <div className="space-y-4">
          <div className="bg-card border border-primary/30 rounded-lg p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading text-xl text-cream mb-1">Encrypted Link Ready</h3>
            <p className="text-xs text-muted-foreground mb-4">AES-256 encrypted · End-to-end secure</p>

            <div className="flex items-center gap-2 bg-background rounded-md border border-border p-2 mb-4">
              <code className="flex-1 text-xs text-cream/70 truncate">https://vault.health/share/enc_7f8a9b3c</code>
              <button onClick={handleCopy} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium flex items-center gap-1 hover:bg-primary/90">
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Countdown */}
            <div className="p-3 bg-secondary/20 rounded mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Expires in</p>
              <p className="font-heading text-3xl text-primary">{formatTime(countdown)}</p>
            </div>

            {/* Access log */}
            <div className="text-left">
              <p className="text-[10px] tracking-wider text-muted-foreground uppercase mb-2">Access Log</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 bg-secondary/10 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-muted-foreground" />
                    <span className="text-cream/70">Link created</span>
                  </div>
                  <span className="text-muted-foreground">Just now</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => { setStep(1); setGenerated(false); setCountdown(86400); }} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
            Create Another Brief
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareBriefSection;
