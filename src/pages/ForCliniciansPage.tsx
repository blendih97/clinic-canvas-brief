import PartnerPage, { PartnerPageConfig } from "@/components/marketing/PartnerPage";

const config: PartnerPageConfig = {
  slug: "for-clinics",
  seoTitle: "RinVita for Clinics — Help International Patients Arrive Prepared",
  seoDescription:
    "A patient-owned international medical passport you can offer your patients. Records organised and translated before arrival, shared by the patient in a clinician-ready view. No EHR integration.",
  eyebrow: "For private clinics & international patient departments",
  headline: "Help international patients",
  headlineAccent: "arrive prepared.",
  intro:
    "RinVita is a patient-owned international medical passport, distributed by trusted healthcare partners. Patients bring their own history — organised, translated, and shared in a clinician-ready view — so your team spends consultation time on care rather than chasing paperwork. It is not an EHR and not a diagnostic tool.",
  problems: [
    {
      title: "Records arrive after the patient does",
      body: "Requests to overseas providers take days or weeks. Consultations begin with an incomplete picture, and follow-ups get rebooked.",
    },
    {
      title: "The history is in another language",
      body: "Discharge letters, labs and imaging reports arrive in languages your team can't read, often as photographs of paper.",
    },
    {
      title: "Coordinators absorb the work",
      body: "International patient teams spend hours collating documents by email and messaging apps, with no structured record at the end of it.",
    },
  ],
  benefits: [
    {
      icon: "◎",
      title: "A prepared first consultation",
      body: "Patients invite themselves in before travel and arrive with medications, results, imaging and visit history already structured — with the original documents attached for review.",
    },
    {
      icon: "✦",
      title: "Nothing to integrate",
      body: "No connection to your EHR or practice management system. A pilot can start with an invitation email, not an IT project.",
    },
    {
      icon: "↗",
      title: "Continuity after they leave",
      body: "The record stays with the patient, so onward care abroad and follow-up with your clinic start from the same organised history.",
    },
    {
      icon: "🔒",
      title: "Patient-controlled sharing",
      body: "Patients decide what to share and with whom. Links are time-limited and revocable, data is encrypted at rest and in transit, and access is scoped to the account holder.",
    },
  ],
};

const ForCliniciansPage = () => <PartnerPage config={config} />;

export default ForCliniciansPage;
