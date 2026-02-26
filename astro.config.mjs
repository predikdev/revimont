// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  site: "https://revimont-klatovy.cz",
  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
