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
        <div className="rounded-lg border border-border bg-card p-6 text-foreground/80">
          Coming soon — under solicitor review.
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
