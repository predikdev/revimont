const lightbox = document.getElementById("lightbox");
const image = document.getElementById(
  "lightbox-img",
) as HTMLImageElement | null;
const closeButton = document.getElementById("lightbox-close");
let lastFocused: Element | null = null;

if (lightbox && image && closeButton) {
  const getFocusable = () =>
    Array.from(
      lightbox.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      ),
    );

  const openLightbox = (src: string, alt: string) => {
    lastFocused = document.activeElement;
    image.src = src;
    image.alt = alt;
    lightbox.classList.remove("hidden");
    lightbox.classList.add("flex");
    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.add("hidden");
    lightbox.classList.remove("flex");
    image.src = "";
    document.documentElement.classList.remove("no-scroll");
    document.body.classList.remove("no-scroll");

    if (lastFocused instanceof HTMLElement) {
      lastFocused.focus();
    }
  };

  document
    .querySelectorAll<HTMLElement>("[data-lightbox-src]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const src = button.dataset.lightboxSrc;
        if (!src) return;

        openLightbox(src, button.dataset.lightboxAlt ?? "");
      });
    });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("hidden")) return;

    if (event.key === "Escape") {
      closeLightbox();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
