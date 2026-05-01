import { test, expect } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "./fixtures/auth";

test.describe("Auth flows", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Masuk");
    await expect(page).toHaveScreenshot("login-page.png", { maxDiffPixelRatio: 0.02 });
  });

  test("login success redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", E2E_EMAIL);
    await page.fill("#password", E2E_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("login fail shows error toast", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", E2E_EMAIL);
    await page.fill("#password", "wrongpassword123");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Email atau password salah")).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("register form renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page).toHaveScreenshot("register-page.png", { maxDiffPixelRatio: 0.02 });
  });

  test("forgot password form renders correctly", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page).toHaveScreenshot("forgot-password-page.png", { maxDiffPixelRatio: 0.02 });
  });
});
