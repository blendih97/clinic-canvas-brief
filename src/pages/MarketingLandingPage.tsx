import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FolderOpen, Share2 } from "lucide-react";
import SEO from "@/components/SEO";
import InstantDemo from "@/components/marketing/InstantDemo";
import SampleHealthPassport from "@/components/marketing/SampleHealthPassport";
import ShareRinVita from "@/components/marketing/ShareRinVita";
import { SAMPLE_DOCS, SAMPLE_PATIENT, type SampleDoc } from "@/data/sampleAmiraK";
import { Button } from "@/components/ui/button";
import {
  LogoMark,
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  useMarketingBreakpoint,
  useReveal,
} from "@/components/marketing/shared";

function AppMockup({ scale = 1 }: { scale?: number }) {
  const lab = SAMPLE_DOCS.find((doc) => doc.id === "singapore-blood");
  const tiles = [
    ["Labs", `${lab?.markers?.[0]?.name} · ${lab?.markers?.[0]?.value}`, "Dubai → Singapore"],
    ["Medications", "2 past prescriptions", "Paris · Mar 2025"],
    ["Allergies", "Not documented", "Check with patient"],
    ["Imaging", "Echocardiogram · EF 62%", "Istanbul · Jul 2025"],
    ["Visits", "4 records across countries", "Nov 2024 – Feb 2026"],
  ];

  const width = 300;
  const height = 640;

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "top center", width, height }}>
      <div
        style={{
          width,
          height,
          borderRadius: 40,
          background: marketingColors.surface,
          boxShadow: "0 28px 64px hsl(var(--foreground) / 0.18), 0 0 0 1px hsl(var(--foreground) / 0.08)",
          overflow: "hidden",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 100, height: 28, borderRadius: 16, background: "hsl(var(--foreground))", zIndex: 50 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 48, zIndex: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 7px", background: marketingColors.cream }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: marketingColors.ink }}>9:41</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 14, height: 8, borderRadius: 2, background: marketingColors.ink }} />
            <div style={{ width: 20, height: 8, borderRadius: 4, border: `1px solid ${marketingColors.softText}` }} />
          </div>
        </div>
        {/* App header (matches real mobile header: logo left, avatar right) */}
        <div style={{ position: "absolute", top: 48, left: 0, right: 0, height: 38, zIndex: 9, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: marketingColors.cream2, borderBottom: `1px solid ${marketingColors.goldBorder}` }}>
          <div style={{ fontFamily: "Cormorant Garamond", fontSize: 15, fontWeight: 300, letterSpacing: "0.15em", color: marketingColors.gold }}>RinVita</div>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: marketingColors.gold, fontFamily: "Cormorant Garamond" }}>A</div>
        </div>

        {/* Content area */}
        <div style={{ position: "absolute", top: 86, left: 0, right: 0, bottom: 56, background: marketingColors.cream, overflowY: "auto", padding: "12px 14px 18px" }}>
          <div style={{ fontFamily: "Cormorant Garamond", fontSize: 25, color: marketingColors.ink, marginBottom: 3 }}>Health overview</div>
          <div style={{ fontSize: 10, color: marketingColors.softText, marginBottom: 14 }}>{SAMPLE_PATIENT.fullName} · Fictional sample</div>
          <div className="text-destructive" style={{ borderLeft: "2px solid hsl(var(--destructive))", paddingLeft: 8, marginBottom: 14, fontSize: 10, lineHeight: 1.5 }}>Allergies not documented in these records</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {tiles.map(([title, value, source]) => (
              <div key={title} style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 5, padding: "12px 9px", minHeight: 96 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: marketingColors.gold, marginBottom: 7 }}>{title}</div>
                <div style={{ fontSize: 10, lineHeight: 1.5, color: marketingColors.ink }}>{value}</div>
                <div style={{ fontSize: 8, lineHeight: 1.5, color: marketingColors.softText, marginTop: 6 }}>{source}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: marketingColors.gold, marginTop: 16 }}>Original records linked to every entry ↗</div>
        </div>

        {/* Bottom nav (matches real mobile app: 5 tabs) */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, background: marketingColors.cream2, borderTop: `1px solid ${marketingColors.goldBorder}`, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", zIndex: 20, paddingBottom: 8 }}>
          {[
            { icon: "▦", label: "Overview", active: true },
            { icon: "◈", label: "Lab", active: false },
            { icon: "⊙", label: "Imaging", active: false },
            { icon: "▤", label: "Records", active: false },
            { icon: "⋯", label: "More", active: false },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <span style={{ fontSize: 13, color: item.active ? marketingColors.gold : marketingColors.softText, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 7, fontWeight: item.active ? 600 : 400, color: item.active ? marketingColors.gold : marketingColors.softText }}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 100, height: 3.5, borderRadius: 2, background: "hsl(var(--foreground) / 0.18)", zIndex: 60 }} />
      </div>
    </div>
  );
}

const sampleDubai = SAMPLE_DOCS.find((doc) => doc.id === "dubai-labs");
const sampleParis = SAMPLE_DOCS.find((doc) => doc.id === "paris-discharge");
const sampleIstanbul = SAMPLE_DOCS.find((doc) => doc.id === "istanbul-cardiology");
const sampleSingapore = SAMPLE_DOCS.find((doc) => doc.id === "singapore-blood");

function SampleSource({ doc }: { doc?: SampleDoc }) {
  if (!doc) return null;
  return <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{doc.language} · {doc.dateISO} · {doc.originCity}</div>;
}

function LabPreview() {
  return (
    <div className="space-y-3 text-xs">
      {sampleDubai?.markers?.slice(0, 3).map((marker) => {
        const latest = sampleSingapore?.markers?.find((item) => item.name === marker.name);
        return <div key={marker.name}>
          <div className="flex flex-wrap justify-between gap-2 font-medium"><span>{marker.name}</span><span><span className="text-destructive">{marker.value} ↓</span> → {latest?.value}</span></div>
          <div className="mt-1 text-[11px] text-muted-foreground">Reference range: {marker.range}</div>
        </div>;
      })}
      <SampleSource doc={sampleDubai} /><SampleSource doc={sampleSingapore} />
    </div>
  );
}

function MedicationPreview() {
  return <div className="space-y-3 text-xs">
    <div className="font-medium">Past prescriptions · 5-day discharge course</div>
    {sampleParis?.medications?.map((med) => <div key={med.name}><div className="font-medium">{med.name}</div><div className="mt-1 text-muted-foreground">{med.dose} · {med.freq}</div></div>)}
    <div className="text-muted-foreground">{sampleParis?.facility} · Individual prescriber not stated</div>
    <SampleSource doc={sampleParis} />
  </div>;
}

function ImagingPreview() {
  return <div className="text-xs leading-relaxed">
    <div className="font-medium">Echocardiogram · LV ejection fraction</div>
    <div className="my-2 font-heading text-3xl text-primary">{sampleIstanbul?.markers?.find((marker) => marker.name === "LV Ejection Fraction")?.value}</div>
    <div>No structural abnormality reported.</div>
    <div className="mt-2 text-muted-foreground">Source: {sampleIstanbul?.translatedTitle}</div>
    <SampleSource doc={sampleIstanbul} />
  </div>;
}

function PassportContents() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const cards = [
    { title: "Original documents", body: "Every source file stored and ready to review, side by side with its translation where needed.", preview: <div className="text-xs leading-relaxed"><div className="grid grid-cols-2 gap-3 border-b border-border pb-3"><div><div className="mb-2 text-muted-foreground">Original · French</div><div>{sampleParis?.originalTitle}</div><div className="mt-2">{sampleParis?.originalSnippet[3]}</div></div><div><div className="mb-2 text-muted-foreground">English translation</div><div>{sampleParis?.translatedTitle}</div><div className="mt-2">Uncomplicated acute appendicitis.</div></div></div><SampleSource doc={sampleParis} /></div> },
    { title: "Lab results, tracked over time", body: "Values, units and reference ranges. Abnormal results flagged, with trends across countries.", preview: <LabPreview /> },
    { title: "Medications", body: "Current and past medications, dose, frequency, prescriber and country — where recorded.", preview: <MedicationPreview /> },
    { title: "Allergies and alerts", body: "Shown first, every time. Missing information stays visibly missing.", preview: <div className="text-xs leading-relaxed"><div className="border-l-2 border-destructive pl-3 text-destructive"><strong>Allergies: not documented</strong><div>Confirm with the patient; absence of a record is not confirmation of no allergies.</div></div><div className="mt-4 font-medium">Recorded alert · Dubai</div><div>{sampleDubai?.flags?.[0]?.label}</div><SampleSource doc={sampleDubai} /></div> },
    { title: "Imaging reports", body: "MRI, CT, X-ray and ultrasound reports, with originals attached and translated automatically where needed. This sample includes an echocardiogram.", preview: <ImagingPreview /> },
    { title: "Diagnoses and visit history", body: "Consultations, admissions and discharge summaries, organised as a timeline.", preview: <ol className="space-y-3 border-l border-primary/30 pl-3 text-xs">{SAMPLE_DOCS.map((doc) => <li key={doc.id}><div className="font-medium">{doc.timeline.note}</div><SampleSource doc={doc} /></li>)}</ol> },
  ];
  return <section id="inside-passport" style={{ padding: `${isMobile ? 64 : 96}px ${isMobile ? 20 : isTablet ? 32 : 56}px`, background: marketingColors.cream2 }}>
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 text-center"><span className="marketing-section-label">What RinVita builds</span><h2 className="font-heading text-[34px] font-light leading-tight md:text-[46px]">Inside every RinVita passport</h2><p className="mt-3 text-xs text-muted-foreground">Amira K. · Fictional sample records from Dubai, Paris, Istanbul and Singapore</p></div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => <article key={card.title} className="flex min-w-0 flex-col rounded border border-primary/20 bg-card p-6 text-card-foreground">
          <div className="mb-3 font-heading text-xl text-primary">0{index + 1}</div>
          <h3 className="font-heading text-[26px] leading-tight">{card.title}</h3>
          <p className="mb-5 mt-3 text-sm font-light leading-relaxed text-muted-foreground">{card.body}</p>
          <div className="mt-auto border-t border-primary/20 pt-5">{card.preview}</div>
        </article>)}
      </div>
      <p className="mt-9 text-center text-sm leading-relaxed text-muted-foreground">Everything a doctor needs, organised, and always in your hands.</p>
    </div>
  </section>;
}

function DoctorBrief() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  return <section id="clinician-brief" style={{ padding: `${isMobile ? 64 : 96}px ${isMobile ? 20 : isTablet ? 32 : 56}px`, background: marketingColors.cream }}>
    <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="min-w-0"><span className="marketing-section-label">For clinical review</span><h2 className="font-heading text-[34px] font-light leading-tight md:text-[46px]">Built for the doctor on the other side</h2>
        <ul className="my-7 space-y-5 text-sm font-light leading-relaxed text-muted-foreground">{[
          "One page, clinical order: alerts, medications, labs, imaging, history.",
          "Every value traceable to its source document and language.",
          "Secure one-time link or PDF — no app or login needed for the doctor.",
          "Not a diagnostic tool; nothing is interpreted or changed. Review the structured output against the originals.",
        ].map((point) => <li key={point} className="flex gap-3"><span className="text-primary" aria-hidden>◆</span><span>{point}</span></li>)}</ul>
        <Button asChild className="h-auto max-w-full whitespace-normal rounded-sm px-6 py-4 text-sm"><a href="#sample-passport">See a sample clinician brief →</a></Button>
      </div>
      <article aria-label="Sample clinician brief" className="min-w-0 rounded border border-primary/30 bg-card p-6 text-card-foreground shadow-sm md:p-8">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-primary/20 pb-4"><div><div className="font-heading text-3xl text-primary">Clinician brief</div><div className="mt-1 text-sm">{SAMPLE_PATIENT.fullName} · DOB 12 Jun 1990</div></div><span className="text-xs text-muted-foreground">Fictional sample</span></header>
        <div className="divide-y divide-border text-xs leading-relaxed">
          <div className="pb-4 text-destructive"><h3 className="mb-1 font-semibold">Allergies & alerts</h3><p>Allergies not documented — confirm with patient.</p><p className="mt-2">{sampleDubai?.flags?.[0]?.label}</p><SampleSource doc={sampleDubai} /></div>
          <div className="py-4"><h3 className="mb-2 font-semibold">Active medications</h3><p>Current medication list not documented in this sample.</p><p className="mt-2">Past: {sampleParis?.medications?.[0]?.name} · {sampleParis?.medications?.[0]?.dose} · {sampleParis?.medications?.[0]?.freq}</p><SampleSource doc={sampleParis} /></div>
          <div className="py-4"><h3 className="mb-2 font-semibold">Flagged labs & follow-up</h3><p><span className="text-destructive">Ferritin 9 ng/mL ↓</span> (reference 15 – 150) → 38 ng/mL on follow-up.</p><SampleSource doc={sampleDubai} /><SampleSource doc={sampleSingapore} /></div>
          <div className="py-4"><h3 className="mb-2 font-semibold">Recent imaging</h3><ImagingPreview /></div>
          <div className="pt-4"><h3 className="mb-2 font-semibold">Visit history</h3><p>Laparoscopic appendectomy · 21 March 2025</p><SampleSource doc={sampleParis} /></div>
        </div>
      </article>
    </div>
  </section>;
}

function Hero() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  return (
    <section style={{ minHeight: "auto", display: "flex", alignItems: "center", padding: isMobile ? "88px 20px 56px" : `120px ${paddingX}px 80px`, background: marketingColors.cream, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(hsl(var(--primary) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.05) 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 100%, transparent 40%, black 100%)" }} />
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 80, alignItems: "center" }}>
        <div style={{ animation: "marketing-fade-up 0.9s cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: "hsl(var(--primary) / 0.06)", border: `1px solid hsl(var(--primary) / 0.15)`, borderRadius: 2, marginBottom: isMobile ? 28 : 44 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "hsl(var(--primary))", animation: "marketing-pulse 2s infinite" }} />
            <span style={{ fontSize: isMobile ? 9 : 11, letterSpacing: "0.14em", color: "hsl(var(--primary))", fontWeight: 500 }}>THE MEDICAL PASSPORT FOR INTERNATIONAL FAMILIES</span>
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 38 : isTablet ? 48 : 56, fontWeight: 300, lineHeight: 1.1, color: marketingColors.ink, marginBottom: isMobile ? 18 : 24, letterSpacing: 0 }}>
            Your medical records. One place.{" "}
            <em style={{ fontStyle: "italic", color: marketingColors.gold }}>Ready to share with any doctor.</em>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 17, lineHeight: 1.7, color: marketingColors.mutedText, maxWidth: 520, marginBottom: isMobile ? 22 : 28, fontWeight: 300 }}>
            Store every report, result and letter from every provider. Review your history any time, and share it with any doctor in seconds by a secure one-time link or a PDF. Records from abroad are translated automatically.
          </p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center" }}>
            <Link to="/auth?mode=signup" style={{ padding: isMobile ? "18px 24px" : "17px 36px", background: marketingColors.gold, borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: isMobile ? 15 : 15.5, fontWeight: 600, letterSpacing: "0.05em", textDecoration: "none", textAlign: "center", boxShadow: "0 6px 28px hsl(var(--primary) / 0.4)" }}>
              Start free — 3 documents
            </Link>
            <Link to="/demo" style={{ padding: isMobile ? "15px 24px" : "15px 28px", background: "transparent", border: `1px solid ${marketingColors.gold}`, borderRadius: 2, color: marketingColors.gold, fontSize: 14, textDecoration: "none", textAlign: "center", fontWeight: 500 }}>
              See an example →
            </Link>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {[
              { icon: FolderOpen, text: "Store — every record, every provider, every country" },
              { icon: ClipboardList, text: "Review — results tracked over time, medications and allergies in one list" },
              { icon: Share2, text: "Share — one-time secure link or PDF, no app or login for the doctor" },
            ].map(({ icon: Icon, text }) => <li key={text} className="flex items-start gap-3"><Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span className="min-w-0">{text}</span></li>)}
          </ul>
          <div style={{ marginTop: 12, fontSize: 12.5, color: marketingColors.softText, letterSpacing: "0.01em", fontWeight: 400 }}>
            Is your clinic or concierge a RinVita partner? Ask them for free access.
          </div>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px" }}>
            <Link to="/for-clinics" style={{ padding: "11px 20px", border: `1px solid ${marketingColors.ink}`, borderRadius: 2, color: marketingColors.ink, fontSize: 13.5, fontWeight: 500, textDecoration: "none" }}>
              For clinics &amp; concierges →
            </Link>
            <Link to="/pricing" style={{ fontSize: 12.5, color: marketingColors.gold, textDecoration: "none", fontWeight: 500 }}>
              See pricing
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? "8px 16px" : 20, marginTop: isMobile ? 22 : 28, fontSize: 12, color: marketingColors.mutedText, letterSpacing: "0.02em" }}>
            {[
              "Designed with UK GDPR principles in mind",
              "Encrypted at rest and in transit",
              "You control access",
              "Built for international healthcare",
            ].map((item) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: marketingColors.gold, fontSize: 13 }}>✓</span>
                {item}
              </span>
            ))}
          </div>
          {isMobile && (
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 340,
                  height: 470,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "72%", height: 34, borderRadius: "50%", background: "hsl(var(--primary) / 0.14)", filter: "blur(20px)" }} />
                <div style={{ transform: "translateY(0) scale(0.72)", transformOrigin: "top center" }}>
                  <AppMockup />
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: isMobile ? 40 : 64, paddingTop: isMobile ? 28 : 40, borderTop: `1px solid hsl(var(--foreground) / 0.1)`, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? "20px 16px" : 24 }}>
            {[
              ["45+", "languages", "From Arabic to Mandarin"],
              ["256-bit", "encryption", "At rest and in transit"],
              ["UK GDPR", "providers", "See our Privacy Policy"],
              ["UK", "registered", "ICO ZC123014"],
            ].map(([value, unit, sub]) => (
              <div key={value}>
                <div style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 26, color: marketingColors.gold, fontWeight: 400, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.7)", marginTop: 2, fontWeight: 500 }}>{unit}</div>
                <div style={{ fontSize: 10, color: marketingColors.softText, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", justifyContent: "center", animation: "marketing-fade-up 1s 0.12s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ animation: "marketing-float 6s ease-in-out infinite", position: "relative" }}>
              <div style={{ position: "absolute", bottom: -30, left: "10%", right: "10%", height: 60, background: "hsl(var(--primary) / 0.14)", borderRadius: "50%", filter: "blur(24px)" }} />
              <AppMockup scale={isTablet ? 0.88 : 1} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const steps = [
    {
      n: "01",
      title: "Upload",
      desc: "Patients upload PDFs, scans, photographs and medical records from any country or provider — no formatting required.",
      icon: "↥",
    },
    {
      n: "02",
      title: "Translate",
      desc: "Records are automatically translated and structured across 45+ languages, from Arabic to Mandarin.",
      icon: "◎",
    },
    {
      n: "03",
      title: "Understand",
      desc: "Generate clinician-ready summaries, medication lists and a clear timeline of every diagnosis, test and treatment.",
      icon: "✦",
    },
    {
      n: "04",
      title: "Share",
      desc: "Securely share a structured summary with any doctor, anywhere in the world — with time-limited, revocable access.",
      icon: "↗",
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 80 }}>
          <span className="marketing-section-label">How it works</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 34 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>From scattered records to a clear medical passport</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 2 : 0 }}>
          {steps.map((step, index) => (
            <div key={step.n} style={{ padding: isMobile ? "32px 24px" : "44px 32px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderLeft: !isMobile && index > 0 ? "none" : `1px solid ${marketingColors.goldBorder}` }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: marketingColors.gold, fontSize: 22 }}>{step.icon}</div>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 11, color: "hsl(var(--primary) / 0.7)", letterSpacing: "0.1em", marginBottom: 8 }}>STEP {step.n}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 22 : 26, fontWeight: 400, color: marketingColors.ink, marginBottom: 12, lineHeight: 1.2 }}>{step.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyRinVita() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile } = useMarketingBreakpoint();

  return (
    <section style={{ padding: `${isMobile ? 72 : 100}px ${isMobile ? 20 : 56}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <span className="marketing-section-label">Why RinVita exists</span>
        <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.4vw,46px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 24, lineHeight: 1.2 }}>
          Built by people working in international healthcare.
        </h2>
        <p style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 18 : 22, fontWeight: 300, lineHeight: 1.7, color: "hsl(var(--foreground) / 0.78)", fontStyle: "italic", marginBottom: 20 }}>
          We saw first-hand how difficult it can be for families and patients to manage records across different countries, hospitals and languages.
        </p>
        <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 32 }}>
          RinVita was created to give patients one secure place to store, review and share their records whenever it matters most.
        </p>
        <div style={{ width: 48, height: 1, background: marketingColors.goldStrong, margin: "0 auto" }} />
      </div>
    </section>
  );
}

function UseCases() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const cases = [
    { tag: "Families", title: "International Families", desc: "Keep your family's medical history together, no matter where life takes you." },
    { tag: "Mobility", title: "Expats & Relocations", desc: "Move countries without losing important medical information." },
    { tag: "Specialists", title: "Second Opinions", desc: "Share structured records with specialists quickly and easily." },
    { tag: "Concierge", title: "Private & Concierge Healthcare", desc: "Give clinicians a clear picture without chasing documents across multiple languages and providers." },
  ];

  return (
    <section style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
          <span className="marketing-section-label">Who it's for</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>For lives that don't stay in one place</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(2,1fr)", gap: 16 }}>
          {cases.map((c) => (
            <div key={c.title} style={{ padding: isMobile ? "28px 24px" : "36px 32px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div style={{ display: "inline-block", fontSize: 10, letterSpacing: "0.12em", color: marketingColors.gold, fontWeight: 500, padding: "3px 10px", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 1, marginBottom: 14, textTransform: "uppercase" }}>{c.tag}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 28, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.2 }}>{c.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoVideo() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  return (
    <section id="demo" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 48 }}>
          <span className="marketing-section-label">Demo</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 14 }}>See RinVita in action.</h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: marketingColors.mutedText, maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
            See how to add your records, review lab trends, medications and visits, and share a clinician-ready brief with any doctor.
          </p>
        </div>
        <div style={{ position: "relative", borderRadius: 4, overflow: "hidden", border: `1px solid ${marketingColors.goldBorder}`, background: "hsl(var(--foreground) / 0.02)", boxShadow: "0 24px 80px hsl(var(--foreground) / 0.08)" }}>
          <video
            src="/video/rinvita-demo.mp4"
            controls
            playsInline
            preload="metadata"
            poster="/image/rinvita-demo-poster.jpg"
            style={{ width: "100%", display: "block", aspectRatio: "16 / 9", background: marketingColors.cream2 }}
          />
        </div>
      </div>
    </section>
  );
}

function Features() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const features = [
    ["One Secure Place", "Store Every Record", "Reports, results and letters from every provider and country, with originals always available."],
    ["Your History Together", "Review Your Record", "Results tracked over time, medications, allergies, imaging and visits — translated automatically where needed across 45+ languages."],
    ["You Stay In Control", "Share With Any Doctor", "Share by secure one-time link or PDF, with no app or login needed for the doctor."],
    ["Up to 6 Members", "Family Plan", "Manage records for elderly parents, children, and dependents under one secure account."],
  ];

  return (
    <section id="features" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 80 }}>
          <span className="marketing-section-label">Features</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>Built for real international lives</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
          {features.map(([tag, title, desc]) => (
            <div key={title} style={{ padding: isMobile ? "28px 24px" : 48, background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: marketingColors.gold, fontSize: 20 }}>✦</div>
              <div style={{ display: "inline-block", fontSize: 10, letterSpacing: "0.1em", color: marketingColors.gold, fontWeight: 500, padding: "3px 10px", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 1, marginBottom: 12 }}>{tag}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 27, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.2 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClinicalSafety() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const pillars = [
    {
      icon: "🔒",
      title: "Your records, not ours",
      body: "Your medical history is encrypted with AES-256 at rest and TLS 1.3 in transit, isolated per user with row-level security. No RinVita employee can read your documents without an explicit, logged access grant from you. You can delete everything anytime.",
    },
    {
      icon: "📄",
      title: "Source documents always preserved",
      body: "Every stored record and structured summary keeps the original document one click away, translated automatically where needed. Doctors can verify any detail against the original at any moment. We never replace your records — we organise them.",
    },
    {
      icon: "✦",
      title: "AI assists, doesn't replace",
      body: "Our AI structures and translates. It doesn't make clinical decisions. Every share brief is reviewed and approved by you before any clinician sees it. AI-generated content is clearly marked.",
    },
    {
      icon: "🛡",
      title: "UK-registered, encrypted storage",
      body: "Stored encrypted with UK GDPR-compliant providers — see our Privacy Policy for the full list of processors. RinVita Ltd is ICO registered (ZC123014). Health data is processed with your explicit consent, and our legal basis is kept under review.",
    },
    {
      icon: "🛡",
      title: "Audit trail",
      body: "Every change, every access, every share is logged. You can see exactly who accessed what, and when.",
    },
  ];

  return (
    <section id="security" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
          <span className="marketing-section-label">Security & trust</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 16 }}>Your health information belongs to you.</h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: marketingColors.mutedText, maxWidth: 600, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
            Designed for sensitive medical information — encrypted at rest and in transit, user-scoped access controls, and revocable, time-limited sharing. You control who can access your records.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)", gap: 16 }}>
          {pillars.map((p) => (
            <div key={p.title} style={{ padding: isMobile ? "26px 22px" : "32px 28px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 18 }}>{p.icon}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, color: marketingColors.ink, marginBottom: 10, lineHeight: 1.25 }}>{p.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, color: marketingColors.mutedText, fontWeight: 300 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const [trustOpen, setTrustOpen] = useState<string | null>(null);

  // Fire pricing_viewed once when the section mounts
  useEffect(() => {
    let cancelled = false;
    import("@/lib/analytics").then((a) => { if (!cancelled) a.trackEvent("pricing_viewed"); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const freePlan = {
    name: "Free plan",
    badge: "3 DOCUMENTS · NO CARD",
    price: "Free",
    period: "3 documents",
    desc: "Start free with up to 3 documents. No card required, no time limit.",
    features: [
      "Up to 3 documents, free",
      "Full AI translation and structured summaries",
      "Travelling abroad? Translation in 45+ languages",
      "Preview clinician share links and PDF exports",
    ],
    cta: "Start free",
    available: true,
  };

  const futurePlans = [
    {
      name: "Standard",
      price: "£149",
      period: "/year",
      desc: "For individuals managing complex medical history.",
      highlight: null as string | null,
      features: [
        "1 user account",
        "Unlimited document uploads",
        "Translation in 45+ languages",
        "AI-structured medical summaries",
        "Clinician sharing links (full collaboration)",
        "Priority support",
        "Cancel anytime",
      ],
    },
    {
      name: "Family",
      price: "£249",
      period: "/year",
      desc: "One plan for the whole family, across every border.",
      highlight: "Best for families",
      features: [
        "Up to 6 family members",
        "Separate health passport per member",
        "Unlimited document uploads per member",
        "Translation in 45+ languages",
        "AI-structured medical summaries",
        "Family admin dashboard",
        "Clinician sharing links (full collaboration)",
        "Priority support",
        "Cancel anytime",
      ],
    },
  ];

  return (
    <section id="pricing" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
          <span className="marketing-section-label">Pricing</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 16 }}>Simple annual plans for individuals and families.</h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: marketingColors.mutedText, maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
            Start free with 3 documents — no card required. Upgrade when you need unlimited uploads, full sharing and PDF export.
          </p>
        </div>

        {/* Paid plans */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 11, letterSpacing: "0.16em", color: marketingColors.softText, fontWeight: 500, textTransform: "uppercase" }}>Upgrade when you need more</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: isMobile ? 20 : 24, alignItems: "stretch" }}>
          {futurePlans.map((plan) => {
            const isFamily = plan.name === "Family";
            const displayPrice = plan.price;
            return (
              <div
                key={plan.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: isMobile ? "32px 24px" : "40px 36px",
                  background: marketingColors.surface,
                  border: isFamily ? `1.5px solid ${marketingColors.gold}` : `1px solid ${marketingColors.goldBorder}`,
                  borderRadius: 2,
                  position: "relative",
                  boxShadow: isFamily ? "0 12px 48px hsl(var(--primary) / 0.10)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -12, left: isMobile ? 24 : 36, background: marketingColors.gold, color: "hsl(var(--primary-foreground))", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", padding: "4px 14px", borderRadius: 1, textTransform: "uppercase" }}>
                    {plan.highlight}
                  </div>
                )}
                <div style={{ fontFamily: "Cormorant Garamond", fontSize: 11, color: "hsl(var(--primary) / 0.7)", letterSpacing: "0.1em", marginBottom: 12, marginTop: plan.highlight ? 4 : 0 }}>{plan.name.toUpperCase()}</div>

                {/* Try free badge above price */}
                <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6, padding: "5px 10px", background: "hsl(var(--primary) / 0.08)", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: marketingColors.gold, textTransform: "uppercase", marginBottom: 12 }}>
                  ✦ Start free — 3 documents, no card
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 40 : 48, fontWeight: 300, color: marketingColors.ink, lineHeight: 1 }}>{displayPrice}</span>
                  <span style={{ fontSize: 13, color: marketingColors.softText }}>{plan.period}</span>
                </div>



                <p style={{ fontSize: 13, color: marketingColors.mutedText, marginTop: 4, marginBottom: 20, lineHeight: 1.6 }}>{plan.desc}</p>
                <div style={{ height: 1, background: marketingColors.goldBorder, marginBottom: 20 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: marketingColors.gold, fontSize: 13, marginTop: 2 }}>✓</span>
                      <span style={{ fontSize: 13.5, color: "hsl(var(--foreground) / 0.78)", fontWeight: 300, lineHeight: 1.55 }}>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to={`/auth?mode=signup&plan=${plan.name.toLowerCase()}`}
                  style={{
                    marginTop: 24,
                    padding: "13px 20px",
                    width: "100%",
                    background: marketingColors.gold,
                    color: "hsl(var(--primary-foreground))",
                    border: `1px solid ${marketingColors.gold}`,
                    borderRadius: 2,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)",
                  }}
                >
                  Choose {plan.name}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Free plan callout */}
        <div style={{ marginTop: isMobile ? 56 : 72, padding: isMobile ? "32px 24px" : "40px 44px", background: marketingColors.cream2, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
          <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 28, fontWeight: 400, color: marketingColors.ink, marginBottom: 6 }}>Start free — no card required</h3>
          <p style={{ fontSize: 14, color: marketingColors.mutedText, marginBottom: 20, lineHeight: 1.7 }}>Free plan · 3 documents · No card required. Everything below is included:</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: isMobile ? 16 : 20, marginBottom: 24 }}>
            {freePlan.features.map((item) => (
              <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: marketingColors.gold, fontSize: 14, marginTop: 2 }}>◆</span>
                <span style={{ fontSize: 14, color: "hsl(var(--foreground) / 0.78)", fontWeight: 300, lineHeight: 1.7 }}>{item}</span>
              </div>
            ))}
          </div>
          <Link to="/auth?mode=signup" style={{ display: "inline-block", padding: "13px 28px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {freePlan.cta}
          </Link>
        </div>

        {/* Credibility strip — expandable details */}
        <div style={{ marginTop: isMobile ? 48 : 64, textAlign: "center" }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.18em", color: marketingColors.softText, fontWeight: 600, textTransform: "uppercase", marginBottom: 16 }}>
            Trusted by design
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: isMobile ? "10px 14px" : "12px 22px", fontSize: 12.5 }}>
            {([
              ["ICO ZC123014", "Registered with the UK Information Commissioner's Office as a data controller under registration ZC123014."],
              ["UK GDPR principles", "Designed with UK GDPR principles in mind. Health data is processed with your explicit consent, and our legal basis is kept under review."],
              ["AES-256 encryption", "All documents encrypted in transit (TLS 1.3) and at rest (AES-256). Keys managed by our cloud provider."],
              ["Encrypted storage", "Stored encrypted with UK GDPR-compliant providers. See our Privacy Policy for the full list of processors."],
              ["Built by people working in international healthcare", "Founded by a team with direct experience in international patient care — the product solves problems we've watched families face."],
            ] as [string, string][]).map(([label, detail], i, arr) => {
              const isOpen = trustOpen === label;
              return (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setTrustOpen(isOpen ? null : label)}
                    aria-expanded={isOpen}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "transparent", border: "none", padding: 0, cursor: "pointer",
                      fontSize: 12.5, color: marketingColors.mutedText, fontFamily: "inherit",
                      borderBottom: `1px dashed ${isOpen ? marketingColors.gold : "transparent"}`,
                    }}
                  >
                    <span style={{ color: marketingColors.gold }}>✦</span>
                    <span>{label}</span>
                  </button>
                  {i < arr.length - 1 && !isMobile && <span style={{ color: marketingColors.goldBorder, marginLeft: 12 }}>·</span>}
                </span>
              );
            })}
          </div>
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              overflow: "hidden",
              maxHeight: trustOpen ? 140 : 0,
              transition: "max-height 0.35s cubic-bezier(.16,1,.3,1), margin-top 0.35s ease",
              marginTop: trustOpen ? 18 : 0,
            }}
          >
            {trustOpen && (
              <div
                style={{
                  padding: "14px 20px",
                  background: marketingColors.surface,
                  border: `1px solid ${marketingColors.goldBorder}`,
                  borderRadius: 2,
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: marketingColors.mutedText,
                  textAlign: "left",
                }}
              >
                {[
                  ["ICO ZC123014", "Registered with the UK Information Commissioner's Office as a data controller under registration ZC123014."],
                  ["UK GDPR principles", "Designed with UK GDPR principles in mind. Health data is processed with your explicit consent, and our legal basis is kept under review."],
                  ["AES-256 encryption", "All documents encrypted in transit (TLS 1.3) and at rest (AES-256). Keys managed by our cloud provider."],
                  ["Encrypted storage", "Stored encrypted with UK GDPR-compliant providers. See our Privacy Policy for the full list of processors."],
                  ["Built by people working in international healthcare", "Founded by a team with direct experience in international patient care — the product solves problems we've watched families face."],
                ].find(([l]) => l === trustOpen)?.[1]}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  const [open, setOpen] = useState<number | null>(null);

  const items = [
    ["Is my medical data safe?", "Documents are encrypted in transit (TLS 1.3) and at rest (AES-256), stored with UK GDPR-compliant providers (see our Privacy Policy for the full list of processors), and access is scoped to your account. RinVita Ltd is ICO registered (ZC123014)."],
    ["Who can see my records?", "Only you, and anyone you explicitly share a Health Passport link with. Our staff cannot browse your documents. Share links are time-limited and revocable at any time."],
    ["Can I delete my data?", "Yes — at any time, from Settings. Account deletion removes your documents, extracted data and share links within 30 days."],
    ["Do you train AI on my records?", "No. Your documents are never used to train third-party models. AI processing runs on isolated infrastructure and outputs are stored only in your vault."],
    ["What languages does RinVita support?", "45+ languages including Arabic, Mandarin, Spanish, French, Turkish, Russian, Polish, Hindi, Portuguese and more."],
    ["Will a doctor actually use the output?", "RinVita is designed to help clinicians review a structured summary quickly, with source documents available alongside it. Whether a clinician uses it is ultimately their decision."],
    ["Can I manage records for my parents or children?", "Yes. The Family plan lets you manage up to six separate health profiles under one account."],
  ];

  return (
    <section id="faq" style={{ padding: `${isMobile ? 72 : 120}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 72 }}>
          <span className="marketing-section-label">FAQ</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(34px,3.8vw,52px)", fontWeight: 300, color: marketingColors.ink }}>Questions, answered.</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map(([question, answer], index) => (
            <div key={question} style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)`, overflow: "hidden" }}>
              <button onClick={() => setOpen(open === index ? null : index)} style={{ width: "100%", padding: isMobile ? "20px 0" : "24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}>
                <span style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 19 : 22, fontWeight: 400, color: marketingColors.ink, lineHeight: 1.3, flex: 1 }}>{question}</span>
                <span style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: open === index ? "rotate(45deg)" : "rotate(0deg)", color: marketingColors.gold, fontSize: 18 }}>+</span>
              </button>
              <div style={{ maxHeight: open === index ? 240 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(.16,1,.3,1)" }}>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300, paddingBottom: isMobile ? 20 : 28 }}>{answer}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid hsl(var(--foreground) / 0.1)` }} />
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile } = useMarketingBreakpoint();
  return (
    <section style={{ padding: `${isMobile ? 72 : 100}px ${isMobile ? 20 : 56}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="marketing-section-label">What you can rely on</span>
        </div>
        <div style={{ padding: isMobile ? "28px 22px" : "40px 48px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, boxShadow: "0 8px 32px hsl(var(--foreground) / 0.04)" }}>
          <p style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 20 : 23, fontWeight: 300, lineHeight: 1.5, color: marketingColors.ink, marginBottom: 24, textAlign: "center" }}>
            RinVita is a new product. Instead of testimonials we haven't earned yet, here is exactly what it does today.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 20 }}>
            {[
              ["Records from any country", "Upload documents in any language and keep the original alongside the structured version."],
              ["Traceable extraction", "Multilingual AI extraction with every result traceable back to the original record."],
              ["Encrypted storage", "Encrypted at rest and in transit, stored with UK GDPR-compliant providers."],
              ["Sharing you can revoke", "User-scoped access controls and time-limited share links you can withdraw at any time."],
            ].map(([title, body]) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: marketingColors.gold, fontSize: 14, marginTop: 3 }}>◆</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: marketingColors.ink, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForClinicsCallout() {
  const { isMobile } = useMarketingBreakpoint();
  return (
    <section style={{ padding: `${isMobile ? 56 : 96}px ${isMobile ? 20 : 56}px`, background: marketingColors.cream2 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center", padding: isMobile ? "36px 24px" : "56px 64px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 4 }}>
        <span className="marketing-section-label">For private healthcare providers</span>
        <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 28 : 38, fontWeight: 300, color: marketingColors.ink, marginBottom: 16 }}>
          For private healthcare providers.
        </h2>
        <p style={{ fontSize: isMobile ? 14.5 : 16, color: marketingColors.mutedText, maxWidth: 620, margin: "0 auto 28px", lineHeight: 1.75, fontWeight: 300 }}>
          Give patients a medical record they control: one place to store, review and share reports, results and letters with any doctor. Fewer resend requests for your team, better-prepared appointments for your patients.
        </p>
        <Link to="/for-clinics" style={{ display: "inline-block", padding: "14px 32px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Book a Demo
        </Link>
      </div>
    </section>
  );
}

function MobileStickyCTA() {
  const { isMobile } = useMarketingBreakpoint();
  if (!isMobile) return null;
  return (
    <>
      <div style={{ height: 92 }} aria-hidden />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 180, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "hsl(var(--background) / 0.97)", backdropFilter: "blur(20px)", borderTop: `1px solid ${marketingColors.goldBorder}` }}>
        <Link to="/auth?mode=signup" style={{ display: "block", width: "100%", padding: "16px", background: marketingColors.gold, borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: 15, fontWeight: 600, letterSpacing: "0.06em", textAlign: "center", textDecoration: "none", boxShadow: "0 6px 24px hsl(var(--primary) / 0.35)" }}>
          Start free
        </Link>
        <div style={{ marginTop: 6, fontSize: 11, color: marketingColors.softText, textAlign: "center" }}>
          Free plan · 3 documents · No card required
        </div>
      </div>
    </>
  );
}

function TryItLive() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  return (
    <section id="try-live" style={{ padding: `${isMobile ? 72 : 100}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 44 }}>
          <span className="marketing-section-label">Try it live</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 14, lineHeight: 1.15 }}>
            See a structured record take shape.
          </h2>
          <p style={{ fontSize: isMobile ? 14.5 : 16, color: marketingColors.mutedText, lineHeight: 1.7, fontWeight: 300, maxWidth: 620, margin: "0 auto" }}>
            Explore a fictional record organised into results, medications and visit history, with its original alongside. No account or upload needed.
          </p>
        </div>
        <InstantDemo variant="homepage" />
      </div>
    </section>
  );
}

function PartnerStrip() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  return (
    <section
      aria-label="For clinics and medical concierges"
      style={{
        padding: `${isMobile ? 20 : 22}px ${paddingX}px`,
        background: marketingColors.cream2,
        borderTop: `1px solid ${marketingColors.goldBorder}`,
        borderBottom: `1px solid ${marketingColors.goldBorder}`,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 12 : 24,
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: marketingColors.gold, marginBottom: 6 }}>
            For clinics and medical concierges
          </div>
          <div style={{ fontSize: isMobile ? 14 : 15, color: marketingColors.mutedText, lineHeight: 1.6, fontWeight: 300 }}>
            Offer patients one place to store, review and share their medical records — no EHR integration required.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/for-clinics" style={partnerStripLink}>For clinics</Link>
          <Link to="/for-concierges" style={partnerStripLink}>For concierges</Link>
        </div>
      </div>
    </section>
  );
}

const partnerStripLink: React.CSSProperties = {
  padding: "9px 18px",
  border: `1px solid ${marketingColors.goldBorder}`,
  borderRadius: 2,
  color: marketingColors.gold,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

function WhoItsFor() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const audiences = [
    {
      icon: "✈",
      title: "Expats and people relocating",
      body: "Keep your history in one place when you move, ready to review and share with a new doctor — translated automatically where needed.",
      href: "/medical-records-for-expats",
      linkLabel: "Medical records for expats",
    },
    {
      icon: "⌂",
      title: "International families",
      body: "Records made in several countries and languages, held in one account with a separate profile for each person.",
      href: "/organise-medical-records-for-family",
      linkLabel: "Organise family records",
    },
    {
      icon: "♡",
      title: "Caring for parents abroad",
      body: "Hold a parent's medications, results and letters even when the appointments happen without you — with their agreement.",
      href: "/organise-medical-records-for-family",
      linkLabel: "Caring from another country",
    },
    {
      icon: "⊙",
      title: "Second opinions overseas",
      body: "Send one structured, revocable link instead of a folder of photographs when a reviewing clinician asks for your history.",
      href: "/medical-records-for-overseas-treatment",
      linkLabel: "Preparing a second opinion",
    },
    {
      icon: "◈",
      title: "Travellers with a chronic condition",
      body: "Keep your current medications, allergies and recent results ready in case you need care away from your usual team.",
      href: "/medical-passport",
      linkLabel: "What a medical passport holds",
    },
    {
      icon: "✦",
      title: "Treatment planned abroad",
      body: "Store everything the receiving team asks for, review it before travel and share by secure link or PDF — translated automatically where needed.",
      href: "/medical-records-for-overseas-treatment",
      linkLabel: "Records for treatment abroad",
    },
  ];

  return (
    <section style={{ padding: `${isMobile ? 72 : 104}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 60 }}>
          <span className="marketing-section-label">Who it's for</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 32 : "clamp(32px,3.6vw,46px)", fontWeight: 300 }}>
            Built for people whose care crosses borders
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 16 }}>
          {audiences.map((a) => (
            <div key={a.title} style={{ padding: isMobile ? "24px 20px" : "28px 26px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div aria-hidden style={{ width: 42, height: 42, borderRadius: "50%", border: `1px solid ${marketingColors.goldBorder}`, background: marketingColors.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: marketingColors.gold, fontSize: 18 }}>{a.icon}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, marginBottom: 10, lineHeight: 1.25 }}>{a.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 12 }}>{a.body}</p>
              <Link to={a.href} style={{ fontSize: 12.5, color: marketingColors.gold, textDecoration: "none", fontWeight: 600, letterSpacing: "0.03em" }}>
                {a.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ThreeSteps() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const steps = [
    { n: "01", title: "Add your records", body: "Store reports, results and letters as PDFs, scans or photographs from any country or provider." },
    { n: "02", title: "We organise them into your medical record", body: "Review labs, medications, allergies, imaging and visits, linked to their originals and translated automatically where needed." },
    { n: "03", title: "Share with any doctor in one tap", body: "Send a secure one-time link or a PDF — no app or login needed for the doctor." },
  ];

  return (
    <section id="how-it-works" style={{ padding: `${isMobile ? 72 : 104}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
          <span className="marketing-section-label">How it works</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300 }}>
            Store, review and share in three steps
          </h2>
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
          {steps.map((s) => (
            <li key={s.n} style={{ padding: isMobile ? "24px 20px" : "30px 26px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 26, color: marketingColors.gold, marginBottom: 8 }}>{s.n}</div>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 22, fontWeight: 400, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{s.body}</p>
            </li>
          ))}
        </ol>
        <div style={{ textAlign: "center", marginTop: isMobile ? 28 : 40 }}>
          <Link to="/auth?mode=signup" style={{ display: "inline-block", padding: "14px 30px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", borderRadius: 2, fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", textDecoration: "none" }}>
            Create your medical passport
          </Link>
          <div style={{ fontSize: 12.5, color: marketingColors.softText, marginTop: 12 }}>
            Free plan · 3 documents · no card required
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustMechanisms() {
  const ref = useReveal<HTMLDivElement>();
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const items = [
    { title: "Every entry traces back to a source document", body: "Nothing stands on its own. Whatever RinVita extracts stays linked to the record it came from, so you or a clinician can open the original." },
    { title: "Encrypted at rest and in transit", body: "Records are encrypted while stored and while moving between your device and RinVita. We do not describe this as end-to-end encrypted — processing your documents requires us to hold the keys." },
    { title: "Time-limited sharing, revocable by you", body: "Sharing links expire, and you can revoke one immediately from your account. Nothing is shared unless you choose to share it." },
    { title: "Organised, never diagnosed", body: "RinVita structures and translates records. It does not diagnose or advise, and AI output should be reviewed against the original documents." },
  ];

  return (
    <section style={{ padding: `${isMobile ? 72 : 104}px ${paddingX}px`, background: marketingColors.cream }}>
      <div ref={ref} className="marketing-reveal" style={{ maxWidth: 1020, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 36 : 52 }}>
          <span className="marketing-section-label">What you can rely on</span>
          <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 30 : "clamp(32px,3.6vw,46px)", fontWeight: 300 }}>Your records stay yours.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
          {items.map((i) => (
            <div key={i.title} style={{ padding: isMobile ? "24px 20px" : "28px 26px", background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2 }}>
              <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: 21, fontWeight: 400, marginBottom: 10, lineHeight: 1.3 }}>{i.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: marketingColors.mutedText, fontWeight: 300 }}>{i.body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/security" style={{ fontSize: 13, color: marketingColors.gold, textDecoration: "none", fontWeight: 600 }}>
            Read the full security page →
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeShare() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;
  return (
    <section style={{ padding: `${isMobile ? 56 : 80}px ${paddingX}px`, background: marketingColors.cream2 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <ShareRinVita placement="home" />
      </div>
    </section>
  );
}

const MarketingLandingPage = () => {
  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <SEO
        title="RinVita — Store, review and share your medical records with any doctor"
        description="Store every report, result and letter in one secure place. Review your history and share with any doctor by one-time link or PDF, translated automatically where needed."
        path="/"
      />
      <MarketingStyles />
      <MarketingNav />
      <Hero />
      <PassportContents />
      <PartnerStrip />
      <ThreeSteps />
      <DemoVideo />
      <DoctorBrief />
      <TryItLive />
      <WhoItsFor />
      <WhyRinVita />
      <Features />
      <SampleHealthPassport />
      <TrustMechanisms />
      <ClinicalSafety />
      <ForClinicsCallout />
      <FAQ />
      <HomeShare />
      <MarketingFooter />
      <MobileStickyCTA />
    </div>
  );
};

export default MarketingLandingPage;
