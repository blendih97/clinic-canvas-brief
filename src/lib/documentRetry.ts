import { supabase } from "@/integrations/supabase/client";

export const FRIENDLY_FAILURE_MESSAGE = "We couldn't process this file yet — we've been notified and will retry.";

/** Retries analysis of a failed document from its stored original. Returns an error message, or null on success. */
export async function retryDocument(documentId: string): Promise<{ ok: boolean; code?: string; message?: string }> {
  const { error } = await supabase.functions.invoke("retry-document", { body: { documentId } });
  if (!error) return { ok: true };
  let code: string | undefined;
  let message = "Retry failed";
  try {
    const body = await (error as any)?.context?.json?.();
    code = body?.code;
    message = body?.error || message;
  } catch { /* generic */ }
  return { ok: false, code, message };
}
