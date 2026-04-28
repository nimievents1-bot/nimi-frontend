import { expect, test } from "@playwright/test";

/**
 * Smoke tests — load every primary marketing page and confirm:
 *   - 200 response
 *   - the brand wordmark renders
 *   - the page-specific headline is present
 *   - the persistent "Get in Touch" stamp is reachable
 *
 * These are the cheapest possible signals; if any of these fails, something
 * has badly regressed. Run on every PR.
 */

const PAGES: Array<{ path: string; headline: RegExp }> = [
  { path: "/", headline: /Where good food gathers\./ },
  { path: "/catering", headline: /Where good food gathers\./ },
  { path: "/events", headline: /Hosted with care\./ },
  { path: "/gifting", headline: /Made-to-order/i },
  { path: "/cravings", headline: /A small, monthly indulgence\./ },
  { path: "/about", headline: /A family kitchen/i },
  { path: "/faq", headline: /Frequently asked questions/i },
  { path: "/contact", headline: /Get in touch/i },
  { path: "/journal", headline: /Notes from the kitchen\./ },
  { path: "/privacy", headline: /Privacy policy/i },
  { path: "/terms", headline: /Terms & conditions/i },
];

for (const { path, headline } of PAGES) {
  test(`smoke: ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);

    // Wordmark always present.
    await expect(page.getByLabel(/Nimi Events/i).first()).toBeVisible();

    // Page-specific headline.
    await expect(page.getByRole("heading", { name: headline }).first()).toBeVisible();

    // Persistent "Get in Touch" stamp.
    const stamp = page.locator("a", { hasText: "Get in" });
    await expect(stamp.first()).toBeVisible();
  });
}

test("smoke: /api/health is 200", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { status: string };
  expect(body.status).toBe("ok");
});

test("smoke: 404 page renders", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /not on the menu/i })).toBeVisible();
});

test("smoke: security headers are set on the home page", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);

  const csp = res.headers()["content-security-policy"];
  expect(csp).toBeTruthy();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");

  expect(res.headers()["strict-transport-security"]).toMatch(/max-age=\d+/);
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
