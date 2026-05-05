type SiteEnvironment = "production" | "staging" | "development";

const explicitSiteEnv = import.meta.env.PUBLIC_SITE_ENV as
  | SiteEnvironment
  | undefined;
const vercelEnv = import.meta.env.VERCEL_ENV as string | undefined;

const normalizeSiteEnv = (): SiteEnvironment => {
  if (
    explicitSiteEnv === "production" ||
    explicitSiteEnv === "staging" ||
    explicitSiteEnv === "development"
  ) {
    return explicitSiteEnv;
  }

  if (vercelEnv === "preview") return "staging";
  if (vercelEnv === "development") return "development";

  return "production";
};

export const SITE_ENV = normalizeSiteEnv();
export const IS_PRODUCTION = SITE_ENV === "production";
export const SHOULD_INDEX_SITE = IS_PRODUCTION;
export const NOINDEX_ROBOTS_CONTENT = "noindex,nofollow,noarchive,nosnippet";
export const INDEX_ROBOTS_CONTENT =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
