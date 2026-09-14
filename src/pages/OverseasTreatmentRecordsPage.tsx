import ConsumerPage, { type ConsumerPageConfig } from "@/components/marketing/ConsumerPage";

const config: ConsumerPageConfig = {
  slug: "medical-records-for-overseas-treatment",
  seoTitle: "Medical Records for Overseas Treatment and Second Opinions",
  seoDescription:
    "Preparing for treatment or a second opinion abroad? Organise and translate your medical records, then share a clinician-ready view through a time-limited link you control.",
  eyebrow: "For treatment and second opinions abroad",
  headline: "Arrive with your history ready,",
  headlineAccent: "not scattered across three countries.",
  intro:
    "Treatment abroad and overseas second opinions both begin the same way: someone asks you to send everything relevant. What usually follows is a scramble through emails, photographs and printouts in several languages. RinVita lets you assemble that package once, keep it current, and hand it over as one clear, revocable link.",
  problems: [
    {
      title: "The receiving team asks for everything",
      body: "Imaging reports, pathology, recent bloods, current medications and prior treatment — usually before they will confirm anything.",
    },
    {
      title: "It has to be readable on arrival",
      body: "A report the treating team cannot read delays the consultation, and sometimes leads to repeating tests you have already had.",
    },
    {
      title: "Sending it safely is its own problem",
      body: "Medical records sent as email attachments or messaging app photos stay wherever they land, with no way to take them back.",
    },
  ],
  sections: [
    {
      heading: "What an overseas team usually needs",
      paragraphs: [
        "Requirements vary by condition and by clinic, but most international patient departments ask for a similar core. Assembling it in advance is the single largest thing you can do to avoid delay.",
      ],
      bullets: [
        "A current, accurate medication list with doses",
        "Recent laboratory results, with the reference ranges used",
        "Imaging reports, and where possible the studies themselves",
        "Pathology or biopsy reports where relevant",
        "Discharge summaries and specialist letters describing prior treatment",
        "Known allergies and previous reactions",
      ],
    },
    {
      heading: "Second opinions depend on the quality of the history",
      paragraphs: [
        "A second opinion is only as good as the information the reviewing clinician receives. Gaps in the history tend to produce cautious, non-committal answers, and missing prior imaging is one of the most common reasons a review stalls.",
        "A structured summary with source documents behind it lets the reviewing clinician see the shape of your history quickly, then read the original wherever they want detail. RinVita does not interpret your results or offer an opinion of its own.",
      ],
    },
    {
      heading: "Sharing you can take back",
      paragraphs: [
        "Rather than emailing files, you share a link that shows a structured view of your records. The link is time-limited, and you can revoke it from your account the moment it is no longer needed — after the consultation, or if plans change and you go elsewhere.",
        "Each shared item remains traceable to the document it came from, so the receiving clinician is never asked to trust a summary alone.",
      ],
    },
    {
      heading: "Before you travel",
      paragraphs: [
        "Upload what you already hold as early as you can, so you can see what is missing while there is still time to request it. Bring the originals with you as well; many hospitals still want to see physical documents or imaging media at registration.",
      ],
    },
  ],
  limitations: [
    "RinVita is not a medical travel agency and does not arrange, recommend or vet treatment or providers.",
    "It does not give second opinions, interpret results or make clinical recommendations.",
    "It cannot obtain records from hospitals on your behalf — you upload what you hold or request it from your provider.",
    "Imaging studies themselves may still need to be carried on disc or transferred by the imaging provider.",
    "AI translation and extraction can be wrong; every item is traceable to its source document and should be checked against it.",
  ],
  faq: [
    {
      q: "What medical records do I need for treatment abroad?",
      a: "Most overseas teams ask for a current medication list, recent laboratory results, imaging and pathology reports, discharge summaries describing prior treatment, and known allergies. Requirements vary by clinic, so confirm with the receiving team.",
    },
    {
      q: "How do I send my records to a hospital in another country?",
      a: "With RinVita you share a time-limited link to a structured view of your records, with the original documents behind each entry, instead of emailing attachments. You can revoke the link at any time.",
    },
    {
      q: "Can RinVita translate my records for the receiving clinician?",
      a: "Yes. Records are translated and the original is always kept alongside. Translation is AI-generated and should be reviewed against the source document before any clinical decision.",
    },
    {
      q: "Does RinVita arrange treatment or recommend hospitals?",
      a: "No. RinVita only organises and translates the records you hold. Choosing a provider and a treatment plan is entirely between you and your clinicians.",
    },
    {
      q: "Can I take the sharing link back afterwards?",
      a: "Yes. Links are time-limited and you can revoke one immediately from your account.",
    },
  ],
  related: [
    { label: "What is a medical passport?", href: "/medical-passport" },
    { label: "Medical records for expats", href: "/medical-records-for-expats" },
    { label: "Organise family medical records", href: "/organise-medical-records-for-family" },
    { label: "For clinics", href: "/for-clinics" },
  ],
};

export default function OverseasTreatmentRecordsPage() {
  return <ConsumerPage config={config} />;
}
