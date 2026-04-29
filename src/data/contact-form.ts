export const CONTACT_SERVICE_OPTIONS = [
  "Elektroinstalace",
  "Revize",
  "Opravy a montáže",
  "Jiné",
] as const;

export type ContactService = (typeof CONTACT_SERVICE_OPTIONS)[number];

export const CZECH_PHONE_REGEX =
  /^(\+420|\+421|00420|00421)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{3}[\s.-]?[0-9]{3}$/;

export const CONTACT_ERROR_MESSAGES = {
  name: "Jméno musí mít alespoň 2 znaky",
  phone: "Neplatné telefonní číslo. Použijte formát +420 XXX XXX XXX",
  service: "Vyberte prosím typ služby",
  email: "Neplatná e-mailová adresa",
  location: "Lokalita musí mít alespoň 2 znaky",
  message: "Zpráva musí mít alespoň 10 znaků",
  privacy: "Musíte souhlasit se zpracováním osobních údajů",
  turnstile: "Ověření Turnstile selhalo",
} as const;
