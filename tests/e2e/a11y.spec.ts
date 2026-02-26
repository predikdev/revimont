import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { dismissCookieConsent } from "./helpers";

const routes = ["/", "/sluzby", "/kontakt"];

for (const route of routes) {
  test(`a11y smoke: ${route}`, async ({ page }) => {
    await page.goto(route);
    await dismissCookieConsent(page);

    const result = await new AxeBuilder({ page })
      .exclude("#cc-main")
      .exclude(".cf-turnstile")
      .disableRules(["color-contrast"])
      .analyze();

    const blockingViolations = result.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );

    expect(
      blockingViolations,
      blockingViolations
        .map((violation) => {
          const nodes = violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(" "))
            .join("; ");
          return `${violation.id} (${violation.impact}): ${nodes}`;
        })
        .join("\n"),
    ).toEqual([]);
  });
}
