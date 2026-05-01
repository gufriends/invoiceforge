import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("dashboard-page.png", { maxDiffPixelRatio: 0.02 });
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/dashboard");
    // Sidebar nav items
    await expect(page.getByRole("link", { name: /Invoice/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Klien/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Dashboard/ }).first()).toBeVisible();
  });
});
