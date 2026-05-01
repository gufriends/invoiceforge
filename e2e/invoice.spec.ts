import { test, expect } from "@playwright/test";

test.describe("Invoices", () => {
  test("invoice list page renders", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page).toHaveURL(/\/invoices/);
    // Should have tab filters and main content area
    await expect(page.getByRole("tab", { name: "Semua" })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("invoice-list-page.png", { maxDiffPixelRatio: 0.02 });
  });

  test("create invoice form renders", async ({ page }) => {
    await page.goto("/invoices/create");
    await expect(page).toHaveURL(/\/invoices\/create/);
    await expect(page.locator("form")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("invoice-create-page.png", { maxDiffPixelRatio: 0.02 });
  });
});
