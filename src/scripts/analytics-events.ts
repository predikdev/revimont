import { trackEvent } from "./analytics";

const trackedElements = new WeakSet<Element>();

const getLinkLabel = (element: Element, fallback: string) => {
  const explicitLabel = element.getAttribute("data-analytics-label");
  if (explicitLabel) return explicitLabel;

  const text = element.textContent?.trim().replace(/\s+/g, " ");
  return text || fallback;
};

const getPagePath = () => window.location.pathname;

const trackExplicitEvent = (element: Element) => {
  const eventName = element.getAttribute("data-analytics-event");
  if (!eventName) return false;

  trackEvent(eventName, {
    event_category:
      element.getAttribute("data-analytics-category") || "engagement",
    event_label: getLinkLabel(element, eventName),
    link_url: element instanceof HTMLAnchorElement ? element.href : undefined,
    page_path: getPagePath(),
  });

  return true;
};

const trackLinkClick = (link: HTMLAnchorElement) => {
  const href = link.getAttribute("href") || "";
  const label = getLinkLabel(link, href);
  const commonParams = {
    event_label: label,
    link_url: link.href,
    page_path: getPagePath(),
  };

  if (href.startsWith("tel:")) {
    trackEvent("phone_click", commonParams);
    return;
  }

  if (href.startsWith("mailto:")) {
    trackEvent("email_click", commonParams);
    return;
  }

  if (
    link.href.includes("google.com/maps") ||
    link.href.includes("maps.google")
  ) {
    trackEvent("maps_click", commonParams);
    return;
  }

  const url = new URL(link.href, window.location.href);
  const isSameOrigin = url.origin === window.location.origin;

  if (isSameOrigin && url.pathname === "/kontakt") {
    trackEvent("cta_click", {
      ...commonParams,
      cta_label: label,
      cta_destination: url.pathname,
    });
    return;
  }

  if (
    isSameOrigin &&
    url.pathname.startsWith("/realizace/") &&
    url.pathname !== "/realizace/"
  ) {
    trackEvent("project_click", {
      ...commonParams,
      project_slug: url.pathname
        .replace(/^\/realizace\//, "")
        .replace(/\/$/, ""),
    });
  }
};

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const trackedElement = target.closest("[data-analytics-event]");
  if (trackedElement && !trackedElements.has(trackedElement)) {
    trackedElements.add(trackedElement);
    window.setTimeout(() => trackedElements.delete(trackedElement), 500);
    if (trackExplicitEvent(trackedElement)) return;
  }

  const link = target.closest("a[href]");
  if (link instanceof HTMLAnchorElement) {
    trackLinkClick(link);
  }
});
