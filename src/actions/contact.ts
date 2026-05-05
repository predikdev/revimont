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
  });

  const row = (label: string, value: string, isLast = false) => `
    <tr>
      <td style="padding:14px 16px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;width:140px;vertical-align:top;${isLast ? "" : "border-bottom:1px solid #f3f4f6;"}">${label}</td>
      <td style="padding:14px 16px;color:#111827;font-size:15px;${isLast ? "" : "border-bottom:1px solid #f3f4f6;"}">${value}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-left:4px solid #d97706;padding-left:16px;">
                    <div style="font-size:20px;font-weight:700;color:#111827;line-height:1.3;">Nová poptávka</div>
                    <div style="font-size:13px;color:#9ca3af;margin-top:4px;">${now}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Contact info -->
                <tr>
                  <td style="padding:20px 16px 12px 16px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#d97706;">Kontakt</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${row("Jméno", escapeHtml(input.name))}
                      ${row("E-mail", `<a href="mailto:${escapeHtml(input.email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(input.email)}</a>`)}
                      ${row("Telefon", escapeHtml(input.phone || "—"), true)}
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 16px;">
                    <div style="border-top:2px solid #f3f4f6;margin:8px 0;"></div>
                  </td>
                </tr>

                <!-- Project info -->
                <tr>
                  <td style="padding:12px 16px 12px 16px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#d97706;">Poptávka</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${row("Služba", escapeHtml(input.service))}
                      ${row("Lokalita", escapeHtml(input.location), true)}
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 16px;">
                    <div style="border-top:2px solid #f3f4f6;margin:8px 0;"></div>
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td style="padding:12px 16px 12px 16px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#d97706;">Zpráva</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 16px 24px 16px;">
                    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;font-size:15px;color:#111827;line-height:1.6;">${escapeHtml(input.message).replace(/\n/g, "<br>")}</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 0 0;text-align:center;">
              <div style="font-size:12px;color:#9ca3af;">revimont-klatovy.cz</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
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
