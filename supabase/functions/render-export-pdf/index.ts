// Renders the new "v2" Patient Summary PDF using @react-pdf/renderer (Deno-compatible).
// Milestone 1: Page 1 only (Patient Summary). Subsequent milestones add Visit History,
// Medications, Blood Results, Imaging, and Original Source Documents appendix.

import React from "npm:react@18.3.1";
// @ts-ignore - Deno resolves npm specifiers
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font, Svg, Circle } from "npm:@react-pdf/renderer@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- Font registration (Google Fonts TTFs, Unicode-safe) ----------
// Cormorant Garamond — headings. DM Sans — body. Noto fallbacks for Arabic/CJK/Hebrew.
Font.register({
  family: "Cormorant Garamond",
  fonts: [
    { src: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEPjsS6V7w.ttf", fontWeight: 600 },
  ],
});

Font.register({
  family: "DM Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g7vN_AYFawu1nQg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g7vN_AYFawu5nQg.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g7vN_AYFawu1nQg.ttf", fontWeight: 700 },
  ],
});

// Disable hyphenation — letters were splitting in old export.
Font.registerHyphenationCallback((word: string) => [word]);

// ---------- Theme ----------
const COLORS = {
  ink: "#1C1810",       // dark charcoal — never pure black
  muted: "#6B6256",
  hairline: "#E8E2D5",
  paper: "#FFFFFF",
  gold: "#B8952A",
  goldSoft: "#F6F2E9",
  amber: "#C9853A",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "DM Sans",
    fontSize: 10,
    paddingTop: 56,    // ~1.5cm
    paddingBottom: 56,
    paddingHorizontal: 56,
    lineHeight: 1.5,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.hairline,
    paddingBottom: 10,
    marginBottom: 22,
  },
  headerBrand: {
    fontFamily: "Cormorant Garamond",
    fontSize: 18,
    color: COLORS.ink,
    letterSpacing: 0,
  },
  headerBrandAccent: { color: COLORS.gold },
  headerCentre: { fontSize: 9, color: COLORS.muted },
  headerRight: { fontSize: 9, color: COLORS.muted },
  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.hairline,
    paddingTop: 8,
  },
  // Hero
  patientName: {
    fontFamily: "Cormorant Garamond",
    fontSize: 30,
    fontWeight: 600,
    color: COLORS.ink,
    marginBottom: 4,
  },
  patientMeta: { fontSize: 10, color: COLORS.muted, marginBottom: 18 },
  ataGlance: {
    fontFamily: "Cormorant Garamond",
    fontSize: 13,
    color: COLORS.ink,
    backgroundColor: COLORS.goldSoft,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.gold,
    marginBottom: 22,
  },
  // Section blocks
  sectionHeading: {
    fontFamily: "Cormorant Garamond",
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  twoCol: { flexDirection: "row", gap: 18, marginBottom: 18 },
  col: { flex: 1 },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 10, color: COLORS.gold, fontSize: 10, lineHeight: 1.5 },
  bulletText: { flex: 1, fontSize: 10, color: COLORS.ink, lineHeight: 1.5 },
  emptyText: { fontSize: 9, color: COLORS.muted, fontStyle: "italic" },
  // Highlights
  highlightsBlock: { marginTop: 4, marginBottom: 18 },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.amber,
    backgroundColor: "#FCFAF5",
    marginBottom: 6,
  },
  highlightDot: { marginTop: 5, marginRight: 8 },
  highlightText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.45,
  },
  // Disclaimer
  disclaimer: {
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.5,
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.hairline,
  },
});

// ---------- Types (subset of VaultData consumed for M1) ----------
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
  highlights: string[]; // 3-5 plain one-line statements
  language: string;     // ISO code of the export language
  generatedAt: string;  // ISO timestamp
  isRtl?: boolean;
  strings: {            // localised UI labels (precomputed strings only — no functions cross JSON)
    patientSummary: string;
    atAGlance: string;             // already interpolated client-side
    currentMedications: string;
    knownAllergies: string;
    chronicConditions: string;
    clinicalHighlights: string;
    none: string;
    footerNote: string;
    disclaimer: string;
  };
}

// ---------- Components (React.createElement to avoid JSX in Deno bundler) ----------
const h = React.createElement;

const AmberDot = () =>
  h(Svg, { width: 6, height: 6, viewBox: "0 0 6 6" },
    h(Circle, { cx: 3, cy: 3, r: 3, fill: COLORS.amber }),
  );

const Header = ({ patientName }: { patientName: string }) =>
  h(View, { style: styles.header, fixed: true },
    h(Text, { style: styles.headerBrand },
      "Rin",
      h(Text, { style: styles.headerBrandAccent }, "Vita"),
    ),
    h(Text, { style: styles.headerCentre }, patientName),
    h(Text, {
      style: styles.headerRight,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `${pageNumber} / ${totalPages}`,
    }),
  );

const Footer = ({ generatedAt }: { generatedAt: string }) =>
  h(View, { style: styles.footer, fixed: true },
    h(Text, null, `Generated by RinVita · ${generatedAt}`),
    h(Text, null, "ICO ZC123014 · Not a medical device"),
  );

const Bullets = ({ items, empty }: { items: string[]; empty: string }) => {
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

const PatientSummaryPage = (data: PatientPayload) => {
  const { patient, counts: _counts, currentMedications, allergies, highlights, strings, generatedAt } = data;

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
    h(Header, { patientName: patient.fullName }),
    h(Text, { style: styles.patientName }, patient.fullName),
    meta ? h(Text, { style: styles.patientMeta }, meta) : null,
    h(Text, { style: styles.ataGlance }, strings.atAGlance),
    h(View, { style: styles.twoCol },
      h(View, { style: styles.col },
        h(Text, { style: styles.sectionHeading }, strings.currentMedications),
        h(Bullets, { items: medItems, empty: strings.none }),
      ),
      h(View, { style: styles.col },
        h(Text, { style: styles.sectionHeading }, strings.knownAllergies),
        h(Bullets, { items: allergyItems, empty: strings.none }),
      ),
    ),
    patient.chronicConditions
      ? h(View, { style: { marginBottom: 18 } },
          h(Text, { style: styles.sectionHeading }, strings.chronicConditions),
          h(Text, { style: styles.bulletText }, patient.chronicConditions),
        )
      : null,
    h(Text, { style: styles.sectionHeading }, strings.clinicalHighlights),
    h(View, { style: styles.highlightsBlock },
      highlights.length === 0
        ? h(Text, { style: styles.emptyText }, strings.none)
        : highlights.slice(0, 5).map((highlight, i) =>
            h(View, { key: i, style: styles.highlightRow },
              h(View, { style: styles.highlightDot }, h(AmberDot, null)),
              h(Text, { style: styles.highlightText }, highlight),
            ),
          ),
    ),
    h(Text, { style: styles.disclaimer }, strings.disclaimer),
    h(Footer, { generatedAt }),
  );
};

// ---------- HTTP handler ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as PatientPayload;

    if (!payload?.patient?.fullName) {
      return new Response(
        JSON.stringify({ error: "Missing patient data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const doc = React.createElement(
      Document,
      { title: `${payload.patient.fullName} — Health Brief`, author: "RinVita" },
      PatientSummaryPage(payload)
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
