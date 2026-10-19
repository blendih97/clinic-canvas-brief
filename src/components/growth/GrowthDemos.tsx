import { useState } from "react";
import { FileText, Lock, Mail, Download, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_DOCS } from "@/data/sampleAmiraK";

export default function GrowthDemos() {
  const [tab, setTab] = useState<"patient" | "partner">("patient");
  const [docId, setDocId] = useState(SAMPLE_DOCS[0].id);
  const [view, setView] = useState<"summary" | "original">("summary");
  const [invited, setInvited] = useState(false);
  const doc = SAMPLE_DOCS.find(item => item.id === docId) ?? SAMPLE_DOCS[0];
  return <section className="py-12 border-t border-border" aria-label="Fictional interactive demonstrations">
    <div className="flex flex-wrap justify-between items-end gap-4 mb-6"><div><p className="text-sm text-primary mb-2">FICTIONAL DEMONSTRATION</p><h2 className="text-3xl">Two workspaces. One privacy boundary.</h2></div>
      <div className="flex gap-2" role="tablist" aria-label="Demo workspace"><Button role="tab" aria-selected={tab === "patient"} variant={tab === "patient" ? "default" : "outline"} onClick={() => setTab("patient")}>Patient record</Button><Button role="tab" aria-selected={tab === "partner"} variant={tab === "partner" ? "default" : "outline"} onClick={() => setTab("partner")}>Partner dashboard</Button></div></div>
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3"><Lock className="h-4 w-4 text-primary"/><p className="text-sm">{tab === "patient" ? "Amira K. · Fictional patient · Private workspace" : "Illustrative partner workspace · No patient medical records"}</p></div>
      {tab === "patient" ? <div className="grid md:grid-cols-[260px_1fr]">
        <div className="border-b md:border-b-0 md:border-r border-border p-4 space-y-2"><p className="text-sm text-muted-foreground mb-4">4 fictional documents</p>{SAMPLE_DOCS.map(item => <Button key={item.id} variant={item.id === docId ? "secondary" : "ghost"} className="w-full h-auto py-3 justify-start text-left whitespace-normal" onClick={() => setDocId(item.id)}><FileText className="shrink-0"/><span>{item.translatedTitle}<span className="block text-xs text-muted-foreground mt-1">{item.language} · {item.timeline.label}</span></span></Button>)}</div>
        <div className="p-5 md:p-8 min-w-0"><div className="flex gap-2 mb-6"><Button size="sm" variant={view === "summary" ? "default" : "outline"} onClick={() => setView("summary")}>Record summary</Button><Button size="sm" variant={view === "original" ? "default" : "outline"} onClick={() => setView("original")}>Original excerpt</Button></div>
          <h3 className="text-2xl mb-2">{view === "summary" ? doc.translatedTitle : doc.originalTitle}</h3><p className="text-sm text-muted-foreground mb-5">{doc.facility} · {doc.dateISO} · Fictional facility and record</p>
          {view === "original" ? <div className="space-y-3 text-sm" lang={doc.languageCode}>{doc.originalSnippet.map(line => <p key={line}>{line}</p>)}</div> : <><p className="text-sm leading-7 mb-5">{doc.translatedSummary}</p>{doc.markers && <div className="divide-y divide-border">{doc.markers.map(marker => <div key={marker.name} className="flex justify-between gap-4 py-3 text-sm"><span>{marker.name}</span><span>{marker.value} · {marker.status}</span></div>)}</div>}{doc.medications?.map(m => <p key={m.name} className="text-sm py-2">{m.name} · {m.dose} · {m.freq} (historical prescription)</p>)}</>}
          <div className="border-t border-border mt-6 pt-5"><Button variant="outline" onClick={async () => { const { generateSampleHealthPassport } = await import("@/lib/sampleHealthPassport"); await generateSampleHealthPassport(); }}><Download/>Download fictional PDF</Button></div>
        </div>
      </div> : <div className="p-5 md:p-8"><div className="grid sm:grid-cols-3 gap-6 mb-7">{[[invited ? "2" : "1", "Invited"], ["1", "Joined"], ["1", "Active in 30 days"]].map(([n, label]) => <div key={label}><p className="font-heading text-4xl text-primary">{n}</p><p className="text-sm text-muted-foreground">{label} · simulated</p></div>)}</div>
        <div className="divide-y divide-border border-y border-border mb-6"><div className="py-4 flex gap-4 justify-between text-sm"><span>Amira K. · Fictional patient</span><span className="flex items-center gap-2"><Check className="h-4 w-4"/>Joined</span></div><div className="py-4 flex gap-4 justify-between text-sm"><span>Alex R. · Fictional patient</span><span>Invited</span></div>{invited && <div className="py-4 flex gap-4 justify-between text-sm"><span>Sam T. · Fictional patient</span><span>Invited (simulation)</span></div>}</div>
        <Button variant="outline" disabled={invited} onClick={() => setInvited(true)}><Mail/>{invited ? "Fictional invitation added" : "Simulate patient invitation"}</Button><p className="text-sm text-muted-foreground mt-3">No email is sent. No account or sponsorship is created.</p><p className="flex items-center gap-2 text-sm mt-6"><Users className="h-4 w-4 text-primary"/>Partners manage invitations and sponsorship, never medical records.</p>
      </div>}
    </div>
  </section>;
}