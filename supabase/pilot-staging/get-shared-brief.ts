// Replacement entrypoint for get-shared-brief. Stage with the SQL change before deployment.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const bodySchema = z.object({ token: z.string().min(16).max(256), recipientSecret: z.string().regex(/^[a-f0-9]{64}$/) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Pragma': 'no-cache' },
});

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'invalid_request' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ error: 'server_error' }, 500);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parsed.data.recipientSecret));
    const recipientHash = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    const { data, error } = await createClient(url, key).rpc('consume_shared_brief', {
      _token: parsed.data.token, _recipient_hash: recipientHash,
    });
    if (error) return json({ error: 'lookup_failed' }, 503);
    // Identical response for used, expired, revoked and unknown tokens.
    return json({ brief: data, protocol: 2 });
  } catch {
    return json({ error: 'server_error' }, 500);
  }
});