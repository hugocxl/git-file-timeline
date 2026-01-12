/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
  define: {
    // Environment variables for provider selection
    "import.meta.env.VITE_GIT_PROVIDER": JSON.stringify(
      process.env.VITE_GIT_PROVIDER || ""
    ),
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/vscode-ext/**",
      "**/cli/**",
    ],
  },
});
