import { FileText, CheckCircle } from "lucide-react";
import { useVaultStore } from "@/store/vaultStore";

const countryFlags: Record<string, string> = { UAE: "🇦🇪", UK: "🇬🇧", Qatar: "🇶🇦", Switzerland: "🇨🇭", USA: "🇺🇸" };

const DocumentsSection = () => {
  const documents = useVaultStore((s) => s.documents);

  if (documents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-3xl font-light text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload documents to build your health archive.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground text-sm">
          No documents yet.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-foreground">Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">Full archive of uploaded medical records</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Document</th>
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Type</th>
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Country</th>
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Facility</th>
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Date</th>
              <th className="p-3 text-[10px] tracking-wider text-muted-foreground uppercase font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{d.name}</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{d.type}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span>{countryFlags[d.country] || "🌍"}</span>
                    <span className="text-xs text-muted-foreground">{d.country}</span>
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{d.facility}</td>
                <td className="p-3 text-xs text-muted-foreground">{d.date}</td>
                <td className="p-3">
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
    </div>
  );
};

export default DocumentsSection;
