import { useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import Sidebar from "@/components/Sidebar";
import OverviewSection from "@/components/sections/OverviewSection";
import BloodResultsSection from "@/components/sections/BloodResultsSection";
import ImagingSection from "@/components/sections/ImagingSection";
import MedicationsSection from "@/components/sections/MedicationsSection";
import DocumentsSection from "@/components/sections/DocumentsSection";
import ShareBriefSection from "@/components/sections/ShareBriefSection";
import BillingSection from "@/components/sections/BillingSection";
import ExportSection from "@/components/sections/ExportSection";
import FamilySection from "@/components/sections/FamilySection";
import DocumentUpload from "@/components/DocumentUpload";
import OnboardingModal from "@/components/OnboardingModal";
import { Upload, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing" | "export" | "family";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewingMember, setViewingMember] = useState<{ id: string; name: string } | null>(null);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const { user } = useAuth();
  const { loadUserData, documents } = useVaultStore();

  useEffect(() => {
    if (user && !viewingMember) {
      loadUserData(user.id);
    }
  }, [user, loadUserData, viewingMember]);

  useEffect(() => {
    if (user && !showSplash) {
      const dismissed = localStorage.getItem(`vault-onboarding-${user.id}`);
      if (!dismissed && documents.length === 0) {
        setShowOnboarding(true);
      }
    }
  }, [user, showSplash, documents.length]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (user) localStorage.setItem(`vault-onboarding-${user.id}`, "true");
  };

  const handleViewMember = (memberId: string, memberName: string) => {
    setViewingMember({ id: memberId, name: memberName });
    loadUserData(memberId);
    setSection("overview");
  };

  const handleReturnToMyVault = () => {
    setViewingMember(null);
    if (user) loadUserData(user.id);
    setSection("overview");
  };

  const renderSection = () => {
    switch (section) {
      case "overview":
        return <OverviewSection onNavigate={setSection} onUpload={() => setUploadOpen(true)} />;
      case "blood":
        return <BloodResultsSection />;
      case "imaging":
        return <ImagingSection />;
      case "medications":
        return <MedicationsSection />;
      case "documents":
        return <DocumentsSection />;
      case "share":
        return <ShareBriefSection />;
      case "billing":
        return <BillingSection />;
      case "export":
        return <ExportSection />;
      case "family":
        return <FamilySection onViewMember={handleViewMember} />;
      default:
        return <OverviewSection onNavigate={setSection} onUpload={() => setUploadOpen(true)} />;
    }
  };

  const showUploadBanner = documents.length === 0 && !showOnboarding && user &&
    localStorage.getItem(`vault-onboarding-${user.id}`) === "true";

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="flex min-h-screen bg-background">
        <Sidebar active={section} onNavigate={setSection} />
        <main className="flex-1 p-6 md:p-8 overflow-auto pb-20 md:pb-8 pt-16 md:pt-8">
          {/* Family member viewing banner */}
          {viewingMember && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
              <p className="text-sm text-foreground">
                You are viewing <span className="font-semibold">{viewingMember.name}</span>'s vault
              </p>
              <button
                onClick={handleReturnToMyVault}
                className="shrink-0 ml-3 flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to My Vault
              </button>
            </div>
          )}

          {showUploadBanner && (
            <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <p className="text-sm text-foreground">
                <span className="font-medium">Get started:</span> Upload your first medical document to begin building your health vault.
              </p>
              <button onClick={() => setUploadOpen(true)}
                className="shrink-0 ml-3 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                Upload
              </button>
            </div>
          )}
          {!viewingMember && (
            <div className="flex items-center justify-end mb-4">
              <button onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Upload className="w-4 h-4" />
                Add Document
              </button>
            </div>
          )}
          {renderSection()}
        </main>
      </div>
      <DocumentUpload open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} onUpload={() => setUploadOpen(true)} />
    </>
  );
};

export default Index;
