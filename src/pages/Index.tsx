import { useState, useCallback } from "react";
import SplashScreen from "@/components/SplashScreen";
import Sidebar from "@/components/Sidebar";
import OverviewSection from "@/components/sections/OverviewSection";
import BloodResultsSection from "@/components/sections/BloodResultsSection";
import ImagingSection from "@/components/sections/ImagingSection";
import MedicationsSection from "@/components/sections/MedicationsSection";
import DocumentsSection from "@/components/sections/DocumentsSection";
import ShareBriefSection from "@/components/sections/ShareBriefSection";
import BillingSection from "@/components/sections/BillingSection";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing";

const sectionComponents: Record<Section, React.FC> = {
  overview: OverviewSection,
  blood: BloodResultsSection,
  imaging: ImagingSection,
  medications: MedicationsSection,
  documents: DocumentsSection,
  share: ShareBriefSection,
  billing: BillingSection,
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  const ActiveSection = sectionComponents[section];

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="flex min-h-screen bg-background">
        <Sidebar active={section} onNavigate={setSection} />
        <main className="flex-1 p-8 overflow-auto">
          <ActiveSection />
        </main>
      </div>
    </>
  );
};

export default Index;
