// Post-build prerenderer: writes dist/<route>/index.html for every public
// route, with that route's own head tags and real rendered markup inside
// #root. The client bundle hydrates/takes over exactly as before.
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = resolve("dist");
const SSR_ENTRY = resolve("dist-ssr/entry-server.js");

const LANGUAGES = [
  "polish",
  "romanian",
  "spanish",
  "portuguese",
  "italian",
  "french",
  "german",
  "dutch",
  "greek",
  "turkish",
  "russian",
  "arabic",
  "chinese",
];

const ROUTES = [
  "/",
  "/medical-passport",
  "/translate",
  ...LANGUAGES.map((l) => `/translate/${l}-medical-records-to-english`),
  "/medical-records-for-expats",
  "/organise-medical-records-for-family",
  "/medical-records-for-overseas-treatment",
  "/for-clinics",
  "/for-concierges",
  "/demo",
  "/security",
  "/privacy",
  "/terms",
];

if (!existsSync(SSR_ENTRY)) {
  console.error(`prerender: missing SSR bundle at ${SSR_ENTRY}`);
  process.exit(1);
}

const { render } = await import(pathToFileURL(SSR_ENTRY).href);
const template = readFileSync(resolve(DIST, "index.html"), "utf8");

/** Remove the generic head tags so each route's own tags are authoritative. */
function stripGenericHead(html) {
  return html
    .replace(/\n?\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\n?\s*<meta\s+name="description"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+property="og:(title|description|url|type)"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+name="twitter:(card|title|description)"[^>]*>/gi, "");
}

let written = 0;
let failed = 0;

for (const route of ROUTES) {
  try {
    const { html, head } = render(route);
    let page = stripGenericHead(template);
    page = page.replace("</head>", `  ${head}\n  </head>`);
    page = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`);

    const outFile = route === "/" ? resolve(DIST, "index.html") : resolve(DIST, `.${route}/index.html`);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, page, "utf8");
    written += 1;
  } catch (err) {
    failed += 1;
    console.error(`prerender: FAILED ${route}\n`, err);
  }
}

rmSync(resolve("dist-ssr"), { recursive: true, force: true });

console.log(`prerender: wrote ${written} route(s), ${failed} failure(s)`);
if (failed > 0) process.exit(1);
