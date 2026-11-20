// Close a patient's account and delete their records from live systems, safely retryable.
// STAGING CANDIDATE: replaces delete-account once approved (see README.md). Not deployed.
//
// POST { action: "request", confirmation: "DELETE", source?: "settings" | "end_of_pilot" }  (patient's own session)
//   Revokes share links straight away, signs the patient out everywhere, blocks sign-in, then deletes.
// POST { action: "process" }  (Authorization: Bearer <service role key>; run on a schedule)
//   Picks up any request that is pending or failed and due for a retry.
//
// Each step is idempotent and recorded, so a retry continues where the last attempt stopped.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const STEPS = [
  "revoke_shares",
  "cancel_billing",
  "storage_medical",
  "storage_avatars",
  "partner_cleanup",
  "db_rows",
  "email_logs",
  "auth_user",
] as const;
type Step = (typeof STEPS)[number];
const MAX_ATTEMPTS = 8;
const STALE_LOCK_MS = 15 * 60_000;
const backoffMinutes = (attempt: number) => Math.min(5 * 2 ** (attempt - 1), 12 * 60); // 5m, 10m, 20m ... 12h

interface DeletionRequest {
  id: string; user_id: string | null; status: string; steps_done: string[]; attempts: number;
}

/** Every object under `<userId>/` in a bucket, however deep. */
async function listAll(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const folders = [prefix];
  while (folders.length) {
    const folder = folders.pop()!;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 1000, offset });
      if (error) throw new Error(`list ${bucket}: ${error.message}`);
      for (const item of data ?? []) {
        const path = `${folder}/${item.name}`;
        // Folders come back without an id.
        if (item.id === null || item.id === undefined) folders.push(path);
        else out.push(path);
      }
      if (!data || data.length < 1000) break;
    }
  }
  return out;
}

async function removeAll(admin: SupabaseClient, bucket: string, userId: string) {
  const paths = (await listAll(admin, bucket, userId)).filter((p) => p.startsWith(`${userId}/`));
  for (let i = 0; i < paths.length; i += 500) {
    const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + 500));
    if (error) throw new Error(`remove ${bucket}: ${error.message}`);
  }
  // Confirm nothing is left (a partial removal must not be recorded as done).
  const left = await listAll(admin, bucket, userId);
  if (left.length) throw new Error(`${bucket}: ${left.length} files still present`);
  return paths.length;
}

async function runStep(admin: SupabaseClient, step: Step, userId: string): Promise<void> {
  switch (step) {
    case "revoke_shares": {
      const now = new Date().toISOString();
      const a = await admin.from("shared_briefs").update({ revoked_at: now }).eq("user_id", userId).is("revoked_at", null);
      if (a.error) throw a.error;
      const b = await admin.from("media_shares").update({ revoked_at: now }).eq("user_id", userId).is("revoked_at", null);
      if (b.error) throw b.error;
      return;
    }
    case "cancel_billing": {
      // Stop any future charge. Past invoices stay with Stripe (accounting records).
      const { data, error } = await admin.from("subscriptions").select("stripe_subscription_id, environment, status")
        .eq("user_id", userId).in("status", ["active", "trialing", "past_due"]);
      if (error) throw error;
      if (!data?.length) return;
      const { createStripeClient } = await import("../_shared/stripe.ts");
      for (const s of data) {
        const stripe = createStripeClient(s.environment);
        try {
          await stripe.subscriptions.cancel(s.stripe_subscription_id);
        } catch (e) {
          if ((e as { code?: string }).code !== "resource_missing") throw e;
        }
      }
      return;
    }
    case "storage_medical": { await removeAll(admin, "medical-documents", userId); return; }
    case "storage_avatars": { await removeAll(admin, "avatars", userId); return; }
    case "partner_cleanup": {
      const { data: u } = await admin.auth.admin.getUserById(userId);
      const { error } = await admin.rpc("cleanup_partner_personal_data", { _user_id: userId, _email: u?.user?.email ?? null });
      if (error) throw error;
      return;
    }
    case "db_rows": {
      const { error } = await admin.rpc("delete_user_rows", { _user_id: userId });
      if (error) throw error;
      return;
    }
    case "email_logs": {
      const { data: u } = await admin.auth.admin.getUserById(userId);
      const email = u?.user?.email?.toLowerCase();
      if (!email) return;
      const a = await admin.from("email_send_log").delete().ilike("recipient_email", email);
      if (a.error) throw a.error;
      const b = await admin.from("email_unsubscribe_tokens").delete().ilike("email", email);
      if (b.error) throw b.error;
      return;
    }
    case "auth_user": {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error && !/not found/i.test(error.message) && (error as { status?: number }).status !== 404) throw error;
      return;
    }
  }
}

/** Claim a request so two runs never work on it at once. */
async function claim(admin: SupabaseClient, id: string): Promise<DeletionRequest | null> {
  const { data: row, error: readError } = await admin.from("account_deletion_requests")
    .select("id, status, started_at").eq("id", id).maybeSingle();
  if (readError) throw readError;
  if (!row) return null;
  const stale = row.status === "in_progress" && (!row.started_at || Date.parse(row.started_at) < Date.now() - STALE_LOCK_MS);
  if (!["pending", "failed"].includes(row.status) && !stale) return null;
  // Optimistic lock: only one run can move it from the status it was in.
  let q = admin.from("account_deletion_requests")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", id).eq("status", row.status);
  q = row.started_at ? q.eq("started_at", row.started_at) : q.is("started_at", null);
  const { data, error } = await q.select("id, user_id, status, steps_done, attempts").maybeSingle();
  if (error) throw error;
  return data as DeletionRequest | null;
}

export async function processRequest(admin: SupabaseClient, id: string) {
  const req = await claim(admin, id);
  if (!req || !req.user_id) return { id, status: "skipped" };
  const done = new Set(req.steps_done);
  const attempt = req.attempts + 1;
  for (const step of STEPS) {
    if (done.has(step)) continue;
    try {
      await runStep(admin, step, req.user_id);
      done.add(step);
      await admin.from("account_deletion_requests").update({ steps_done: [...done] }).eq("id", id);
    } catch (e) {
      const msg = `${step}: ${(e as Error)?.message ?? String(e)}`.slice(0, 300);
      const next = new Date(Date.now() + backoffMinutes(attempt) * 60_000).toISOString();
      await admin.from("account_deletion_requests").update({
        status: "failed", attempts: attempt, last_error: msg, steps_done: [...done],
        next_attempt_at: next,
      }).eq("id", id);
      console.error("close-account step failed", id, msg);
      return { id, status: "failed", step, attempts: attempt };
    }
  }
  // Nothing personal is kept once finished: only that a deletion completed, and when.
  const { error } = await admin.from("account_deletion_requests").update({
    status: "completed", user_id: null, attempts: attempt, last_error: null, steps_done: [...done],
    completed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
  return { id, status: "completed", attempts: attempt };
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const auth = req.headers.get("Authorization") ?? "";
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "process") {
      if (auth !== `Bearer ${service}`) return json({ error: "Unauthorized" }, 401);
      const { data, error } = await admin.from("account_deletion_requests").select("id")
        .in("status", ["pending", "failed", "in_progress"]).lt("attempts", MAX_ATTEMPTS)
        .lte("next_attempt_at", new Date().toISOString()).not("user_id", "is", null).limit(20);
      if (error) throw error;
      const results = [];
      for (const r of data ?? []) results.push(await processRequest(admin, r.id));
      return json({ results });
    }

    if (body.action !== "request") return json({ error: "Unknown action" }, 400);
    if (body.confirmation !== "DELETE") return json({ error: "Confirmation text mismatch" }, 400);
    const jwt = auth.replace(/^Bearer\s+/i, "");
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user }, error: authError } = await userClient.auth.getUser(jwt);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const source = body.source === "end_of_pilot" ? "end_of_pilot" : "settings";
    const { data: existing } = await admin.from("account_deletion_requests").select("id").eq("user_id", user.id).maybeSingle();
    let id = existing?.id as string | undefined;
    if (!id) {
      const { data, error } = await admin.from("account_deletion_requests").insert({ user_id: user.id, source }).select("id").single();
      if (error) throw error;
      id = data.id;
    }

    // Straight away, before the slower steps: share links stop working, every session ends, sign-in is blocked.
    await runStep(admin, "revoke_shares", user.id);
    await admin.from("account_deletion_requests").update({ steps_done: ["revoke_shares"] }).eq("id", id).eq("status", "pending");
    await admin.auth.admin.signOut(jwt, "global").catch(() => undefined);
    const ban = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
    if (ban.error) console.error("close-account: could not block sign-in", ban.error.message);

    const result = await processRequest(admin, id!);
    // Even if a step failed, the request stands and the scheduled worker retries it.
    return json({ requested: true, ...result }, 202);
  } catch (e) {
    console.error("close-account error", (e as Error)?.message);
    return json({ error: "Something went wrong. Your request is saved and will be retried." }, 500);
  }
}

if (import.meta.main) Deno.serve(handle);
