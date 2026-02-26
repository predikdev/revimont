import type { Page } from "@playwright/test";

export async function dismissCookieConsent(page: Page): Promise<void> {
  const candidates = [
    page.getByRole("button", { name: "Pouze nutné" }),
    page.getByRole("button", { name: "Přijmout vše" }),
  ];

  for (const button of candidates) {
    try {
      if (await button.isVisible({ timeout: 1_000 })) {
        await button.click();
        return;
      }
    } catch {
      // Banner may be hidden already or not rendered yet.
    }
  }
}
