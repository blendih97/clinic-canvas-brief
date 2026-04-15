import { useState, useEffect } from "react";
import { FileText, CheckCircle, Send, Clock, Eye, Inbox, X, Loader2, Search, Pin } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DocumentViewerModal from "@/components/DocumentViewerModal";
import type { Document } from "@/store/vaultStore";
import { toast } from "sonner";

const countryFlags: Record<string, string> = { UAE: "🇦🇪", UK: "🇬🇧", Qatar: "🇶🇦", Switzerland: "🇨🇭", USA: "🇺🇸" };

interface RecordRequest {
  id: string;
  provider_name: string;
  provider_email: string;
  request_description: string;
  status: string;
  created_at: string;
  expires_at: string;
  token: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  link_opened: { label: "Opened", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Eye },
  received: { label: "Received", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Inbox },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground border-border", icon: X },
};

const DocumentsSection = ({ onRequestRecords }: { onRequestRecords?: () => void }) => {
  const documents = useVaultStore((s) => s.documents);
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [tab, setTab] = useState<"documents" | "requests">("documents");
  const [requests, setRequests] = useState<RecordRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (tab === "requests" && user) loadRequests();
  }, [tab, user]);

  const loadRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    const { data } = await supabase.from("record_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRequests((data as RecordRequest[]) || []);
    setLoadingRequests(false);
  };

  const handleCancelRequest = async (id: string) => {
    const { error } = await supabase.from("record_requests").update({ status: "cancelled" }).eq("id", id);
    if (!error) { toast.success("Request cancelled"); loadRequests(); }
  };

  const handleRowClick = (doc: Document) => { setSelectedDoc(doc); setShowViewer(true); };

  const q = search.toLowerCase();
  const filteredDocs = documents.filter(d =>
    !q || d.name.toLowerCase().includes(q) || d.facility.toLowerCase().includes(q) ||
    d.country.toLowerCase().includes(q) || d.date.includes(q) || d.type.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground mt-2">Full archive of uploaded medical records</p>
        </div>
        {onRequestRecords && (
          <button onClick={onRequestRecords}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:border-primary/30 transition-colors">
            <Send className="w-4 h-4" /> Request Records
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents, facilities, dates…"
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        <button onClick={() => setTab("documents")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "documents" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <FileText className="w-3 h-3" /> Documents
        </button>
        <button onClick={() => setTab("requests")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "requests" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Send className="w-3 h-3" /> Requests
        </button>
      </div>

      {tab === "documents" ? (
        filteredDocs.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
            {search ? "No documents match your search." : "No documents yet. Upload documents to build your health archive."}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Document</th>
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Type</th>
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Country</th>
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Facility</th>
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Date</th>
                  <th className="p-4 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d) => (
                  <tr key={d.id} onClick={() => handleRowClick(d)}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">{d.name}</span>
                        {d.aiNote?.includes("Received via request") && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                            Received via Request
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{d.type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span>{countryFlags[d.country] || "🌍"}</span>
                        <span className="text-xs text-muted-foreground">{d.country}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{d.facility}</td>
                    <td className="p-4 text-xs text-muted-foreground">{d.date}</td>
                    <td className="p-4">
                      {d.extracted && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Extracted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {loadingRequests ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
              No record requests yet. Request records from your healthcare providers to get started.
            </div>
          ) : (
            requests.map((req) => {
              const cfg = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={req.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground">{req.provider_name}</h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.request_description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Sent {new Date(req.created_at).toLocaleDateString()} · Expires {new Date(req.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    {req.status === "pending" && (
                      <button onClick={() => handleCancelRequest(req.id)}
                        className="shrink-0 ml-3 text-xs text-muted-foreground hover:text-destructive transition-colors">Cancel</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showViewer && selectedDoc && (
        <DocumentViewerModal document={selectedDoc} onClose={() => setShowViewer(false)} />
      )}
    </div>
  );
};

export default DocumentsSection;
