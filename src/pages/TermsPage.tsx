import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";

const TermsPage = () => {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const copy = locale === "ar"
    ? {
        back: "رجوع",
        title: "شروط الخدمة",
        body: "تخضع الشروط النهائية للمراجعة القانونية. في الوقت الحالي، يتم تقديم RinVita كمساحة شخصية وآمنة لتنظيم سجلاتك الصحية ومشاركتها مع مقدمي الرعاية الذين تختارهم.",
      }
    : {
        back: "Back",
        title: "Terms of Service",
        body: "Final legal terms are under solicitor review. For now, RinVita is offered as a secure personal workspace for organising your records and sharing them only with clinicians you choose.",
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

export default TermsPage;
