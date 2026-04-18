import { useState } from "react";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const imagingTypes = ["MRI", "CT", "X-Ray", "Ultrasound", "PET", "Mammography", "DEXA"];

const RequestImagingModal = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [providerName, setProviderName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [imagingType, setImagingType] = useState("MRI");
  const [bodyRegion, setBodyRegion] = useState("");
  const [studyDate, setStudyDate] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setProviderName(""); setProviderEmail(""); setImagingType("MRI");
    setBodyRegion(""); setStudyDate(""); setRefNumber("");
    setSending(false); setSent(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSend = async () => {
    if (!user || !providerName.trim() || !providerEmail.trim() || !bodyRegion.trim()) return;
    setSending(true);

    try {
      const token = crypto.randomUUID();
      const patientName = profile?.full_name || user.email?.split("@")[0] || "Patient";
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const description = `${imagingType} — ${bodyRegion}${studyDate ? ` (study date: ${studyDate})` : ""}${refNumber ? ` · Ref: ${refNumber}` : ""}. Please share the full DICOM study and any associated radiology report.`;

      const { error } = await supabase.from("record_requests").insert({
        user_id: user.id,
        provider_name: providerName.trim(),
        provider_email: providerEmail.trim(),
        request_description: description,
        patient_name: patientName,
        token,
        status: "pending",
        expires_at: expiresAt,
      });
      if (error) throw error;

      const appUrl = window.location.origin;
      await supabase.functions.invoke("send-record-request", {
        body: {
          providerName: providerName.trim(),
          providerEmail: providerEmail.trim(),
          patientName: patientName.split(" ")[0],
          requestDescription: description,
          uploadLink: `${appUrl}/upload-request/${token}`,
          isImaging: true,
          imagingType,
          bodyRegion,
        },
      });

      setSent(true);
      toast.success("Imaging request sent to " + providerName.trim());
    } catch (e) {
      console.error("Imaging request error:", e);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h3 className="font-heading text-xl text-foreground">
            {sent ? "Imaging Request Sent" : "Request Imaging from Radiology"}
          </h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {sent ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-heading text-xl text-foreground">Request Sent</h4>
              <p className="text-sm text-muted-foreground">
                The radiology team at <span className="font-medium text-foreground">{providerName}</span> will receive a secure upload link to share your DICOM study and report.
              </p>
              <button onClick={handleClose} className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Radiology Provider Name</label>
                <input type="text" value={providerName} onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. HMC Doha Radiology"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Provider Email</label>
                <input type="email" value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="radiology@provider.com"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Imaging Type</label>
                  <select value={imagingType} onChange={(e) => setImagingType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    {imagingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Body Region</label>
                  <input type="text" value={bodyRegion} onChange={(e) => setBodyRegion(e.target.value)}
                    placeholder="e.g. Left Foot"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Approximate Study Date</label>
                  <input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Reference Number <span className="text-muted-foreground">(optional)</span></label>
                  <input type="text" value={refNumber} onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Accession #"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                The provider will receive a secure link accepting DICOM, JPEG, PNG and MP4 files — no login required.
              </p>

              <button onClick={handleSend}
                disabled={sending || !providerName.trim() || !providerEmail.trim() || !bodyRegion.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending…" : "Send Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestImagingModal;
