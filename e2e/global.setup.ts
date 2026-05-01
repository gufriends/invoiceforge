import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

// E2E test user — local/CI only, no production access
const E2E_EMAIL = "e2e@invoiceforge.test";
const E2E_PASSWORD = "E2eTestPassword123!";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", E2E_EMAIL);
  await page.fill("#password", E2E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await page.context().storageState({ path: authFile });
});
