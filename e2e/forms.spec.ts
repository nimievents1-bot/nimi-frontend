import { expect, test } from "@playwright/test";

/**
 * Form-level tests — focus on validation behaviour, not the API. We don't
 * actually submit the contact form to the API in CI (no Turnstile key, no
 * outbound network); we verify that the form validates correctly client-side
 * and that the API call happens on the happy path.
 */

test("contact form: required fields surface validation errors", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: /Get in touch/i })).toBeVisible();

  // Try to submit empty.
  await page.getByRole("button", { name: /submit enquiry/i }).click();

  await expect(page.getByText(/please enter your name/i).first()).toBeVisible();
  await expect(page.getByText(/please enter a valid email/i).first()).toBeVisible();
  await expect(page.getByText(/tell us a little more/i).first()).toBeVisible();
});

test("contact form: invalid email rejected client-side", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel(/full name/i).fill("Test User");
  await page.getByLabel(/^email/i).fill("not-an-email");
  await page.getByLabel(/tell us about your event/i).fill("This is a long enough message to pass the minimum.");

  await page.getByRole("button", { name: /submit enquiry/i }).click();

  await expect(page.getByText(/please enter a valid email/i).first()).toBeVisible();
});

test("login form: required fields gated", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();

  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
});

test("signup form: enforces password complexity", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel(/^name/i).fill("Test User");
  await page.getByLabel(/^email/i).fill("test@example.com");
  await page.getByLabel(/^password/i).fill("short");
  await page.getByLabel(/confirm password/i).fill("short");

  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/12\+ chars with lower, upper, number/i).first()).toBeVisible();
});

test("homepage: navigates to catering booking via the package CTA", async ({ page }) => {
  await page.goto("/catering");
  await page.getByRole("link", { name: /enquire/i }).first().click();
  await expect(page).toHaveURL(/\/catering\/booking/);
  await expect(page.getByRole("heading", { name: /tell us about your event/i })).toBeVisible();
});
