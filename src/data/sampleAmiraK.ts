// Fictional patient "Amira K." — coherent 18-month multi-country record used both
// for the anonymous instant demo (`InstantDemo`) and (later) the sample Health
// Passport PDF. No real hospitals; plausible facility names only.
// Every value is invented for demonstration; nothing here is a real medical record.

export type SampleDoc = {
  id: "dubai-labs" | "paris-discharge" | "istanbul-cardiology" | "singapore-blood";
  flag: string;
  language: string;              // display language name
  languageCode: string;          // ISO code hint for translate simulation
  originCity: string;
  facility: string;              // fictional
  originalTitle: string;         // in original script
  translatedTitle: string;       // English
  dateISO: string;               // YYYY-MM-DD
  // Original-language teaser lines shown in the "Detecting language" phase.
  // Kept short — a visual cue, not a full document.
  originalSnippet: string[];
  translatedSummary: string;
  // Extracted structured items shown in the reveal.
  markers?: Array<{ name: string; value: string; range: string; status: "normal" | "high" | "low" }>;
  medications?: Array<{ name: string; dose: string; freq: string }>;
  flags?: Array<{ label: string; detail: string }>;
  timeline: { label: string; note: string };
};

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: "dubai-labs",
    flag: "🇦🇪",
    language: "Arabic",
    languageCode: "ar",
    originCity: "Dubai, UAE",
    facility: "Al Noor Medical Centre, Dubai",
    originalTitle: "تقرير تحليل الدم الشامل",
    translatedTitle: "Comprehensive Blood Panel",
    dateISO: "2024-11-14",
    originalSnippet: [
      "المريضة: أميرة ك.",
      "التاريخ: ١٤ نوفمبر ٢٠٢٤",
      "الهيموجلوبين — ١١٫٢ جم/دل ↓",
      "الحديد في المصل — منخفض",
      "فيتامين د — ١٨ نانوجرام/مل ↓",
    ],
    translatedSummary:
      "Full blood count and iron studies for a 34-year-old female. Mildly low haemoglobin and low serum ferritin — consistent with early iron-deficiency anaemia. Vitamin D also below range. All other parameters within normal limits.",
    markers: [
      { name: "Haemoglobin", value: "11.2 g/dL", range: "12.0 – 15.5", status: "low" },
      { name: "Ferritin", value: "9 ng/mL", range: "15 – 150", status: "low" },
      { name: "Vitamin D (25-OH)", value: "18 ng/mL", range: "30 – 100", status: "low" },
      { name: "TSH", value: "2.1 mIU/L", range: "0.4 – 4.5", status: "normal" },
      { name: "HbA1c", value: "5.3 %", range: "< 5.7", status: "normal" },
      { name: "eGFR", value: "98 mL/min", range: "> 90", status: "normal" },
    ],
    flags: [
      { label: "Iron-deficiency anaemia (early)", detail: "Hb 11.2, ferritin 9 — recommend oral iron + repeat FBC in 12 weeks." },
      { label: "Vitamin D insufficiency", detail: "25-OH 18 ng/mL — supplementation advised." },
    ],
    timeline: { label: "Nov 2024 · Dubai", note: "Routine blood panel — Al Noor Medical Centre" },
  },
  {
    id: "paris-discharge",
    flag: "🇫🇷",
    language: "French",
    languageCode: "fr",
    originCity: "Paris, France",
    facility: "Clinique Saint-Rémi, Paris",
    originalTitle: "Compte rendu d'hospitalisation",
    translatedTitle: "Hospital Discharge Summary",
    dateISO: "2025-03-22",
    originalSnippet: [
      "Patiente : Amira K., 34 ans",
      "Admission : 20/03/2025 — Sortie : 22/03/2025",
      "Motif : douleurs abdominales aiguës",
      "Diagnostic : appendicite aiguë non compliquée",
      "Intervention : appendicectomie coelioscopique",
    ],
    translatedSummary:
      "Admitted for acute right lower quadrant pain. Diagnosed with uncomplicated acute appendicitis. Underwent laparoscopic appendectomy on 21 March 2025. Uneventful recovery. Discharged home 22 March 2025 on paracetamol and a 5-day course of oral antibiotics.",
    medications: [
      { name: "Paracetamol", dose: "1 g", freq: "4× daily, as needed, 5 days" },
      { name: "Amoxicillin / clavulanic acid", dose: "1 g", freq: "3× daily, 5 days" },
    ],
    flags: [
      { label: "Recent surgery", detail: "Laparoscopic appendectomy 21 Mar 2025 — post-op review recommended at 2 weeks." },
    ],
    timeline: { label: "Mar 2025 · Paris", note: "Laparoscopic appendectomy — Clinique Saint-Rémi" },
  },
  {
    id: "istanbul-cardiology",
    flag: "🇹🇷",
    language: "Turkish",
    languageCode: "tr",
    originCity: "Istanbul, Türkiye",
    facility: "Boğaziçi Kardiyoloji Merkezi, İstanbul",
    originalTitle: "Kardiyoloji Muayene Raporu",
    translatedTitle: "Cardiology Consultation Report",
    dateISO: "2025-07-09",
    originalSnippet: [
      "Hasta: Amira K.",
      "Şikayet: ara sıra çarpıntı",
      "EKG: sinüs ritmi, normal aks",
      "Ekokardiyografi: EF %62 — normal",
      "Kan basıncı: 128 / 82 mmHg",
    ],
    translatedSummary:
      "Referred for intermittent palpitations. ECG shows normal sinus rhythm with a normal axis. Echocardiogram: left ventricular ejection fraction 62%, no structural abnormality. Blood pressure slightly elevated at 128/82. Impression: benign palpitations, likely stress-related. Advised lifestyle measures and BP monitoring; no cardiac medication started.",
    markers: [
      { name: "Blood Pressure", value: "128 / 82 mmHg", range: "< 120 / 80", status: "high" },
      { name: "Resting Heart Rate", value: "76 bpm", range: "60 – 100", status: "normal" },
      { name: "LV Ejection Fraction", value: "62 %", range: "≥ 55", status: "normal" },
    ],
    flags: [
      { label: "Blood pressure at upper limit", detail: "128/82 — recheck in 3 months, home BP diary suggested." },
    ],
    timeline: { label: "Jul 2025 · Istanbul", note: "Cardiology consult — Boğaziçi Kardiyoloji Merkezi" },
  },
  {
    id: "singapore-blood",
    flag: "🇸🇬",
    language: "Chinese",
    languageCode: "zh",
    originCity: "Singapore",
    facility: "Marina Bay Health Clinic, Singapore",
    originalTitle: "全血细胞计数报告",
    translatedTitle: "Full Blood Count Report",
    dateISO: "2026-02-05",
    originalSnippet: [
      "患者:Amira K.",
      "日期:2026年2月5日",
      "血红蛋白:13.4 g/dL ✓",
      "铁蛋白:38 ng/mL ✓",
      "维生素D:32 ng/mL ✓",
    ],
    translatedSummary:
      "Repeat blood work following iron and vitamin D supplementation. Haemoglobin now within normal range at 13.4 g/dL. Ferritin recovered to 38 ng/mL. Vitamin D corrected to 32 ng/mL. All other markers normal. No further supplementation required beyond maintenance.",
    markers: [
      { name: "Haemoglobin", value: "13.4 g/dL", range: "12.0 – 15.5", status: "normal" },
      { name: "Ferritin", value: "38 ng/mL", range: "15 – 150", status: "normal" },
      { name: "Vitamin D (25-OH)", value: "32 ng/mL", range: "30 – 100", status: "normal" },
      { name: "HbA1c", value: "5.2 %", range: "< 5.7", status: "normal" },
    ],
    flags: [
      { label: "Improvement vs Nov 2024", detail: "Iron and vitamin D deficiencies both resolved — supplementation successful." },
    ],
    timeline: { label: "Feb 2026 · Singapore", note: "Follow-up bloods — Marina Bay Health Clinic" },
  },
];

export const SAMPLE_PATIENT = {
  fullName: "Amira K.",
  dob: "1990-06-12",
  biologicalSex: "Female",
  nationality: "Lebanese",
  bloodType: "A+",
  notes: "Sample document — fictional patient data for demonstration.",
};
