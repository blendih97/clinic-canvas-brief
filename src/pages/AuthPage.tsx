import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, CreditCard, XCircle } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";
import SEO from "@/components/SEO";

const AuthPage = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const { signIn, signUp } = useAuth();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "signup" || requestedMode === "signin" || requestedMode === "forgot") {
      setMode(requestedMode);
    }
  }, [searchParams]);

  const resetSignupFlow = () => {
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(t("auth.invalidCredentials"));
    } else {
      navigate("/app");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email || !password) {
      toast.error(t("auth.completeAccountFields"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    const consentTime = new Date().toISOString();
    const { error, session } = await signUp(email, password, {
      full_name: fullName.trim(),
      terms_consent_at: consentTime,
      preferred_ui_language: locale,
      preferred_translation_language: locale,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Meta Pixel: standard Lead + CompleteRegistration
    try {
      const m = await import("@/lib/metaPixel");
      m.trackLead();
      m.trackCompleteRegistration({ content_name: "signup_completed" });
    } catch {}

    // Fire-and-forget admin notification
    try {
      void supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-signup-admin",
          recipientEmail: "hello@rinvita.co.uk",
          idempotencyKey: `new-signup-${email}-${consentTime}`,
          templateData: {
            fullName: fullName.trim(),
            email,
            country: "—",
            plan: "free",
            signedUpAt: consentTime,
          },
        },
      });
    } catch {}

    resetSignupFlow();

    if (session) {
      navigate("/app");
    } else {
      navigate("/check-email");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.resetEmailSent"));
      setMode("signin");
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app`,
    });
    if (result.error) {
      toast.error(t("auth.googleFailed"));
      return;
    }
    if (result.redirected) return;
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Sign in or create your account — RinVita" description="Access your RinVita health vault. Sign in or create a free Early Access account." path="/auth" noindex />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LanguageSwitcher />
          <div>
            <h1 className="font-heading text-3xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
            <p className="text-xs tracking-[0.15em] text-muted-foreground mt-1">{t("auth.brandTagline")}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {mode === "forgot" ? (
            <>
              <h2 className="font-heading text-xl text-foreground mb-1">{t("auth.resetTitle")}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("auth.resetDescription")}</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">{t("auth.email")}</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? t("auth.sendingResetLink") : t("auth.sendResetLink")}
                </button>
              </form>
              <button onClick={() => setMode("signin")} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">
                {t("auth.backToSignIn")}
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
                <button onClick={() => { setMode("signin"); resetSignupFlow(); }}
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "signin" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}>
                  {t("auth.modes.signIn")}
                </button>
                <button onClick={() => { setMode("signup"); }}
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "signup" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}>
                  {t("auth.modes.signUp")}
                </button>
              </div>

              {mode === "signup" && (
                <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-center">
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    <span className="font-medium text-foreground">Try it free</span> · 3 documents, fully translated · No card required
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-primary" /> Bank-level encryption</span>
                    <span className="inline-flex items-center gap-1"><XCircle className="w-3 h-3 text-primary" /> Cancel anytime</span>
                    <span className="inline-flex items-center gap-1"><CreditCard className="w-3 h-3 text-primary" /> No card</span>
                  </div>
                </div>
              )}

              <button onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("auth.continueWithGoogle")}
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span></div>
              </div>

              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">{t("auth.email")}</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">{t("auth.password")}</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {loading ? t("auth.signingIn") : t("auth.modes.signIn")}
                  </button>
                  <button type="button" onClick={() => setMode("forgot")} className="w-full text-xs text-muted-foreground hover:text-foreground">
                    {t("auth.modes.forgot")}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <p className="text-[11px] text-muted-foreground">Takes about 30 seconds.</p>
                  <div>
                    <label className="text-xs font-medium text-foreground">Full name</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name" autoCapitalize="words"
                      className="w-full mt-1 px-3 py-2.5 bg-background border border-border rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">{t("auth.email")}</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                      className="w-full mt-1 px-3 py-2.5 bg-background border border-border rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">{t("auth.password")}</label>
                    <div className="relative mt-1">
                      <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                        className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className={`text-[11px] mt-1 ${password.length >= 6 ? "text-primary" : "text-muted-foreground"}`}>
                      {password.length >= 6 ? "✓ Strong enough" : "At least 6 characters"}
                    </p>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    No credit card required · Cancel anytime
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 text-center leading-relaxed">
                    By creating an account you agree to our{" "}
                    <Link to="/terms" target="_blank" rel="noopener" className="underline hover:text-foreground">Terms</Link>
                    {" "}and{" "}
                    <Link to="/privacy" target="_blank" rel="noopener" className="underline hover:text-foreground">Privacy Policy</Link>.
                  </p>
                </form>
              )}
            </>
          )}
        </div>

        {mode === "signup" && (
          <figure className="mt-5 rounded-lg border border-border/60 bg-card/60 px-4 py-3 text-center">
            <blockquote className="text-xs italic text-muted-foreground leading-relaxed">
              "Since moving from Dubai to London, keeping track of my medical records across two countries was a nightmare. RinVita changed that completely."
            </blockquote>
            <figcaption className="mt-1.5 text-[10px] tracking-[0.12em] uppercase text-muted-foreground/80">
              Sarah K. · London (previously Dubai)
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
