import { useParams, Navigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import TranslatorTool from "@/components/marketing/TranslatorTool";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";
import {
  TRANSLATE_LANGUAGES,
  findTranslateLanguage,
  translatePath,
  type TranslateLanguage,
} from "@/data/translateLanguages";

const DOCUMENT_TYPES = [
  "Laboratory and blood test results",
  "Hospital discharge summaries and letters",
  "Prescriptions and medication lists",
  "Imaging reports — ultrasound, MRI, CT and X-ray",
  "Vaccination records and child health booklets",
];

const buildFaq = (lang: TranslateLanguage) => [
  {
    q: `Can I translate ${lang.name} medical records into English for free?`,
    a: `Yes. Upload a PDF or a clear photo of the document and RinVita produces an English translation and a plain-English summary. The free translator allows five documents a day and does not require an account.`,
  },
  {
    q: "Is the translation accepted as an official or certified translation?",
    a: "No. This is an AI translation intended to help you and your clinician read the document. If an authority, insurer or immigration office requires a certified translation, use a certified translator.",
  },
  {
    q: "Is my document stored?",
    a: "The document is processed in memory to produce the translation and is not stored by the free tool. If you create a free account, you choose which records to save to your own medical passport.",
  },
  {
    q: `What should I bring to a new doctor with my ${lang.name} records?`,
    a: "Bring the original document and the translated summary together. Ask the practice to add both to your record, so the next clinician can see the source alongside the translation.",
  },
];

export default function TranslateLanguagePage() {
  const { slug } = useParams();
  const lang = findTranslateLanguage(slug);
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const headingFont = "Cormorant Garamond";

  if (!lang) return <Navigate to="/translate" replace />;

  const path = translatePath(lang.slug);
  const faq = buildFaq(lang);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const others = TRANSLATE_LANGUAGES.filter((l) => l.slug !== lang.slug);

  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink, minHeight: "100vh" }}>
      <SEO
        title={`Translate ${lang.name} Medical Records into English — Free | RinVita`}
        description={`Free AI translation of ${lang.name} medical records into English: lab results, discharge summaries, prescriptions, imaging reports and vaccination records, plus a plain-English summary and a ${lang.name} medical term glossary.`}
        path={path}
        jsonLd={faqSchema}
      />
      <MarketingStyles />
      <MarketingNav currentPage="home" />

      {/* Hero */}
      <section style={{ padding: `${isMobile ? 100 : 140}px ${paddingX}px ${isMobile ? 36 : 56}px` }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <span className="marketing-section-label">Free tool · {lang.name} → English</span>
          <h1 style={{ fontFamily: headingFont, fontSize: isMobile ? 34 : "clamp(38px,4.4vw,56px)", fontWeight: 300, lineHeight: 1.12, marginBottom: 18, letterSpacing: "-0.02em" }}>
            Translate {lang.name} medical records into{" "}
            <em style={{ fontStyle: "italic", color: marketingColors.gold }}>English.</em>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 17.5, color: marketingColors.mutedText, lineHeight: 1.8, fontWeight: 300 }}>
            You have {lang.context} — and the doctor you are seeing next, in the UK or anywhere else, cannot read it.
            Upload the document here and get an English translation with a plain-English summary in about a minute.
            No account needed.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section style={{ padding: `0 ${paddingX}px ${isMobile ? 48 : 72}px` }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <TranslatorTool defaultTargetLanguage="en" landingPath={path} isMobile={isMobile} />

          <div style={{ marginTop: 28, padding: isMobile ? 22 : 28, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, textAlign: "center" }}>
            <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 24 : 28, fontWeight: 400, marginBottom: 10 }}>
              Keep all your records translated in one place
            </h2>
            <Link
              to="/auth?mode=signup"
              style={{ display: "inline-block", padding: "13px 28px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              Create your medical passport
            </Link>
            <p style={{ fontSize: 12.5, color: marketingColors.softText, marginTop: 12 }}>
              Free plan · 3 documents · no card required.
            </p>
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section style={{ padding: `${isMobile ? 52 : 80}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 27 : 36, fontWeight: 300, marginBottom: 16 }}>
            Common terms you'll see on {lang.name} medical documents
          </h2>
          <div style={{ overflowX: "auto", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 13.5 : 14.5 }}>
              <caption className="sr-only">{lang.name} medical terms and their English meanings</caption>
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>{lang.name} term</th>
                  <th scope="col" style={thStyle}>English meaning</th>
                </tr>
              </thead>
              <tbody>
                {lang.glossary.map((g) => (
                  <tr key={g.term}>
                    <td
                      style={{ ...tdStyle, fontWeight: 500 }}
                      dir={lang.rtl ? "rtl" : undefined}
                      lang={lang.code}
                    >
                      {g.term}
                    </td>
                    <td style={{ ...tdStyle, color: marketingColors.mutedText }}>{g.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 13, color: marketingColors.softText, marginTop: 14, fontStyle: "italic" }}>
            For orientation only — always confirm with a clinician.
          </p>
        </div>
      </section>

      {/* Prose sections */}
      <section style={{ padding: `${isMobile ? 52 : 80}px ${paddingX}px` }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 26 : 32, fontWeight: 300, marginBottom: 14 }}>
            Which {lang.name} documents people usually need translated
          </h2>
          <ul style={{ margin: "0 0 44px", padding: 0, listStyle: "none" }}>
            {DOCUMENT_TYPES.map((d) => (
              <li key={d} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span aria-hidden style={{ color: marketingColors.gold, marginTop: 2 }}>✦</span>
                <span style={{ fontSize: 15, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{d}</span>
              </li>
            ))}
          </ul>

          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 26 : 32, fontWeight: 300, marginBottom: 14 }}>
            How to use the translation at a new doctor
          </h2>
          <p style={paraStyle}>
            Bring the original document and the translated summary to your first appointment, on paper or on your phone.
            Clinicians work faster when they can see the source beside the translation, and dates, drug names and
            reference ranges can be checked on the original page.
          </p>
          <p style={{ ...paraStyle, marginBottom: 44 }}>
            Ask the practice to add both versions to your record, so the next clinician who sees you does not have to
            start from your memory.
          </p>

          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 26 : 32, fontWeight: 300, marginBottom: 14 }}>
            The limits of an AI translation
          </h2>
          <p style={paraStyle}>
            AI translation is an aid, not a certified translation. It can misread handwriting, faint scans and
            abbreviations, and it does not diagnose or interpret your results. Always review the translation against the
            original and discuss anything that matters with a qualified clinician.
          </p>
          <p style={paraStyle}>
            If an authority, insurer, employer or immigration office requires a certified translation, use a certified
            translator — this tool does not replace one.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: `${isMobile ? 52 : 80}px ${paddingX}px`, background: marketingColors.cream2 }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 27 : 36, fontWeight: 300, marginBottom: 22, textAlign: "center" }}>
            Questions about {lang.name} medical translation
          </h2>
          {faq.map((item) => (
            <details key={item.q} style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, padding: isMobile ? "16px 18px" : "18px 22px", marginBottom: 10 }}>
              <summary style={{ cursor: "pointer", fontSize: 15.5, fontWeight: 500, lineHeight: 1.5, listStyle: "none" }}>{item.q}</summary>
              <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Other languages */}
      <section style={{ padding: `${isMobile ? 52 : 80}px ${paddingX}px` }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <h2 style={{ fontFamily: headingFont, fontSize: isMobile ? 26 : 32, fontWeight: 300, marginBottom: 18 }}>
            Translate medical records from another language
          </h2>
          <nav aria-label="Other language pages" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {others.map((l) => (
              <Link key={l.slug} to={translatePath(l.slug)} style={chipStyle}>
                {l.name} → English
              </Link>
            ))}
            <Link to="/translate" style={{ ...chipStyle, background: marketingColors.goldSoft }}>
              All languages · free translator
            </Link>
          </nav>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 18px",
  borderBottom: `1px solid ${marketingColors.goldBorder}`,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: marketingColors.gold,
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderBottom: `1px solid hsl(var(--foreground) / 0.06)`,
  lineHeight: 1.6,
  verticalAlign: "top",
};

const paraStyle: React.CSSProperties = {
  fontSize: 15.5,
  lineHeight: 1.9,
  color: marketingColors.mutedText,
  fontWeight: 300,
  marginBottom: 14,
};

const chipStyle: React.CSSProperties = {
  padding: "9px 16px",
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  color: marketingColors.gold,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textDecoration: "none",
};
