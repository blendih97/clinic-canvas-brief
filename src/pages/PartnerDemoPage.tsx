// Self-contained, fictional partner demonstration for concierge and medical
// travel decision makers. No login, no data collection, no network or AI calls.
// Every value below is synthetic sample data for the fictional patient "Layla H.".

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { LogoMark } from "@/components/marketing/shared";

const INQUIRY_MAILTO = "mailto:hello@rinvita.co.uk?subject=RinVita%20Partner%20Demo";
const SERIF = { fontFamily: "'Cormorant Garamond', Georgia, serif" } as const;

/* ------------------------------------------------------------------ */
/* Fictional sample data                                               */
/* ------------------------------------------------------------------ */

type SourceDoc = {
  id: string;
  title: string;
  country: string;
  flag: string;
  language: string;
  provider: string;
  date: string;
  kind: string;
  excerpt: string[];
  rtl?: boolean;
};

const SOURCE_DOCS: SourceDoc[] = [
  {
    id: "lab-fr",
    title: "Bilan sanguin",
    country: "France",
    flag: "FR",
    language: "French",
    provider: "Laboratoire Fictif Saint-Clair, Lyon",
    date: "12 Mar 2026",
    kind: "Blood panel",
    excerpt: ["HbA1c : 7,4 %  (N < 6,0)", "Cholestérol LDL : 3,6 mmol/L", "Créatinine : 78 µmol/L", "Conclusion : contrôle glycémique à surveiller."],
  },
  {
    id: "mri-ae",
    title: "تقرير الرنين المغناطيسي",
    country: "UAE",
    flag: "AE",
    language: "Arabic",
    provider: "Al Noor Demo Imaging Centre, Dubai",
    date: "28 Apr 2026",
    kind: "Lumbar MRI report",
    rtl: true,
    excerpt: ["الفحص: رنين مغناطيسي للعمود الفقري القطني", "النتيجة: انتفاخ قرصي خفيف عند L4-L5", "لا يوجد ضغط على الجذور العصبية", "التوصية: متابعة سريرية"],
  },
  {
    id: "dis-de",
    title: "Entlassungsbrief",
    country: "Germany",
    flag: "DE",
    language: "German",
    provider: "Klinik Beispiel am See, Munich",
    date: "03 Jun 2026",
    kind: "Discharge letter",
    excerpt: ["Diagnose: Laparoskopische Cholezystektomie", "Verlauf: komplikationslos", "Allergie: Penicillin (Urtikaria)", "Medikation: Metformin 500 mg 2x täglich"],
  },
  {
    id: "gp-uk",
    title: "GP clinic summary",
    country: "United Kingdom",
    flag: "UK",
    language: "English",
    provider: "Harbour Lane Sample Practice, London",
    date: "19 Aug 2026",
    kind: "Clinic letter",
    excerpt: ["HbA1c 6.8% on repeat, improving.", "Continue metformin 500 mg twice daily.", "Atorvastatin 20 mg started at night.", "Review in 3 months."],
  },
];

const LAB_TREND = [
  { label: "Mar", value: 7.4 },
  { label: "May", value: 7.1 },
  { label: "Aug", value: 6.8 },
  { label: "Oct", value: 6.5 },
];

type ModuleId = "labs" | "imaging" | "meds" | "visits" | "allergies" | "sources";
const MODULES: { id: ModuleId; label: string; count: string }[] = [
  { id: "labs", label: "Labs", count: "14 results" },
  { id: "imaging", label: "Imaging", count: "1 report" },
  { id: "meds", label: "Medications", count: "2 active" },
  { id: "visits", label: "Visits", count: "4 visits" },
  { id: "allergies", label: "Allergies", count: "1 recorded" },
  { id: "sources", label: "Sources", count: "4 originals" },
];

const SCENES = [
  { phase: "Before care", title: "Fragmented records", short: "Fragmented" },
  { phase: "Before care", title: "Import and organise", short: "Organise" },
  { phase: "During care", title: "Medical passport", short: "Passport" },
  { phase: "During care", title: "Translate and trace", short: "Translate" },
  { phase: "After care", title: "Clinician sharing", short: "Share" },
] as const;

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function DemoTag() {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
      Demo data
    </span>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">{children}</p>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_40px_-20px_hsl(var(--foreground)/0.18)] ${className}`}>{children}</div>;
}

function FlagChip({ code }: { code: string }) {
  return (
    <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-border bg-secondary px-1.5 text-[10px] font-semibold tracking-wider text-foreground/70">
      {code}
    </span>
  );
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/* ------------------------------------------------------------------ */
/* Scene 1: fragmented records                                         */
/* ------------------------------------------------------------------ */

function DocPreview({ doc }: { doc: SourceDoc }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5">
      <span aria-hidden className="pointer-events-none absolute right-3 top-3 rotate-6 rounded border border-primary/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary/80">
        Fictional
      </span>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{doc.provider}</p>
      <p className="mt-3 text-xl text-foreground" style={SERIF} dir={doc.rtl ? "rtl" : "ltr"}>{doc.title}</p>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3 font-mono text-[12.5px] leading-relaxed text-foreground/80" dir={doc.rtl ? "rtl" : "ltr"}>
        {doc.excerpt.map((l) => <p key={l}>{l}</p>)}
      </div>
    </div>
  );
}

function SceneFragmented() {
  const [active, setActive] = useState(SOURCE_DOCS[0].id);
  const doc = SOURCE_DOCS.find((d) => d.id === active)!;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-muted-foreground">Four providers, four countries, three languages. Each holds one piece of the picture. Select a document to inspect it.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1" role="list">
          {SOURCE_DOCS.map((d, i) => {
            const on = d.id === active;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setActive(d.id)}
                  aria-pressed={on}
                  className={`group w-full rounded-xl border p-4 text-left transition-all duration-300 ${focusRing} ${on ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
                  style={{ transform: on ? "none" : `rotate(${[-0.6, 0.5, -0.3, 0.7][i]}deg)` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FlagChip code={d.flag} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.kind}</p>
                        <p className="text-xs text-muted-foreground">{d.country} · {d.language} · {d.date}</p>
                      </div>
                    </div>
                    <span className={`text-xs ${on ? "text-primary" : "text-muted-foreground"}`}>{on ? "Viewing" : "Inspect"}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Source document preview</p>
            <DemoTag />
          </div>
          <DocPreview key={doc.id} doc={doc} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {[["Provider", doc.provider], ["Language", doc.language], ["Country", doc.country], ["Issued", doc.date]].map(([k, v]) => (
              <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="mt-0.5 text-foreground">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">Typical reality: emailed PDFs, photos on a phone, paper in a folder. No single doctor sees all of it.</p>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 2: import and organise (purely visual)                        */
/* ------------------------------------------------------------------ */

function SceneOrganise({ reduced }: { reduced: boolean }) {
  const [step, setStep] = useState(0); // 0 scattered, 1 gathering, 2 organised
  const timers = useRef<number[]>([]);
  const play = () => {
    timers.current.forEach(clearTimeout);
    if (reduced) { setStep(2); return; }
    setStep(1);
    timers.current = [window.setTimeout(() => setStep(2), 1100)];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const positions = [
    { x: -150, y: -80, r: -8 }, { x: 150, y: -90, r: 7 }, { x: -140, y: 90, r: 5 }, { x: 145, y: 85, r: -6 },
  ];
  const categories = ["Labs", "Imaging", "Medications", "Visits", "Allergies", "Sources"];
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="text-muted-foreground">The patient brings their documents into one private place. They are grouped by type and date, with every original kept. This animation is illustrative only; nothing is uploaded or processed here.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={play} className={`rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 ${focusRing}`}>
            {step === 2 ? "Replay" : "Organise the records"}
          </button>
          {step > 0 && (
            <button type="button" onClick={() => setStep(0)} className={`rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition hover:border-primary/40 ${focusRing}`}>Reset</button>
          )}
        </div>
        <ol className="mt-6 space-y-2 text-sm">
          {["Collected from the patient", "Grouped by type and date", "Original kept beside every entry"].map((t, i) => (
            <li key={t} className={`flex items-center gap-3 transition-opacity duration-500 ${step >= Math.min(i, 2) && step > 0 ? "opacity-100" : "opacity-60"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${step === 2 || (step === 1 && i === 0) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{i + 1}</span>
              <span className="text-foreground/80">{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <Card className="relative h-[340px] overflow-hidden bg-secondary/50 sm:h-[380px]" >
        <div aria-live="polite" className="sr-only">{step === 2 ? "Records organised into one medical passport" : step === 1 ? "Gathering records" : "Records scattered"}</div>
        {SOURCE_DOCS.map((d, i) => {
          const p = positions[i];
          const gathered = step >= 1;
          return (
            <div
              key={d.id}
              aria-hidden
              className="absolute left-1/2 top-1/2 w-32 rounded-lg border border-border bg-card p-2.5 shadow-sm"
              style={{
                transform: gathered
                  ? `translate(-50%, -50%) scale(0.5)`
                  : `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) rotate(${p.r}deg)`,
                opacity: step === 2 ? 0 : 1,
                transition: reduced ? "none" : `transform 900ms cubic-bezier(.2,.8,.2,1) ${i * 80}ms, opacity 400ms ease ${step === 2 ? 0 : 0}ms`,
              }}
            >
              <div className="flex items-center gap-1.5"><FlagChip code={d.flag} /><span className="truncate text-[10px] text-muted-foreground">{d.language}</span></div>
              <p className="mt-1.5 truncate text-xs text-foreground">{d.kind}</p>
              <div className="mt-1.5 space-y-1"><div className="h-1 rounded bg-border" /><div className="h-1 w-2/3 rounded bg-border" /></div>
            </div>
          );
        })}
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{ opacity: step === 2 ? 1 : 0, transform: step === 2 ? "scale(1)" : "scale(0.94)", transition: reduced ? "none" : "all 600ms cubic-bezier(.2,.8,.2,1)" }}
          aria-hidden={step !== 2}
        >
          <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><LogoMark size={20} /><span className="text-lg text-foreground" style={SERIF}>Medical passport</span></div>
              <DemoTag />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Layla H. · fictional patient · 4 sources</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <div key={c} className="rounded-lg border border-border bg-background px-2 py-2 text-center text-[11px] text-foreground/80">{c}</div>
              ))}
            </div>
          </div>
        </div>
        {step === 0 && <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">Four separate records</p>}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 3: medical passport dashboard                                 */
/* ------------------------------------------------------------------ */

function TrendChart() {
  const w = 300, h = 120, pad = 22;
  const min = 6, max = 8;
  const pts = LAB_TREND.map((p, i) => ({
    ...p,
    x: pad + (i * (w - pad * 2)) / (LAB_TREND.length - 1),
    y: pad + ((max - p.value) / (max - min)) * (h - pad * 2),
  }));
  const target = pad + ((max - 6.5) / (max - min)) * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="HbA1c trend, fictional values: March 7.4%, May 7.1%, August 6.8%, October 6.5%">
      <line x1={pad} x2={w - pad} y1={target} y2={target} stroke="hsl(var(--primary))" strokeOpacity="0.35" strokeDasharray="3 4" />
      <text x={w - pad} y={target - 5} textAnchor="end" fontSize="9" fill="hsl(var(--foreground))" fillOpacity="0.55">sample target 6.5%</text>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">{p.value}</text>
          <text x={p.x} y={h - 4} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" fillOpacity="0.55">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Provenance({ docId }: { docId: string }) {
  const d = SOURCE_DOCS.find((x) => x.id === docId)!;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span className="uppercase tracking-[0.14em]">Source</span>
      <FlagChip code={d.flag} /> {d.provider} · {d.date} · original in {d.language}
    </p>
  );
}

function ModuleBody({ id }: { id: ModuleId }) {
  switch (id) {
    case "labs":
      return (
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">HbA1c over 2026</p>
            <TrendChart />
          </div>
          <div>
            <table className="w-full text-sm">
              <caption className="sr-only">Fictional latest lab values</caption>
              <thead><tr className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground"><th className="pb-2 font-normal">Marker</th><th className="pb-2 font-normal">Value</th><th className="pb-2 font-normal">Ref.</th></tr></thead>
              <tbody className="divide-y divide-border">
                {[["HbA1c", "6.5 %", "< 6.0", true], ["LDL cholesterol", "2.9 mmol/L", "< 3.0", false], ["Creatinine", "78 µmol/L", "45-90", false], ["eGFR", "> 90", "> 60", false]].map(([m, v, r, f]) => (
                  <tr key={m as string}><td className="py-2 text-foreground">{m}</td><td className={`py-2 ${f ? "font-medium text-primary" : "text-foreground"}`}>{v}</td><td className="py-2 text-muted-foreground">{r}</td></tr>
                ))}
              </tbody>
            </table>
            <Provenance docId="lab-fr" />
          </div>
        </div>
      );
    case "imaging":
      return (
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <div aria-hidden className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-foreground/90">
            <div className="absolute inset-x-[38%] top-[8%] bottom-[8%] rounded-full bg-background/25" />
            {[...Array(5)].map((_, i) => <div key={i} className="absolute left-[36%] right-[36%] h-[9%] rounded bg-background/40" style={{ top: `${14 + i * 16}%` }} />)}
            <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-[0.18em] text-background/80">Illustration</span>
          </div>
          <div>
            <p className="text-lg text-foreground" style={SERIF}>Lumbar spine MRI</p>
            <blockquote className="mt-2 border-l-2 border-primary/50 pl-4 text-sm leading-relaxed text-foreground/80">
              Mild disc bulge at L4-L5. No nerve root compression. Clinical follow-up recommended.
            </blockquote>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted-foreground">Modality</dt><dd className="text-foreground">MRI, 1.5T</dd></div>
              <div><dt className="text-muted-foreground">Region</dt><dd className="text-foreground">Lumbar spine</dd></div>
            </dl>
            <Provenance docId="mri-ae" />
          </div>
        </div>
      );
    case "meds":
      return (
        <div>
          <ul className="divide-y divide-border">
            {[["Metformin", "500 mg", "Twice daily with meals", "dis-de"], ["Atorvastatin", "20 mg", "Once daily at night", "gp-uk"]].map(([n, d, f, src]) => (
              <li key={n} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-foreground">{n} <span className="text-muted-foreground">{d}</span></p><p className="text-sm text-muted-foreground">{f}</p></div>
                <Provenance docId={src} />
              </li>
            ))}
          </ul>
        </div>
      );
    case "visits":
      return (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {SOURCE_DOCS.map((d) => (
            <li key={d.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card" />
              <p className="text-xs text-muted-foreground">{d.date} · {d.country}</p>
              <p className="text-foreground">{d.kind}</p>
              <p className="text-xs text-muted-foreground">{d.provider}</p>
            </li>
          ))}
        </ol>
      );
    case "allergies":
      return (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-foreground"><span className="font-medium">Penicillin</span> · reaction: urticaria (hives)</p>
          <p className="mt-1 text-sm text-muted-foreground">Recorded once, in a German discharge letter. Now visible to any doctor the patient chooses to share with.</p>
          <Provenance docId="dis-de" />
        </div>
      );
    case "sources":
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {SOURCE_DOCS.map((d) => (
            <li key={d.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-2"><FlagChip code={d.flag} /><p className="text-sm text-foreground">{d.kind}</p></div>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                <dt>Language</dt><dd className="text-foreground/80">{d.language}</dd>
                <dt>Issued</dt><dd className="text-foreground/80">{d.date}</dd>
                <dt>Format</dt><dd className="text-foreground/80">PDF, 1 page</dd>
              </dl>
            </li>
          ))}
        </ul>
      );
  }
}

function ScenePassport() {
  const [mod, setMod] = useState<ModuleId>("labs");
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = MODULES.findIndex((m) => m.id === mod);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setMod(MODULES[(i + 1) % MODULES.length].id); }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setMod(MODULES[(i - 1 + MODULES.length) % MODULES.length].id); }
  };
  useEffect(() => { document.getElementById(`mod-tab-${mod}`)?.focus({ preventScroll: true }); }, [mod]);
  const tabs = (mobile: boolean) => (
    <div role="tablist" aria-label="Passport modules" onKeyDown={onKey} aria-orientation={mobile ? "horizontal" : "vertical"}
      className={mobile ? "grid grid-cols-6 border-t border-border bg-card/95 backdrop-blur md:hidden" : "hidden md:flex md:flex-col md:gap-1"}>
      {MODULES.map((m) => {
        const on = m.id === mod;
        return (
          <button key={m.id} id={mobile ? undefined : `mod-tab-${m.id}`} role="tab" type="button" aria-selected={on} aria-controls="mod-panel" tabIndex={on ? 0 : -1}
            onClick={() => setMod(m.id)}
            className={mobile
              ? `py-3 text-[10px] transition ${focusRing} ${on ? "text-primary" : "text-muted-foreground"}`
              : `flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${focusRing} ${on ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
            {mobile ? <><span className={`mx-auto mb-1 block h-1 w-1 rounded-full ${on ? "bg-primary" : "bg-transparent"}`} />{m.label === "Medications" ? "Meds" : m.label}</> : <><span>{m.label}</span><span className="text-[11px] text-muted-foreground">{m.count}</span></>}
          </button>
        );
      })}
    </div>
  );
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xl text-foreground" style={SERIF}>Layla H.</p>
          <p className="text-xs text-muted-foreground">Fictional patient · born 1979 · records from 4 countries</p>
        </div>
        <DemoTag />
      </div>
      <div className="grid md:grid-cols-[210px_1fr]">
        <div className="border-r border-border p-3">{tabs(false)}</div>
        <div id="mod-panel" role="tabpanel" aria-label={MODULES.find((m) => m.id === mod)!.label} className="min-h-[320px] p-5">
          <div className="mb-4 flex items-center justify-between"><p className="text-lg text-foreground" style={SERIF}>{MODULES.find((m) => m.id === mod)!.label}</p><DemoTag /></div>
          <div key={mod} className="animate-[pd-fade_400ms_ease]"><ModuleBody id={mod} /></div>
        </div>
      </div>
      <div className="sticky bottom-0">{tabs(true)}</div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 4: translate and trace                                        */
/* ------------------------------------------------------------------ */

const TRANSLATIONS = {
  ar: {
    doc: "mri-ae",
    lines: [
      ["الفحص: رنين مغناطيسي للعمود الفقري القطني", "Examination: MRI of the lumbar spine"],
      ["النتيجة: انتفاخ قرصي خفيف عند L4-L5", "Finding: mild disc bulge at L4-L5"],
      ["لا يوجد ضغط على الجذور العصبية", "No compression of the nerve roots"],
      ["التوصية: متابعة سريرية", "Recommendation: clinical follow-up"],
    ],
  },
  fr: {
    doc: "lab-fr",
    lines: [
      ["HbA1c : 7,4 %  (N < 6,0)", "HbA1c: 7.4% (reference below 6.0)"],
      ["Cholestérol LDL : 3,6 mmol/L", "LDL cholesterol: 3.6 mmol/L"],
      ["Créatinine : 78 µmol/L", "Creatinine: 78 µmol/L"],
      ["Conclusion : contrôle glycémique à surveiller.", "Conclusion: glycaemic control to be monitored."],
    ],
  },
} as const;

function SceneTranslate() {
  const [lang, setLang] = useState<"ar" | "fr">("ar");
  const [hover, setHover] = useState<number | null>(0);
  const t = TRANSLATIONS[lang];
  const d = SOURCE_DOCS.find((x) => x.id === t.doc)!;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Source language" className="inline-flex rounded-full border border-border bg-card p-1">
          {([["ar", "Arabic MRI report"], ["fr", "French blood panel"]] as const).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={lang === k} onClick={() => { setLang(k); setHover(0); }}
              className={`rounded-full px-4 py-1.5 text-sm transition ${focusRing} ${lang === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Simulated output, shown for illustration</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Original · {d.language}</p><FlagChip code={d.flag} /></div>
          <ul className="space-y-1" dir={lang === "ar" ? "rtl" : "ltr"}>
            {t.lines.map(([src], i) => (
              <li key={i}>
                <button type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)}
                  className={`w-full rounded-md px-2 py-1.5 text-start text-[15px] transition ${focusRing} ${hover === i ? "bg-primary/10 text-foreground" : "text-foreground/80"}`}>{src}</button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">English interpretation</p><DemoTag /></div>
          <ul className="space-y-1">
            {t.lines.map(([, en], i) => (
              <li key={i}>
                <button type="button" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[15px] transition ${focusRing} ${hover === i ? "bg-primary/10 text-foreground" : "text-foreground/80"}`}>
                  <span>{en}</span>
                  <span className={`text-[10px] uppercase tracking-[0.14em] ${hover === i ? "text-primary" : "text-transparent"}`}>Line {i + 1}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-5 flex gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
        <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-xs font-semibold text-primary">!</span>
        <p className="text-sm text-foreground/85"><span className="font-medium text-foreground">AI output must be reviewed and verified.</span> Every translated line stays linked to the original document, so a clinician can always check the source. Translations support understanding; they are not medical advice and are not a certified translation.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scene 5: clinician sharing                                          */
/* ------------------------------------------------------------------ */

const SHARE_SECTIONS = ["Summary", "Labs", "Imaging", "Medications", "Allergies", "Visits", "Original documents"] as const;
const EXPIRY = ["24 hours", "7 days", "30 days"] as const;

function SceneShare() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Summary", "Imaging", "Medications", "Allergies", "Original documents"]));
  const [expiry, setExpiry] = useState<(typeof EXPIRY)[number]>("7 days");
  const [created, setCreated] = useState(false);
  const toggle = (s: string) => { setCreated(false); setSelected((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; }); };
  const has = (s: string) => selected.has(s);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <Card className="p-5">
        <p className="text-lg text-foreground" style={SERIF}>Patient chooses what to share</p>
        <fieldset className="mt-4">
          <legend className="sr-only">Sections to include</legend>
          <div className="flex flex-wrap gap-2">
            {SHARE_SECTIONS.map((s) => (
              <label key={s} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${has(s) ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                <input type="checkbox" className="sr-only" checked={has(s)} onChange={() => toggle(s)} />
                {has(s) ? "✓ " : ""}{s}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-6 text-sm text-muted-foreground">Link expires after</p>
        <div role="radiogroup" aria-label="Link expiry" className="mt-2 inline-flex rounded-full border border-border p-1">
          {EXPIRY.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={expiry === e} onClick={() => { setExpiry(e); setCreated(false); }}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${focusRing} ${expiry === e ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{e}</button>
          ))}
        </div>
        <button type="button" disabled={selected.size === 0} onClick={() => setCreated(true)}
          className={`mt-6 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 ${focusRing}`}>
          {created ? "Sample link ready (simulated)" : "Create sample share link"}
        </button>
        <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-xs text-muted-foreground">
          {created ? `rinvita.co.uk/share/••••••  ·  expires in ${expiry}  ·  revocable any time. Illustration only, nothing is sent.` : selected.size === 0 ? "Select at least one section." : "Nothing is transmitted in this demo."}
        </p>
      </Card>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Doctor's view · simulated</p>
          <DemoTag />
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div>
            <p className="text-xl text-foreground" style={SERIF}>Clinician brief: Layla H.</p>
            <p className="text-xs text-muted-foreground">Shared by the patient · access expires in {expiry}</p>
          </div>
          {selected.size === 0 && <p className="text-muted-foreground">The patient has not selected any sections.</p>}
          {has("Summary") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Summary</h4><p className="mt-1 text-foreground/85">Type 2 diabetes on metformin, HbA1c improving through 2026. Post-cholecystectomy (Jun 2026). Mild L4-L5 disc bulge on MRI.</p></section>}
          {has("Labs") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Labs</h4><p className="mt-1 text-foreground/85">HbA1c 6.5% (Oct) · LDL 2.9 mmol/L · eGFR &gt; 90</p></section>}
          {has("Imaging") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Imaging</h4><p className="mt-1 text-foreground/85">Lumbar MRI, Apr 2026: mild disc bulge L4-L5, no root compression.</p></section>}
          {has("Medications") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Medications</h4><p className="mt-1 text-foreground/85">Metformin 500 mg twice daily · Atorvastatin 20 mg at night</p></section>}
          {has("Allergies") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Allergies</h4><p className="mt-1 text-foreground/85">Penicillin (urticaria)</p></section>}
          {has("Visits") && <section><h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Visits</h4><p className="mt-1 text-foreground/85">Lyon (Mar) · Dubai (Apr) · Munich (Jun) · London (Aug)</p></section>}
          {has("Original documents") && (
            <section>
              <h4 className="text-[11px] uppercase tracking-[0.14em] text-primary">Original documents</h4>
              <ul className="mt-2 space-y-1.5">
                {SOURCE_DOCS.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                    <span className="flex items-center gap-2 text-foreground/85"><FlagChip code={d.flag} />{d.kind}</span>
                    <span className="text-xs text-muted-foreground">{d.language} original</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PartnerDemoPage() {
  const reduced = usePrefersReducedMotion();
  const [scene, setScene] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const demoRef = useRef<HTMLElement>(null);

  const go = useCallback((i: number, focus = false) => {
    const n = Math.max(0, Math.min(SCENES.length - 1, i));
    setScene(n);
    setVisited((p) => new Set(p).add(n));
    if (focus) document.getElementById(`scene-tab-${n}`)?.focus();
  }, []);

  const scrollToDemo = () => demoRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(scene + 1, true); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(scene - 1, true); }
    if (e.key === "Home") { e.preventDefault(); go(0, true); }
    if (e.key === "End") { e.preventDefault(); go(SCENES.length - 1, true); }
  };

  const progress = (visited.size / SCENES.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <SEO
        title="RinVita Partner Demo: see the entire patient journey, connected"
        description="An interactive, fictional demonstration for concierge and medical travel partners: a medical passport that travels with the patient, not the provider."
        path="/partner-demo"
        noindex
      />
      <style>{`
        @keyframes pd-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .animate-\\[pd-fade_400ms_ease\\] { animation: none !important; } html { scroll-behavior: auto !important; } }
      `}</style>

      <a href="#demo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">Skip to demo</a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className={`flex items-center gap-2.5 rounded ${focusRing}`} aria-label="RinVita home">
            <LogoMark size={24} />
            <span className="text-xl tracking-wide" style={SERIF}>RinVita</span>
            <span className="hidden border-l border-border pl-2.5 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:inline">For healthcare partners</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Partner demo">
            <Link to="/for-concierges" className={`hidden rounded text-sm text-muted-foreground transition hover:text-foreground sm:inline ${focusRing}`}>Partner page</Link>
            <a href={INQUIRY_MAILTO} className={`rounded-full bg-foreground px-4 py-2 text-sm text-background transition hover:opacity-90 ${focusRing}`}>Partner inquiry</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-20 lg:pb-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Fictional demonstration. No real patient information.
            </span>
            <h1 className="mt-6 max-w-3xl text-[2.6rem] leading-[1.05] text-foreground sm:text-6xl lg:text-7xl" style={SERIF}>
              See the entire patient journey, <em className="text-primary">finally connected.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">A medical passport that travels with the patient, not the provider.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" onClick={scrollToDemo} className={`rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 ${focusRing}`}>View interactive demo</button>
              <Link to="/for-concierges" className={`rounded-full border border-border bg-card px-6 py-3 text-sm text-foreground transition hover:border-primary/40 ${focusRing}`}>How partnership works</Link>
            </div>
            <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-6">
              {[["Before", "Records gathered"], ["During", "One coherent view"], ["After", "Patient-led sharing"]].map(([k, v]) => (
                <div key={k}><dt className="text-2xl text-foreground" style={SERIF}>{k}</dt><dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{v}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        {/* Interactive journey */}
        <section id="demo" ref={demoRef} className="scroll-mt-20 border-y border-border bg-secondary/40 py-14 sm:py-20" aria-labelledby="demo-h">
          <div className="mx-auto max-w-6xl px-5">
            <Eyebrow>Interactive journey · sample partner flow</Eyebrow>
            <h2 id="demo-h" className="mt-3 text-4xl text-foreground sm:text-5xl" style={SERIF}>One patient. Four countries. Five moments.</h2>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{SCENES[scene].phase}</span>
                <span aria-live="polite">{visited.size} of {SCENES.length} explored</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Scenes explored" aria-valuemin={0} aria-valuemax={SCENES.length} aria-valuenow={visited.size}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div role="tablist" aria-label="Journey scenes" onKeyDown={onTabKey} className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
                {SCENES.map((s, i) => {
                  const on = i === scene;
                  return (
                    <button key={s.title} id={`scene-tab-${i}`} role="tab" type="button" aria-selected={on} aria-controls="scene-panel" tabIndex={on ? 0 : -1} onClick={() => go(i)}
                      className={`rounded-xl border px-2 py-2.5 text-left transition sm:px-3.5 sm:py-3 ${focusRing} ${on ? "border-primary/50 bg-card shadow-sm" : "border-transparent hover:bg-card/60"}`}>
                      <span className={`block text-[10px] ${visited.has(i) ? "text-primary" : "text-muted-foreground"}`}>0{i + 1}{visited.has(i) && !on ? " ✓" : ""}</span>
                      <span className={`mt-0.5 block text-xs sm:hidden ${on ? "text-foreground" : "text-muted-foreground"}`}>{s.short}</span>
                      <span className={`mt-0.5 hidden text-sm sm:block ${on ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div id="scene-panel" role="tabpanel" aria-labelledby={`scene-tab-${scene}`} className="mt-8">
              <div key={scene} className="animate-[pd-fade_400ms_ease]">
                <h3 className="mb-5 text-3xl text-foreground" style={SERIF}>{SCENES[scene].title}</h3>
                {scene === 0 && <SceneFragmented />}
                {scene === 1 && <SceneOrganise reduced={reduced} />}
                {scene === 2 && <ScenePassport />}
                {scene === 3 && <SceneTranslate />}
                {scene === 4 && <SceneShare />}
              </div>
            </div>

            <div className="sticky bottom-3 z-30 mt-10">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
                <div className="flex gap-2">
                  <button type="button" onClick={() => go(scene - 1)} disabled={scene === 0} className={`rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary/40 disabled:opacity-60 ${focusRing}`}>Back</button>
                  {scene < SCENES.length - 1
                    ? <button type="button" onClick={() => go(scene + 1)} className={`rounded-full bg-foreground px-4 py-2 text-sm text-background transition hover:opacity-90 ${focusRing}`}>Next: {SCENES[scene + 1].short}</button>
                    : <button type="button" onClick={() => go(0)} className={`rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary/40 ${focusRing}`}>Start again</button>}
                </div>
                <a href={INQUIRY_MAILTO} className={`rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 ${focusRing}`}>Talk to us about partnering</a>
              </div>
            </div>
          </div>
        </section>

        {/* Partner value split */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24" aria-labelledby="value-h">
          <Eyebrow>Who gets what</Eyebrow>
          <h2 id="value-h" className="mt-3 max-w-2xl text-4xl text-foreground sm:text-5xl" style={SERIF}>Value for everyone, access only for the patient.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["The client", "Owns their records.", "Stores, reviews and shares their own history with any doctor, by one-time link or PDF."],
              ["The partner", "Offers a benefit, without access.", "Invites and sponsors clients through a co-branded page, and sees sign-up and activity status only. Partners never see medical records."],
              ["The specialist", "Receives a coherent brief.", "A structured summary chosen by the patient, with the original documents one click away."],
            ].map(([who, head, body]) => (
              <Card key={who} className="p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{who}</p>
                <p className="mt-3 text-2xl text-foreground" style={SERIF}>{head}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="border-y border-border bg-secondary/40 py-16 sm:py-24" aria-labelledby="cmp-h">
          <div className="mx-auto max-w-6xl px-5">
            <Eyebrow>Illustrative comparison</Eyebrow>
            <h2 id="cmp-h" className="mt-3 text-4xl text-foreground sm:text-5xl" style={SERIF}>Disconnected versus connected.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[
                { t: "Typical disconnected journey", tone: "muted", items: ["Records scattered across emails, apps and paper", "Reports in languages the next doctor cannot read", "Allergy noted once, in one country", "Coordinators chase providers across time zones", "Patient retells their history at every visit"] },
                { t: "Integrated journey with RinVita", tone: "gold", items: ["One private passport the patient controls", "Translations kept beside every original", "Allergies and medications visible when shared", "Patient sends a brief before the appointment", "Each new document adds to the same record"] },
              ].map((c) => (
                <Card key={c.t} className={`p-6 ${c.tone === "gold" ? "border-primary/40" : ""}`}>
                  <p className="text-2xl text-foreground" style={SERIF}>{c.t}</p>
                  <ul className="mt-5 space-y-3 text-sm">
                    {c.items.map((it) => (
                      <li key={it} className="flex gap-3"><span aria-hidden className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.tone === "gold" ? "bg-primary" : "bg-foreground/40"}`} /><span className="text-foreground/80">{it}</span></li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Illustrative only. Not based on measured outcomes.</p>
          </div>
        </section>

        {/* Hypotheses */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24" aria-labelledby="hyp-h">
          <Eyebrow>Potential impact · hypotheses, not proven results</Eyebrow>
          <h2 id="hyp-h" className="mt-3 max-w-2xl text-4xl text-foreground sm:text-5xl" style={SERIF}>What we believe partners may see.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Less record chasing", "Coordinators may spend less time requesting documents."],
              ["Better-prepared visits", "Specialists may receive history before the appointment."],
              ["Fewer repeated explanations", "Clients may retell their story less often."],
              ["Stronger loyalty", "A useful benefit may deepen the client relationship."],
            ].map(([h, b]) => (
              <div key={h} className="border-t border-primary/40 pt-5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Hypothesis</span>
                <p className="mt-2 text-xl text-foreground" style={SERIF}>{h}</p>
                <p className="mt-2 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-center sm:px-12 sm:py-20">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <div className="flex justify-center"><LogoMark size={34} /></div>
              <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight text-background sm:text-6xl" style={SERIF}>Give your clients continuity, wherever care happens.</h2>
              <p className="mx-auto mt-5 max-w-xl text-background/75">Free 14-day trial, with pricing agreed before it starts. No EHR integration required.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <a href={INQUIRY_MAILTO} className={`rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 ${focusRing}`}>Email hello@rinvita.co.uk</a>
                <Link to="/for-concierges" className={`rounded-full border border-background/30 px-6 py-3 text-sm text-background transition hover:border-background/60 ${focusRing}`}>Explore the partner programme</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-8 text-xs leading-relaxed text-muted-foreground">
          <p><span className="text-foreground">Confidentiality and disclaimer.</span> This page is a fictional demonstration. All names, providers, documents and values are synthetic sample data; no real patient information is shown or collected, and nothing on this page is sent anywhere. RinVita does not diagnose, does not provide medical advice and is not a certified medical device. AI-generated translations and summaries can contain errors and must be reviewed against the original documents.</p>
          <p>© {new Date().getFullYear()} RinVita · <Link to="/privacy" className="underline-offset-2 hover:underline">Privacy</Link> · <Link to="/terms" className="underline-offset-2 hover:underline">Terms</Link></p>
        </div>
      </footer>
    </div>
  );
}
