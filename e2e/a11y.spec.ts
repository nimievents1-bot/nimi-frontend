import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility tests — run axe on the most-visited public pages and the
 * authentication pages. Build fails on serious or critical violations.
 *
 * We exclude the third-party Cloudflare Turnstile widget from the scan
 * (it has known minor issues outside our control) and the Stripe iframe
 * if it's mounted on the page.
 */

const PAGES = [
  { path: "/", name: "home" },
  { path: "/catering", name: "catering" },
  { path: "/events", name: "events" },
  { path: "/gifting", name: "gifting" },
  { path: "/cravings", name: "cravings" },
  { path: "/contact", name: "contact" },
  { path: "/faq", name: "faq" },
  { path: "/journal", name: "journal" },
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
];

for (const { path, name } of PAGES) {
  test(`a11y: ${name}`, async ({ page }) => {
    await page.goto(path);
    // Wait for the page to settle — fonts, hero, etc.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("iframe[src*='challenges.cloudflare.com']")
      .exclude("iframe[src*='js.stripe.com']")
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    if (blocking.length > 0) {
      // Surface the violations in the test report.
      for (const v of blocking) {
        // eslint-disable-next-line no-console
        console.log(`[a11y] ${name} → ${v.id} (${v.impact}): ${v.help}`);
        for (const node of v.nodes) {
          // eslint-disable-next-line no-console
          console.log(`         target: ${node.target.join(", ")}`);
          // eslint-disable-next-line no-console
          console.log(`         summary: ${node.failureSummary ?? ""}`);
        }
      }
    }

    expect(blocking, `Serious or critical a11y violations on ${name}`).toEqual([]);
  });
}
