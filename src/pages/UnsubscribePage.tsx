import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"validating" | "valid" | "invalid" | "already" | "submitting" | "done" | "error">("validating");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
      headers: { apikey: supabaseAnonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.valid === true) setState("valid");
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    if (error) setState("error");
    else if (data?.success) setState("done");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-xl shadow-sm w-full max-w-md p-8 text-center">
        <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text mb-1">RinVita</h1>
        <p className="text-[10px] tracking-[0.15em] text-muted-foreground mb-6">EMAIL PREFERENCES</p>

        {state === "validating" && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking your unsubscribe link…</p>
          </div>
        )}

        {state === "valid" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl text-foreground">Confirm Unsubscribe</h2>
            <p className="text-sm text-muted-foreground">
              You'll stop receiving non-essential emails from RinVita. Critical account and security emails will still be sent.
            </p>
            <button onClick={confirm} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Confirm Unsubscribe
            </button>
          </div>
        )}

        {state === "submitting" && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Updating your preferences…</p>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <h2 className="font-heading text-xl text-foreground">You're unsubscribed</h2>
            <p className="text-sm text-muted-foreground">You won't receive further marketing or notification emails from RinVita.</p>
          </div>
        )}

        {state === "already" && (
          <div className="space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <h2 className="font-heading text-xl text-foreground">Already unsubscribed</h2>
            <p className="text-sm text-muted-foreground">This email address has already been unsubscribed.</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="space-y-3 py-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="font-heading text-xl text-foreground">Invalid link</h2>
            <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-3 py-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
            <h2 className="font-heading text-xl text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsubscribePage;
