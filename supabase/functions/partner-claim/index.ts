import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,58}[a-z0-9])?$/
const TOKEN_RE = /^[a-f0-9]{64}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return json({ error: 'unauthorized' }, 401)
  const { data: u, error: uErr } = await admin.auth.getUser(jwt)
  if (uErr || !u?.user) return json({ error: 'unauthorized' }, 401)
  const user = u.user

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body allowed */ }
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : ''
  const token = typeof body.token === 'string' ? body.token.trim().toLowerCase() : ''
  if (slug && !SLUG_RE.test(slug)) return json({ error: 'invalid_slug' }, 400)
  if (token && !TOKEN_RE.test(token)) return json({ error: 'invalid_token' }, 400)

  const { data, error } = await admin.rpc('partner_claim', {
    _user_id: user.id,
    _email: user.email ?? null,
    _email_verified: !!user.email_confirmed_at,
    _slug: slug || null,
    _token: token || null,
  })
  if (error) {
    console.error('partner_claim failed', error.message)
    return json({ error: 'claim_failed' }, 500)
  }
  return json(data)
})
