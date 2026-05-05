// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),

  site: "https://www.revimont-klatovy.cz",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
