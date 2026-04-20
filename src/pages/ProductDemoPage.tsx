import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MarketingFooter,
  MarketingNav,
  MarketingStyles,
  marketingColors,
  LogoMark,
  useMarketingBreakpoint,
} from "@/components/marketing/shared";

const steps = [
  { label: "Upload", icon: "⬆" },
  { label: "Extract", icon: "◎" },
  { label: "Translate", icon: "⟷" },
  { label: "Organise", icon: "▦" },
  { label: "Share", icon: "↗" },
] as const;

const stepContent = [
  {
    heading: "Step 1 — Upload any document",
    body: "Sarah's mother has medical records from three countries. Today she's uploading an MRI report from a hospital in Dubai — written in Arabic. She photographs it with her phone and drops it into RinVita.",
  },
  {
    heading: "Step 2 — AI reads the document",
    body: "RinVita identifies patient details, dates, findings, diagnoses, and medications across languages and document formats from hospitals worldwide.",
  },
  {
    heading: "Step 3 — Every word translated",
    body: "The original Arabic document is preserved forever. Alongside it, a clinical-grade English translation — ready for any UK doctor. Switch between languages anytime.",
  },
  {
    heading: "Step 4 — Your complete history",
    body: "One document becomes part of a living timeline — blood results, imaging, medications, allergies, and more. Searchable, comparable, always there.",
  },
  {
    heading: "Step 5 — Share in 30 seconds",
    body: "Generate a secure, time-limited link. The clinician opens it in their browser — no account, no app, no software. They see a complete, organised, translated summary.",
  },
] as const;

function PhoneStepUpload() {
  return (
    <div style={{ height: "100%", background: marketingColors.cream, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 17, color: marketingColors.ink }}>Upload Document</div>
      <div style={{ fontSize: 8.5, color: marketingColors.softText, marginTop: -8 }}>Any language · Any country · Any year</div>
      <div style={{ border: `2px dashed ${marketingColors.gold}`, borderRadius: 10, background: marketingColors.goldSoft, padding: "18px 12px", textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
        <div style={{ fontSize: 9, fontWeight: 600, color: marketingColors.ink, marginBottom: 2 }}>MRI_Report_DubaiHospital.pdf</div>
        <div style={{ fontSize: 7.5, color: marketingColors.softText, marginBottom: 8 }}>تقرير التصوير بالرنين المغناطيسي · 2.4 MB</div>
        <div style={{ background: marketingColors.successSoft, border: `1px solid ${marketingColors.successBorder}`, borderRadius: 4, padding: "4px 8px", display: "inline-block" }}>
          <span style={{ fontSize: 7.5, color: marketingColors.success, fontWeight: 500 }}>✓ Uploaded · AI processing…</span>
        </div>
      </div>
      {[
        ["🩻", "Arabic MRI report", "مستشفى دبي"],
        ["📋", "French prescription", "Ordonnance – Lyon"],
        ["🧪", "Turkish blood panel", "Kan Tahlili Raporu"],
      ].map(([icon, label, sub]) => (
        <div key={label} style={{ background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.07)`, borderRadius: 6, padding: "7px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 500, color: marketingColors.ink }}>{label}</div>
            <div style={{ fontSize: 7.5, color: marketingColors.softText, marginTop: 1 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneStepExtract() {
  const fields = [
    ["Patient name", "Layla Hassan"],
    ["Date of scan", "14 October 2024"],
    ["Referring physician", "Dr. Khalid Al-Rashidi"],
    ["Scan type", "MRI — Left knee, 1.5T"],
    ["Findings", "Partial tear, medial meniscus…"],
  ];

  return (
    <div style={{ height: "100%", background: marketingColors.cream, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 17, color: marketingColors.ink }}>Reading document…</div>
      <div style={{ background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.08)`, borderRadius: 6, padding: 8, minHeight: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 7, color: marketingColors.faintText, marginBottom: 4, letterSpacing: "0.05em" }}>ORIGINAL — ARABIC</div>
        <div style={{ fontSize: 10, lineHeight: 1.8, color: marketingColors.mutedText, direction: "rtl", textAlign: "right", fontFamily: "serif" }}>
          تقرير التصوير بالرنين المغناطيسي
          <br />
          <span style={{ fontSize: 8 }}>المريضة: ليلى حسن · التاريخ: ١٤ أكتوبر ٢٠٢٤</span>
          <br />
          <span style={{ fontSize: 8 }}>مستشفى دبي الدولي · قسم الأشعة التشخيصية</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, height: 1.5, background: marketingColors.goldStrong, animation: "marketing-shimmer 1.4s infinite", top: "50%" }} />
      </div>
      {fields.map(([label, value]) => (
        <div key={label} style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 5, padding: "5px 8px", animation: "marketing-pop-in 0.35s ease" }}>
          <div style={{ fontSize: 7.5, color: marketingColors.softText, marginBottom: 1, letterSpacing: "0.04em" }}>{label.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: marketingColors.ink, fontWeight: 500 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function PhoneStepTranslate() {
  const [lang, setLang] = useState<"en" | "ar">("en");

  return (
    <div style={{ height: "100%", background: marketingColors.cream, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 17, color: marketingColors.ink }}>Translation ready</div>
      <div style={{ display: "flex", background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.1)`, borderRadius: 6, overflow: "hidden" }}>
        {(["en", "ar"] as const).map((code) => (
          <button key={code} onClick={() => setLang(code)} style={{ flex: 1, padding: "7px 4px", background: lang === code ? marketingColors.gold : "transparent", border: "none", color: lang === code ? "hsl(var(--primary-foreground))" : marketingColors.mutedText, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
            {code === "en" ? "English" : "العربية"}
          </button>
        ))}
      </div>
      {lang === "en" ? (
        <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.successBorder}`, borderRadius: 6, padding: 10, animation: "marketing-fade-in 0.3s ease" }}>
          <div style={{ fontSize: 7.5, color: marketingColors.success, marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em" }}>✓ CLINICAL-GRADE ENGLISH TRANSLATION</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: marketingColors.ink, marginBottom: 6 }}>MRI Report — Left Knee</div>
          <div style={{ fontSize: 8.5, lineHeight: 1.8, color: "hsl(var(--foreground) / 0.7)" }}>
            <strong>Patient:</strong> Layla Hassan, F, 38
            <br />
            <strong>Date:</strong> 14 October 2024
            <br />
            <strong>Institution:</strong> Dubai International Hospital
            <br />
            <strong>Findings:</strong> Partial tear of the posterior horn of the medial meniscus.
          </div>
        </div>
      ) : (
        <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 6, padding: 10, animation: "marketing-fade-in 0.3s ease" }}>
          <div style={{ fontSize: 7.5, color: marketingColors.softText, marginBottom: 6, fontWeight: 500, letterSpacing: "0.05em" }}>النص الأصلي محفوظ</div>
          <div style={{ fontSize: 8.5, lineHeight: 1.9, color: "hsl(var(--foreground) / 0.7)", direction: "rtl", textAlign: "right", fontFamily: "serif" }}>
            <strong>المريضة:</strong> ليلى حسن، أنثى، ٣٨ سنة
            <br />
            <strong>التاريخ:</strong> ١٤ أكتوبر ٢٠٢٤
            <br />
            <strong>النتائج:</strong> تمزق جزئي في القرن الخلفي للغضروف الهلالي الإنسي.
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneStepOrganise() {
  const records = [
    ["🇦🇪", "🩻", "MRI Report — Left Knee", "Oct 2024", "Imaging", true],
    ["🇦🇪", "🩸", "Chest X-ray report", "Mar 2024", "Imaging", false],
    ["🇹🇷", "🧪", "Tam Kan Sayımı Raporu", "Nov 2023", "Blood", false],
    ["🇫🇷", "💊", "Ordonnance — Cardiologie", "Aug 2023", "Rx", false],
  ] as const;

  return (
    <div style={{ height: "100%", background: marketingColors.cream, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 17, color: marketingColors.ink }}>Your Health Timeline</div>
      <div style={{ fontSize: 8.5, color: marketingColors.softText }}>4 records · 3 countries · 2 languages</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {["All", "Imaging", "Blood", "Rx"].map((category, index) => (
          <div key={category} style={{ padding: "3px 9px", background: index === 0 ? marketingColors.gold : marketingColors.goldSoft, border: `1px solid ${index === 0 ? marketingColors.gold : marketingColors.goldBorder}`, borderRadius: 20, fontSize: 8, color: index === 0 ? "hsl(var(--primary-foreground))" : marketingColors.gold, fontWeight: 500 }}>{category}</div>
        ))}
      </div>
      {records.map(([flag, icon, name, date, type, fresh]) => (
        <div key={name} style={{ background: marketingColors.surface, border: `1px solid ${fresh ? marketingColors.goldStrong : "hsl(var(--foreground) / 0.07)"}`, borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 8, boxShadow: fresh ? "0 2px 12px hsl(var(--primary) / 0.1)" : "none" }}>
          <span style={{ fontSize: 16 }}>{flag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 500, color: marketingColors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{icon} {name}</div>
            <div style={{ fontSize: 7.5, color: marketingColors.softText, marginTop: 1 }}>{date}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
            <div style={{ fontSize: 7, padding: "2px 6px", background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 3, color: marketingColors.gold }}>{type}</div>
            {fresh && <div style={{ fontSize: 7, color: marketingColors.success, fontWeight: 500 }}>✓ NEW</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneStepShare() {
  return (
    <div style={{ height: "100%", background: marketingColors.cream, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
        <div style={{ fontFamily: "Cormorant Garamond", fontSize: 17, color: marketingColors.ink, marginBottom: 4 }}>Link generated</div>
        <div style={{ fontSize: 8.5, color: marketingColors.mutedText }}>Expires in 7 days · Revoke anytime</div>
      </div>
      <div style={{ background: marketingColors.surface, border: `1px solid ${marketingColors.goldStrong}`, borderRadius: 6, padding: "8px 10px", marginBottom: 10 }}>
        <div style={{ fontSize: 7.5, color: marketingColors.softText, marginBottom: 4, letterSpacing: "0.05em" }}>SECURE LINK</div>
        <div style={{ fontSize: 8, color: marketingColors.gold, fontWeight: 500, wordBreak: "break-all" }}>rinvita.co.uk/share/lh-k7x2m9p4</div>
      </div>
      <div style={{ background: marketingColors.surface, border: `1px solid hsl(var(--foreground) / 0.08)`, borderRadius: 6, padding: "8px 10px" }}>
        <div style={{ fontSize: 8.5, fontWeight: 600, color: marketingColors.ink, marginBottom: 4 }}>Layla Hassan — Health Summary</div>
        {["MRI Left Knee — Oct 2024", "Full Blood Count — Nov 2023", "Cardiology Rx — Aug 2023"].map((item, index) => (
          <div key={item} style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0", borderTop: index > 0 ? `1px solid hsl(var(--foreground) / 0.05)` : "none" }}>
            <span style={{ fontSize: 12 }}>📄</span>
            <div>
              <div style={{ fontSize: 8, color: marketingColors.ink, fontWeight: 500 }}>{item}</div>
              <div style={{ fontSize: 7, color: marketingColors.softText }}>English translation included</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneShell({ step }: { step: number }) {
  const screens = [PhoneStepUpload, PhoneStepExtract, PhoneStepTranslate, PhoneStepOrganise, PhoneStepShare];
  const Screen = screens[step] ?? PhoneStepUpload;

  return (
    <div style={{ width: 290, height: 610, borderRadius: 40, background: marketingColors.surface, boxShadow: "0 28px 64px hsl(var(--foreground) / 0.18), 0 0 0 1px hsl(var(--foreground) / 0.08)", overflow: "hidden", position: "relative", fontFamily: "system-ui, sans-serif", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 96, height: 26, borderRadius: 14, background: "hsl(var(--foreground))", zIndex: 50 }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 46, zIndex: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 7px", background: marketingColors.cream }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: marketingColors.ink }}>9:41</span>
        <div style={{ width: 20, height: 8, borderRadius: 4, border: `1px solid ${marketingColors.softText}` }} />
      </div>
      <div style={{ position: "absolute", top: 46, left: 0, right: 0, zIndex: 9, height: 36, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", background: "hsl(var(--background) / 0.95)", borderBottom: `1px solid ${marketingColors.goldBorder}` }}>
        <LogoMark size={14} color={marketingColors.gold} />
        <span style={{ fontFamily: "Cormorant Garamond", fontSize: 13, fontWeight: 500, color: marketingColors.ink }}>RinVita</span>
        <div style={{ marginLeft: "auto", fontSize: 8, color: marketingColors.gold, fontWeight: 500, letterSpacing: "0.06em", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, padding: "2px 6px" }}>Layla Hassan</div>
      </div>
      <div style={{ position: "absolute", top: 82, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <div key={step} style={{ height: "100%", animation: "marketing-fade-in 0.35s ease" }}>
          <Screen />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", width: 96, height: 3.5, borderRadius: 2, background: "hsl(var(--foreground) / 0.18)", zIndex: 60 }} />
    </div>
  );
}

function Stepper({ current, onGoto }: { current: number; onGoto: (index: number) => void }) {
  const { isMobile } = useMarketingBreakpoint();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", maxWidth: isMobile ? 360 : 560, margin: "0 auto" }}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <div key={step.label} style={{ display: "contents" }}>
            <button onClick={() => onGoto(index)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", minWidth: isMobile ? 48 : 56, flexShrink: 0 }}>
              <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: "50%", background: active ? marketingColors.gold : done ? marketingColors.goldSoft : "hsl(var(--foreground) / 0.06)", border: active ? `2px solid ${marketingColors.gold}` : done ? `2px solid ${marketingColors.goldStrong}` : "2px solid hsl(var(--foreground) / 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 12 : 14, color: active ? "hsl(var(--primary-foreground))" : done ? marketingColors.gold : marketingColors.faintText, boxShadow: active ? "0 0 0 4px hsl(var(--primary) / 0.15)" : "none" }}>
                {done ? "✓" : step.icon}
              </div>
              {!isMobile && <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.05em", color: active ? marketingColors.ink : done ? marketingColors.mutedText : marketingColors.faintText, textTransform: "uppercase" }}>{step.label}</span>}
            </button>
            {index < steps.length - 1 && <div style={{ flex: 1, height: 2, borderRadius: 1, background: index < current ? marketingColors.goldStrong : "hsl(var(--foreground) / 0.08)", marginBottom: isMobile ? 0 : 16 }} />}
          </div>
        );
      })}
    </div>
  );
}

function AutoPlayBar({ active, duration, onComplete, step }: { active: boolean; duration: number; onComplete: () => void; step: number }) {
  if (!active) return null;

  return (
    <div style={{ height: 2, background: "hsl(var(--foreground) / 0.08)", borderRadius: 1, marginTop: 8, overflow: "hidden" }}>
      <div key={`${step}-${active}`} style={{ height: "100%", background: marketingColors.gold, borderRadius: 1, animation: `marketing-progress-bar ${duration}ms linear forwards` }} onAnimationEnd={onComplete} />
    </div>
  );
}

function DemoArea() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [done, setDone] = useState(false);
  const autoDuration = 15000;
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  useEffect(() => {
    if (!autoPlay || done) return;
    const timeout = window.setTimeout(() => {
      if (step < steps.length - 1) {
        setStep((current) => current + 1);
      } else {
        setDone(true);
      }
    }, autoDuration);
    return () => window.clearTimeout(timeout);
  }, [autoPlay, done, step]);

  const goNext = () => {
    if (step < steps.length - 1) setStep((current) => current + 1);
    else setDone(true);
  };

  const goBack = () => {
    if (done) {
      setDone(false);
      setStep(steps.length - 1);
      return;
    }
    if (step > 0) setStep((current) => current - 1);
  };

  if (done) {
    return (
      <div style={{ padding: `80px ${paddingX}px 120px`, textAlign: "center", animation: "marketing-fade-up 0.7s ease" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
        <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : "clamp(38px,4.5vw,60px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 16 }}>That's RinVita.</h2>
        <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.8, color: marketingColors.mutedText, maxWidth: 480, margin: "0 auto 48px", fontWeight: 300 }}>The whole journey, from shoebox to shareable health record. In under 60 seconds.</p>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, justifyContent: "center", alignItems: "center" }}>
          <Link to="/auth?mode=signup" style={{ padding: "16px 36px", background: marketingColors.gold, borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: 14, fontWeight: 600, letterSpacing: "0.07em", textDecoration: "none", boxShadow: "0 4px 24px hsl(var(--primary) / 0.35)" }}>Claim your founding spot</Link>
          <button onClick={() => { setStep(0); setDone(false); }} style={{ background: "transparent", border: `1px solid hsl(var(--foreground) / 0.18)`, borderRadius: 2, padding: "15px 24px", color: marketingColors.mutedText, fontSize: 14, cursor: "pointer" }}>↺ Replay demo</button>
        </div>
        <div style={{ marginTop: 32 }}>
          <Link to="/" style={{ fontSize: 14, color: marketingColors.mutedText, textDecoration: "none", borderBottom: `1px solid hsl(var(--foreground) / 0.15)`, paddingBottom: 1 }}>← Back to homepage</Link>
        </div>
      </div>
    );
  }

  const content = stepContent[step];

  return (
    <div style={{ padding: `40px ${paddingX}px ${isMobile ? 60 : 100}px` }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 48 }}>
        <Stepper current={step} onGoto={(index) => { setDone(false); setStep(index); }} />
        <AutoPlayBar active={autoPlay} duration={autoDuration} onComplete={goNext} step={step} />
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 32 : 64, alignItems: isMobile ? "center" : "flex-start", maxWidth: 1100, margin: "0 auto", justifyContent: "center" }}>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <PhoneShell step={step} />
          {isMobile && (
            <div style={{ display: "flex", gap: 10, width: 290 }}>
              <button onClick={goBack} disabled={step === 0} style={{ flex: 1, padding: 12, background: "transparent", border: `1px solid hsl(var(--foreground) / 0.15)`, borderRadius: 2, color: marketingColors.mutedText, opacity: step === 0 ? 0.35 : 1 }}>← Back</button>
              <button onClick={goNext} style={{ flex: 2, padding: 12, background: marketingColors.gold, border: "none", borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: 14, fontWeight: 600, letterSpacing: "0.06em" }}>{step === steps.length - 1 ? "Finish ✓" : "Next →"}</button>
            </div>
          )}
        </div>
        <div style={{ maxWidth: isMobile ? "100%" : 400, width: "100%", paddingTop: isMobile ? 0 : 16 }}>
          <div key={step} style={{ animation: "marketing-fade-up 0.4s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, padding: "4px 10px", marginBottom: 20 }}>
              <span style={{ fontSize: 9, letterSpacing: "0.14em", color: marketingColors.gold, fontWeight: 500 }}>{step + 1} OF {steps.length} — {steps[step].label.toUpperCase()}</span>
            </div>
            <h3 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 28 : "clamp(26px,2.8vw,36px)", fontWeight: 400, color: marketingColors.ink, marginBottom: 16, lineHeight: 1.2 }}>{content.heading}</h3>
            <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.85, color: marketingColors.mutedText, fontWeight: 300, marginBottom: 36 }}>{content.body}</p>
            {!isMobile && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={goNext} style={{ padding: "14px 32px", background: marketingColors.gold, border: "none", borderRadius: 2, color: "hsl(var(--primary-foreground))", fontSize: 14, fontWeight: 600, letterSpacing: "0.06em", cursor: "pointer", minWidth: 140 }}>{step === steps.length - 1 ? "Finish ✓" : "Next →"}</button>
                {step > 0 && <button onClick={goBack} style={{ background: "transparent", border: "none", color: marketingColors.softText, fontSize: 14, cursor: "pointer", padding: "8px 0", textDecoration: "underline", textUnderlineOffset: 3 }}>← Back</button>}
              </div>
            )}
            {!isMobile && (
              <div style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid hsl(var(--foreground) / 0.08)`, display: "flex", gap: 8, alignItems: "center" }}>
                {steps.map((_, index) => (
                  <button key={index} onClick={() => setStep(index)} style={{ width: index === step ? 20 : 7, height: 7, borderRadius: 4, background: index === step ? marketingColors.gold : index < step ? marketingColors.goldStrong : "hsl(var(--foreground) / 0.12)", border: "none", cursor: "pointer", padding: 0 }} />
                ))}
                <span style={{ fontSize: 11, color: marketingColors.faintText, marginLeft: 8 }}>{step + 1}/{steps.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={() => setAutoPlay((current) => !current)} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)", border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 20, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px hsl(var(--foreground) / 0.08)", cursor: "pointer" }}>
        <div style={{ width: 28, height: 16, borderRadius: 8, background: autoPlay ? marketingColors.gold : "hsl(var(--foreground) / 0.15)", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 2, left: autoPlay ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "hsl(var(--card))", transition: "left 0.3s" }} />
        </div>
        <span style={{ fontSize: 11, color: marketingColors.mutedText, fontWeight: 500, whiteSpace: "nowrap" }}>Auto-play</span>
      </button>
    </div>
  );
}

function DemoHero() {
  const { isMobile } = useMarketingBreakpoint();

  return (
    <div style={{ padding: isMobile ? "88px 20px 40px" : "104px 56px 56px", background: marketingColors.cream, borderBottom: `1px solid ${marketingColors.goldBorder}`, textAlign: "center" }}>
      <span className="marketing-section-label" style={{ display: "block", marginBottom: 16 }}>Interactive Demo</span>
      <h1 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 36 : "clamp(42px,5vw,64px)", fontWeight: 300, color: marketingColors.ink, marginBottom: 16, lineHeight: 1.1, letterSpacing: "-0.02em" }}>See RinVita in action.</h1>
      <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.8, color: marketingColors.mutedText, maxWidth: 540, margin: "0 auto", fontWeight: 300 }}>Click through a real scenario — uploading an Arabic medical report, watching it translate, and sharing it with a clinician. 60 seconds, no signup.</p>
    </div>
  );
}

const ProductDemoPage = () => {
  return (
    <div className="marketing-page" style={{ background: marketingColors.cream, color: marketingColors.ink }}>
      <MarketingStyles />
      <MarketingNav currentPage="demo" />
      <DemoHero />
      <div style={{ background: marketingColors.cream, minHeight: "60vh" }}>
        <DemoArea />
      </div>
      <MarketingFooter />
    </div>
  );
};

export default ProductDemoPage;
