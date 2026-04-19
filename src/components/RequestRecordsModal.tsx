import { useState } from "react";
import { X, Send, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RequestRecordsModal = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [providerName, setProviderName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setProviderName("");
    setProviderEmail("");
    setDescription("");
    setSending(false);
    setSent(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async () => {
    if (!user || !providerName.trim() || !providerEmail.trim() || !description.trim()) return;
    setSending(true);

    try {
      const token = crypto.randomUUID();
      const patientName = profile?.full_name || user.email?.split("@")[0] || "Patient";
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: inserted, error } = await supabase.from("record_requests").insert({
        user_id: user.id,
        provider_name: providerName.trim(),
        provider_email: providerEmail.trim(),
        request_description: description.trim(),
        patient_name: patientName,
        token,
        status: "pending",
        expires_at: expiresAt,
      }).select("id").single();

      if (error) throw error;

      const appUrl = window.location.origin;
      const { error: emailError } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "record-request",
          recipientEmail: providerEmail.trim(),
          idempotencyKey: `record-request-${inserted?.id || token}`,
          templateData: {
            providerName: providerName.trim(),
            patientName,
            requestDescription: description.trim(),
            uploadLink: `${appUrl}/upload-request/${token}`,
            isImaging: false,
          },
        },
      });
      if (emailError) throw emailError;

      setSent(true);
      toast.success("Request sent to " + providerName.trim());
    } catch (e: any) {
      console.error("Request error:", e);
      toast.error("Failed to send request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading text-xl text-foreground">
            {sent ? "Request Sent" : "Request Records from Provider"}
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
                An email has been sent to <span className="font-medium text-foreground">{providerName}</span> with a secure upload link.
                You'll be notified when they upload your records.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Provider Name</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. HMC Doha Radiology"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Provider Email</label>
                <input
                  type="email"
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="records@provider.com"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">What are you requesting?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. MRI Left Foot from October 2025, full DICOM study if available"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !providerName.trim() || !providerEmail.trim() || !description.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
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

export default RequestRecordsModal;
