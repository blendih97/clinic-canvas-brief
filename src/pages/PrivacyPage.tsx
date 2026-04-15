import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-heading text-3xl font-light text-foreground mb-6">Privacy Policy</h1>
        <div className="prose prose-sm text-foreground/80 space-y-4">
          <p>RinVita processes your health data including medical documents, blood results, imaging findings, and medication records to provide you with a unified health record platform.</p>
          <p>Your data is encrypted at rest and in transit. We do not sell your health data to third parties. Shared links are time-limited and encrypted.</p>
          <p>You can export or delete all your data at any time from your Settings page.</p>
          <p>For questions, contact support@rinvita.health</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
