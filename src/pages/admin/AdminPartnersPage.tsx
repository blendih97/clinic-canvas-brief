import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isValidSlug, LOGO_MAX_BYTES, LOGO_TYPES, partnerLink, slugify } from "@/lib/partners";

interface Org {
  id: string; name: string; slug: string; type: string; logo_url: string | null; sponsored_plan: string;
  seat_limit: number; sponsor_until: string | null; status: string; created_at: string;
}
interface Member { id: string; org_id: string; invited_email: string; role: string; status: string; joined_at: string | null }
interface LinkRow { org_id: string; status: string; patient_user_id: string | null }

const defaultSponsorUntil = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toLocaleDateString("en-CA"); };
const emptyForm = { id: "", name: "", slug: "", type: "clinic", seat_limit: 50, sponsor_until: "", status: "active", sponsored_plan: "standard", logo_url: "" };
const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

const AdminPartnersPage = () => {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [staffEmail, setStaffEmail] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    const [o, l, m] = await Promise.all([
      supabase.from("partner_orgs").select("*").order("created_at", { ascending: false }),
      supabase.from("partner_patient_links").select("org_id,status,patient_user_id"),
      supabase.from("partner_members").select("id,org_id,invited_email,role,status,joined_at"),
    ]);
    setOrgs((o.data as Org[]) || []);
    setLinks((l.data as LinkRow[]) || []);
    setMembers((m.data as Member[]) || []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const edit = (o?: Org) => {
    setForm(o ? { id: o.id, name: o.name, slug: o.slug, type: o.type, seat_limit: o.seat_limit, sponsor_until: o.sponsor_until || "", status: o.status, sponsored_plan: o.sponsored_plan, logo_url: o.logo_url || "" } : { ...emptyForm, sponsor_until: defaultSponsorUntil() });
    setSlugTouched(!!o);
    setLogoFile(null);
    setFormOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(form.slug || form.name);
    if (!form.name.trim() || !isValidSlug(slug)) { toast.error("Enter a name and a valid link name (letters, numbers, hyphens)."); return; }
    if (!form.sponsor_until) { toast.error("Choose a sponsored-until date."); return; }
    if (logoFile && (!LOGO_TYPES.includes(logoFile.type) || logoFile.size > LOGO_MAX_BYTES)) {
      toast.error("Logo must be PNG, JPG or WebP and under 2 MB."); return;
    }
    setSaving(true);
    let logo_url = form.logo_url || null;
    if (logoFile) {
      const ext = logoFile.type === "image/png" ? "png" : logoFile.type === "image/webp" ? "webp" : "jpg";
      const path = `${slug}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("partner-logos").upload(path, logoFile, { contentType: logoFile.type, upsert: false });
      if (up.error) { setSaving(false); toast.error("Logo upload failed."); return; }
      // Bucket is private (workspace blocks public buckets): use a long-lived signed URL for page + emails.
      const signed = await supabase.storage.from("partner-logos").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      logo_url = signed.data?.signedUrl ?? null;
    }
    const row = {
      name: form.name.trim(), slug, type: form.type, seat_limit: Math.max(0, Number(form.seat_limit) || 0),
      sponsor_until: form.sponsor_until, status: form.status, sponsored_plan: form.sponsored_plan, logo_url,
    };
    const res = form.id
      ? await supabase.from("partner_orgs").update(row).eq("id", form.id)
      : await supabase.from("partner_orgs").insert(row);
    setSaving(false);
    if (res.error) { toast.error(res.error.message.includes("duplicate") ? "That link name is already taken." : res.error.message); return; }
    toast.success("Partner saved.");
    setFormOpen(false);
    void load();
  };

  const inviteStaff = async (org: Org) => {
    const email = (staffEmail[org.id] || "").trim();
    if (!email) return;
    const { data, error } = await supabase.functions.invoke("partner-manage", { body: { action: "invite_staff", orgId: org.id, email } });
    if (error || data?.error) { toast.error(data?.error === "already_member" ? "Already a member." : "Invite failed."); return; }
    toast.success(`Invitation sent (${data.role === "partner_admin" ? "partner admin" : "staff"}).`);
    setStaffEmail((s) => ({ ...s, [org.id]: "" }));
    void load();
  };

  const removeStaff = async (org: Org, m: Member) => {
    if (!confirm(`Remove ${m.invited_email}?`)) return;
    await supabase.functions.invoke("partner-manage", { body: { action: "remove_staff", orgId: org.id, memberId: m.id } });
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-light text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground">Clinics and concierges sponsoring patients. No clinical data is shown here.</p>
        </div>
        <button onClick={() => edit()} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">New partner</button>
      </div>

      <div style={{ display: formOpen ? "block" : "none" }}>
        <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">Name
            <input className={input} value={form.name} maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} />
          </label>
          <label className="text-sm">Link name (rinvita.co.uk/p/…)
            <input className={input} value={form.slug} maxLength={60}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }} />
          </label>
          <label className="text-sm">Type
            <select className={input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="clinic">Clinic</option><option value="concierge">Concierge</option><option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm">Sponsored plan
            <select className={input} value={form.sponsored_plan} onChange={(e) => setForm((f) => ({ ...f, sponsored_plan: e.target.value }))}>
              <option value="standard">Standard</option><option value="family">Family</option>
            </select>
          </label>
          <label className="text-sm">Seat limit
            <input type="number" min={0} className={input} value={form.seat_limit} onChange={(e) => setForm((f) => ({ ...f, seat_limit: Number(e.target.value) }))} />
          </label>
          <label className="text-sm">Sponsored until
            <input type="date" className={input} value={form.sponsor_until} onChange={(e) => setForm((f) => ({ ...f, sponsor_until: e.target.value }))} />
          </label>
          <label className="text-sm">Status
            <select className={input} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option><option value="suspended">Suspended</option>
            </select>
          </label>
          <label className="text-sm">Logo (PNG, JPG or WebP, max 2 MB)
            <input type="file" accept="image/png,image/jpeg,image/webp" className={input} onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{saving ? "Saving…" : "Save partner"}</button>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      </div>

      {orgs.length === 0 && <p className="text-sm text-muted-foreground">No partners yet.</p>}

      <div className="grid gap-4">
        {orgs.map((o) => {
          const ol = links.filter((l) => l.org_id === o.id);
          const invited = ol.filter((l) => l.status === "invited").length;
          const joined = ol.filter((l) => l.status === "joined").length;
          const seats = ol.filter((l) => l.patient_user_id).length;
          const om = members.filter((m) => m.org_id === o.id);
          return (
            <div key={o.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {o.logo_url && <img src={o.logo_url} alt="" className="h-10 w-10 object-contain" />}
                  <div>
                    <p className="font-medium text-foreground">{o.name} <span className="text-xs text-muted-foreground">({o.type}, {o.status})</span></p>
                    <a href={partnerLink(o.slug)} target="_blank" rel="noreferrer" className="text-xs text-primary">{partnerLink(o.slug)}</a>
                  </div>
                </div>
                <button onClick={() => edit(o)} className="rounded-md border border-border px-3 py-1.5 text-sm">Edit</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Invited</p><p>{invited}</p></div>
                <div><p className="text-muted-foreground text-xs">Joined</p><p>{joined}</p></div>
                <div><p className="text-muted-foreground text-xs">Seats</p><p>{seats} / {o.seat_limit}</p></div>
                <div><p className="text-muted-foreground text-xs">Sponsored until</p><p>{o.sponsor_until || "—"}</p></div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Partner staff</p>
                <ul className="text-sm space-y-1 mb-3">
                  {om.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span className="break-all">{m.invited_email} · {m.role === "partner_admin" ? "admin" : "staff"} · {m.status}</span>
                      <button onClick={() => void removeStaff(o, m)} className="text-xs text-destructive">Remove</button>
                    </li>
                  ))}
                  {om.length === 0 && <li className="text-muted-foreground">No staff yet — the first person invited becomes partner admin.</li>}
                </ul>
                <div className="flex gap-2">
                  <input type="email" placeholder="staff@clinic.com" className={input} value={staffEmail[o.id] || ""}
                    onChange={(e) => setStaffEmail((s) => ({ ...s, [o.id]: e.target.value }))} />
                  <button onClick={() => void inviteStaff(o)} className="rounded-md border border-border px-3 py-2 text-sm whitespace-nowrap">Invite staff</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPartnersPage;
