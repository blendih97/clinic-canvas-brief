import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, Download, Shield, Info, Trash2, ChevronRight, Building2, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const planFeatures: Record<string, string[]> = {
  free: ["1 document upload", "AI extraction & translation", "No sharing, export, or record requests"],
  standard: ["Unlimited uploads", "Full AI extraction & translation", "Unlimited share links"],
  family: ["Everything in Standard", "Up to 6 family members", "Shared billing"],
};

const planPrices: Record<string, string> = {
  free: "Free — 14 days",
  standard: "£39/month",
  family: "£89.99/month",
};

const processors = [
  { name: "Lovable Cloud", region: "EU / Ireland", purpose: "Secure database, authentication, and file storage" },
  { name: "Anthropic", region: "United States", purpose: "AI processing with Standard Contractual Clauses" },
  { name: "Stripe", region: "United States", purpose: "Payments and subscription billing" },
  { name: "Resend", region: "Pending setup", purpose: "Email delivery once configured" },
  { name: "Microsoft 365", region: "UK / EU", purpose: "Business email and support operations" },
];

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const store = useVaultStore();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [documentProcessed, setDocumentProcessed] = useState(true);
  const [shareNotifs, setShareNotifs] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProcessorsDialog, setShowProcessorsDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;

    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: deleteConfirm },
    });

    setDeleting(false);

    if (error) {
      toast.error("Unable to delete your account right now");
      return;
    }

    toast.success("Your account has been deleted");
    await signOut();
    navigate("/auth", { replace: true });
  };

  const plan = profile?.plan || "free";

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
              <div className="pr-4"><p className="text-sm text-foreground">Clinician uploads</p><p className="text-xs text-muted-foreground">Get notified when a clinician or provider has uploaded records to your RinVita account via the Request Records flow</p></div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">New document processed</p><p className="text-xs text-muted-foreground">Get notified when a document you've uploaded has finished processing and is ready to view</p></div>
              <Switch checked={documentProcessed} onCheckedChange={setDocumentProcessed} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">Share link activity</p><p className="text-xs text-muted-foreground">Know when someone you've shared records with opens the link</p></div>
              <Switch checked={shareNotifs} onCheckedChange={setShareNotifs} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">Account security alerts</p><p className="text-xs text-muted-foreground">Get notified of suspicious login attempts or password changes</p></div>
              <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
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
            <button onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-2 px-4 py-3 border border-destructive/30 rounded-lg text-sm text-left text-destructive hover:bg-destructive/5 transition-colors">
              <Trash2 className="w-4 h-4" />
              <div className="flex-1"><p>Delete account</p><p className="text-xs text-muted-foreground">Permanently delete your account and all your data</p></div>
            </button>
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
                <p className="text-sm font-medium text-foreground capitalize mb-2">{key === "free" ? "Free Trial" : key}</p>
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
            <button onClick={() => setShowProcessorsDialog(true)} className="flex w-full items-center gap-2 text-foreground hover:text-primary transition-colors text-left">
              <Building2 className="w-4 h-4" />
              <span className="flex-1">Our data processors</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <a href="mailto:support@rinvita.health" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> Contact Support
            </a>
          </div>
        </section>

        <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirm(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Delete account</DialogTitle>
              <DialogDescription>
                This permanently deletes your account, uploaded documents, and associated health data. Type DELETE to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <BellRing className="mt-0.5 h-4 w-4 text-destructive" />
                <p className="text-sm text-foreground">This action cannot be undone.</p>
              </div>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE" || deleting}>
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showProcessorsDialog} onOpenChange={setShowProcessorsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">Our data processors</DialogTitle>
              <DialogDescription>
                These providers help RinVita securely deliver storage, AI processing, payments, and email operations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {processors.map((processor) => (
                <div key={processor.name} className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{processor.name}</p>
                    <span className="text-xs text-muted-foreground">{processor.region}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{processor.purpose}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SettingsPage;
