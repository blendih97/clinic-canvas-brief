import { FileText, Upload, CheckCircle, Globe } from "lucide-react";
import { documents } from "@/data/mockData";

const countryFlags: Record<string, string> = { UAE: "🇦🇪", UK: "🇬🇧", Qatar: "🇶🇦", Switzerland: "🇨🇭" };

const DocumentsSection = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-3xl font-light text-cream">Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">Full archive of uploaded medical records</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
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
              <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm text-cream">{d.name}</span>
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
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
