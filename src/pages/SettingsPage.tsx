import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Lock, Download, Shield, Info, Trash2, ChevronRight, Building2, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const { t, isRTL } = useLocale();
  const navigate = useNavigate();
  const store = useVaultStore();

  const planFeatures: Record<string, string[]> = {
    free: [t("settings.planFreeFeature1"), t("settings.planFreeFeature2"), t("settings.planFreeFeature3")],
    standard: [t("settings.planStandardFeature1"), t("settings.planStandardFeature2"), t("settings.planStandardFeature3")],
    family: [t("settings.planFamilyFeature1"), t("settings.planFamilyFeature2"), t("settings.planFamilyFeature3")],
  };

  const planPrices: Record<string, string> = {
    free: t("settings.planFreePrice"),
    standard: t("settings.planStandardPrice"),
    family: t("settings.planFamilyPrice"),
  };

  const processors = [
    { name: "Lovable Cloud", region: t("settings.processorEuIreland"), purpose: t("settings.processorLovablePurpose") },
    { name: "Anthropic", region: t("settings.processorUnitedStates"), purpose: t("settings.processorAnthropicPurpose") },
    { name: "Stripe", region: t("settings.processorUnitedStates"), purpose: t("settings.processorStripePurpose") },
    { name: "Resend", region: t("settings.processorPending"), purpose: t("settings.processorResendPurpose") },
    { name: "Microsoft 365", region: t("settings.processorUkEu"), purpose: t("settings.processorMicrosoftPurpose") },
  ];

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
    else toast.success(t("settings.passwordResetSent"));
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
    toast.success(t("settings.dataExported"));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;

    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: deleteConfirm },
    });

    setDeleting(false);

    if (error) {
      toast.error(t("settings.deleteAccountError"));
      return;
    }

    toast.success(t("settings.accountDeleted"));
    await signOut();
    navigate("/auth", { replace: true });
  };

  const plan = profile?.plan || "free";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate("/app")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} /> {t("settings.backToDashboard")}
        </button>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-heading text-3xl font-light text-foreground">{t("settings.title")}</h1>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-foreground">{t("settings.language")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.languageDescription")}</p>
            </div>
            <LanguageSwitcher />
            <div className="pt-2">
              <p className="text-xs font-medium text-foreground">{t("settings.translationLanguage")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.translationLanguageDescription")}</p>
            </div>
            <LanguageSwitcher mode="translation" />
          </div>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("settings.notifications")}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">{t("settings.clinicianUploads")}</p><p className="text-xs text-muted-foreground">{t("settings.clinicianUploadsDesc")}</p></div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">{t("settings.newDocumentProcessed")}</p><p className="text-xs text-muted-foreground">{t("settings.newDocumentProcessedDesc")}</p></div>
              <Switch checked={documentProcessed} onCheckedChange={setDocumentProcessed} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">{t("settings.shareLinkActivity")}</p><p className="text-xs text-muted-foreground">{t("settings.shareLinkActivityDesc")}</p></div>
              <Switch checked={shareNotifs} onCheckedChange={setShareNotifs} />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-4"><p className="text-sm text-foreground">{t("settings.accountSecurityAlerts")}</p><p className="text-xs text-muted-foreground">{t("settings.accountSecurityAlertsDesc")}</p></div>
              <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("settings.privacySecurity")}</h2>
          <div className="space-y-4">
            <button onClick={handlePasswordReset}
              className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1"><p>{t("settings.changePassword")}</p><p className="text-xs text-muted-foreground">{t("settings.changePasswordDesc")}</p></div>
            </button>
            <div className="flex items-center justify-between px-4 py-3 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div><p className="text-sm text-foreground">{t("settings.twoFactor")}</p><p className="text-xs text-muted-foreground">{t("settings.twoFactorDesc")}</p></div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{t("settings.comingSoon")}</span>
            </div>
            <button onClick={handleExportData}
              className="w-full flex items-center gap-2 px-4 py-3 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left">
              <Download className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1"><p>{t("settings.exportAllData")}</p><p className="text-xs text-muted-foreground">{t("settings.exportAllDataDesc")}</p></div>
            </button>
            <button onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-2 px-4 py-3 border border-destructive/30 rounded-lg text-sm text-left text-destructive hover:bg-destructive/5 transition-colors">
              <Trash2 className="w-4 h-4" />
              <div className="flex-1"><p>{t("settings.deleteAccount")}</p><p className="text-xs text-muted-foreground">{t("settings.deleteAccountDesc")}</p></div>
            </button>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("settings.subscription")}</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">{plan}</span>
            <span className="text-sm text-muted-foreground">{planPrices[plan]}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(planFeatures).map(([key, features]) => (
              <div key={key} className={`border rounded-lg p-4 ${key === plan ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <p className="text-sm font-medium text-foreground capitalize mb-2">{key === "free" ? t("settings.freeTrial") : key}</p>
                <p className="text-lg font-heading text-foreground mb-3">{planPrices[key]}</p>
                <ul className="space-y-1.5">
                  {features.map((f) => <li key={f} className="text-xs text-muted-foreground">✓ {f}</li>)}
                </ul>
                {key !== plan && (
                  <button className="w-full mt-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    {key === "free" ? t("settings.downgrade") : t("settings.upgrade")} — {t("settings.comingSoon")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-lg text-foreground mb-4">{t("settings.about")}</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("settings.version")}</span>
              <span className="text-foreground">1.0.0</span>
            </div>
            <a href="/privacy" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> {t("settings.privacyPolicy")}
            </a>
            <a href="/terms" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> {t("settings.termsOfService")}
            </a>
            <button onClick={() => setShowProcessorsDialog(true)} className="flex w-full items-center gap-2 text-foreground hover:text-primary transition-colors text-left">
              <Building2 className="w-4 h-4" />
              <span className="flex-1">{t("settings.processors")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <a href="mailto:support@rinvita.health" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" /> {t("settings.contactSupport")}
            </a>
          </div>
        </section>

        <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirm(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">{t("settings.deleteAccountTitle")}</DialogTitle>
              <DialogDescription>
                {t("settings.deleteAccountPrompt")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <BellRing className="mt-0.5 h-4 w-4 text-destructive" />
                <p className="text-sm text-foreground">{t("settings.irreversible")}</p>
              </div>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={t("settings.typeDelete")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== "DELETE" || deleting}>
                {deleting ? t("settings.deleting") : t("settings.deleteAccount")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showProcessorsDialog} onOpenChange={setShowProcessorsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">{t("settings.processorsTitle")}</DialogTitle>
              <DialogDescription>
                {t("settings.processorsDescription")}
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
