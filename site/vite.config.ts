import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages serves the site from /wakekeeper/; Vercel and local dev serve it from /.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
});
