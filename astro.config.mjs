// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),

  // site: "https://revimont-klatovy.cz",
  site: "https://revimont.vercel.app/",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
