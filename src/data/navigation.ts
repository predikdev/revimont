export interface NavLink {
  href: string;
  label: string;
}

/** Service sub-menu links — used in both desktop and mobile navigation. */
export const SERVICE_LINKS: NavLink[] = [
  { href: "/sluzby/elektroinstalace", label: "Elektroinstalace" },
  { href: "/sluzby/revize", label: "Revize" },
  { href: "/sluzby/opravy-montaze", label: "Opravy a montáže" },
];

/** Top-level navigation links (excluding Domů and Služby dropdown). */
export const MAIN_LINKS: NavLink[] = [
  { href: "/realizace", label: "Realizace" },
  { href: "/kontakt", label: "Kontakt" },
];

/** Checks if a nav link is active based on the current pathname. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
