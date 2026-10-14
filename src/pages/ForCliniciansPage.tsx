import PartnerPage, { PartnerPageConfig } from "@/components/marketing/PartnerPage";

const config: PartnerPageConfig = {
  slug: "for-clinics",
  seoTitle: "RinVita for Clinics — Patient-controlled medical records for your practice",
  seoDescription:
    "Offer patients a branded medical record to store, review and share reports, results and letters with any doctor by secure link or PDF. No EHR integration.",
  eyebrow: "For private clinics & practices",
  headline: "Give your patients their records —",
  headlineAccent: "in one place they control.",
  intro:
    "RinVita is a branded medical record your practice offers its patients. They store, review and share every report, result and letter with any doctor by secure link or PDF. Fewer resend requests for your team, better-prepared appointments, and a premium extra your patients will value.",
  pilotCaption: "Free 60-day pilot for 5 of your patients.",
  pilotPoints: [
    "Selected clinics only",
    "Free 60-day pilot",
    "For 5 of your patients",
    "No EHR integration required",
    "Guided setup and co-branded invitation materials",
    "Success review at the end of the pilot",
  ],
  pilotFaqAnswer: "A free 60-day pilot for 5 of your patients, guided setup, co-branded invitation materials, no integration work, and a success review at the end.",
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
      title: "A premium service your patients keep using",
      body: "Give patients a medical record they control, ready to store, review and share whenever they need care.",
    },
    {
      icon: "✦",
      title: "Fewer requests to resend results and letters",
      body: "Patients keep their reports, results and letters in one place, ready to review or share without asking your team for another copy.",
    },
    {
      icon: "↗",
      title: "New patients arrive with their history organised",
      body: "Patients can bring records from their previous providers and share an organised history before their appointment, with originals available for review.",
    },
    {
      icon: "◎",
      title: "Records from abroad translated automatically",
      body: "Records are translated automatically where needed, with every original kept alongside for the patient and doctor to check.",
    },
    {
      icon: "🔒",
      title: "Your branding, our secure infrastructure",
      body: "Offer a branded patient experience on infrastructure encrypted at rest and in transit. Patients control access to their records; no EHR integration is required.",
    },
  ],
};

const ForCliniciansPage = () => <PartnerPage config={config} />;

export default ForCliniciansPage;
