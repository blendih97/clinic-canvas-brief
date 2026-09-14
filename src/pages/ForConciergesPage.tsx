import PartnerPage, { PartnerPageConfig } from "@/components/marketing/PartnerPage";

const config: PartnerPageConfig = {
  slug: "for-concierges",
  seoTitle: "RinVita for Medical Concierges — A Medical Passport for Mobile Clients",
  seoDescription:
    "For medical concierge and executive health providers: less record-chasing, translated records, and continuity across countries — with sharing always controlled by your client.",
  eyebrow: "For medical concierges & executive health",
  headline: "Help international patients",
  headlineAccent: "arrive prepared.",
  intro:
    "Internationally mobile families collect care in several countries and carry almost none of it with them. RinVita gives each client a patient-owned medical passport you can offer as part of your service — records organised, translated, and shared by the client in a clinician-ready view, wherever they are treated next. It is not an EHR and not a diagnostic tool.",
  problems: [
    {
      title: "Chasing records eats the relationship",
      body: "Every new specialist means another round of requests to clinics in other countries, in other time zones, in other languages.",
    },
    {
      title: "No continuity between countries",
      body: "Care delivered in Dubai, Geneva and London never meets in one place, so each clinician starts from what the client can remember.",
    },
    {
      title: "Sensitive material in ad-hoc channels",
      body: "Scans and letters end up in email threads and messaging apps, with no structure, no translation, and no way to withdraw access.",
    },
  ],
  benefits: [
    {
      icon: "◎",
      title: "Less record-chasing",
      body: "Clients gather their own history once, in one place. Your team coordinates care instead of collating attachments.",
    },
    {
      icon: "✦",
      title: "Translated, structured records",
      body: "Documents in many languages are organised into medications, results, imaging and visits, with the original kept alongside every translation for review.",
    },
    {
      icon: "↗",
      title: "Continuity across countries",
      body: "One history that travels with the family, so a consultation abroad can begin from the same organised record as the one at home.",
    },
    {
      icon: "🔒",
      title: "A premium, private experience",
      body: "Discreet and client-controlled: the client owns the account, chooses each recipient, and can revoke a time-limited link at any moment. Data is encrypted at rest and in transit.",
    },
  ],
};

const ForConciergesPage = () => <PartnerPage config={config} />;

export default ForConciergesPage;
