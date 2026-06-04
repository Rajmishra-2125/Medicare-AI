import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    // Override COOP/COEP headers so Google OAuth popup (window.closed) works
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'framework';
            }
            if (
              id.includes('node_modules/@sentry/') ||
              id.includes('node_modules/@opentelemetry/')
            ) {
              return 'sentry';
            }
            if (
              id.includes('node_modules/jspdf') ||
              id.includes('node_modules/html2canvas') ||
              id.includes('node_modules/jspdf-autotable')
            ) {
              return 'pdf';
            }
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/victory-vendor')
            ) {
              return 'charts';
            }
            if (
              id.includes('node_modules/firebase') ||
              id.includes('node_modules/@firebase')
            ) {
              return 'firebase';
            }
            return 'vendor';
          }
        },
      },
      onwarn(warning, warn) {
        // Suppress "use client" / "use server" directive warnings from third-party packages
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
  },
});
