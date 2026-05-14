import { Link } from "react-router-dom";

const UploadConsentModal = ({
  open,
  onAccept,
  onCancel,
}: {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ display: open ? "flex" : "none" }}
      role="dialog"
      aria-modal="true"
      aria-label="Health data processing consent"
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="font-heading text-xl text-foreground mb-3">
          Before you upload
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          By uploading this document you consent to RinVita Ltd processing the
          health information it contains using AI to extract, translate and
          structure your medical data. You can withdraw consent and delete your
          data at any time via your account settings.
        </p>
        <p className="text-xs text-muted-foreground/80 leading-relaxed mb-5">
          See our{" "}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener"
            className="underline hover:text-primary"
          >
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener"
            className="underline hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          for full details.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAccept}
            className="flex-[2] py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            I understand and consent
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadConsentModal;
