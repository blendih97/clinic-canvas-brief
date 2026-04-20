import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, Download, Shield, Moon, Sun, Globe, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const planFeatures: Record<string, string[]> = {
  free: ["3 document uploads", "Basic extraction", "No share links"],
  standard: ["Unlimited uploads", "Full AI extraction & translation", "Unlimited share links"],
  family: ["Everything in Standard", "Up to 6 family members", "Shared billing"],
};

const planPrices: Record<string, string> = {
  free: "Free",
  standard: "£19.99/mo",
  family: "£49.99/mo",
};

const SettingsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const store = useVaultStore();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [shareNotifs, setShareNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  const handleExportData = () => {
    const data = {
      bloodResults: store.bloodResults, imagingResults: store.imagingResults,
      medications: store.medications, documents: store.documents,
      allergies: store.allergies, alerts: store.alerts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rinvita-health-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported");
  };

  const plan = profile?.plan || "free";

  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!on)}
      className={`w-10 h-5 rounded-full transition-colors relative ${on ? "bg-primary" : "bg-border"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5.5 left-0.5" : "left-0.5"}`}
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate("/app")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <h1 className="font-heading text-3xl font-light text-foreground mb-6">Settings</h1>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-foreground">Email alerts for flagged results</p><p className="text-xs text-muted-foreground">Get notified when results need attention</p></div>
              <Toggle on={emailAlerts} onChange={setEmailAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-foreground">Weekly health summary</p><p className="text-xs text-muted-foreground">Receive a weekly digest email</p></div>
              <Toggle on={weeklySummary} onChange={setWeeklySummary} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-foreground">Share link notifications</p><p className="text-xs text-muted-foreground">Know when someone accesses your shared brief</p></div>
              <Toggle on={shareNotifs} onChange={setShareNotifs} />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Privacy & Security</h2>
          <div className="space-y-4">
            <button onClick={handlePasswordReset}
              className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1"><p>Change Password</p><p className="text-xs text-muted-foreground">Send a password reset email</p></div>
            </button>
            <div className="flex items-center justify-between px-4 py-3 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div><p className="text-sm text-foreground">Two-factor authentication</p><p className="text-xs text-muted-foreground">Add extra security to your account</p></div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">Coming soon</span>
            </div>
            <button onClick={handleExportData}
              className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left">
              <Download className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1"><p>Export all data</p><p className="text-xs text-muted-foreground">Download your data as JSON</p></div>
            </button>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                <p className="text-sm text-foreground">Dark mode</p>
              </div>
              <Toggle on={darkMode} onChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-foreground">Language</p>
              </div>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground">
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">Subscription</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">{plan}</span>
            <span className="text-sm text-muted-foreground">{planPrices[plan]}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(planFeatures).map(([key, features]) => (
              <div key={key} className={`border rounded-lg p-4 ${key === plan ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <p className="text-sm font-medium text-foreground capitalize mb-2">{key}</p>
                <p className="text-lg font-heading text-foreground mb-3">{planPrices[key]}</p>
                <ul className="space-y-1.5">
                  {features.map((f) => <li key={f} className="text-xs text-muted-foreground">✓ {f}</li>)}
                </ul>
                {key !== plan && (
                  <button className="w-full mt-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    {key === "free" ? "Downgrade" : "Upgrade"} — Coming soon
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-lg text-foreground mb-4">About</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground">1.0.0</span>
            </div>
            <a href="/privacy" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> Privacy Policy
            </a>
            <a href="/terms" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> Terms of Service
            </a>
            <a href="mailto:support@rinvita.health" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
