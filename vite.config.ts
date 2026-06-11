import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/huggingface": {
        target: "https://api-inference.huggingface.co",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/huggingface/, ""),
      },
    },
  },

  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
    allowedHosts: [
      "test-inventory-system.onrender.com",
      ".onrender.com"
    ],
  },
});