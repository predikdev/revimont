import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { Resend } from "resend";
import { COMPANY } from "../data/company";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

// Formát: +420 123 456 789, +420123456789, 00420123456789, atd.
const czechPhoneRegex =
  /^(\+420|\+421|00420|00421)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{3}[\s.-]?[0-9]{3}$/;

const nullToEmptyString = (value: unknown): unknown =>
  value == null ? "" : value;

const schema = z.object({
  name: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(2, "Jméno musí mít alespoň 2 znaky"),
  ),
  phone: z.preprocess(
    nullToEmptyString,
    z
      .string()
      .trim()
      .refine((val) => !val || czechPhoneRegex.test(val), {
        message: "Neplatné telefonní číslo. Použijte formát +420 XXX XXX XXX",
      }),
  ),
  email: z.preprocess(
    nullToEmptyString,
    z.string().trim().email("Neplatná e-mailová adresa"),
  ),
  service: z.enum(["Elektroinstalace", "Revize", "Opravy a montáže", "Jiné"], {
    errorMap: () => ({ message: "Vyberte prosím typ služby" }),
  }),
  location: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(2, "Lokalita musí mít alespoň 2 znaky"),
  ),
  message: z.preprocess(
    nullToEmptyString,
    z.string().trim().min(10, "Zpráva musí mít alespoň 10 znaků"),
  ),
  privacy: z.literal("on", {
    errorMap: () => ({
      message: "Musíte souhlasit se zpracováním osobních údajů",
    }),
  }),
  "cf-turnstile-response": z.preprocess(
    nullToEmptyString,
    z.string().trim().min(1, "Ověření Turnstile selhalo"),
  ),
});

export const server = {
  poptavka: defineAction({
    accept: "form",
    input: schema,
    handler: async (input) => {
      const resend = getResendClient();

      // Ověření Turnstile tokenu
      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: import.meta.env.TURNSTILE_SECRET_KEY,
            response: input["cf-turnstile-response"],
          }),
        },
      );

      const verification = await turnstileResponse.json();

      if (!verification.success) {
        throw new Error("Turnstile verification failed");
      }

      // Formátování času v CZ
      const now = new Date().toLocaleString("cs-CZ", {
        timeZone: "Europe/Prague",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // HTML email s tabulkou
      const htmlContent = `
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

      // Odeslání emailu
      const emailResult = await resend.emails.send({
        from: "Revimont Web <poptavka@revimont-klatovy.cz>",
        to: COMPANY.email,
        replyTo: input.email,
        subject: `Nová poptávka od ${input.name} — ${input.service}`,
        html: htmlContent,
      });

      if (emailResult.error) {
        throw new Error(`Email sending failed: ${emailResult.error.message}`);
      }

      return { success: true };
    },
  }),
};

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
