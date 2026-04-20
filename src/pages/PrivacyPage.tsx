import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const copy = locale === "ar"
    ? {
        back: "رجوع",
        title: "سياسة الخصوصية",
        body: "يتم إعداد سياسة الخصوصية النهائية للمراجعة القانونية. حتى ذلك الحين، تبقى بياناتك الصحية محصورة داخل حسابك ولا تتم مشاركتها إلا عندما تطلب أنت ذلك صراحةً.",
      }
    : {
        back: "Back",
        title: "Privacy Policy",
        body: "The final privacy policy is being prepared for legal review. Until then, your health data stays scoped to your account and is only shared when you explicitly request it.",
      };
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 md:p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {copy.back}
        </button>
        <h1 className="font-heading text-3xl font-light text-foreground mb-6">{copy.title}</h1>
        <div className="rounded-lg border border-border bg-card p-6 text-foreground/80">
          {copy.body}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
