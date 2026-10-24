import { useState } from "react";
import { toast } from "sonner";
import { retryDocument } from "@/lib/documentRetry";

/** Admin-only retry for a failed document; shows the real error to the admin. */
const AdminRetryButton = ({ documentId, onDone }: { documentId: string; onDone?: () => void }) => {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const res = await retryDocument(documentId);
    setBusy(false);
    if (res.ok) { toast.success("Document processed."); onDone?.(); }
    else toast.error(res.message);
  };
  return (
    <button onClick={() => void run()} disabled={busy}
      className="ml-2 rounded-full border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/5 disabled:opacity-60">
      {busy ? "Retrying…" : "Retry"}
    </button>
  );
};

export default AdminRetryButton;
