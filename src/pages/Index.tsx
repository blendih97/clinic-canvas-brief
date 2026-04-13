import { useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import Sidebar from "@/components/Sidebar";
import OverviewSection from "@/components/sections/OverviewSection";
import BloodResultsSection from "@/components/sections/BloodResultsSection";
import ImagingSection from "@/components/sections/ImagingSection";
import MediaSection from "@/components/sections/MediaSection";
import MedicationsSection from "@/components/sections/MedicationsSection";
import DocumentsSection from "@/components/sections/DocumentsSection";
import ShareBriefSection from "@/components/sections/ShareBriefSection";
import BillingSection from "@/components/sections/BillingSection";
import ExportSection from "@/components/sections/ExportSection";
import FamilySection from "@/components/sections/FamilySection";
import DocumentUpload from "@/components/DocumentUpload";
import OnboardingModal from "@/components/OnboardingModal";
import RequestRecordsModal from "@/components/RequestRecordsModal";
import { Upload, ArrowLeft, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultStore } from "@/store/vaultStore";
import { supabase } from "@/integrations/supabase/client";

type Section = "overview" | "blood" | "imaging" | "media" | "medications" | "documents" | "share" | "billing" | "export" | "family";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewingMember, setViewingMember] = useState<{ id: string; name: string } | null>(null);
  const [receivedNotifications, setReceivedNotifications] = useState<{ provider_name: string; id: string }[]>([]);
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

  // Check for received record requests
  useEffect(() => {
    if (!user) return;
    const checkReceived = async () => {
      const dismissedKey = `vault-received-dismissed-${user.id}`;
      const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || "[]");
      
      const { data } = await supabase
        .from("record_requests")
        .select("id, provider_name")
        .eq("user_id", user.id)
        .eq("status", "received");

      if (data) {
        const newNotifications = data.filter((r: any) => !dismissed.includes(r.id));
        setReceivedNotifications(newNotifications);
      }
    };
    checkReceived();
  }, [user, section]);

  const dismissNotification = (id: string) => {
    if (!user) return;
    const dismissedKey = `vault-received-dismissed-${user.id}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || "[]");
    localStorage.setItem(dismissedKey, JSON.stringify([...dismissed, id]));
    setReceivedNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Listen for cross-section navigation events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setSection(detail as Section);
    };
    window.addEventListener("navigate-section", handler);
    return () => window.removeEventListener("navigate-section", handler);
  }, []);

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
        return <OverviewSection onNavigate={setSection} onUpload={() => setUploadOpen(true)} onRequestRecords={() => setRequestOpen(true)} />;
      case "blood":
        return <BloodResultsSection />;
      case "imaging":
        return <ImagingSection />;
      case "media":
        return <MediaSection onRequestRecords={() => setRequestOpen(true)} onUpload={() => setUploadOpen(true)} />;
      case "medications":
        return <MedicationsSection />;
      case "documents":
        return <DocumentsSection onRequestRecords={() => setRequestOpen(true)} />;
      case "share":
        return <ShareBriefSection />;
      case "billing":
        return <BillingSection />;
      case "export":
        return <ExportSection />;
      case "family":
        return <FamilySection onViewMember={handleViewMember} />;
      default:
        return <OverviewSection onNavigate={setSection} onUpload={() => setUploadOpen(true)} onRequestRecords={() => setRequestOpen(true)} />;
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

          {/* Received records notifications */}
          {receivedNotifications.map((n) => (
            <div key={n.id} className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-600" />
                <p className="text-sm text-foreground">
                  New records received from <span className="font-semibold">{n.provider_name}</span> — 
                  <button onClick={() => { setSection("documents"); dismissNotification(n.id); }} className="text-primary font-medium ml-1 hover:underline">
                    tap to view
                  </button>
                </p>
              </div>
              <button onClick={() => dismissNotification(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
                Dismiss
              </button>
            </div>
          ))}

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
      <RequestRecordsModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} onUpload={() => setUploadOpen(true)} />
    </>
  );
};

export default Index;
