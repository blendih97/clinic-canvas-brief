import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminActivity,
  getAdminDashboardData,
  getAdminSettings,
  getAdminUsers,
  updateAdminSettings,
  updateAdminUserState,
  type AdminActivityItem,
  type AdminRecentDocument,
  type AdminSettingsRecord,
  type AdminUserRow,
} from "@/lib/admin";
import { getAdminAssuranceLevel } from "@/lib/admin-mfa";

type Mode = "users" | "subscriptions" | "documents" | "activity" | "settings";

const statusTone: Record<string, string> = {
  success: "bg-primary/10 text-primary",
  processed: "bg-primary/10 text-primary",
  pending: "bg-secondary text-secondary-foreground",
  processing: "bg-secondary text-secondary-foreground",
  failed: "bg-destructive/10 text-destructive",
};

const planOptions = ["all", "free", "standard", "family"] as const;
const statusOptions = ["all", "active", "trial", "comped", "suspended"] as const;

const fmtDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "—");
const fmtDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

const AdminPlaceholderPage = ({
  title,
  description,
  mode,
  extra,
}: {
  title: string;
  description: string;
  mode: Mode;
  extra?: ReactNode;
}) => {
  const [loading, setLoading] = useState(true);
  const [aal2, setAal2] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<(typeof planOptions)[number]>("all");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [documents, setDocuments] = useState<AdminRecentDocument[]>([]);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [settings, setSettings] = useState<AdminSettingsRecord | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [form, setForm] = useState({
    defaultTrialDays: "14",
    aiModel: "google/gemini-2.5-pro",
    announcementSenderName: "",
    announcementReplyTo: "",
  });

  const loadUsers = async () => {
    const data = await getAdminUsers({
      search,
      plan: plan === "all" ? undefined : plan,
      status: status === "all" ? undefined : status,
      limit: 100,
    });
    setUsers(data);
  };

  const load = async () => {
    setLoading(true);
    try {
      const assurance = await getAdminAssuranceLevel();
      setAal2(assurance.currentLevel === "aal2");

      if (mode === "users" || mode === "subscriptions") {
        await loadUsers();
      }

      if (mode === "documents" || mode === "subscriptions") {
        const dashboard = await getAdminDashboardData();
        setDocuments(dashboard.recentDocuments);
      }

      if (mode === "activity") {
        setActivity(await getAdminActivity(100));
      }

      if (mode === "settings") {
        const nextSettings = await getAdminSettings();
        setSettings(nextSettings);
        if (nextSettings) {
          setForm({
            defaultTrialDays: String(nextSettings.default_trial_days),
            aiModel: nextSettings.ai_model,
            announcementSenderName: nextSettings.announcement_sender_name ?? "",
            announcementReplyTo: nextSettings.announcement_reply_to ?? "",
          });
        }
      }
    } catch {
      toast.error("Could not load this admin view");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [mode]);

  const filteredUserMetrics = useMemo(() => {
    const active = users.filter((user) => !user.suspended_at).length;
    const suspended = users.filter((user) => Boolean(user.suspended_at)).length;
    const comped = users.filter((user) => user.comped_until && new Date(user.comped_until) > new Date()).length;
    return { active, suspended, comped };
  }, [users]);

  const guardedAction = async (callback: () => Promise<void>) => {
    if (!aal2) {
      toast.error("Verify your admin session with MFA before changing member access");
      return;
    }
    await callback();
    await load();
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await updateAdminSettings({
        defaultTrialDays: Number(form.defaultTrialDays || 14),
        aiModel: form.aiModel,
        announcementSenderName: form.announcementSenderName,
        announcementReplyTo: form.announcementReplyTo,
      });
      setSettings(updated);
      toast.success("Admin settings saved");
    } catch {
      toast.error("Could not save admin settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1.8fr,0.9fr,0.9fr]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <select value={plan} onChange={(event) => setPlan(event.target.value as typeof plan)} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
          {planOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All plans" : option}</option>)}
        </select>
        <div className="flex gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
            {statusOptions.map((option) => <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>)}
          </select>
          <button onClick={() => void loadUsers()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Apply</button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="p-4">Member</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Docs</th>
                  <th className="p-4">Trial ends</th>
                  <th className="p-4">Last active</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">{loading ? "Loading members…" : "No members match these filters."}</td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60 align-top">
                    <td className="p-4 text-sm">
                      <p className="font-medium text-foreground">{user.full_name || "Unnamed member"}</p>
                      <p className="mt-1 text-muted-foreground">{user.email || "No email"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Joined {fmtDate(user.created_at)} · {user.nationality || "No country set"}</p>
                    </td>
                    <td className="p-4 text-sm capitalize text-foreground">{user.comped_plan || user.plan}</td>
                    <td className="p-4 text-sm capitalize text-foreground">{user.role}</td>
                    <td className="p-4 text-sm text-foreground">{user.document_count}</td>
                    <td className="p-4 text-sm text-foreground">{fmtDate(user.trial_ends_at)}</td>
                    <td className="p-4 text-sm text-foreground">{fmtDateTime(user.last_active_at)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void guardedAction(() => updateAdminUserState({ targetUserId: user.id, suspended: !user.suspended_at, suspendedReason: user.suspended_at ? null : "Manual admin hold" }))}
                          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                        >
                          {user.suspended_at ? "Restore access" : "Suspend"}
                        </button>
                        <button
                          onClick={() => void guardedAction(() => updateAdminUserState({ targetUserId: user.id, trialExtensionDays: 7 }))}
                          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                        >
                          +7 day trial
                        </button>
                        <button
                          onClick={() => void guardedAction(() => updateAdminUserState({ targetUserId: user.id, compedPlan: "standard", compedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }))}
                          className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                        >
                          Comp 30 days
                        </button>
                      </div>
                      {user.suspended_reason && <p className="mt-2 text-xs text-destructive">{user.suspended_reason}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active members</p><p className="mt-3 font-heading text-3xl font-light text-foreground">{loading ? "—" : filteredUserMetrics.active}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Suspended</p><p className="mt-3 font-heading text-3xl font-light text-foreground">{loading ? "—" : filteredUserMetrics.suspended}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comped access</p><p className="mt-3 font-heading text-3xl font-light text-foreground">{loading ? "—" : filteredUserMetrics.comped}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-xl font-medium">Plan distribution</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {users.length === 0 ? "No subscription data yet." : ["free", "standard", "family"].map((planName) => {
            const count = users.filter((user) => user.plan === planName).length;
            return <div key={planName} className="flex items-center justify-between rounded-md border border-border px-4 py-3"><span className="capitalize text-foreground">{planName}</span><span>{count} members</span></div>;
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-xl font-medium">Recent paid-plan document activity</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {documents.length === 0 ? "No recent documents yet." : documents.slice(0, 6).map((document) => (
            <div key={document.document_id} className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3">
              <div>
                <p className="text-foreground">{document.user_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{document.document_name}</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs capitalize ${statusTone[document.processing_status] || "bg-secondary text-secondary-foreground"}`}>{document.processing_status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="p-4">User</th>
                <th className="p-4">Document</th>
                <th className="p-4">Type</th>
                <th className="p-4">Language</th>
                <th className="p-4">Uploaded</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">{loading ? "Loading documents…" : "No documents uploaded yet."}</td></tr>
              ) : documents.map((document) => (
                <tr key={document.document_id} className="border-b border-border/60">
                  <td className="p-4 text-sm text-foreground">{document.user_name}</td>
                  <td className="p-4 text-sm"><p className="text-foreground">{document.document_name}</p><p className="mt-1 text-xs text-muted-foreground">{document.document_id}</p></td>
                  <td className="p-4 text-sm text-foreground">{document.document_type || "—"}</td>
                  <td className="p-4 text-sm text-foreground">{document.original_language || "—"}</td>
                  <td className="p-4 text-sm text-foreground">{fmtDateTime(document.upload_date)}</td>
                  <td className="p-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs capitalize ${statusTone[document.processing_status] || "bg-secondary text-secondary-foreground"}`}>{document.processing_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderActivity = () => (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activity.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{loading ? "Loading activity…" : "No activity recorded yet."}</div>
          ) : activity.map((item) => (
            <div key={item.id} className="grid gap-2 px-5 py-4 lg:grid-cols-[180px,1fr,220px]">
              <div>
                <p className="text-sm font-medium text-foreground">{item.event_type.split("_").join(" ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(item.created_at)}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><span className="text-foreground">Actor:</span> {item.actor_name || item.actor_user_id || "System"}</p>
                <p className="mt-1"><span className="text-foreground">Target:</span> {item.user_name || item.user_id || "Platform"}</p>
              </div>
              <pre className="overflow-x-auto rounded-md bg-secondary/40 p-3 text-xs text-muted-foreground">{JSON.stringify(item.details_json ?? {}, null, 2)}</pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-xl font-medium">Platform defaults</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-foreground">
            <span>Default trial days</span>
            <input value={form.defaultTrialDays} onChange={(event) => setForm((current) => ({ ...current, defaultTrialDays: event.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Primary AI model</span>
            <input value={form.aiModel} onChange={(event) => setForm((current) => ({ ...current, aiModel: event.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Announcement sender</span>
            <input value={form.announcementSenderName} onChange={(event) => setForm((current) => ({ ...current, announcementSenderName: event.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="space-y-2 text-sm text-foreground">
            <span>Reply-to email</span>
            <input value={form.announcementReplyTo} onChange={(event) => setForm((current) => ({ ...current, announcementReplyTo: event.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2 flex items-center justify-between rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
            <span>Last updated {settings ? fmtDateTime(settings.updated_at) : "—"}</span>
            <button onClick={() => void saveSettings()} disabled={savingSettings} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{savingSettings ? "Saving…" : "Save settings"}</button>
          </div>
        </CardContent>
      </Card>
      {extra}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">Admin</p>
        <h1 className="mt-2 font-heading text-4xl font-light text-foreground">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>

      {!aal2 && mode !== "settings" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-muted-foreground">
            <p>Admin session verification is required before changing member state.</p>
            <Link to="/admin/settings" className="rounded-md border border-border px-3 py-2 text-foreground transition-colors hover:bg-muted">Open security settings</Link>
          </CardContent>
        </Card>
      )}

      {mode === "users" && renderUsers()}
      {mode === "subscriptions" && renderSubscriptions()}
      {mode === "documents" && renderDocuments()}
      {mode === "activity" && renderActivity()}
      {mode === "settings" && renderSettings()}
    </div>
  );
};

export default AdminPlaceholderPage;