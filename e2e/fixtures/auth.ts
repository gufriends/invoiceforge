import { test as base, type Page } from "@playwright/test";

// E2E test user — local/CI only, no production access
export const E2E_EMAIL = "e2e@invoiceforge.test";
export const E2E_PASSWORD = "E2eTestPassword123!";

export async function loginAsTestUser(page: Page) {
  await page.goto("/login");
  await page.fill("#email", E2E_EMAIL);
  await page.fill("#password", E2E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export const test = base.extend({});
export { expect } from "@playwright/test";
