import { test, expect, type Page } from "@playwright/test";
import { setupDemoAdmin } from "./helpers/auth";

async function gotoSimulator(page: Page) {
  await page.goto("/admin/simulator");
  await expect(
    page.locator("text=Симулятор станции"),
  ).toBeVisible({ timeout: 20000 });
}

test.describe("Admin Station Simulator Page", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAdmin(page);
  });

  test("should load without infinite loop or redirect", async ({ page }) => {
    await page.goto("/admin/simulator");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/admin/simulator");
    await expect(
      page.locator("text=Симулятор станции"),
    ).toBeVisible({ timeout: 20000 });
  });

  test("should display connection panel with station ID input", async ({ page }) => {
    await gotoSimulator(page);
    const stationInput = page.locator('input[type="text"]').first();
    await expect(stationInput).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
    await expect(page.getByRole("button", { name: "Подключить" })).toBeVisible();
  });

  test("should show offline status badge initially", async ({ page }) => {
    await gotoSimulator(page);
    await expect(page.locator("text=Offline")).toBeVisible();
  });

  test("should display empty state when simulator is not active", async ({ page }) => {
    await gotoSimulator(page);
    await expect(
      page.locator("text=Симулятор не запущен"),
    ).toBeVisible();
  });

  test("should not produce console errors related to CSRF", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await gotoSimulator(page);
    await page.waitForTimeout(3000);
    const csrfErrors = consoleErrors.filter(
      (e) => e.includes("csrf_origin") || e.includes("csrf_failed"),
    );
    expect(csrfErrors).toHaveLength(0);
  });

  test("should not redirect away within 5 seconds (no loop)", async ({ page }) => {
    await gotoSimulator(page);
    expect(page.url()).toContain("/admin/simulator");
    await page.waitForTimeout(5000);
    expect(page.url()).toContain("/admin/simulator");
    await expect(page.locator("text=Симулятор станции")).toBeVisible();
  });

  test("should have default station ID RP-BSH-001", async ({ page }) => {
    await gotoSimulator(page);
    const stationInput = page.locator('input[type="text"]').first();
    await expect(stationInput).toHaveValue("RP-BSH-001");
  });

  test("should have connector selector with 4 options", async ({ page }) => {
    await gotoSimulator(page);
    const select = page.locator("select");
    await expect(select).toBeVisible();
    const options = select.locator("option");
    await expect(options).toHaveCount(4);
  });
});
