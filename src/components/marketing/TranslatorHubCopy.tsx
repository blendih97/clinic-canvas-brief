import { Link } from "react-router-dom";
import { marketingColors } from "@/components/marketing/shared";

const HUB_ITEMS = [
  "All records in one place — any country, any language",
  "Results tracked over time, with flags",
  "Medications, allergies and family profiles",
  "Time-limited sharing with any clinician",
];

type ResponsiveCopyProps = {
  isMobile: boolean;
};

export function TranslatorHubPositioning() {
  return (
    <p style={{ fontSize: 13.5, color: marketingColors.ink, maxWidth: 720, margin: "18px auto 0", lineHeight: 1.7, fontWeight: 500 }}>
      Part of RinVita — the private hub for your whole medical history: every record in one place, organised, tracked over time and ready to share with any doctor.
    </p>
  );
}

export function TranslatorHubCta({ isMobile }: ResponsiveCopyProps) {
  return (
    <div style={{ marginTop: 28, padding: isMobile ? 22 : 28, background: marketingColors.goldSoft, border: `1px solid ${marketingColors.goldBorder}`, borderRadius: 2, textAlign: "center" }}>
      <h2 style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 28, fontWeight: 400, marginBottom: 10 }}>
        Don't let this record get lost again
      </h2>
      <p style={{ maxWidth: 660, margin: "0 auto 18px", fontSize: 14, color: marketingColors.mutedText, lineHeight: 1.75 }}>
        Save it to your RinVita hub alongside the rest of your records — results tracked over time, medications and allergies in one list, and a secure link for any doctor, anywhere.
      </p>
      <Link
        to="/auth?mode=signup&from=translate"
        style={{ display: "inline-block", padding: "13px 28px", background: marketingColors.gold, color: "hsl(var(--primary-foreground))", textDecoration: "none", borderRadius: 2, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        Start your medical hub — free
      </Link>
      <p style={{ fontSize: 12.5, color: marketingColors.softText, marginTop: 12 }}>
        Free plan · 3 documents · no card required.
      </p>
    </div>
  );
}

export function TranslatorHubStrip({ isMobile }: ResponsiveCopyProps) {
  return (
    <aside aria-labelledby="translator-hub-heading" style={{ marginTop: isMobile ? 38 : 48 }}>
      <h2 id="translator-hub-heading" style={{ fontFamily: "Cormorant Garamond", fontSize: isMobile ? 24 : 28, fontWeight: 400, marginBottom: 16, textAlign: "center" }}>
        What your RinVita hub does
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", borderTop: `1px solid ${marketingColors.goldBorder}`, borderLeft: `1px solid ${marketingColors.goldBorder}` }}>
        {HUB_ITEMS.map((item) => (
          <div key={item} style={{ padding: "16px 18px", background: marketingColors.surface, borderRight: `1px solid ${marketingColors.goldBorder}`, borderBottom: `1px solid ${marketingColors.goldBorder}`, color: marketingColors.mutedText, fontSize: 13.5, lineHeight: 1.6 }}>
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}