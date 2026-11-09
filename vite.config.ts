import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),

  // DICOM viewer (Cornerstone3D): the image decoder runs in module workers, and its
  // codecs are CommonJS, so they are pre-bundled for the dev server.
  worker: { format: "es" as const },
  optimizeDeps: {
    exclude: ["@cornerstonejs/dicom-image-loader"],
    include: [
      "dicom-parser",
      "@cornerstonejs/dicom-image-loader > @cornerstonejs/codec-openjpeg/decodewasmjs",
      "@cornerstonejs/dicom-image-loader > @cornerstonejs/codec-charls/decodewasmjs",
      "@cornerstonejs/dicom-image-loader > @cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs",
      "@cornerstonejs/dicom-image-loader > @cornerstonejs/codec-libjxl/decodewasmjs",
      "@cornerstonejs/dicom-image-loader > @cornerstonejs/codec-openjph/wasmjs",
      "@cornerstonejs/dicom-image-loader > pako",
      "@cornerstonejs/dicom-image-loader > comlink",
      "@cornerstonejs/dicom-image-loader > uuid",
    ],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
