import SEO from "@/components/SEO";

const CheckEmailPage = () => {
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
        </div>
        <p className="text-xs text-muted-foreground/80 pt-2">Can't find it? Check your spam folder.</p>
      </div>
    </div>
  );
};

export default CheckEmailPage;
