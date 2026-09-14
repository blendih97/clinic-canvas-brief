import ConsumerPage, { type ConsumerPageConfig } from "@/components/marketing/ConsumerPage";

const config: ConsumerPageConfig = {
  slug: "organise-medical-records-for-family",
  seoTitle: "Organise Medical Records for Your Family — Including Parents Abroad",
  seoDescription:
    "A practical way to organise family medical records across countries: separate profiles, translated documents, a clear medication list and sharing you control.",
  eyebrow: "For families and carers",
  headline: "One person usually ends up holding",
  headlineAccent: "everyone's medical history.",
  intro:
    "If you are the person who knows which tablets your mother takes, when your father's last scan was, and what your child reacted to at four years old, you are already the family's medical record — usually from another country, and usually from memory. RinVita gives that role a proper place to live.",
  problems: [
    {
      title: "Caring for parents in another country",
      body: "Appointments happen while you are not there, in a language you may not read, and the paperwork stays in a drawer you cannot reach.",
    },
    {
      title: "Each person's history gets mixed up",
      body: "Photographs of documents pile up in one camera roll, and nobody can tell whose result is whose or which year it belongs to.",
    },
    {
      title: "The information is needed under pressure",
      body: "An admission or an emergency is when someone asks for the medication list — and that is the hardest moment to find it.",
    },
  ],
  sections: [
    {
      heading: "Keep each person separate",
      paragraphs: [
        "The first practical step is to stop treating family records as one collection. RinVita's Family plan supports separate profiles under a single account, so a parent's cardiology history never blends into a child's allergy record.",
        "Each profile holds its own documents, medications, results, imaging and visit timeline. Sharing is decided per profile, so handing a clinician your father's history does not expose anyone else's.",
      ],
    },
    {
      heading: "A medication list that stays current",
      paragraphs: [
        "The single most requested piece of information in any consultation is an accurate, current medication list — and it is the one families most often get wrong, especially when prescriptions come from more than one country.",
        "As you upload prescriptions and discharge letters, RinVita builds a medication list with dose and source, so you can see where each entry came from rather than relying on recollection. Check it against the original prescription before relying on it; RinVita organises what the documents say, it does not verify what is currently being taken.",
      ],
      bullets: [
        "Upload the prescription, not a typed note — the source matters",
        "Re-upload after any change in treatment",
        "Keep discharge summaries; they usually restate the full list",
        "Record allergies and reactions explicitly, with the document that reports them",
      ],
    },
    {
      heading: "Records in more than one language",
      paragraphs: [
        "Families spread across countries generate records in several languages at once. RinVita translates each document and keeps the original alongside, so a sibling, a carer or a clinician can read the same record in the language they need while still being able to check the source.",
        "Translation is AI-generated. For anything that affects treatment, read it against the original document.",
      ],
    },
    {
      heading: "Sharing with the people who need it",
      paragraphs: [
        "When a relative is admitted, or a new specialist takes over, you can share a structured view through a time-limited link rather than forwarding a folder of photographs. You can revoke that link immediately once it is no longer needed.",
        "Only share a relative's records with their knowledge and agreement, or where you hold the legal authority to act for them.",
      ],
    },
  ],
  limitations: [
    "Managing a relative's records requires their consent, or the legal authority to act on their behalf.",
    "RinVita does not collect records from hospitals for you — the family uploads what it holds.",
    "It does not monitor health, send medication reminders or alert anyone to a change.",
    "AI extraction and translation can be wrong; the original document is always kept so it can be checked.",
    "RinVita does not diagnose and does not give medical advice.",
  ],
  faq: [
    {
      q: "Can I manage medical records for my parents?",
      a: "Yes. The Family plan supports separate profiles under one account, so you can hold a parent's records distinctly from your own. You should do this with their agreement, or where you have legal authority to act for them.",
    },
    {
      q: "How many people can one account cover?",
      a: "The Family plan supports up to six separate health profiles under one account.",
    },
    {
      q: "Does each family member's history stay separate?",
      a: "Yes. Documents, medications, results and sharing are held per profile rather than merged.",
    },
    {
      q: "What is the best way to start?",
      a: "Begin with the current medication list, recorded allergies, and the most recent discharge or specialist letter for each person. Those three cover most of what a clinician asks for first.",
    },
    {
      q: "Is there a free way to try it?",
      a: "Yes — the free plan covers three documents with no card required. Family features, including multiple profiles, are part of the paid Family plan.",
    },
  ],
  related: [
    { label: "What is a medical passport?", href: "/medical-passport" },
    { label: "Medical records for expats", href: "/medical-records-for-expats" },
    { label: "Records for overseas treatment", href: "/medical-records-for-overseas-treatment" },
  ],
};

export default function FamilyMedicalRecordsPage() {
  return <ConsumerPage config={config} />;
}
