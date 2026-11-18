// Partner admin demo (/demo/partner-admin?brand=kixa): what a partner's team sees in RinVita.
// Fictional patients only, kept in this page's memory. No live services are called, nothing is saved,
// and partners see sign-up status and their own case stages, never patients' records.
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpRight, CalendarClock, Info, Lock, RotateCcw, Send, X } from "lucide-react";
import SEO from "@/components/SEO";
import { LogoMark } from "@/components/marketing/shared";
import { Button } from "@/components/ui/button";
import {
  CASE_STAGES, DEMO_BRANDS, DEMO_CASES, caseStats, daysAgoLabel, dueLabel, needsAction,
  type CaseStage, type DemoCase,
} from "@/lib/partnerAdminDemo";

const card = "rounded-xl border border-border bg-card";

export default function PartnerAdminDemoPage() {
  const [params] = useSearchParams();
  const brand = DEMO_BRANDS[(params.get("brand") || "").toLowerCase()] ?? null;
  const orgName = brand?.name ?? "Your organisation";
  const [cases, setCases] = useState<DemoCase[]>(DEMO_CASES.map((c) => ({ ...c })));
  const [openId, setOpenId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"All" | CaseStage>("All");

  const stats = useMemo(() => caseStats(cases), [cases]);
  const due = useMemo(() => needsAction(cases), [cases]);
  const shown = filter === "All" ? cases : cases.filter((c) => c.stage === filter);
  const open = cases.find((c) => c.id === openId) ?? null;

  const update = (id: string, patch: Partial<DemoCase>) => setCases((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const reset = () => { setCases(DEMO_CASES.map((c) => ({ ...c }))); setOpenId(null); setFilter("All"); setNotice("Demo reset."); };
  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setNotice("Enter an email address to see how an invitation appears."); return; }
    setCases((cs) => [{ id: `n${Date.now()}`, name: "New patient", email, status: "Invited", invitedDaysAgo: 0, joinedDaysAgo: null, lastActiveDaysAgo: null, stage: "Enquiry", next: "", nextInDays: null, treatment: "Not set" }, ...cs]);
    setInviteEmail("");
    setNotice("Demo only: no email was sent. In a real account the patient gets an invitation with your logo.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="RinVita | Partner admin demo" description="A demonstration of the RinVita partner admin page with fictional patients." path="/demo/partner-admin" noindex />
      <div className="bg-[#1F2933] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <p className="text-sm flex-1 min-w-0 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-[#e6c46a] shrink-0" />
            <span>Preview of the partner admin page. All patients are fictional and nothing you change is saved or sent.</span>
          </p>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs"><RotateCcw className="w-3.5 h-3.5" /> Reset demo</button>
        </div>
      </div>

      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {brand ? <img src={brand.logo} alt={brand.name} className="h-10 max-w-[140px] object-contain" /> : <span className="font-heading text-xl">{orgName}</span>}
            <span className="text-muted-foreground" aria-hidden>×</span>
            <span className="inline-flex items-center gap-2"><LogoMark size={22} /><span className="font-heading text-xl tracking-[0.15em] text-primary">RinVita</span></span>
          </div>
          <span className="text-sm text-muted-foreground">care.team@example.com</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Partner admin</p>
          <h1 className="mt-1 font-heading text-3xl text-foreground">Welcome, {orgName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Invite patients, see who has joined, and track each case through to home.</p>
        </div>

        {notice && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([["Invited", stats.invited], ["Joined RinVita", stats.joined], ["Active (30 days)", stats.active], ["Booked or beyond", stats.booked]] as const).map(([k, v]) => (
            <div key={k} className={`${card} p-4`}><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-heading text-3xl tabular-nums">{v}</p></div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className={`${card} p-5`} aria-labelledby="due-title">
            <h2 id="due-title" className="font-medium flex items-center gap-2"><CalendarClock className="w-4 h-4 text-primary" /> Needs action</h2>
            {due.length ? (
              <ul className="mt-3 divide-y divide-border">
                {due.map((c) => (
                  <li key={c.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.next}</p>
                      <p className={`text-xs ${c.nextInDays! < 0 ? "text-destructive" : "text-muted-foreground"}`}>{c.name} · {dueLabel(c.nextInDays)}</p>
                    </div>
                    <button type="button" onClick={() => setOpenId(c.id)} className="text-xs text-primary shrink-0">Open</button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted-foreground">Nothing due today.</p>}
          </section>
          <form onSubmit={invite} className={`${card} p-5 space-y-3`}>
            <h2 className="font-medium">Invite a patient</h2>
            <label htmlFor="demo-invite" className="sr-only">Patient email</label>
            <input id="demo-invite" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="patient@example.com" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <Button type="submit" size="sm"><Send /> Send invitation</Button>
            <p className="text-xs text-muted-foreground">The patient joins with your logo on their account. RinVita is free for them when you sponsor it.</p>
          </form>
        </div>

        <section className={`${card} p-5`} aria-labelledby="cases-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cases-title" className="font-medium">Patients</h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by stage">
              {(["All", ...CASE_STAGES] as const).map((s) => (
                <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`rounded-full border px-3 py-1 text-xs ${filter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="py-2 font-medium">Patient</th><th className="font-medium">Joined RinVita</th><th className="font-medium">Last active</th><th className="font-medium">Case stage</th><th className="font-medium">Next step</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id} className="border-t border-border align-top">
                    <td className="py-2.5"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.treatment}</p></td>
                    <td className="py-2.5">{c.status === "Joined" ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Joined {daysAgoLabel(c.joinedDaysAgo)}</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Invited {daysAgoLabel(c.invitedDaysAgo)}</span>}</td>
                    <td className="py-2.5 text-muted-foreground">{daysAgoLabel(c.lastActiveDaysAgo)}</td>
                    <td className="py-2.5">
                      <label className="sr-only" htmlFor={`stage-${c.id}`}>Case stage for {c.name}</label>
                      <select id={`stage-${c.id}`} value={c.stage} onChange={(e) => update(c.id, { stage: e.target.value as CaseStage })} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                        {CASE_STAGES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 max-w-[260px]">{c.next ? <><p>{c.next}</p><p className={`text-xs ${c.nextInDays !== null && c.nextInDays < 0 ? "text-destructive" : "text-muted-foreground"}`}>{dueLabel(c.nextInDays)}</p></> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2.5 text-right"><button type="button" onClick={() => setOpenId(c.id)} className="text-xs text-primary">Open</button></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No patients at this stage.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" /> You see sign-up status and your own case stages. Patients' medical records stay private to them; they share them with hospitals and doctors themselves.</p>
        </section>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setOpenId(null); }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="case-title" className="h-full w-full max-w-md overflow-y-auto bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="case-title" className="font-heading text-2xl">{open.name}</h2>
                <p className="text-sm text-muted-foreground">{open.treatment} · {open.email}</p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Close" className="rounded-md p-1.5 hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <h3 className="mt-6 text-sm font-medium">Case progress</h3>
            <ol className="mt-3 space-y-2">
              {[["Invited", true, daysAgoLabel(open.invitedDaysAgo)], ["Joined RinVita", open.status === "Joined", daysAgoLabel(open.joinedDaysAgo)]].map(([label, done, when]) => (
                <li key={label as string} className="flex items-center gap-3 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-primary" : "border border-border"}`} aria-hidden />
                  <span className={done ? "" : "text-muted-foreground"}>{label as string}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{done ? when as string : "Waiting"} · automatic</span>
                </li>
              ))}
              {CASE_STAGES.slice(1).map((s) => {
                const done = CASE_STAGES.indexOf(open.stage) >= CASE_STAGES.indexOf(s);
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <input type="checkbox" checked={done} aria-label={s} className="h-4 w-4 accent-primary"
                      onChange={() => update(open.id, { stage: done ? CASE_STAGES[CASE_STAGES.indexOf(s) - 1] : s })} />
                    <span className={done ? "" : "text-muted-foreground"}>{s}</span>
                    <span className="ml-auto text-xs text-muted-foreground">your team</span>
                  </li>
                );
              })}
            </ol>

            <h3 className="mt-6 text-sm font-medium">Next step</h3>
            <label htmlFor="case-next" className="sr-only">Next step</label>
            <input id="case-next" value={open.next} onChange={(e) => update(open.id, { next: e.target.value })} placeholder="For example: chase the hospital for a quote" className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <label htmlFor="case-due" className="mt-3 block text-xs text-muted-foreground">Due</label>
            <select id="case-due" value={open.nextInDays ?? ""} onChange={(e) => update(open.id, { nextInDays: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">No date</option>
              {open.nextInDays !== null && open.nextInDays < 0 && <option value={open.nextInDays}>{dueLabel(open.nextInDays)}</option>}
              <option value={0}>Today</option><option value={1}>Tomorrow</option><option value={3}>In 3 days</option><option value={7}>In a week</option>
            </select>

            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><Lock className="w-4 h-4" /> Medical records</p>
              <p className="mt-1 text-muted-foreground">Private to the patient. They upload their records and share them with hospitals and doctors themselves.</p>
              {open.isEleanor && (
                <a href={brand ? `/demo/${Object.keys(DEMO_BRANDS).find((k) => DEMO_BRANDS[k] === brand)}` : "/demo/eleanor"} className="mt-3 inline-flex items-center gap-1 text-primary">
                  See what {open.name.split(" ")[0]} sees <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </aside>
        </div>
      )}

      <footer className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 text-[11px] text-muted-foreground">
        All patients, emails and cases on this page are fictional. Nothing is emailed, uploaded or saved.
      </footer>
    </div>
  );
}
