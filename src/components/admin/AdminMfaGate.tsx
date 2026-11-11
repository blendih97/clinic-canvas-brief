// The admin area can show any patient's account data, so it requires two-step sign-in
// (an authenticator app code) every session. Admins without an authenticator set one up here.
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import AdminMfaPanel from "@/components/admin/AdminMfaPanel";
import { getAdminAssuranceLevel } from "@/lib/admin-mfa";

export default function AdminMfaGate({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<"checking" | "verified" | "needed" | "error">("checking");
  const check = useCallback(async () => {
    try {
      const aal = await getAdminAssuranceLevel();
      setLevel(aal.currentLevel === "aal2" ? "verified" : "needed");
    } catch { setLevel("error"); }
  }, []);
  useEffect(() => { void check(); }, [check]);

  if (level === "verified") return <>{children}</>;
  if (level === "checking") return null;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="admin-mfa-gate">
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" aria-hidden />
          <h1 className="font-heading text-2xl text-foreground">Two-step sign-in required</h1>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          {level === "error" ? "We couldn't check your sign-in. Try again below." : "The admin area holds patient account data, so it needs a code from your authenticator app each time you sign in. If you haven't set one up yet, do it now."}
        </p>
        <AdminMfaPanel onVerified={() => void check()} />
      </div>
    </div>
  );
}
