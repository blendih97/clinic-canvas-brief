import { supabase } from "@/integrations/supabase/client";

type MfaFactor = {
  id: string;
  factor_type?: string;
  friendly_name?: string | null;
  status?: string;
};

const mfa = supabase.auth.mfa as any;

const normalizeFactors = (data: any): MfaFactor[] => {
  if (!data) return [];
  if (Array.isArray(data?.all)) return data.all;
  if (Array.isArray(data)) return data;
  const verified = Array.isArray(data?.totp) ? data.totp : [];
  const unverified = Array.isArray(data?.unverified) ? data.unverified : [];
  return [...verified, ...unverified];
};

export async function getAdminAssuranceLevel() {
  const { data, error } = await mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data as { currentLevel?: string | null; nextLevel?: string | null };
}

export async function listAdminMfaFactors() {
  const { data, error } = await mfa.listFactors();
  if (error) throw error;
  return normalizeFactors(data);
}

export async function enrollAdminTotp() {
  const { data, error } = await mfa.enroll({
    factorType: "totp",
    friendlyName: "RinVita Admin",
  });

  if (error) throw error;
  return data as {
    id: string;
    totp?: {
      qr_code?: string;
      secret?: string;
      uri?: string;
    };
  };
}

export async function verifyAdminTotp(factorId: string, code: string) {
  const { data, error } = await mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
  return data;
}

export async function unenrollAdminFactor(factorId: string) {
  const { error } = await mfa.unenroll({ factorId });
  if (error) throw error;
}

export function createRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const left = Math.random().toString(36).slice(2, 6).toUpperCase();
    const right = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${left}-${right}`;
  });
}

export async function storeAdminRecoveryCodes(codes: string[]) {
  const { error } = await supabase.rpc("store_admin_recovery_codes", { _codes: codes });
  if (error) throw error;
}

export async function consumeAdminRecoveryCode(code: string) {
  const { data, error } = await supabase.rpc("consume_admin_recovery_code", { _code: code });
  if (error) throw error;
  return Boolean(data);
}