import { useState } from "react";
import { FileText, Upload, Share2, AlertTriangle, Pill, CheckCircle, Send, Search, Pin } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";

type Section = "overview" | "blood" | "imaging" | "media" | "medications" | "documents" | "share" | "billing" | "export" | "family";

interface OverviewProps {
  onNavigate?: (s: Section) => void;
  onUpload?: () => void;
  onRequestRecords?: () => void;
}

const OverviewSection = ({ onNavigate, onUpload, onRequestRecords }: OverviewProps) => {
  const { documents, allergies, medications, bloodResults } = useVaultStore();
  const [search, setSearch] = useState("");
  const [pinnedDocIds, setPinnedDocIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("rinvita-pinned-docs");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [pinnedBloodIds, setPinnedBloodIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("rinvita-pinned-blood");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const togglePinDoc = (id: string) => {
    setPinnedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("rinvita-pinned-docs", JSON.stringify([...next]));
      return next;
    });
  };

  const togglePinBlood = (id: string) => {
    setPinnedBloodIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("rinvita-pinned-blood", JSON.stringify([...next]));
      return next;
    });
  };

  const q = search.toLowerCase();
  const filteredDocs = documents.filter(d =>
    !q || d.name.toLowerCase().includes(q) || d.facility.toLowerCase().includes(q) ||
    d.country.toLowerCase().includes(q) || d.date.includes(q) || d.type.toLowerCase().includes(q)
  );

  const recentDocs = [...filteredDocs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const activeMeds = medications.filter((m) => m.active);

  const pinnedDocs = documents.filter(d => pinnedDocIds.has(d.id));
  const pinnedBlood = bloodResults.filter(b => pinnedBloodIds.has(b.id));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Your Health Overview</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {documents.length > 0
            ? `${documents.length} document${documents.length !== 1 ? "s" : ""} uploaded`
            : "Upload your first document to get started"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents, facilities, dates…"
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Pinned Items */}
      {(pinnedDocs.length > 0 || pinnedBlood.length > 0) && (
        <div>
          <h3 className="font-heading text-lg text-foreground mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary" /> Pinned
          </h3>
          <div className="space-y-2">
            {pinnedDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-card border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.facility} · {doc.date}</p>
                  </div>
                </div>
                <button onClick={() => togglePinDoc(doc.id)} className="text-primary hover:text-primary/70">
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {pinnedBlood.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-card border border-primary/20 rounded-lg">
                <div>
                  <p className="text-sm text-foreground">{b.marker}: {b.value} {b.unit}</p>
                  <p className="text-xs text-muted-foreground">{b.source} · {b.date}</p>
                </div>
                <button onClick={() => togglePinBlood(b.id)} className="text-primary hover:text-primary/70">
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onUpload}
          className="flex items-center gap-4 p-6 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Upload Document</p>
            <p className="text-xs opacity-80">PDF, image, or clinical letter</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.("share")}
          className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl hover:border-primary/40 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Share with Clinician</p>
            <p className="text-xs text-muted-foreground">Generate a secure link</p>
          </div>
        </button>
        <button
          onClick={onRequestRecords}
          className="flex items-center gap-4 p-6 bg-card border border-border rounded-xl hover:border-primary/40 transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Request Records</p>
            <p className="text-xs text-muted-foreground">Ask your provider to send files</p>
          </div>
        </button>
      </div>

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div>
          <h3 className="font-heading text-lg text-foreground mb-4">Recent Documents</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {recentDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onNavigate?.("documents")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.facility}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); togglePinDoc(doc.id); }}
                    className={`p-1 rounded hover:bg-muted ${pinnedDocIds.has(doc.id) ? "text-primary" : "text-muted-foreground/40"}`}>
                    <Pin className="w-3 h-3" />
                  </button>
                  {doc.extracted && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" /> Extracted
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{doc.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Medical Info */}
      {(allergies.length > 0 || activeMeds.length > 0) && (
        <div>
          <h3 className="font-heading text-lg text-foreground mb-4">Key Medical Info</h3>
          <div className="space-y-4">
            {allergies.length > 0 && (
              <div>
                <p className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {a.substance} — {a.reaction}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {activeMeds.length > 0 && (
              <div>
                <p className="text-xs tracking-wider text-muted-foreground uppercase font-medium mb-2">Active Medications</p>
                <div className="flex flex-wrap gap-2">
                  {activeMeds.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
                      <Pill className="w-3 h-3" />
                      {m.name} {m.dose}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
