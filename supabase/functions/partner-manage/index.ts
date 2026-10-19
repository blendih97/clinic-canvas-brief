import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'

const SITE = 'https://rinvita.co.uk'
const MAX_PER_SUBMIT = 50
const MAX_PER_DAY = 200

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const Email = z.string().trim().toLowerCase().email().max(254)
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('invite_staff'), orgId: z.string().uuid(), email: Email, role: z.enum(['partner_admin', 'partner_staff']).optional() }),
  z.object({ action: z.literal('remove_staff'), orgId: z.string().uuid(), memberId: z.string().uuid() }),
  z.object({ action: z.literal('invite_patients'), orgId: z.string().uuid(), emails: z.array(z.string()).min(1).max(MAX_PER_SUBMIT) }),
  z.object({ action: z.literal('resend_invite'), orgId: z.string().uuid(), linkId: z.string().uuid() }),
  z.object({ action: z.literal('revoke_invite'), orgId: z.string().uuid(), linkId: z.string().uuid() }),
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(url, serviceKey)

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return json({ error: 'unauthorized' }, 401)
  const { data: u, error: uErr } = await db.auth.getUser(jwt)
  if (uErr || !u?.user) return json({ error: 'unauthorized' }, 401)
  const userId = u.user.id

  let raw: unknown
  try { raw = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const parsed = Body.safeParse(raw)
  if (!parsed.success) return json({ error: 'invalid_request', details: parsed.error.flatten().fieldErrors }, 400)
  const input = parsed.data

  const { data: org } = await db.from('partner_orgs').select('*').eq('id', input.orgId).maybeSingle()
  if (!org) return json({ error: 'not_found' }, 404)

  const { data: roleRow } = await db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  const isPlatformAdmin = !!roleRow
  const { data: member } = await db.from('partner_members').select('role,status')
    .eq('org_id', org.id).eq('user_id', userId).eq('status', 'active').maybeSingle()
  const isOrgAdmin = member?.role === 'partner_admin'
  const isOrgMember = !!member

  const sendEmail = async (templateName: string, to: string, templateData: Record<string, unknown>, key: string) => {
    const res = await fetch(`${url}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ templateName, recipientEmail: to, idempotencyKey: key, templateData }),
    })
    if (!res.ok) console.error('email send failed', templateName, res.status, await res.text())
    return res.ok
  }

  // ---- Staff management: platform admins or the org's partner_admin ----
  if (input.action === 'invite_staff' || input.action === 'remove_staff') {
    if (!isPlatformAdmin && !isOrgAdmin) return json({ error: 'forbidden' }, 403)

    if (input.action === 'remove_staff') {
      const { data: target } = await db.from('partner_members').select('id,user_id').eq('id', input.memberId).eq('org_id', org.id).maybeSingle()
      if (!target) return json({ error: 'not_found' }, 404)
      if (target.user_id === userId && !isPlatformAdmin) return json({ error: 'cannot_remove_self' }, 400)
      await db.from('partner_members').delete().eq('id', target.id)
      return json({ ok: true })
    }

    const { count } = await db.from('partner_members').select('id', { count: 'exact', head: true }).eq('org_id', org.id)
    const role = (count ?? 0) === 0 ? 'partner_admin' : (input.role ?? 'partner_staff')
    const { data: existing } = await db.from('partner_members').select('id,status').eq('org_id', org.id).ilike('invited_email', input.email).maybeSingle()
    if (existing && existing.status === 'active') return json({ error: 'already_member' }, 409)
    if (!existing) {
      const { error } = await db.from('partner_members').insert({ org_id: org.id, invited_email: input.email, role, invited_by: userId })
      if (error) return json({ error: 'invite_failed' }, 500)
    } else {
      await db.from('partner_members').update({ invited_at: new Date().toISOString(), role }).eq('id', existing.id)
    }
    await sendEmail('partner-staff-invite', input.email, {
      partnerName: org.name, partnerLogoUrl: org.logo_url,
      role: role === 'partner_admin' ? 'administrator' : 'team member',
      inviteLink: `${SITE}/auth?mode=signup&staff=1&next=/partner`,
    }, `partner-staff-${org.id}-${input.email}-${Date.now()}`)
    return json({ ok: true, role })
  }

  // ---- Patient invites: any active org member (or platform admin) ----
  if (!isPlatformAdmin && !isOrgMember) return json({ error: 'forbidden' }, 403)
  if (org.status !== 'active') return json({ error: 'partner_suspended' }, 400)

  const since = new Date(Date.now() - 86400_000).toISOString()
  const sentToday = async () => {
    const { count } = await db.from('partner_patient_links').select('id', { count: 'exact', head: true })
      .eq('org_id', org.id).gte('last_sent_at', since)
    return count ?? 0
  }
  const inviteLink = (token: string) => `${SITE}/p/${org.slug}?invite=${token}`
  const sendInvite = (to: string, token: string) => sendEmail('partner-patient-invite', to, {
    partnerName: org.name, partnerLogoUrl: org.logo_url, inviteLink: inviteLink(token),
  }, `partner-invite-${token}-${Date.now()}`)

  if (input.action === 'resend_invite' || input.action === 'revoke_invite') {
    const { data: link } = await db.from('partner_patient_links').select('*').eq('id', input.linkId).eq('org_id', org.id).maybeSingle()
    if (!link) return json({ error: 'not_found' }, 404)
    if (input.action === 'revoke_invite') {
      // Revoking never removes the patient's account or their sponsored plan.
      await db.from('partner_patient_links').update({ status: 'revoked' }).eq('id', link.id)
      return json({ ok: true })
    }
    if (link.status !== 'invited' || !link.invited_email) return json({ error: 'not_resendable' }, 400)
    if ((await sentToday()) >= MAX_PER_DAY) return json({ error: 'daily_limit' }, 429)
    await db.from('partner_patient_links').update({ last_sent_at: new Date().toISOString() }).eq('id', link.id)
    await sendInvite(link.invited_email, link.invite_token)
    return json({ ok: true })
  }

  // invite_patients
  const valid: string[] = []
  const invalid: string[] = []
  for (const e of input.emails) {
    const r = Email.safeParse(e)
    if (r.success) { if (!valid.includes(r.data)) valid.push(r.data) } else if (e.trim()) invalid.push(e.trim().slice(0, 100))
  }
  const remaining = MAX_PER_DAY - (await sentToday())
  if (remaining <= 0) return json({ error: 'daily_limit' }, 429)

  const { data: existingLinks } = await db.from('partner_patient_links').select('id,invited_email,status,patient_user_id').eq('org_id', org.id)
  const byEmail = new Map((existingLinks ?? []).filter((l) => l.invited_email).map((l) => [l.invited_email!.toLowerCase(), l]))

  const sent: string[] = []
  const skipped: string[] = []
  for (const email of valid) {
    if (sent.length >= remaining) { skipped.push(email); continue }
    const prior = byEmail.get(email)
    if (prior && (prior.status !== 'revoked' || prior.patient_user_id)) { skipped.push(email); continue }
    const now = new Date().toISOString()
    let token: string | null = null
    if (prior) {
      const { data } = await db.from('partner_patient_links').update({ status: 'invited', last_sent_at: now, invited_by: userId }).eq('id', prior.id).select('invite_token').single()
      token = data?.invite_token ?? null
    } else {
      const { data } = await db.from('partner_patient_links').insert({
        org_id: org.id, invited_email: email, invited_by: userId, status: 'invited', source: 'email_invite', last_sent_at: now,
      }).select('invite_token').single()
      token = data?.invite_token ?? null
    }
    if (!token) { skipped.push(email); continue }
    await sendInvite(email, token)
    sent.push(email)
  }
  return json({ ok: true, sent: sent.length, skipped, invalid })
})
