import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const inputClass =
  "w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let found = false;
    const markReady = () => {
      found = true;
      setReady(true);
      setExpired(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) markReady();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });
    const timer = window.setTimeout(() => {
      if (!found) setExpired(true);
    }, 4000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    toast.success("Password updated");
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Reset your password — RinVita" description="Choose a new password for your RinVita account." path="/reset-password" noindex />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {ready ? (
            <>
              <h2 className="font-heading text-xl text-foreground mb-1">Choose a new password</h2>
              <p className="text-sm text-muted-foreground mb-6">At least 6 characters.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground">New password</label>
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Confirm password</label>
                  <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          ) : expired ? (
            <div className="text-center">
              <p className="text-sm text-foreground mb-4">This reset link has expired or was already used.</p>
              <Link to="/auth?mode=forgot"
                className="inline-block w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Request a new link
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Checking your reset link…</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
