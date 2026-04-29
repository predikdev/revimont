import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { Resend } from "resend";
import {
  CONTACT_ERROR_MESSAGES,
  CONTACT_SERVICE_OPTIONS,
  CZECH_PHONE_REGEX,
} from "../data/contact-form";

let resendClient: Resend | null = null;

type TurnstileVerificationResult = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  challenge_ts?: string;
};

type ContactActionResult =
  | { success: true }
  | { success: false; code: string; message: string };

const nullToEmptyString = (value: unknown): unknown =>
  value == null ? "" : value;

const contactSchema = z.object({
  name: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(2, CONTACT_ERROR_MESSAGES.name),
  ),
  phone: z.preprocess(
    nullToEmptyString,
    z
      .string()
      .trim()
      .refine((val) => !val || CZECH_PHONE_REGEX.test(val), {
        message: CONTACT_ERROR_MESSAGES.phone,
      }),
  ),
  email: z.preprocess(
    nullToEmptyString,
    z.string().trim().email(CONTACT_ERROR_MESSAGES.email),
  ),
  service: z.enum(CONTACT_SERVICE_OPTIONS, {
    errorMap: () => ({ message: CONTACT_ERROR_MESSAGES.service }),
  }),
  location: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(2, CONTACT_ERROR_MESSAGES.location),
  ),
  message: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(10, CONTACT_ERROR_MESSAGES.message),
  ),
  privacy: z.literal("on", {
    errorMap: () => ({ message: CONTACT_ERROR_MESSAGES.privacy }),
  }),
  "cf-turnstile-response": z.preprocess(
    nullToEmptyString,
    z.string().trim().min(1, CONTACT_ERROR_MESSAGES.turnstile),
  ),
});

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

async function verifyTurnstile(token: string): Promise<ContactActionResult> {
  const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;

  if (!turnstileSecret) {
    return {
      success: false,
      code: "turnstile_secret_missing",
      message: "Chybí TURNSTILE_SECRET_KEY na serveru.",
    };
  }

  const turnstileResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: token,
      }),
    },
  );

  const verification =
    (await turnstileResponse.json()) as TurnstileVerificationResult;

  if (verification.success) {
    return { success: true };
  }

  const errorCodes = verification["error-codes"]?.join(", ") || "unknown";

  console.error("Turnstile verification failed", {
    errorCodes: verification["error-codes"],
    hostname: verification.hostname,
    challengeTs: verification.challenge_ts,
  });

  return {
    success: false,
    code: `turnstile_${errorCodes}`,
    message: `Ověření Turnstile selhalo (${errorCodes}).`,
  };
}

function buildContactEmailHtml(input: z.infer<typeof contactSchema>): string {
  const now = new Date().toLocaleString("cs-CZ", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border-bottom: 1px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .header { color: #d97706; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    .timestamp { color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">Nová poptávka ze webových stránek</div>

  <table>
    <tr>
      <th>Jméno a příjmení</th>
      <td>${escapeHtml(input.name)}</td>
    </tr>
    <tr>
      <th>E-mail</th>
      <td><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></td>
    </tr>
    <tr>
      <th>Telefon</th>
      <td>${escapeHtml(input.phone || "—")}</td>
    </tr>
    <tr>
      <th>Typ služby</th>
      <td>${escapeHtml(input.service)}</td>
    </tr>
    <tr>
      <th>Lokalita</th>
      <td>${escapeHtml(input.location)}</td>
    </tr>
    <tr>
      <th>Zpráva</th>
      <td>${escapeHtml(input.message).replace(/\n/g, "<br>")}</td>
    </tr>
  </table>

  <div class="timestamp">Obdrženo: ${now}</div>
</body>
</html>
      `;
}

export const poptavka = defineAction({
  accept: "form",
  input: contactSchema,
  handler: async (input): Promise<ContactActionResult> => {
    try {
      const contactFormToEmail = import.meta.env.CONTACT_FORM_TO_EMAIL?.trim();

      if (!contactFormToEmail) {
        return {
          success: false,
          code: "contact_form_to_email_missing",
          message: "Chybí CONTACT_FORM_TO_EMAIL na serveru.",
        };
      }

      const turnstileResult = await verifyTurnstile(
        input["cf-turnstile-response"],
      );
      if (!turnstileResult.success) return turnstileResult;

      const resend = getResendClient();
      const resendFromEmail =
        import.meta.env.RESEND_FROM_EMAIL?.trim() ||
        "Revimont Web <poptavka@kontakt.revimont-klatovy.cz>";

      const emailResult = await resend.emails.send({
        from: resendFromEmail,
        to: contactFormToEmail,
        replyTo: input.email,
        subject: `Nová poptávka od ${input.name} — ${input.service}`,
        html: buildContactEmailHtml(input),
      });

      if (emailResult.error) {
        console.error("Resend email send failed", {
          message: emailResult.error.message,
          name: emailResult.error.name,
        });

        return {
          success: false,
          code: "resend_send_failed",
          message: `Odeslání e-mailu selhalo (${emailResult.error.message}).`,
        };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      console.error("Contact form action failed", { message });
      return {
        success: false,
        code: "server_unexpected_error",
        message: `Serverová chyba (${message}).`,
      };
    }
  },
});

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
