import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = isOpen && options ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl my-8">
        <button
          onClick={closeCheckout}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/90 hover:bg-background border border-border flex items-center justify-center"
          aria-label="Close checkout"
        >
          <X className="w-4 h-4" />
        </button>
        <StripeEmbeddedCheckout {...options} />
      </div>
    </div>
  ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
