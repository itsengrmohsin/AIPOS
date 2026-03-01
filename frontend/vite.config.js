import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // or '0.0.0.0' to expose on LAN
    port: 5173, // optional, default is 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          react: ["react", "react-dom", "react-router-dom"],

          // UI frameworks
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
          tailwind: ["tailwindcss"],

          // Forms & validation
          forms: ["formik", "yup", "@formspree/react"],

          // Charts & animations
          charts: ["recharts"],
          motion: ["motion"],

          // Icons
          icons: ["lucide-react", "react-icons"],
        },
      },
    },
  },
});
