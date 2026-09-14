import ConsumerPage, { type ConsumerPageConfig } from "@/components/marketing/ConsumerPage";

const config: ConsumerPageConfig = {
  slug: "medical-passport",
  seoTitle: "Medical Passport — Your International Medical Records in One Place",
  seoDescription:
    "A patient-owned medical passport for international medical records. Upload records in any language, see them organised and translated, and share a clinician-ready view abroad.",
  eyebrow: "For patients and families",
  headline: "One medical passport for a life lived across",
  headlineAccent: "more than one country.",
  intro:
    "If your health history is spread across hospitals, clinics, languages and filing systems in different countries, no single doctor has ever seen the whole picture. RinVita is a patient-owned medical passport: you upload the records you already have, RinVita translates and organises them, and you share a clear view with whichever clinician you are seeing next.",
  problems: [
    {
      title: "Records sit in the country they were made in",
      body: "A cardiology report in Istanbul, blood work in Dubai and a discharge letter in Paris rarely travel together. Nothing joins them up, so each new doctor starts from your memory.",
    },
    {
      title: "Language is the second barrier",
      body: "Even when you have the documents, an appointment in another country often begins with a clinician unable to read them. Multilingual health records need translation that keeps the original alongside.",
    },
    {
      title: "The urgent moment is the worst time to look",
      body: "Emergencies, second opinions and relocations all arrive with short notice. A medical passport is something you assemble calmly, in advance.",
    },
  ],
  sections: [
    {
      heading: "What a medical passport actually contains",
      paragraphs: [
        "A medical passport is not a new medical record created by a company — it is your existing records, gathered and made readable. RinVita takes the documents you upload and organises what they contain so it can be reviewed quickly.",
      ],
      bullets: [
        "Medications, with dose and where they were prescribed",
        "Blood and laboratory results, with reference ranges over time",
        "Imaging reports and the studies they describe",
        "Visits, admissions and discharge summaries as a timeline",
        "Allergies and recorded reactions",
        "The original document behind every single entry",
      ],
    },
    {
      heading: "Multilingual health records, with the original kept",
      paragraphs: [
        "Records are translated into the language you work in, and the source document is always kept beside the translation. That matters clinically: a doctor who wants to check a value, a date or a drug name can open the original page rather than trusting a summary.",
        "RinVita handles a wide range of languages, including Arabic, Mandarin, Turkish, French, German, Spanish, Portuguese, Russian, Polish and Hindi. Translation is produced by AI and should be reviewed against the source record before it is relied on clinically.",
      ],
    },
    {
      heading: "Overseas second opinions and treatment abroad",
      paragraphs: [
        "Second opinions depend almost entirely on the quality of the history the reviewing clinician receives. When you seek an opinion overseas, you are usually asked to supply everything relevant — and to supply it in a form the receiving team can read.",
        "With a medical passport you send one time-limited link instead of a folder of photographs. The receiving clinician sees a structured summary and can open any source document behind it. You can revoke that link the moment the consultation is over.",
      ],
    },
    {
      heading: "A family medical passport",
      paragraphs: [
        "Many people who need this are not managing only their own health. Parents in another country, children at school abroad and partners treated in a different system all generate records that someone has to hold. The Family plan allows separate profiles under one account, so each person's history stays distinct rather than merged into one pile.",
      ],
    },
  ],
  limitations: [
    "RinVita does not diagnose, does not give medical advice and does not replace a clinician's judgement.",
    "It does not connect to hospital systems or fetch records for you — you upload the documents you already hold, or request them from a provider.",
    "AI translation and extraction can make mistakes; every entry is traceable to its source document and should be checked against it.",
    "We do not describe RinVita as end-to-end encrypted. Records are encrypted at rest and in transit, and we hold the keys required to process them.",
    "No clinician is obliged to accept a shared summary; it is there to make their review faster, not to replace their own records.",
  ],
  faq: [
    {
      q: "What is a medical passport?",
      a: "A medical passport is a patient-owned collection of your own health records, organised and translated so that any clinician can review your history quickly. RinVita builds one from the documents you upload.",
    },
    {
      q: "Who owns my records and my account?",
      a: "You do. The account is yours, the records are yours, and nothing is shared with anyone unless you deliberately create a sharing link.",
    },
    {
      q: "Does it cost anything to start?",
      a: "No. The free plan lets you upload three documents, see them translated and organised, and no card is required. Paid plans start at £39 a month and add unlimited uploads, sharing, PDF export and record requests.",
    },
    {
      q: "Which languages are supported?",
      a: "A wide range, including Arabic, Mandarin, Turkish, French, German, Spanish, Portuguese, Russian, Polish and Hindi. The original document is always kept alongside the translation.",
    },
    {
      q: "How do I share my history with a doctor abroad?",
      a: "You create a sharing link that shows a structured summary with the source documents behind it. The link is time-limited and you can revoke it at any moment from your account.",
    },
    {
      q: "How is my information protected?",
      a: "Records are encrypted at rest and in transit, access is scoped to your account, and sharing is time-limited and revocable. We do not claim end-to-end encryption, because processing your documents requires us to hold the keys.",
    },
    {
      q: "Is RinVita a medical device or a diagnostic tool?",
      a: "No. RinVita organises and translates records you already have. It does not diagnose, interpret results clinically, or recommend treatment.",
    },
  ],
  related: [
    { label: "Medical records for expats", href: "/medical-records-for-expats" },
    { label: "Organise family medical records", href: "/organise-medical-records-for-family" },
    { label: "Records for overseas treatment", href: "/medical-records-for-overseas-treatment" },
    { label: "For clinics", href: "/for-clinics" },
  ],
};

export default function MedicalPassportPage() {
  return <ConsumerPage config={config} />;
}
