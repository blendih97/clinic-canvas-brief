import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import CountryCombobox, { type CountryOption } from "@/components/CountryCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";

const totalSignupSteps = 5;

const stepLabels = ["Account", "Personal", "Countries", "Health", "Consent"] as const;

const AuthPage = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const { signIn, signUp } = useAuth();
  const { t, locale, isRTL } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nationalityCode, setNationalityCode] = useState("");
  const [residenceCountryCode, setResidenceCountryCode] = useState("");
  const [knownAllergies, setKnownAllergies] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [healthConsent, setHealthConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "signup" || requestedMode === "signin" || requestedMode === "forgot") {
      setMode(requestedMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode !== "signup") return;

    let isMounted = true;

    const loadCountries = async () => {
      setCountriesLoading(true);

      try {
        const { data, error } = await supabase
          .from("countries")
          .select("code, name_en, name_ar, flag_emoji")
          .order("name_en", { ascending: true });

        if (error) {
          toast.error(t("auth.loadCountriesError"));
          return;
        }

        if (isMounted) {
          setCountries((data ?? []) as CountryOption[]);
        }
      } catch {
        toast.error(t("auth.loadCountriesError"));
      } finally {
        if (isMounted) {
          setCountriesLoading(false);
        }
      }
    };

    void loadCountries();

    return () => {
      isMounted = false;
    };
  }, [mode]);

  const fullName = useMemo(() => `${firstName} ${lastName}`.trim(), [firstName, lastName]);

  const resetSignupFlow = () => {
    setSignupStep(1);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setDob("");
    setBiologicalSex("");
    setNationalityCode("");
    setResidenceCountryCode("");
    setKnownAllergies("");
    setCurrentMedications("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setHealthConsent(false);
    setTermsConsent(false);
    setMarketingConsent(false);
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) return t("auth.completeAccountFields");
      if (password !== confirmPassword) return t("auth.passwordsDoNotMatch");
      if (password.length < 6) return t("auth.passwordTooShort");
    }

    if (step === 2) {
      if (!firstName.trim() || !lastName.trim() || !dob || !biologicalSex) return t("auth.completePersonalDetails");
    }

    if (step === 3) {
      if (!nationalityCode || !residenceCountryCode) return t("auth.completeCountryDetails");
    }

    if (step === 5) {
      if (!termsConsent || !healthConsent) return t("auth.acceptConsents");
    }

    return null;
  };

  const goToNextStep = () => {
    const error = validateStep(signupStep);
    if (error) {
      toast.error(error);
      return;
    }
    setSignupStep((current) => Math.min(current + 1, totalSignupSteps));
  };

  const goToPreviousStep = () => setSignupStep((current) => Math.max(current - 1, 1));

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
    const validationError = validateStep(5);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    const consentTime = new Date().toISOString();
    const { error, session } = await signUp(email, password, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName,
      date_of_birth: dob,
      biological_sex: biologicalSex,
      nationality_code: nationalityCode,
      residence_country_code: residenceCountryCode,
      known_allergies: knownAllergies,
      current_medications: currentMedications,
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_phone: emergencyContactPhone.trim(),
      health_data_consent: String(healthConsent),
      health_data_consent_timestamp: consentTime,
      terms_consent_at: consentTime,
      marketing_consent: String(marketingConsent),
       preferred_ui_language: locale,
       preferred_translation_language: locale,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    resetSignupFlow();

    if (session) {
      navigate("/app");
    } else {
      toast.success(t("auth.confirmationSent"));
      setMode("signin");
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
              <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
                <button onClick={() => { setMode("signin"); resetSignupFlow(); }}
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "signin" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}>
                  {t("auth.modes.signIn")}
                </button>
                <button onClick={() => { setMode("signup"); setSignupStep(1); }}
                  className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "signup" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}>
                  {t("auth.modes.signUp")}
                </button>
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
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                       <span>{t("auth.step", { step: signupStep, total: totalSignupSteps })}</span>
                       <span>{t(`auth.${stepLabels[signupStep - 1].toLowerCase()}`)}</span>
                    </div>
                    <div className="flex gap-1">
                      {stepLabels.map((label, index) => (
                        <div key={label} className={`h-1 flex-1 rounded-full ${index + 1 <= signupStep ? "bg-primary" : "bg-border"}`} />
                      ))}
                    </div>
                  </div>

                  {signupStep === 1 && (
                    <div className="space-y-4">
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
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.confirmPassword")}</label>
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                  )}

                  {signupStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                           <label className="text-xs font-medium text-foreground">{t("auth.firstName")}</label>
                          <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                           <label className="text-xs font-medium text-foreground">{t("auth.lastName")}</label>
                          <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.dateOfBirth")}</label>
                        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.biologicalSex")}</label>
                        <select value={biologicalSex} onChange={(e) => setBiologicalSex(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                           <option value="">{t("auth.selectPlaceholder")}</option>
                           <option value="male">{t("auth.male")}</option>
                           <option value="female">{t("auth.female")}</option>
                           <option value="prefer_not_to_say">{t("auth.preferNotToSay")}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {signupStep === 3 && (
                    <div className="space-y-4">
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.nationality")}</label>
                        <div className="mt-1">
                           <CountryCombobox countries={countries} disabled={countriesLoading} value={nationalityCode} onChange={setNationalityCode} placeholder={countriesLoading ? t("auth.loadingCountries") : t("auth.selectNationality")} />
                        </div>
                      </div>
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.countryOfResidence")}</label>
                        <div className="mt-1">
                           <CountryCombobox countries={countries} disabled={countriesLoading} value={residenceCountryCode} onChange={setResidenceCountryCode} placeholder={countriesLoading ? t("auth.loadingCountries") : t("auth.selectResidence")} />
                        </div>
                      </div>
                    </div>
                  )}

                  {signupStep === 4 && (
                    <div className="space-y-4">
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.knownAllergies")}</label>
                         <textarea value={knownAllergies} onChange={(e) => setKnownAllergies(e.target.value)} placeholder={t("auth.optional")}
                          className="w-full mt-1 min-h-24 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                      </div>
                      <div>
                         <label className="text-xs font-medium text-foreground">{t("auth.currentMedications")}</label>
                         <textarea value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} placeholder={t("auth.optional")}
                          className="w-full mt-1 min-h-24 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                           <label className="text-xs font-medium text-foreground">{t("auth.emergencyContactName")}</label>
                          <input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div>
                           <label className="text-xs font-medium text-foreground">{t("auth.emergencyContactPhone")}</label>
                          <input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                    </div>
                  )}

                  {signupStep === 5 && (
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={termsConsent} onCheckedChange={(checked) => setTermsConsent(checked === true)} className="mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                           {t("auth.agreeTerms")}
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={healthConsent} onCheckedChange={(checked) => setHealthConsent(checked === true)} className="mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                           {t("auth.healthConsent")}
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox checked={marketingConsent} onCheckedChange={(checked) => setMarketingConsent(checked === true)} className="mt-0.5" />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                           {t("auth.marketingConsent")}
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div>
                      {signupStep > 1 ? (
                        <button type="button" onClick={goToPreviousStep} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                           <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} /> {t("auth.deleteBack")}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      {signupStep === 4 ? (
                        <button type="button" onClick={() => setSignupStep(5)} className="text-xs text-muted-foreground hover:text-foreground">
                           {t("auth.skipForNow")}
                        </button>
                      ) : null}

                      {signupStep < totalSignupSteps ? (
                        <button type="button" onClick={goToNextStep}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                           {t("common.continue")} <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <button type="submit" disabled={loading}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                           {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                 <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span></div>
              </div>

              <button onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                 {t("auth.continueWithGoogle")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
