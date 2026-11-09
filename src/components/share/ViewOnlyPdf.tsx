// Shows a PDF as page images inside the page, with no download or print controls
// (the browser's own PDF viewer always offers both). Used on the doctor's share page.
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function ViewOnlyPdf({ url, title }: { url: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const el = box.current;
    if (!el) return;
    el.innerHTML = "";
    setState("loading");
    (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch");
      const task = pdfjs.getDocument({ data: new Uint8Array(await res.arrayBuffer()) });
      const doc = await task.promise;
      if (cancelled) return;
      setPages(doc.numPages);
      const width = Math.max(320, el.clientWidth - 8);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (let n = 1; n <= doc.numPages && !cancelled; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.className = "block bg-white rounded shadow-sm mb-3";
        canvas.setAttribute("aria-label", `${title}, page ${n} of ${doc.numPages}`);
        el.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        if (n === 1 && !cancelled) setState("ready");
      }
      await task.destroy();
    })().catch((e) => { console.error("ViewOnlyPdf", e); if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [url, title]);

  return (
    <div className="w-full" onContextMenu={(e) => e.preventDefault()}>
      {state === "loading" && <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading original…</div>}
      {state === "error" && <p className="py-10 text-center text-sm text-muted-foreground">The original couldn't be displayed. The link may have expired; please reopen it.</p>}
      {state === "ready" && pages > 1 && <p className="text-[11px] text-muted-foreground mb-2">{pages} pages</p>}
      <div ref={box} className="select-none" />
    </div>
  );
}
