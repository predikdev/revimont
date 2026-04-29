import { actions, isInputError } from "astro:actions";
import {
  CONTACT_ERROR_MESSAGES,
  CONTACT_SERVICE_OPTIONS,
  CZECH_PHONE_REGEX,
} from "../data/contact-form";

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: string;
  language?: string;
  size?: "normal" | "compact" | "invisible";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

interface TurnstileApi {
  render(
    container: string | HTMLElement,
    options: TurnstileRenderOptions,
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  getResponse(widgetId: string): string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const form = document.getElementById("contact-form") as HTMLFormElement | null;
const submitBtn = document.getElementById(
  "contact-submit",
) as HTMLButtonElement | null;
const turnstileContainer = document.getElementById(
  "contact-turnstile",
) as HTMLDivElement | null;
const successPanel = document.getElementById(
  "contact-success",
) as HTMLDivElement | null;
const errorBanner = document.getElementById(
  "form-error-banner",
) as HTMLDivElement | null;
const errorText = document.getElementById(
  "form-error-text",
) as HTMLParagraphElement | null;

if (
  form &&
  submitBtn &&
  turnstileContainer &&
  successPanel &&
  errorBanner &&
  errorText
) {
  const defaultLabel =
    submitBtn.getAttribute("data-default-label") || "Odeslat zprávu →";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";

  let turnstileWidgetId: string | null = null;
  let turnstileInitPromise: Promise<void> | null = null;
  let turnstileTokenResolver: ((token: string) => void) | null = null;
  let turnstileTokenRejecter: ((reason?: unknown) => void) | null = null;
  let turnstileScriptPromise: Promise<void> | null = null;

  const loadTurnstileScript = (): Promise<void> => {
    if (turnstileScriptPromise) return turnstileScriptPromise;
    if (window.turnstile) return Promise.resolve();

    turnstileScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });

    return turnstileScriptPromise;
  };

  const scrollToElement = (element: HTMLElement) => {
    element.focus();
    element.scrollIntoView({
      behavior: scrollBehavior,
      block: "center",
    });
  };

  const showFieldError = (
    field: string,
    message: string,
    firstErrorRef: { element: HTMLElement | null },
  ) => {
    const errorElementId =
      field === "cf-turnstile-response" ? "error-turnstile" : `error-${field}`;
    const inputElementId =
      field === "cf-turnstile-response"
        ? "contact-turnstile"
        : `contact-${field}`;
    const errorEl = document.getElementById(errorElementId);

    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.remove("hidden");

    if (!firstErrorRef.element) {
      firstErrorRef.element =
        document.getElementById(inputElementId) || errorEl;
    }
  };

  const clearErrors = () => {
    document.querySelectorAll("[id^='error-']").forEach((el) => {
      el.classList.add("hidden");
      el.textContent = "";
    });
    errorBanner.classList.add("hidden");
  };

  const readStringField = (formData: FormData, name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };

  const validateFormLocally = (formData: FormData) => {
    const errors: Array<{ field: string; message: string }> = [];
    const serviceOptions: readonly string[] = CONTACT_SERVICE_OPTIONS;

    const name = readStringField(formData, "name");
    const phone = readStringField(formData, "phone");
    const service = readStringField(formData, "service");
    const email = readStringField(formData, "email");
    const location = readStringField(formData, "location");
    const message = readStringField(formData, "message");
    const privacy = readStringField(formData, "privacy");

    if (name.length < 2) {
      errors.push({ field: "name", message: CONTACT_ERROR_MESSAGES.name });
    }

    if (phone && !CZECH_PHONE_REGEX.test(phone)) {
      errors.push({ field: "phone", message: CONTACT_ERROR_MESSAGES.phone });
    }

    if (!serviceOptions.includes(service)) {
      errors.push({
        field: "service",
        message: CONTACT_ERROR_MESSAGES.service,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: "email", message: CONTACT_ERROR_MESSAGES.email });
    }

    if (location.length < 2) {
      errors.push({
        field: "location",
        message: CONTACT_ERROR_MESSAGES.location,
      });
    }

    if (message.length < 10) {
      errors.push({
        field: "message",
        message: CONTACT_ERROR_MESSAGES.message,
      });
    }

    if (privacy !== "on") {
      errors.push({
        field: "privacy",
        message: CONTACT_ERROR_MESSAGES.privacy,
      });
    }

    return errors;
  };

  const waitForTurnstileApi = async (): Promise<TurnstileApi> => {
    const timeoutAt = Date.now() + 10_000;

    while (!window.turnstile) {
      if (Date.now() > timeoutAt) {
        throw new Error("Turnstile API unavailable");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }

    return window.turnstile;
  };

  const ensureTurnstileWidget = async (): Promise<void> => {
    if (turnstileWidgetId) return;

    if (!turnstileInitPromise) {
      turnstileInitPromise = (async () => {
        await loadTurnstileScript();
        const turnstile = await waitForTurnstileApi();
        const sitekey = turnstileContainer.dataset.sitekey;

        if (!sitekey) {
          throw new Error("Missing Turnstile site key");
        }

        turnstileWidgetId = turnstile.render(turnstileContainer, {
          sitekey,
          language: turnstileContainer.dataset.language || "cs",
          theme: turnstileContainer.dataset.theme || "light",
          size: "invisible",
          callback: (token: string) => {
            if (turnstileTokenResolver) {
              turnstileTokenResolver(token);
              turnstileTokenResolver = null;
              turnstileTokenRejecter = null;
            }
          },
          "error-callback": () => {
            if (turnstileTokenRejecter) {
              turnstileTokenRejecter(new Error("Turnstile execution failed"));
              turnstileTokenResolver = null;
              turnstileTokenRejecter = null;
            }
          },
          "expired-callback": () => {},
        });
      })();
    }

    await turnstileInitPromise;
  };

  const requestTurnstileToken = async (): Promise<string> => {
    await ensureTurnstileWidget();
    const turnstile = window.turnstile;

    if (!turnstileWidgetId || !turnstile) {
      throw new Error("Turnstile widget not ready");
    }

    const widgetId = turnstileWidgetId;
    const existingToken = turnstile.getResponse(widgetId);
    if (existingToken) {
      return existingToken;
    }

    return await new Promise<string>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        turnstileTokenResolver = null;
        turnstileTokenRejecter = null;
        reject(new Error("Turnstile token timeout"));
      }, 10_000);

      turnstileTokenResolver = (token: string) => {
        window.clearTimeout(timeoutId);
        resolve(token);
      };

      turnstileTokenRejecter = (reason?: unknown) => {
        window.clearTimeout(timeoutId);
        reject(
          reason instanceof Error ? reason : new Error("Turnstile failed"),
        );
      };

      turnstile.execute(widgetId);
    });
  };

  form.addEventListener(
    "focusin",
    () => {
      void ensureTurnstileWidget().catch(() => {});
    },
    { once: true },
  );

  form.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();
    clearErrors();

    const localErrors = validateFormLocally(new FormData(form));
    if (localErrors.length > 0) {
      const firstErrorRef = { element: null as HTMLElement | null };
      for (const error of localErrors) {
        showFieldError(error.field, error.message, firstErrorRef);
      }

      if (firstErrorRef.element) {
        scrollToElement(firstErrorRef.element);
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Odesílání…";

    try {
      const token = await requestTurnstileToken();
      const formData = new FormData(form);
      formData.set("cf-turnstile-response", token);

      const result = await actions.poptavka(formData);

      if (result.error) {
        if (isInputError(result.error)) {
          const firstErrorRef = { element: null as HTMLElement | null };

          for (const [field, messages] of Object.entries(result.error.fields)) {
            if (!messages || messages.length === 0) continue;

            showFieldError(field, messages[0], firstErrorRef);
          }

          if (firstErrorRef.element) {
            scrollToElement(firstErrorRef.element);
          }
        } else {
          errorText.textContent =
            "Chyba při odesílání formuláře. Prosím, zkuste znovu.";
          errorBanner.classList.remove("hidden");
        }
      } else if (result.data?.success === false) {
        errorText.textContent = result.data.message;
        errorBanner.classList.remove("hidden");
      } else if (result.data?.success) {
        form.classList.add("hidden");
        successPanel.classList.remove("hidden");
        successPanel.scrollIntoView({
          behavior: scrollBehavior,
          block: "nearest",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      const isTurnstileError = errorMessage.toLowerCase().includes("turnstile");

      if (isTurnstileError) {
        const firstErrorRef = { element: null as HTMLElement | null };
        showFieldError(
          "cf-turnstile-response",
          CONTACT_ERROR_MESSAGES.turnstile,
          firstErrorRef,
        );

        if (firstErrorRef.element) {
          scrollToElement(firstErrorRef.element);
        } else {
          errorText.textContent =
            "Chyba při ověření formuláře. Prosím, zkuste to znovu.";
          errorBanner.classList.remove("hidden");
        }
      } else {
        errorText.textContent =
          "Chyba při odesílání formuláře. Prosím, zkuste to znovu.";
        errorBanner.classList.remove("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = defaultLabel;
      if (turnstileWidgetId && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId);
      }
    }
  });
}
