import { X, Lock } from "lucide-react";
import { Feature, getRequiredPlanLabel, getRequiredPlanPrice } from "@/lib/planAccess";

interface Props {
  open: boolean;
  onClose: () => void;
  feature: Feature | null;
  customMessage?: string;
}

const featureLabels: Record<Feature, string> = {
  share_brief: "Share Brief",
  export: "Export",
  request_records: "Request Records",
  request_imaging: "Request Imaging",
  family_invite: "Family Members",
  unlimited_uploads: "Unlimited Uploads",
};

const UpgradeModal = ({ open, onClose, feature, customMessage }: Props) => {
  if (!open || !feature) return null;
  const planLabel = getRequiredPlanLabel(feature);
  const planPrice = getRequiredPlanPrice(feature);
  const featureLabel = featureLabels[feature];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading text-xl text-foreground">Upgrade Required</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-foreground">
            {customMessage || (
              <>
                <span className="font-medium">{featureLabel}</span> is available on the{" "}
                <span className="font-medium">{planLabel}</span> plan at{" "}
                <span className="font-medium">{planPrice}</span>.
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">Upgrade coming soon.</p>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
