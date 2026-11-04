import { ShieldCheck } from "lucide-react";
import { consentStatement, signatureMatches, type ConsentDetails } from "@/lib/recordConsent";

interface Props {
  details: ConsentDetails;
  agreed: boolean;
  onAgreed: (v: boolean) => void;
  signature: string;
  onSignature: (v: string) => void;
}

/** Patient's consent for the provider to release records to RinVita, signed by typing their name. */
export function consentReady(details: ConsentDetails, agreed: boolean, signature: string) {
  return agreed && !!details.patientEmail && signatureMatches(signature, details.patientName);
}

const RecordConsentFields = ({ details, agreed, onAgreed, signature, onSignature }: Props) => {
  const typed = signature.trim().length > 0;
  const matches = signatureMatches(signature, details.patientName);
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-foreground">Consent to release your records</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Providers need your written consent before they release records. This is sent with your request, together with your email{" "}
        <span className="font-medium text-foreground">{details.patientEmail || "—"}</span>.
      </p>
      <p className="text-xs text-foreground leading-relaxed bg-background border border-border rounded-md p-3">
        {consentStatement({ ...details, providerName: details.providerName || "the provider" })}
      </p>
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={(e) => onAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary" />
        <span className="text-xs text-foreground">I give this consent.</span>
      </label>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Sign by typing your full name: {details.patientName}</label>
        <input
          type="text"
          value={signature}
          onChange={(e) => onSignature(e.target.value)}
          placeholder={details.patientName}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-base italic font-heading text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {typed && !matches && <p className="text-[11px] text-destructive mt-1">Type your name exactly as shown: {details.patientName}</p>}
      </div>
    </div>
  );
};

export default RecordConsentFields;
