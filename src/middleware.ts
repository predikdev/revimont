import { defineMiddleware } from "astro:middleware";
import { NOINDEX_ROBOTS_CONTENT, SHOULD_INDEX_SITE } from "./lib/site-env";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  if (!SHOULD_INDEX_SITE) {
    response.headers.set("X-Robots-Tag", NOINDEX_ROBOTS_CONTENT);
  }

  return response;
});
