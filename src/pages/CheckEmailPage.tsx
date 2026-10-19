import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { capturePartnerParams, partnerAuthParams } from "@/lib/partners";

export const RESEND_COOLDOWN_SECONDS = 60;

const CheckEmailPage = () => {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => { capturePartnerParams(params.toString()); }, [params]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const signInHref = `/auth?${partnerAuthParams(params, { mode: "signin" })}`;

  const resend = async () => {
    const target = email.trim().toLowerCase();
    if (!target || cooldown > 0) return;
    setSending(true);
    // Result is intentionally ignored: the same message shows whether or not an account exists.
    await supabase.auth.resend({ type: "signup", email: target, options: { emailRedirectTo: window.location.origin } }).catch(() => null);
    setSending(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("If that address needs confirming, we've sent a new link.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEO title="Check your email — RinVita" description="Confirm your RinVita account from the link in your inbox." path="/check-email" noindex />
      <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div>
          <h1 className="font-heading text-4xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
          <p className="text-xs tracking-[0.15em] text-muted-foreground mt-1">Your medical records, organised</p>
        </div>
        <div className="space-y-3 pt-4">
          <h2 className="font-heading text-2xl text-foreground font-light">Check your email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We've sent a confirmation link to your email address. Click it to activate your account.
          </p>
          <p className="text-xs text-muted-foreground/80">Can't find it? Check your spam folder.</p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5 space-y-3 text-left">
          <label className="text-xs font-medium text-foreground">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={() => void resend()} disabled={sending || cooldown > 0 || !email.trim()}
            className="w-full rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-60">
            {sending ? "Sending…" : cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation email"}
          </button>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm text-foreground">Already have a RinVita account? Sign in instead.</p>
          <Link to={signInHref} className="block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailPage;
