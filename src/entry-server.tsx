// Build-time renderer for the public marketing routes. Used by
// scripts/prerender.mjs so every public URL ships real HTML and head tags
// for crawlers and AI assistants that do not execute JavaScript.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LocaleProvider } from "@/hooks/useLocale";
import { AppRoutes } from "./App";

export function render(url: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocaleProvider>
            <TooltipProvider>
              <StaticRouter location={url}>
                <AppRoutes />
              </StaticRouter>
            </TooltipProvider>
          </LocaleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );

  const helmet = helmetContext.helmet;
  const head = [
    helmet?.title.toString(),
    helmet?.meta.toString(),
    helmet?.link.toString(),
    helmet?.script.toString(),
  ]
    .filter(Boolean)
    .join("\n    ");

  return { html, head };
}
