import { test, expect } from "@playwright/test";
import { setupDemoOwner, NAV_TIMEOUT } from "./helpers/auth";

test.describe("Owner Panel — Business Processes", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoOwner(page);
  });

  test("owner dashboard loads", async ({ page }) => {
    await page.goto("/owner/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner stations list loads", async ({ page }) => {
    await page.goto("/owner/stations");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner sessions page loads", async ({ page }) => {
    await page.goto("/owner/sessions");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner revenue page loads", async ({ page }) => {
    await page.goto("/owner/revenue");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner incidents page loads", async ({ page }) => {
    await page.goto("/owner/incidents");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner tariffs page loads", async ({ page }) => {
    await page.goto("/owner/tariffs");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner OCPP logs page loads", async ({ page }) => {
    await page.goto("/owner/logs");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner locations page loads", async ({ page }) => {
    await page.goto("/owner/locations");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner corporate groups page loads", async ({ page }) => {
    await page.goto("/owner/corporate");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner operators page loads", async ({ page }) => {
    await page.goto("/owner/operators");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("owner users page loads", async ({ page }) => {
    await page.goto("/owner/users");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });
});
