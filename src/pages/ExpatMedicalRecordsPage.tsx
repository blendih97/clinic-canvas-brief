import ConsumerPage, { type ConsumerPageConfig } from "@/components/marketing/ConsumerPage";

const config: ConsumerPageConfig = {
  slug: "medical-records-for-expats",
  seoTitle: "Medical Records for Expats — Keep Your History When You Move Country",
  seoDescription:
    "Expat medical records are scattered across countries and languages. Bring them into one place, translated and organised, and share a clinician-ready view with a new doctor abroad.",
  eyebrow: "For expats and people relocating",
  headline: "When you move country, your medical history",
  headlineAccent: "usually doesn't move with you.",
  intro:
    "Registering with a new doctor abroad often means starting from a blank page. You are asked what you have been treated for, what you take, what you react to — and the documents that prove it are in another country, another system, and often another language. RinVita gives you one place to hold that history and one way to hand it over.",
  problems: [
    {
      title: "Each move resets the record",
      body: "Health systems rarely transfer anything between countries. After two or three moves, your own memory is the only continuous record that exists.",
    },
    {
      title: "Requesting records takes weeks",
      body: "Old practices and hospitals have their own processes, and by the time the file arrives you may already have had the appointment.",
    },
    {
      title: "Insurance and registration ask for detail",
      body: "New insurers and clinics ask for dates, diagnoses and prescriptions you cannot reconstruct from memory without documents.",
    },
  ],
  sections: [
    {
      heading: "Gather what you have before you need it",
      paragraphs: [
        "The most useful time to build an expat medical record is before the next appointment, not during it. Most people already hold more than they think: discharge letters, prescription boxes, lab result emails, insurance claim documents and photographs of paperwork taken at the time.",
        "Upload those into RinVita and they stop being a folder of files. They become a timeline of visits, a medication list, a set of results with reference ranges, and a list of recorded allergies — each one still linked to the document it came from.",
      ],
      bullets: [
        "Ask your previous practice for a summary before you deregister",
        "Photograph paper records at the point of care, while you still have them",
        "Keep prescription labels — they carry drug name, dose and prescriber",
        "Save insurance claim paperwork; it often contains diagnosis codes and dates",
      ],
    },
    {
      heading: "The language problem, specifically",
      paragraphs: [
        "Moving between health systems usually means moving between languages. A German discharge letter is not useful to a clinician in Dubai, and a Turkish cardiology report is not useful in Lisbon. RinVita translates records and keeps the original beside the translation, so the new clinician can verify anything they want to check.",
        "Translation is AI-generated and should be reviewed against the source record before any clinical decision. Drug names, units and reference ranges in particular differ between countries and deserve a second look.",
      ],
    },
    {
      heading: "Registering with a new doctor",
      paragraphs: [
        "When you register somewhere new, you can share a structured summary through a time-limited link rather than emailing a pile of attachments. The clinician sees medications, results, imaging and visits, and can open any source document behind them.",
        "The link expires, and you can revoke it yourself as soon as the appointment is done. Nothing stays accessible longer than you intend.",
      ],
    },
  ],
  limitations: [
    "RinVita cannot request records from your previous health system on your behalf — you upload what you hold or ask your provider for it.",
    "It is not a substitute for registering with local healthcare or for local insurance requirements.",
    "AI translation and extraction can be wrong; check anything clinically important against the original document.",
    "RinVita does not diagnose and does not give medical advice.",
    "Records are encrypted at rest and in transit — not end-to-end encrypted, as processing requires us to hold the keys.",
  ],
  faq: [
    {
      q: "How do I move my medical records to another country?",
      a: "There is usually no official transfer between national systems. In practice you request a summary or copies from your previous providers, then keep them yourself. RinVita gives you one place to store, translate and organise them.",
    },
    {
      q: "Can I upload photographs of paper records?",
      a: "Yes. Photographs, scans and PDFs are all accepted, and legible images are processed the same way as digital documents.",
    },
    {
      q: "Will a doctor in my new country accept this?",
      a: "RinVita gives a clinician a structured summary with the original documents behind it, which is quicker to review than loose files. Whether and how they use it is always their own clinical decision.",
    },
    {
      q: "What does it cost?",
      a: "The free plan covers three documents with no card required. Paid plans start at £39 a month and add unlimited uploads, sharing, PDF export and record requests.",
    },
    {
      q: "Can I keep records for my partner and children too?",
      a: "Yes, with the Family plan, which supports separate profiles under one account so each person's history stays distinct.",
    },
  ],
  related: [
    { label: "What is a medical passport?", href: "/medical-passport" },
    { label: "Organise family medical records", href: "/organise-medical-records-for-family" },
    { label: "Records for overseas treatment", href: "/medical-records-for-overseas-treatment" },
  ],
};

export default function ExpatMedicalRecordsPage() {
  return <ConsumerPage config={config} />;
}
