import { Mail, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  SHARE_MESSAGE,
  SITE_URL,
  buildEmailLink,
  buildShareText,
  buildWhatsAppLink,
} from "@/lib/shareLinks";

interface ShareRinVitaProps {
  /** Where the buttons appear — recorded as a privacy-safe analytics property. */
  placement: string;
  /** Public URL to share. Defaults to the RinVita homepage. */
  url?: string;
  heading?: string;
  compact?: boolean;
}

export default function ShareRinVita({
  placement,
  url = SITE_URL,
  heading = "Know someone whose care crosses borders?",
  compact = false,
}: ShareRinVitaProps) {
  const [copied, setCopied] = useState(false);

  const onShare = (channel: "whatsapp" | "email" | "copy") => {
    trackEvent("share_cta_clicked", { channel, placement });
  };

  const copyLink = async () => {
    onShare("copy");
    try {
      await navigator.clipboard.writeText(buildShareText({ url }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard unavailable — the WhatsApp and email options still work
    }
  };

  const btn =
    "inline-flex items-center justify-center gap-2 rounded-sm border border-primary/25 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

  return (
    <section
      aria-labelledby={`share-${placement}`}
      className={`rounded-sm border border-primary/20 bg-card ${compact ? "p-5" : "p-6 sm:p-8"}`}
    >
      <h2 id={`share-${placement}`} className="font-heading text-xl font-light text-foreground sm:text-2xl">
        {heading}
      </h2>
      <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-muted-foreground">
        Send them RinVita. Nothing from your own records is included — only this message and a link.
      </p>
      <p className="mt-3 text-sm italic text-muted-foreground">“{SHARE_MESSAGE}”</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          className={btn}
          href={buildWhatsAppLink({ url })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onShare("whatsapp")}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Share on WhatsApp
        </a>
        <a className={btn} href={buildEmailLink({ url })} onClick={() => onShare("email")}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Share by email
        </a>
        <button type="button" className={btn} onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
