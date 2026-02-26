# Revimont Web

Web prezentace firmy Revimont (Astro + Tailwind CSS) s kontaktním formulářem, cookie consentem a základními automatickými kontrolami kvality.

## Stack

- `Astro 5`
- `Tailwind CSS 4` (přes `@tailwindcss/vite`)
- `TypeScript`
- `Vercel adapter` (`@astrojs/vercel`)
- `Resend` (odesílání poptávek)
- `Cloudflare Turnstile` (anti-spam ve formuláři)

## Požadavky

- `Node.js 20+`
- `pnpm 10+`

## Lokální spuštění

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Aplikace poběží na `http://localhost:4321`.

## Environment proměnné

Projekt používá proměnné z `.env` (viz `.env.example`):

- `RESEND_API_KEY` - API klíč pro odesílání e-mailů přes Resend
- `PUBLIC_TURNSTILE_SITE_KEY` - veřejný klíč Cloudflare Turnstile (bezpečný pro klient)
- `TURNSTILE_SECRET_KEY` - privátní klíč Cloudflare Turnstile (server-only)

Poznámka:

- Proměnné s prefixem `PUBLIC_` jsou dostupné i v browseru.

## Skripty

| Příkaz                  | Co dělá                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`              | Spustí lokální vývojový server                                                  |
| `pnpm build`            | Produkční build do `dist/`                                                      |
| `pnpm preview`          | Lokální preview buildu                                                          |
| `pnpm check:types`      | `astro check` (typy + Astro diagnostika)                                        |
| `pnpm lint`             | ESLint kontrola (`.astro`, TS/JS)                                               |
| `pnpm lint:fix`         | ESLint auto-fix                                                                 |
| `pnpm format`           | Prettier formátování                                                            |
| `pnpm format:check`     | Kontrola formátování bez změn                                                   |
| `pnpm ci`               | Kompletní statické kontroly (`lint` + `format:check` + `astro check` + `build`) |
| `pnpm test:e2e:install` | Nainstaluje Playwright Chromium browser                                         |
| `pnpm test:e2e`         | Spustí Playwright smoke + a11y testy                                            |
| `pnpm test:e2e:headed`  | Spustí Playwright testy s viditelným browserem                                  |

## Kvalita kódu a workflow

Projekt má nastavené:

- `ESLint` pro JS/TS/Astro
- `Prettier` (+ Astro + Tailwind plugin)
- `Husky` + `lint-staged` (`pre-commit` hook)
- GitHub Actions CI (`.github/workflows/ci.yml`)

Co to znamená v praxi:

- při commitu se na změněných souborech spustí lint/format (`pre-commit`)
- v CI se pouští statické kontroly a E2E smoke testy

## E2E a a11y testy (Playwright)

Testy jsou v `tests/e2e/` a aktuálně pokrývají:

- smoke testy hlavních stránek (`/`, `/sluzby`, `/kontakt`)
- základní validaci kontaktního formuláře
- základní a11y smoke kontrolu přes `axe` (závažnosti `serious` / `critical`)

První spuštění lokálně:

```sh
pnpm run test:e2e:install
pnpm run test:e2e
```

Poznámka:

- V některých sandbox/cloud prostředích může selhat stažení Playwright browseru kvůli síťovým omezením.

## Deployment

Projekt je připravený pro deployment na Vercel (`@astrojs/vercel` + `vercel.json`).

Před deploymentem doporučeno spustit:

```sh
pnpm run ci
pnpm run test:e2e
```
