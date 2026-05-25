// Renders the v2 Patient Summary PDF using @react-pdf/renderer (Deno-compatible).
// Milestone 1: Patient Summary. Milestone 2: Visit History. Milestone 3: Meds, Blood, Imaging.
// Milestone 4: RTL + CJK font fallback, typography polish, GET keep-warm probe.

import React from "npm:react@18.3.1";
// @ts-ignore - Deno resolves npm specifiers
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font, Svg, Circle } from "npm:@react-pdf/renderer@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Font registration (prefetched buffers to avoid race conditions) ----------
// @react-pdf/renderer in Deno edge-runtime occasionally fails layout with
// "Cannot read properties of undefined (reading 'unitsPerEm')" when font URLs
// are still in flight at render time. We prefetch each TTF once and register
// the buffer so the font is synchronously available.

const FONT_SOURCES: Record<string, { url: string; weight: number }[]> = {
  "Cormorant Garamond": [
    { url: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf", weight: 400 },
    { url: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnM.ttf", weight: 600 },
  ],
  "DM Sans": [
    { url: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf", weight: 400 },
    { url: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf", weight: 500 },
    { url: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf", weight: 700 },
  ],
  "Noto Naskh Arabic": [
    { url: "https://fonts.gstatic.com/s/notonaskharabic/v34/RrQ5bpV-9Dd1b1OAGA6M9PkyDuVBeLU.ttf", weight: 400 },
  ],
  "Noto Sans Hebrew": [
    { url: "https://fonts.gstatic.com/s/notosanshebrew/v46/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXd4qtoiJltutR2g.ttf", weight: 400 },
  ],
  "Noto Sans SC": [
    { url: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf", weight: 400 },
  ],
  "Noto Sans JP": [
    { url: "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf", weight: 400 },
  ],
  "Noto Sans KR": [
    { url: "https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLTq8H4hfeE.ttf", weight: 400 },
  ],
  "Noto Sans Devanagari": [
    { url: "https://fonts.gstatic.com/s/notosansdevanagari/v26/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-AzoFoW4Ow.ttf", weight: 400 },
  ],
};

const fontDataUrls = new Map<string, string>();
const registeredFamilies = new Set<string>();

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

async function ensureFontFamily(family: string): Promise<void> {
  if (registeredFamilies.has(family)) return;
  const defs = FONT_SOURCES[family];
  if (!defs) return;
  const fonts = await Promise.all(defs.map(async (def) => {
    let dataUrl = fontDataUrls.get(def.url);
    if (!dataUrl) {
      const res = await fetch(def.url);
      if (!res.ok) throw new Error(`Failed to fetch font ${family} (${def.weight}): ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      dataUrl = `data:font/ttf;base64,${toBase64(buf)}`;
      fontDataUrls.set(def.url, dataUrl);
    }
    return { src: dataUrl, fontWeight: def.weight };
  }));
  Font.register({ family, fonts } as any);
  registeredFamilies.add(family);
}

// Disable hyphenation — letters were splitting in old export.
Font.registerHyphenationCallback((word: string) => [word]);

// ---------- Per-language font selection ----------
// Returns { display, body } font families. Falls back to Latin defaults.
function fontsForLanguage(language: string): { display: string; body: string } {
  const lang = (language || "en").toLowerCase();
  // RTL Arabic-script: ar, ur, fa
  if (lang === "ar" || lang === "ur" || lang === "fa") {
    return { display: "Noto Naskh Arabic", body: "Noto Naskh Arabic" };
  }
  if (lang === "he") {
    return { display: "Noto Sans Hebrew", body: "Noto Sans Hebrew" };
  }
  if (lang === "zh") {
    return { display: "Noto Sans SC", body: "Noto Sans SC" };
  }
  if (lang === "ja") {
    return { display: "Noto Sans JP", body: "Noto Sans JP" };
  }
  if (lang === "ko") {
    return { display: "Noto Sans KR", body: "Noto Sans KR" };
  }
  if (lang === "hi" || lang === "mr") {
    return { display: "Noto Sans Devanagari", body: "Noto Sans Devanagari" };
  }
  return { display: "Cormorant Garamond", body: "DM Sans" };
}

function isRtlLanguage(language: string): boolean {
  const lang = (language || "en").toLowerCase();
  return lang === "ar" || lang === "ur" || lang === "fa" || lang === "he";
}

// ---------- Theme ----------
const COLORS = {
  ink: "#1C1810",
  muted: "#6B6256",
  hairline: "#E8E2D5",
  paper: "#FFFFFF",
  gold: "#B8952A",
  goldSoft: "#F6F2E9",
  amber: "#C9853A",
  // Clinical status colours
  navy: "#0E2A3E",
  navyInk: "#FFFFFF",
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  success: "#15803D",
  zebra: "#F7F7F5",
  borderStrong: "#D9D2C2",
};

// Build styles for a given language. Swaps fontFamily + RTL direction so
// Arabic/Hebrew/CJK render with the correct script and reading direction.
function buildStyles(language: string) {
  const { display, body } = fontsForLanguage(language);
  const rtl = isRtlLanguage(language);
  const dir = rtl ? "rtl" : "ltr";
  const startAlign = rtl ? "right" : "left";

  return StyleSheet.create({
    page: {
      backgroundColor: COLORS.paper,
      color: COLORS.ink,
      fontFamily: body,
      fontSize: 10,
      paddingTop: 56,
      paddingBottom: 56,
      paddingHorizontal: 56,
      lineHeight: 1.55,
      textAlign: startAlign as any,
    },
    header: {
      flexDirection: rtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 0.5,
      borderBottomColor: COLORS.hairline,
      paddingBottom: 10,
      marginBottom: 22,
    },
    headerBrand: {
      fontFamily: body,
      fontSize: 11,
      fontWeight: 700,
      color: COLORS.ink,
      letterSpacing: 0,
    },
    headerBrandAccent: { color: COLORS.gold },
    headerRight: {
      fontSize: 9,
      color: COLORS.muted,
      fontWeight: 500,
      letterSpacing: 0,
    },
    footer: {
      position: "absolute",
      bottom: 28,
      left: 56,
      right: 56,
      flexDirection: rtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 7.5,
      color: COLORS.muted,
      borderTopWidth: 0.5,
      borderTopColor: COLORS.hairline,
      paddingTop: 6,
    },
    footerLeft: { fontSize: 7.5, color: COLORS.muted },
    footerRight: { fontSize: 7.5, color: COLORS.muted, fontWeight: 500 },
    patientName: {
      fontFamily: display,
      fontSize: 30,
      fontWeight: 600,
      color: COLORS.ink,
      marginBottom: 4,
      textAlign: startAlign as any,
    },
    patientMeta: {
      fontSize: 10,
      color: COLORS.muted,
      marginBottom: 14,
      textAlign: startAlign as any,
    },
    coverRule: {
      height: 1.5,
      backgroundColor: COLORS.gold,
      marginTop: 4,
      marginBottom: 22,
      width: "30%",
    },
    ataGlance: {
      fontFamily: display,
      fontSize: 13,
      color: COLORS.ink,
      backgroundColor: COLORS.goldSoft,
      padding: 12,
      borderLeftWidth: rtl ? 0 : 2,
      borderRightWidth: rtl ? 2 : 0,
      borderLeftColor: COLORS.gold,
      borderRightColor: COLORS.gold,
      marginBottom: 22,
      lineHeight: 1.5,
      textAlign: startAlign as any,
    },
    sectionHeading: {
      fontFamily: body,
      fontSize: 13,
      fontWeight: 700,
      color: COLORS.ink,
      marginBottom: 4,
      marginTop: 4,
      paddingBottom: 4,
      borderBottomWidth: 1.2,
      borderBottomColor: COLORS.gold,
      textAlign: startAlign as any,
    },
    sectionHeadingSpacer: { marginBottom: 10 },
    twoCol: { flexDirection: rtl ? "row-reverse" : "row", gap: 18, marginBottom: 18 },
    col: { flex: 1 },
    bulletRow: {
      flexDirection: rtl ? "row-reverse" : "row",
      marginBottom: 4,
    },
    bulletDot: { width: 10, color: COLORS.gold, fontSize: 10, lineHeight: 1.5 },
    bulletText: {
      flex: 1,
      fontSize: 10,
      color: COLORS.ink,
      lineHeight: 1.5,
      textAlign: startAlign as any,
    },
    emptyText: { fontSize: 9, color: COLORS.muted },
    highlightsBlock: { marginTop: 4, marginBottom: 18 },
    highlightRow: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderLeftWidth: rtl ? 0 : 2,
      borderRightWidth: rtl ? 2 : 0,
      borderLeftColor: COLORS.amber,
      borderRightColor: COLORS.amber,
      backgroundColor: "#FCFAF5",
      marginBottom: 6,
    },
    highlightDot: { marginTop: 5, marginHorizontal: 8 },
    highlightText: {
      flex: 1,
      fontSize: 10,
      color: COLORS.ink,
      lineHeight: 1.5,
      textAlign: startAlign as any,
    },
    disclaimer: {
      fontSize: 8,
      color: COLORS.muted,
      lineHeight: 1.55,
      marginTop: 18,
      paddingTop: 10,
      borderTopWidth: 0.5,
      borderTopColor: COLORS.hairline,
      textAlign: startAlign as any,
    },
    // Visit History
    // Page title (big, with gold underline)
    pageTitle: {
      fontFamily: body,
      fontSize: 20,
      fontWeight: 700,
      color: COLORS.ink,
      marginBottom: 4,
      textAlign: startAlign as any,
    },
    pageTitleRule: {
      height: 1.5,
      backgroundColor: COLORS.gold,
      width: 36,
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 9.5,
      color: COLORS.muted,
      marginBottom: 14,
      textAlign: startAlign as any,
    },
    visitCard: {
      borderWidth: 0.5,
      borderColor: COLORS.hairline,
      borderRadius: 4,
      padding: 14,
      marginBottom: 14,
    },
    visitHeader: {
      flexDirection: rtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: COLORS.hairline,
    },
    visitDate: {
      fontFamily: display,
      fontSize: 14,
      fontWeight: 600,
      color: COLORS.ink,
    },
    visitFacility: { fontSize: 9, color: COLORS.muted, marginTop: 1 },
    visitFieldLabel: {
      fontSize: 8,
      color: COLORS.gold,
      textTransform: "uppercase",
      // CJK + RTL Naskh look terrible with letter-spacing — only apply for Latin scripts.
      letterSpacing: rtl || /^(zh|ja|ko|hi|mr)$/.test(language) ? 0 : 0.6,
      marginTop: 8,
      marginBottom: 2,
      textAlign: startAlign as any,
    },
    visitFieldValue: {
      fontSize: 10,
      color: COLORS.ink,
      lineHeight: 1.5,
      textAlign: startAlign as any,
    },
    // M3
    pageTitleBlock: { marginBottom: 18 },
    table: {
      borderWidth: 0.5,
      borderColor: COLORS.borderStrong,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 14,
    },
    tableHeader: {
      flexDirection: rtl ? "row-reverse" : "row",
      backgroundColor: COLORS.navy,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      fontSize: 8,
      color: COLORS.navyInk,
      textTransform: "uppercase",
      letterSpacing: rtl || /^(zh|ja|ko|hi|mr)$/.test(language) ? 0 : 0.6,
      fontWeight: 700,
      textAlign: startAlign as any,
    },
    tableRow: {
      flexDirection: rtl ? "row-reverse" : "row",
      paddingVertical: 4.5,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: COLORS.hairline,
    },
    tableRowZebra: { backgroundColor: COLORS.zebra },
    tableRowLast: { borderBottomWidth: 0 },
    tableCell: {
      fontSize: 9,
      color: COLORS.ink,
      lineHeight: 1.35,
      textAlign: startAlign as any,
    },
    tableCellDanger: { color: COLORS.danger, fontWeight: 700 },
    tableCellSuccess: { color: COLORS.success, fontWeight: 600 },
    statusPill: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 4,
    },
    statusGlyph: {
      fontSize: 9,
      fontWeight: 700,
      width: 10,
      color: COLORS.ink,
    },
    statusGlyphDanger: { color: COLORS.danger },
    statusGlyphSuccess: { color: COLORS.success },
    statusLabel: {
      fontSize: 8.5,
      color: COLORS.ink,
    },
    statusLabelDanger: { color: COLORS.danger, fontWeight: 700 },
    statusLabelSuccess: { color: COLORS.success, fontWeight: 600 },
    imagingCard: {
      borderWidth: 0.5,
      borderColor: COLORS.hairline,
      borderRadius: 4,
      padding: 12,
      marginBottom: 10,
    },
    imagingHeaderRow: {
      flexDirection: rtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    imagingTitle: {
      fontFamily: display,
      fontSize: 13,
      fontWeight: 600,
      color: COLORS.ink,
      textAlign: startAlign as any,
    },
    imagingMeta: { fontSize: 9, color: COLORS.muted, marginTop: 1 },
    imagingFindingLabel: {
      fontSize: 8,
      color: COLORS.gold,
      textTransform: "uppercase",
      letterSpacing: rtl || /^(zh|ja|ko|hi|mr)$/.test(language) ? 0 : 0.6,
      marginTop: 6,
      marginBottom: 2,
      textAlign: startAlign as any,
    },
    imagingFindingText: {
      fontSize: 10,
      color: COLORS.ink,
      lineHeight: 1.5,
      textAlign: startAlign as any,
    },
  });
}

type Styles = ReturnType<typeof buildStyles>;

// ---------- Types ----------
interface VisitPayload {
  visitDate?: string;
  facilityName?: string;
  facilityCountry?: string;
  reasonForVisit?: string;
  investigationsPerformed: string[];
  findings?: string;
  diagnosis?: string;
  medicationsPrescribed: string[];
  followUpRecommendations: string[];
}

interface MedicationRow {
  name: string;
  dose?: string;
  frequency?: string;
  prescriber?: string;
  facility?: string;
  date?: string;
  active: boolean;
}

interface BloodRow {
  marker: string;
  value: number | string;
  unit?: string;
  range?: string;
  status: "normal" | "flagged" | "critical" | string;
  date?: string;
}

interface ImagingRow {
  type: string;
  region?: string;
  date?: string;
  facility?: string;
  finding?: string;
  status: "normal" | "flagged" | string;
}

interface PatientPayload {
  patient: {
    fullName: string;
    dob?: string;
    biologicalSex?: string;
    nationality?: string;
    bloodType?: string;
    chronicConditions?: string;
  };
  counts: {
    documents: number;
    countries: number;
    yearsSpan: number;
  };
  currentMedications: { name: string; dose?: string; frequency?: string }[];
  allergies: { substance: string; severity?: string; reaction?: string }[];
  highlights: string[];
  visits?: VisitPayload[];
  medicationsTable?: MedicationRow[];
  bloodTable?: BloodRow[];
  imagingTable?: ImagingRow[];
  language: string;
  generatedAt: string;
  isRtl?: boolean;
  strings: {
    patientSummary: string;
    atAGlance: string;
    currentMedications: string;
    knownAllergies: string;
    chronicConditions: string;
    clinicalHighlights: string;
    none: string;
    footerNote: string;
    disclaimer: string;
    visitHistory: string;
    visitHistorySubtitle: string;
    reasonForVisit: string;
    investigations: string;
    findings: string;
    diagnosis: string;
    medicationsPrescribed: string;
    followUp: string;
    noVisits: string;
    medicationsTitle: string;
    medicationsSubtitle: string;
    medColName: string;
    medColDose: string;
    medColFrequency: string;
    medColPrescriber: string;
    medColStarted: string;
    medColStatus: string;
    medActive: string;
    medInactive: string;
    noMedications: string;
    bloodResultsTitle: string;
    bloodResultsSubtitle: string;
    bloodColMarker: string;
    bloodColValue: string;
    bloodColRange: string;
    bloodColStatus: string;
    bloodColDate: string;
    bloodStatusNormal: string;
    bloodStatusFlagged: string;
    bloodStatusCritical: string;
    noBloodResults: string;
    imagingTitle: string;
    imagingSubtitle: string;
    imagingFinding: string;
    imagingNormal: string;
    imagingFlagged: string;
    noImaging: string;
    documentsTitle?: string;
    documentsSubtitle?: string;
    docColName?: string;
    docColType?: string;
    docColDate?: string;
    docColFacility?: string;
    docColCountry?: string;
    noDocuments?: string;
    headerTitle?: string;
  };
  documentsTable?: { name?: string; type?: string; date?: string; facility?: string; country?: string }[];
}

// ---------- Components ----------
const h = React.createElement;

const AmberDot = () =>
  h(Svg, { width: 6, height: 6, viewBox: "0 0 6 6" },
    h(Circle, { cx: 3, cy: 3, r: 3, fill: COLORS.amber }),
  );

// Document header — same on every page. No patient name; just the brand
// wordmark and the doc title.
const Header = ({ title, styles, showBrand = true }: { title: string; styles: Styles; showBrand?: boolean }) =>
  h(View, { style: styles.header, fixed: true },
    showBrand
      ? h(Text, { style: styles.headerBrand }, "Rin", h(Text, { style: styles.headerBrandAccent }, "Vita"))
      : h(Text, { style: styles.headerBrand }, " "),
    h(Text, { style: styles.headerRight }, title),
  );

const Footer = ({ styles }: { styles: Styles }) =>
  h(View, { style: styles.footer, fixed: true },
    h(Text, { style: styles.footerLeft },
      "Generated by RinVita · ICO ZC123014 · Not a medical device"),
    h(Text, {
      style: styles.footerRight,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `Page ${pageNumber} of ${totalPages}`,
    }),
  );

const Bullets = ({ items, empty, styles }: { items: string[]; empty: string; styles: Styles }) => {
  if (!items || items.length === 0) {
    return h(Text, { style: styles.emptyText }, empty);
  }
  return h(View, null,
    items.map((item, i) =>
      h(View, { key: i, style: styles.bulletRow },
        h(Text, { style: styles.bulletDot }, "•"),
        h(Text, { style: styles.bulletText }, item),
      ),
    ),
  );
};

const PatientSummaryPage = (data: PatientPayload, styles: Styles) => {
  const { patient, currentMedications, allergies, highlights, strings, generatedAt } = data;

  const meta = [
    patient.dob && `DOB: ${patient.dob}`,
    patient.biologicalSex,
    patient.nationality,
    patient.bloodType && `Blood type: ${patient.bloodType}`,
  ].filter(Boolean).join("  ·  ");

  const medItems = currentMedications.map((m) =>
    [m.name, m.dose, m.frequency].filter(Boolean).join(" — ")
  );
  const allergyItems = allergies.map((a) =>
    [a.substance, a.severity && `(${a.severity})`].filter(Boolean).join(" ")
  );

  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(Text, { style: styles.patientName }, patient.fullName),
    meta ? h(Text, { style: styles.patientMeta }, meta) : null,
    h(Text, { style: styles.ataGlance }, strings.atAGlance),
    h(View, { style: styles.twoCol },
      h(View, { style: styles.col },
        h(Text, { style: styles.sectionHeading }, strings.currentMedications),
        h(Bullets, { items: medItems, empty: strings.none, styles }),
      ),
      h(View, { style: styles.col },
        h(Text, { style: styles.sectionHeading }, strings.knownAllergies),
        h(Bullets, { items: allergyItems, empty: strings.none, styles }),
      ),
    ),
    patient.chronicConditions
      ? h(View, { style: { marginBottom: 18 } },
          h(Text, { style: styles.sectionHeading }, strings.chronicConditions),
          h(Text, { style: styles.bulletText }, patient.chronicConditions),
        )
      : null,
    // Keep heading + at least 2 lines together to avoid orphan headings.
    h(Text, { style: styles.sectionHeading, minPresenceAhead: 30 } as any, strings.clinicalHighlights),
    h(View, { style: styles.highlightsBlock },
      highlights.length === 0
        ? h(Text, { style: styles.emptyText }, strings.none)
        : highlights.slice(0, 5).map((highlight, i) =>
            h(View, { key: i, style: styles.highlightRow, wrap: false },
              h(View, { style: styles.highlightDot }, h(AmberDot, null)),
              h(Text, { style: styles.highlightText }, highlight),
            ),
          ),
    ),
    h(Text, { style: styles.disclaimer }, strings.disclaimer),
    h(Footer, { styles }),
  );
};

const VisitCard = ({ visit, strings, styles }: { visit: VisitPayload; strings: PatientPayload["strings"]; styles: Styles }) => {
  const dateText = visit.visitDate || "—";
  const facilityText = [visit.facilityName, visit.facilityCountry].filter(Boolean).join(" · ");

  return h(View, { style: styles.visitCard, wrap: false },
    h(View, { style: styles.visitHeader },
      h(View, null,
        h(Text, { style: styles.visitDate }, dateText),
        facilityText ? h(Text, { style: styles.visitFacility }, facilityText) : null,
      ),
    ),
    visit.reasonForVisit ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.reasonForVisit),
      h(Text, { style: styles.visitFieldValue }, visit.reasonForVisit),
    ) : null,
    visit.investigationsPerformed && visit.investigationsPerformed.length > 0 ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.investigations),
      h(Bullets, { items: visit.investigationsPerformed, empty: strings.none, styles }),
    ) : null,
    visit.findings ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.findings),
      h(Text, { style: styles.visitFieldValue }, visit.findings),
    ) : null,
    visit.diagnosis ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.diagnosis),
      h(Text, { style: styles.visitFieldValue }, visit.diagnosis),
    ) : null,
    visit.medicationsPrescribed && visit.medicationsPrescribed.length > 0 ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.medicationsPrescribed),
      h(Bullets, { items: visit.medicationsPrescribed, empty: strings.none, styles }),
    ) : null,
    visit.followUpRecommendations && visit.followUpRecommendations.length > 0 ? h(View, null,
      h(Text, { style: styles.visitFieldLabel }, strings.followUp),
      h(Bullets, { items: visit.followUpRecommendations, empty: strings.none, styles }),
    ) : null,
  );
};

const VisitHistoryPage = (data: PatientPayload, styles: Styles) => {
  const { visits = [], patient, strings, generatedAt } = data;

  // Sort newest first by visit_date string (ISO-comparable when present)
  const sorted = [...visits].sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));

  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(Text, { style: styles.pageTitle }, strings.visitHistory),
    h(Text, { style: styles.pageSubtitle }, strings.visitHistorySubtitle),
    sorted.length === 0
      ? h(Text, { style: styles.emptyText }, strings.noVisits)
      : h(View, null,
          sorted.map((v, i) => h(VisitCard, { key: i, visit: v, strings, styles })),
        ),
    h(Footer, { styles }),
  );
};

// ---------- M3: Medications, Blood Results, Imaging ----------

// B&W-friendly status glyphs — ASCII-safe (geometric Unicode shapes aren't
// in the Latin font subset and crash textkit with "unitsPerEm undefined").
function bloodStatusGlyph(status: string): string {
  if (status === "critical") return "!!";
  if (status === "flagged") return "!";
  return "·";
}

function bloodStatusLabel(status: string, s: PatientPayload["strings"]): string {
  if (status === "critical") return s.bloodStatusCritical;
  if (status === "flagged") return s.bloodStatusFlagged;
  return s.bloodStatusNormal;
}

function imagingStatusGlyph(status: string): string {
  return status === "flagged" ? "!" : "·";
}

function imagingStatusLabel(status: string, s: PatientPayload["strings"]): string {
  return status === "flagged" ? s.imagingFlagged : s.imagingNormal;
}

const MedicationsPage = (data: PatientPayload, styles: Styles) => {
  const { patient, strings, generatedAt, medicationsTable = [] } = data;

  const cols = [
    { label: strings.medColName, w: 26 },
    { label: strings.medColDose, w: 14 },
    { label: strings.medColFrequency, w: 18 },
    { label: strings.medColPrescriber, w: 20 },
    { label: strings.medColStarted, w: 12 },
    { label: strings.medColStatus, w: 10 },
  ];

  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(View, { style: styles.pageTitleBlock },
      h(Text, { style: styles.pageTitle }, strings.medicationsTitle),
      h(Text, { style: styles.pageSubtitle }, strings.medicationsSubtitle),
    ),
    medicationsTable.length === 0
      ? h(Text, { style: styles.emptyText }, strings.noMedications)
      : h(View, { style: styles.table },
          h(View, { style: styles.tableHeader, fixed: true },
            ...cols.map((c, i) =>
              h(Text, { key: i, style: [styles.tableHeaderCell, { width: `${c.w}%` }] }, c.label),
            ),
          ),
          ...medicationsTable.map((r, i) => {
            const isLast = i === medicationsTable.length - 1;
            const rowStyle = [
              styles.tableRow,
              i % 2 === 1 ? styles.tableRowZebra : null,
              isLast ? styles.tableRowLast : null,
            ];
            return h(View, { key: i, style: rowStyle, wrap: false },
              h(Text, { style: [styles.tableCell, { width: "26%" }] }, r.name || "—"),
              h(Text, { style: [styles.tableCell, { width: "14%" }] }, r.dose || "—"),
              h(Text, { style: [styles.tableCell, { width: "18%" }] }, r.frequency || "—"),
              h(Text, { style: [styles.tableCell, { width: "20%" }] }, r.prescriber || "—"),
              h(Text, { style: [styles.tableCell, { width: "12%" }] }, r.date || "—"),
              h(Text, { style: [styles.tableCell, { width: "10%" }] },
                r.active ? strings.medActive : strings.medInactive,
              ),
            );
          }),
        ),
    h(Footer, { styles }),
  );
};

const BloodResultsPage = (data: PatientPayload, styles: Styles) => {
  const { patient, strings, generatedAt, bloodTable = [] } = data;

  const cols = [
    { label: strings.bloodColMarker, w: 28 },
    { label: strings.bloodColValue, w: 18 },
    { label: strings.bloodColRange, w: 22 },
    { label: strings.bloodColStatus, w: 18 },
    { label: strings.bloodColDate, w: 14 },
  ];

  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(View, { style: styles.pageTitleBlock },
      h(Text, { style: styles.pageTitle }, strings.bloodResultsTitle),
      h(Text, { style: styles.pageSubtitle }, strings.bloodResultsSubtitle),
    ),
    bloodTable.length === 0
      ? h(Text, { style: styles.emptyText }, strings.noBloodResults)
      : h(View, { style: styles.table },
          h(View, { style: styles.tableHeader, fixed: true },
            ...cols.map((c, i) =>
              h(Text, { key: i, style: [styles.tableHeaderCell, { width: `${c.w}%` }] }, c.label),
            ),
          ),
          ...bloodTable.map((r, i) => {
            const isLast = i === bloodTable.length - 1;
            const rowStyle = [
              styles.tableRow,
              i % 2 === 1 ? styles.tableRowZebra : null,
              isLast ? styles.tableRowLast : null,
            ];
            const valueText = `${r.value}${r.unit ? ` ${r.unit}` : ""}`;
            return h(View, { key: i, style: rowStyle, wrap: false },
              h(Text, { style: [styles.tableCell, { width: "28%" }] }, r.marker),
              h(Text, { style: [styles.tableCell, { width: "18%" }] }, valueText),
              h(Text, { style: [styles.tableCell, { width: "22%" }] }, r.range || "—"),
              h(View, { style: [styles.statusPill, { width: "18%" }] },
                h(Text, { style: styles.statusGlyph }, bloodStatusGlyph(r.status)),
                h(Text, { style: styles.statusLabel }, bloodStatusLabel(r.status, strings)),
              ),
              h(Text, { style: [styles.tableCell, { width: "14%" }] }, r.date || "—"),
            );
          }),
        ),
    h(Footer, { styles }),
  );
};

const ImagingCard = ({ row, strings, styles }: { row: ImagingRow; strings: PatientPayload["strings"]; styles: Styles }) => {
  const titleText = [row.type, row.region].filter(Boolean).join(" · ");
  const metaText = [row.date, row.facility].filter(Boolean).join(" · ");

  return h(View, { style: styles.imagingCard, wrap: false },
    h(View, { style: styles.imagingHeaderRow },
      h(View, { style: { flex: 1 } },
        h(Text, { style: styles.imagingTitle }, titleText || "—"),
        metaText ? h(Text, { style: styles.imagingMeta }, metaText) : null,
      ),
      h(View, { style: styles.statusPill },
        h(Text, { style: styles.statusGlyph }, imagingStatusGlyph(row.status)),
        h(Text, { style: styles.statusLabel }, imagingStatusLabel(row.status, strings)),
      ),
    ),
    row.finding ? h(View, null,
      h(Text, { style: styles.imagingFindingLabel }, strings.imagingFinding),
      h(Text, { style: styles.imagingFindingText }, row.finding),
    ) : null,
  );
};

const ImagingPage = (data: PatientPayload, styles: Styles) => {
  const { patient, strings, generatedAt, imagingTable = [] } = data;

  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(View, { style: styles.pageTitleBlock },
      h(Text, { style: styles.pageTitle }, strings.imagingTitle),
      h(Text, { style: styles.pageSubtitle }, strings.imagingSubtitle),
    ),
    imagingTable.length === 0
      ? h(Text, { style: styles.emptyText }, strings.noImaging)
      : h(View, null,
          imagingTable.map((row, i) => h(ImagingCard, { key: i, row, strings, styles })),
        ),
    h(Footer, { styles }),
  );
};

const DocumentsPage = (data: PatientPayload, styles: Styles) => {
  const { strings, documentsTable = [] } = data;
  const cols = [
    { label: strings.docColName || "Document", w: 34 },
    { label: strings.docColType || "Type", w: 16 },
    { label: strings.docColDate || "Date", w: 14 },
    { label: strings.docColFacility || "Facility", w: 24 },
    { label: strings.docColCountry || "Country", w: 12 },
  ];
  return h(Page, { size: "A4", style: styles.page },
    h(Header, { title: strings.headerTitle || "Health Record", styles }),
    h(View, { style: styles.pageTitleBlock },
      h(Text, { style: styles.pageTitle }, strings.documentsTitle || "Documents Archive"),
      h(Text, { style: styles.pageSubtitle }, strings.documentsSubtitle || ""),
    ),
    documentsTable.length === 0
      ? h(Text, { style: styles.emptyText }, strings.noDocuments || "No documents recorded.")
      : h(View, { style: styles.table },
          h(View, { style: styles.tableHeader, fixed: true },
            ...cols.map((c, i) =>
              h(Text, { key: i, style: [styles.tableHeaderCell, { width: `${c.w}%` }] }, c.label),
            ),
          ),
          ...documentsTable.map((r, i) => {
            const isLast = i === documentsTable.length - 1;
            const rowStyle = [
              styles.tableRow,
              i % 2 === 1 ? styles.tableRowZebra : null,
              isLast ? styles.tableRowLast : null,
            ];
            return h(View, { key: i, style: rowStyle, wrap: false },
              h(Text, { style: [styles.tableCell, { width: "34%" }] }, r.name || "—"),
              h(Text, { style: [styles.tableCell, { width: "16%" }] }, r.type || "—"),
              h(Text, { style: [styles.tableCell, { width: "14%" }] }, r.date || "—"),
              h(Text, { style: [styles.tableCell, { width: "24%" }] }, r.facility || "—"),
              h(Text, { style: [styles.tableCell, { width: "12%" }] }, r.country || "—"),
            );
          }),
        ),
    h(Footer, { styles }),
  );
};

// ---------- HTTP handler ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // M4: GET /functions/v1/render-export-pdf?warm=1 — keep-warm probe.
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("warm") === "1") {
      return new Response(
        JSON.stringify({ ok: true, warm: true, t: Date.now() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json() as PatientPayload;

    if (!payload?.patient?.fullName) {
      return new Response(
        JSON.stringify({ error: "Missing patient data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { display, body } = fontsForLanguage(payload.language);
    await Promise.all([ensureFontFamily(display), ensureFontFamily(body)]);
    const styles = buildStyles(payload.language);

    // Section order: Cover → Lab Results → Medications → Visit History → Imaging → Documents.
    const pages: any[] = [
      PatientSummaryPage(payload, styles),
      BloodResultsPage(payload, styles),
      MedicationsPage(payload, styles),
      VisitHistoryPage(payload, styles),
      ImagingPage(payload, styles),
      DocumentsPage(payload, styles),
    ];

    const doc = React.createElement(
      Document,
      { title: `${payload.patient.fullName} — Health Brief`, author: "RinVita" },
      ...pages
    );

    const pdfBuffer = await renderToBuffer(doc);

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="health-brief-${payload.language}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("render-export-pdf error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Render failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
