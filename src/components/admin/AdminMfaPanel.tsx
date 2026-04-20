import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, QrCode, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  consumeAdminRecoveryCode,
  createRecoveryCodes,
  enrollAdminTotp,
  getAdminAssuranceLevel,
  listAdminMfaFactors,
  storeAdminRecoveryCodes,
  unenrollAdminFactor,
  verifyAdminTotp,
} from "@/lib/admin-mfa";

type Props = {
  onVerified?: () => void;
};

const AdminMfaPanel = ({ onVerified }: Props) => {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Array<{ id: string; factor_type?: string; friendly_name?: string | null; status?: string }>>([]);
  const [assurance, setAssurance] = useState<{ currentLevel?: string | null; nextLevel?: string | null }>({});
  const [enrollment, setEnrollment] = useState<{ id: string; qr_code?: string; secret?: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const verifiedTotp = useMemo(
    () => factors.find((factor) => factor.factor_type === "totp" && factor.status === "verified"),
    [factors],
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const [factorList, assuranceLevel] = await Promise.all([listAdminMfaFactors(), getAdminAssuranceLevel()]);
      setFactors(factorList);
      setAssurance(assuranceLevel);
    } catch (error) {
      toast.error("Could not load admin authentication settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleEnroll = async () => {
    setBusy("enroll");
    try {
      const data = await enrollAdminTotp();
      setEnrollment({ id: data.id, qr_code: data.totp?.qr_code, secret: data.totp?.secret });
      setVerifyCode("");
    } catch (error: any) {
      toast.error(error?.message || "Could not start authenticator setup");
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async (factorId: string) => {
    if (!verifyCode.trim()) {
      toast.error("Enter the 6-digit code from your authenticator app");
      return;
    }

    setBusy("verify");
    try {
      await verifyAdminTotp(factorId, verifyCode.trim());
      toast.success("Admin session verified");
      setEnrollment(null);
      setVerifyCode("");
      await refresh();
      onVerified?.();
    } catch (error: any) {
      toast.error(error?.message || "Verification failed");
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateRecoveryCodes = async () => {
    const nextCodes = createRecoveryCodes();
    setBusy("recovery");
    try {
      await storeAdminRecoveryCodes(nextCodes);
      setRecoveryCodes(nextCodes);
      toast.success("New recovery codes generated");
    } catch (error: any) {
      toast.error(error?.message || "Could not save recovery codes");
    } finally {
      setBusy(null);
    }
  };

  const handleRecoveryCheck = async () => {
    if (!recoveryCode.trim()) {
      toast.error("Enter a recovery code");
      return;
    }

    setBusy("consume-recovery");
    try {
      const valid = await consumeAdminRecoveryCode(recoveryCode.trim().toUpperCase());
      if (!valid) {
        toast.error("Recovery code invalid or already used");
        return;
      }
      setRecoveryCode("");
      toast.success("Recovery code accepted");
    } catch (error: any) {
      toast.error(error?.message || "Could not validate recovery code");
    } finally {
      setBusy(null);
    }
  };

  const handleDisable = async () => {
    if (!verifiedTotp) return;
    setBusy("disable");
    try {
      await unenrollAdminFactor(verifiedTotp.id);
      setRecoveryCodes([]);
      toast.success("Authenticator removed");
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove authenticator");
    } finally {
      setBusy(null);
    }
  };

  const copyCodes = async () => {
    if (recoveryCodes.length === 0) return;
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast.success("Recovery codes copied");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-medium">Admin two-factor authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${assurance.currentLevel === "aal2" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
            {assurance.currentLevel === "aal2" ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            {loading ? "Checking session…" : assurance.currentLevel === "aal2" ? "Current session is verified" : "Current session still needs verification"}
          </span>
          {verifiedTotp && assurance.currentLevel !== "aal2" && (
            <span>Verify this session before changing member access or admin settings.</span>
          )}
        </div>

        {!verifiedTotp && !enrollment && (
          <button
            onClick={() => void handleEnroll()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            Set up authenticator app
          </button>
        )}

        {enrollment && (
          <div className="space-y-4 rounded-lg border border-border bg-secondary/40 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Scan the QR code in your authenticator app</p>
              <p className="mt-1 text-sm text-muted-foreground">If scanning fails, use the manual secret below.</p>
            </div>
            {enrollment.qr_code && (
              <div
                className="w-fit rounded-md bg-card p-3"
                dangerouslySetInnerHTML={{ __html: enrollment.qr_code }}
              />
            )}
            {enrollment.secret && (
              <div className="rounded-md bg-card px-3 py-2 text-sm text-foreground">
                <span className="text-muted-foreground">Secret:</span> {enrollment.secret}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
              />
              <button
                onClick={() => void handleVerify(enrollment.id)}
                disabled={busy !== null}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Verify setup
              </button>
            </div>
          </div>
        )}

        {verifiedTotp && (
          <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Authenticator active</p>
                <p className="mt-1 text-sm text-muted-foreground">{verifiedTotp.friendly_name || "RinVita Admin"}</p>
              </div>
              <button
                onClick={() => void handleDisable()}
                disabled={busy !== null}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Remove factor
              </button>
            </div>

            {assurance.currentLevel !== "aal2" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Enter the current authenticator code to promote this session for sensitive admin actions.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={verifyCode}
                    onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
                  />
                  <button
                    onClick={() => void handleVerify(verifiedTotp.id)}
                    disabled={busy !== null}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Verify session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Recovery codes</p>
              <p className="mt-1 text-sm text-muted-foreground">Generate one-time backup codes and store them somewhere offline.</p>
            </div>
            <div className="flex gap-2">
              {recoveryCodes.length > 0 && (
                <button onClick={() => void copyCodes()} className="rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                  <Copy className="mr-2 inline h-4 w-4" />Copy
                </button>
              )}
              <button
                onClick={() => void handleGenerateRecoveryCodes()}
                disabled={busy !== null}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Generate codes
              </button>
            </div>
          </div>

          {recoveryCodes.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map((code) => (
                <div key={code} className="rounded-md bg-secondary/60 px-3 py-2 font-mono text-sm text-foreground">
                  {code}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-0"
            />
            <button
              onClick={() => void handleRecoveryCheck()}
              disabled={busy !== null}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <KeyRound className="mr-2 inline h-4 w-4" />Validate code
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminMfaPanel;