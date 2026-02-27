import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { dismissCookieConsent } from "./helpers";

const pages = [
  {
    path: "/",
    expectedUrl: /\/$/,
  },
  {
    path: "/sluzby",
    expectedUrl: /\/sluzby\/?$/,
    assertions: async (page: Page) => {
      await expect(
        page.getByRole("heading", {
          name: /potřebujete revizi, novou instalaci nebo opravu/i,
        }),
      ).toBeVisible();
    },
  },
  {
    path: "/kontakt",
    expectedUrl: /\/kontakt\/?$/,
    assertions: async (page: Page) => {
      await expect(page.locator("#contact-form")).toBeVisible();
      await expect(page.locator("#contact-submit")).toBeVisible();
    },
  },
] satisfies ReadonlyArray<{
  path: string;
  expectedUrl: RegExp;
  assertions?: (page: Page) => Promise<void>;
}>;

for (const pageCase of pages) {
  test(`smoke: ${pageCase.path} renders core layout`, async ({ page }) => {
    await page.goto(pageCase.path);
    await dismissCookieConsent(page);

    await expect(page).toHaveURL(pageCase.expectedUrl);
    await expect(page.locator("#site-header")).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("footer").first()).toBeVisible();

    if (pageCase.assertions) {
      await pageCase.assertions(page);
    }
  });
}

test("contact form shows validation errors on empty submit", async ({
  page,
}) => {
  await page.goto("/kontakt");
  await dismissCookieConsent(page);

  await page.locator("#contact-submit").click();

  await expect(page.locator("#error-name")).toContainText("Jméno");
  await expect(page.locator("#error-service")).toContainText(
    "Vyberte prosím typ služby",
  );
  await expect(page.locator("#error-email")).toContainText(
    "Neplatná e-mailová adresa",
  );
  await expect(page.locator("#error-location")).toContainText("Lokalita");
  await expect(page.locator("#error-message")).toContainText(
    "Zpráva musí mít alespoň 10 znaků",
  );
  await expect(page.locator("#error-privacy")).toBeVisible();
  await expect(page.locator("#error-privacy")).not.toBeEmpty();
  await expect(page.locator("#error-turnstile")).toBeVisible();
  await expect(page.locator("#error-turnstile")).not.toBeEmpty();
});
