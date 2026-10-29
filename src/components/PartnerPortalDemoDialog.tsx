import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PartnerPortalDemoDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !ref.current) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = ref.current;
    panel.querySelector<HTMLButtonElement>("button")?.focus();
    const keys = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first && last) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last && first) { e.preventDefault(); first.focus(); }
    };
    panel.addEventListener("keydown", keys);
    return () => { panel.removeEventListener("keydown", keys); document.body.style.overflow = bodyOverflow; previous?.focus(); };
  }, [open, onClose]);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label={title} style={{ display: open ? "flex" : "none" }} className="fixed inset-x-0 bottom-[72px] top-0 z-50 items-center justify-center bg-foreground/30 p-0 backdrop-blur-sm md:bottom-0 md:p-8">
    <div className="flex h-full max-h-full w-full max-w-3xl flex-col overflow-hidden border-border bg-card shadow-xl md:h-auto md:max-h-[88vh] md:rounded-lg md:border">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-7"><div><p className="mb-1 text-xs text-primary">Fictional patient · local simulation</p><h2 className="text-2xl">{title}</h2></div><Button variant="ghost" size="icon" aria-label="Close panel" onClick={onClose}><X /></Button></div>
      <div className="overflow-y-auto overscroll-contain p-5 md:p-7">{open && children}</div>
    </div>
  </div>;
}
