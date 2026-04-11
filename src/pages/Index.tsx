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
import DocumentUpload from "@/components/DocumentUpload";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [uploadOpen, setUploadOpen] = useState(false);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const { user } = useAuth();
  const loadUserData = useVaultStore((s) => s.loadUserData);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user, loadUserData]);

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
      default:
        return <OverviewSection onNavigate={setSection} onUpload={() => setUploadOpen(true)} />;
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="flex min-h-screen bg-background">
        <Sidebar active={section} onNavigate={setSection} />
        <main className="flex-1 p-6 md:p-8 overflow-auto pb-20 md:pb-8 pt-16 md:pt-8">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Add Document
            </button>
          </div>
          {renderSection()}
        </main>
      </div>
      <DocumentUpload open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
};

export default Index;
