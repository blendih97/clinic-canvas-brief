// imaging-session: called by the Share Brief page after it has claimed the brief.
// Uses the same atomic claim (consume_shared_brief) — idempotent for the recipient
// who already holds the link, refused for anyone else — and opens a viewing
// session whose secret lives only in that browser tab's memory.
import { z } from 'npm:zod@3.23.8';
import { admin, cors, json, randomHex, sha256Hex } from '../_shared/imaging.ts';

const body = z.object({ token: z.string().min(16).max(256), recipientSecret: z.string().regex(/^[a-f0-9]{64}$/) });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(req, { error: 'invalid_request' }, 400);
  try {
    const sessionSecret = randomHex(32);
    const { data, error } = await admin().rpc('imaging_start_recipient_session', {
      _token: parsed.data.token,
      _recipient_hash: await sha256Hex(parsed.data.recipientSecret),
      _session_hash: await sha256Hex(sessionSecret),
    });
    if (error) return json(req, { error: 'lookup_failed' }, 503);
    // Identical response for used, expired, revoked and unknown links.
    if (!data) return json(req, { imaging: null });
    const hasStudies = Array.isArray(data.studies) && data.studies.length > 0;
    return json(req, { imaging: { ...data, sessionSecret: hasStudies ? sessionSecret : null } });
  } catch {
    return json(req, { error: 'server_error' }, 500);
  }
});
