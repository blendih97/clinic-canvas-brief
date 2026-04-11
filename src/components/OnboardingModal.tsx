import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Upload, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: () => void;
}

const OnboardingModal = ({ open, onClose, onUpload }: OnboardingModalProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [bloodType, setBloodType] = useState(profile?.blood_type || "");
  const [nationality, setNationality] = useState(profile?.nationality || "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      blood_type: bloodType || null,
      nationality: nationality || null,
    }).eq("id", user.id);
    await refreshProfile();
    setSaving(false);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl">
        {/* Progress */}
        <div className="flex items-center gap-1 px-6 pt-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="text-center space-y-4">
              <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">VAULT</h1>
              <h2 className="font-heading text-xl text-foreground">Welcome to your Health Vault</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload any medical document in any language. Vault reads it, translates it, and organises it automatically.
              </p>
              <button onClick={() => setStep(2)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl text-foreground">Complete Your Profile</h2>
              <p className="text-sm text-muted-foreground">Help us personalise your health vault.</p>
              <div>
                <label className="text-xs font-medium text-foreground">Name</label>
                <input value={profile?.full_name || ""} readOnly
                  className="w-full mt-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Blood Type</label>
                <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
                  <option value="">Select...</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Nationality</label>
                <input value={nationality} onChange={(e) => setNationality(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSaveProfile} disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-10 h-10 text-primary mx-auto" />
              <h2 className="font-heading text-xl text-foreground">Upload Your First Document</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a blood test, imaging report, prescription, or any medical document. We'll extract and organise the data for you.
              </p>
              <button onClick={() => { onClose(); onUpload(); }}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Upload Document
              </button>
              <button onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-foreground">
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
