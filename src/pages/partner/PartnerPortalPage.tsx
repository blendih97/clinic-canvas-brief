import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, LogOut } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MAX_INVITES_PER_SUBMIT, parseEmailList, partnerLink } from "@/lib/partners";

interface Org { id: string; name: string; slug: string; logo_url: string | null; seat_limit: number; sponsor_until: string | null; status: string }
interface Member { id: string; org_id: string; user_id: string | null; invited_email: string; role: string; status: string; joined_at: string | null }
interface Patient {
  link_id: string; full_name: string | null; email: string | null; status: string; source: string;
  invited_at: string; joined_at: string | null; last_sent_at: string | null; last_active_at: string | null;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const DAY = 86400_000;

const PartnerPortalPage = ({ orgs, myMemberships }: { orgs: Org[]; myMemberships: Member[] }) => {
  const { user, signOut } = useAuth();
  const [orgId, setOrgId] = useState(orgs[0]?.id);
  const org = orgs.find((o) => o.id === orgId) || orgs[0];
  const isAdmin = myMemberships.some((m) => m.org_id === org.id && m.role === "partner_admin");
  const [tab, setTab] = useState<"patients" | "team">("patients");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [team, setTeam] = useState<Member[]>([]);
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [qr, setQr] = useState("");

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([
      supabase.rpc("get_partner_patients", { _org_id: org.id }),
      supabase.from("partner_members").select("id,org_id,user_id,invited_email,role,status,joined_at").eq("org_id", org.id),
    ]);
    setPatients((p.data as Patient[]) || []);
    setTeam((t.data as Member[]) || []);
  }, [org.id]);
  useEffect(() => { void load(); }, [load]);

  const link = partnerLink(org.slug);
  useEffect(() => { void QRCode.toDataURL(link, { width: 600, margin: 2 }).then(setQr); }, [link]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      invited: patients.filter((p) => p.status === "invited").length,
      joined: patients.filter((p) => p.status === "joined").length,
      active: patients.filter((p) => p.last_active_at && now - new Date(p.last_active_at).getTime() < 30 * DAY && p.joined_at).length,
      seats: patients.filter((p) => p.joined_at).length,
    };
  }, [patients]);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("partner-manage", { body: { orgId: org.id, ...body } });
    if (error) {
      let code = "";
      try { code = (await (error as { context?: Response }).context?.json())?.error || ""; } catch { /* ignore */ }
      return { error: code || "failed" } as Record<string, any>;
    }
    return data as Record<string, any>;
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, invalid } = parseEmailList(emails);
    if (invalid.length) { toast.error(`Check these addresses: ${invalid.slice(0, 5).join(", ")}`); return; }
    if (!valid.length) return;
    if (valid.length > MAX_INVITES_PER_SUBMIT) { toast.error(`Up to ${MAX_INVITES_PER_SUBMIT} addresses at a time.`); return; }
    setSending(true);
    const res = await call({ action: "invite_patients", emails: valid });
    setSending(false);
    if (res.error) { toast.error(res.error === "daily_limit" ? "Daily invite limit reached (200 per day). Try again tomorrow." : "Invites could not be sent."); return; }
    toast.success(`${res.sent} invitation${res.sent === 1 ? "" : "s"} sent${res.skipped?.length ? `, ${res.skipped.length} skipped (already invited or limit reached)` : ""}.`);
    setEmails("");
    void load();
  };

  const act = async (action: string, linkId: string, ok: string) => {
    const res = await call({ action, linkId });
    if (res.error) toast.error(res.error === "daily_limit" ? "Daily invite limit reached." : "That didn't work."); else toast.success(ok);
    void load();
  };

  const inviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await call({ action: "invite_staff", email: staffEmail.trim() });
    if (res.error) toast.error(res.error === "already_member" ? "Already a team member." : "Invite failed.");
    else { toast.success("Team invitation sent."); setStaffEmail(""); }
    void load();
  };

  const removeStaff = async (m: Member) => {
    if (!confirm(`Remove ${m.invited_email} from the team?`)) return;
    const res = await call({ action: "remove_staff", memberId: m.id });
    if (res.error) toast.error("Could not remove."); else toast.success("Removed.");
    void load();
  };

  const card = "rounded-xl border border-border bg-card p-5";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${org.name} partner portal — RinVita`} description="RinVita partner portal" path="/partner" noindex />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {org.logo_url ? <img src={org.logo_url} alt={org.name} className="h-10 max-w-[140px] object-contain" /> : <span className="font-heading text-xl">{org.name}</span>}
            <span className="text-muted-foreground">×</span>
            <span className="font-heading text-xl font-light tracking-[0.15em] gold-gradient-text">RinVita</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {orgs.length > 1 && (
              <select className="rounded-md border border-border bg-background px-2 py-1.5" value={org.id} onChange={(e) => setOrgId(e.target.value)}>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <span className="hidden sm:inline text-muted-foreground">{user?.email}</span>
            <Link to="/app" className="rounded-md border border-border px-3 py-1.5">My records</Link>
            <button onClick={() => void signOut()} className="rounded-md border border-border px-3 py-1.5" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 space-y-6">
        {org.status !== "active" && <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">This partnership is suspended. New invitations are paused.</p>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Invited", stats.invited], ["Joined", stats.joined], ["Active (30 days)", stats.active],
            ["Seats used", `${stats.seats} / ${org.seat_limit}`], ["Sponsored until", fmt(org.sponsor_until)],
          ].map(([k, v]) => (
            <div key={k as string} className={card}><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-heading">{v}</p></div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">You see sign-up and activity status only. Patients' medical records are private to them and never shown here.</p>

        <div className="flex gap-2 border-b border-border">
          <button onClick={() => setTab("patients")} className={`px-3 py-2 text-sm ${tab === "patients" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Patients</button>
          {isAdmin && <button onClick={() => setTab("team")} className={`px-3 py-2 text-sm ${tab === "team" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Team</button>}
        </div>

        <div style={{ display: tab === "patients" ? "block" : "none" }} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={invite} className={card + " space-y-3"}>
              <p className="font-medium">Invite patients</p>
              <textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={5}
                placeholder="One email, or paste a list separated by commas or new lines (max 50)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button disabled={sending || org.status !== "active"} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">
                {sending ? "Sending…" : "Send invitations"}
              </button>
            </form>
            <div className={card + " space-y-3"}>
              <p className="font-medium">Your link</p>
              <p className="text-sm break-all text-muted-foreground">{link}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied."); }} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Copy className="h-4 w-4" /> Copy link</button>
                {qr && <a href={qr} download={`rinvita-${org.slug}-qr.png`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Download className="h-4 w-4" /> Download QR code</a>}
              </div>
              {qr && <img src={qr} alt="QR code for your RinVita link" className="h-32 w-32" />}
            </div>
          </div>

          <div className={card + " overflow-x-auto"}>
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2">Name</th><th>Email</th><th>Status</th><th>Invited</th><th>Joined</th><th>Last active</th><th /></tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.link_id} className="border-t border-border">
                    <td className="py-2">{p.full_name || "—"}</td>
                    <td className="break-all">{p.email || "—"}</td>
                    <td className="capitalize">{p.status}</td>
                    <td>{fmt(p.invited_at)}</td>
                    <td>{fmt(p.joined_at)}</td>
                    <td>{fmt(p.last_active_at)}</td>
                    <td className="text-right whitespace-nowrap space-x-3">
                      {p.status === "invited" && <button onClick={() => void act("resend_invite", p.link_id, "Invitation resent.")} className="text-primary text-xs">Resend</button>}
                      {p.status !== "revoked" && p.status === "invited" && <button onClick={() => void act("revoke_invite", p.link_id, "Invitation revoked.")} className="text-destructive text-xs">Revoke</button>}
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No patients yet. Invite by email or share your link.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: tab === "team" ? "block" : "none" }} className={card + " space-y-4"}>
            <ul className="text-sm space-y-2">
              {team.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <span className="break-all">{m.invited_email} · {m.role === "partner_admin" ? "Admin" : "Staff"} · {m.status}</span>
                  {m.user_id !== user?.id && <button onClick={() => void removeStaff(m)} className="text-xs text-destructive">Remove</button>}
                </li>
              ))}
            </ul>
            <form onSubmit={inviteStaff} className="flex gap-2">
              <input type="email" required value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="colleague@clinic.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground whitespace-nowrap">Invite staff</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnerPortalPage;
