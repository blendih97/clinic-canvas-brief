import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-heading text-3xl font-light text-foreground mb-6">Terms of Service</h1>
        <div className="prose prose-sm text-foreground/80 space-y-4">
          <p>By using RinVita you agree to these terms. RinVita is a health record organisation tool — it is not a medical device and does not provide medical advice.</p>
          <p>You are responsible for the accuracy of the documents you upload. RinVita uses AI to extract information but this extraction may contain errors.</p>
          <p>Always consult a qualified healthcare professional before making any health decisions based on information displayed in RinVita.</p>
          <p>For questions, contact support@rinvita.health</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
