import { test, expect } from "@playwright/test";
import { setupDemoPartner, NAV_TIMEOUT } from "./helpers/auth";

test.describe("Partner Panel — Business Processes", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoPartner(page);
  });

  test("partner dashboard loads", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Обзор").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("partner stations page loads", async ({ page }) => {
    await page.goto("/partner/stations");
    await expect(page.getByText("Станции").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("partner sessions page loads", async ({ page }) => {
    await page.goto("/partner/sessions");
    await expect(page.getByText("Сессии").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("partner revenue page loads", async ({ page }) => {
    await page.goto("/partner/revenue");
    await expect(page.getByText("Доходы").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("partner settings page loads", async ({ page }) => {
    await page.goto("/partner/settings");
    await expect(page.getByText("Настройки").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });
});

test.describe("Partner Panel — Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoPartner(page);
  });

  test("sidebar shows all 5 nav items", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Обзор")).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(sidebar.getByText("Станции")).toBeVisible();
    await expect(sidebar.getByText("Сессии")).toBeVisible();
    await expect(sidebar.getByText("Доходы")).toBeVisible();
    await expect(sidebar.getByText("Настройки")).toBeVisible();
  });

  test("clicking sidebar item navigates", async ({ page }) => {
    await page.goto("/partner/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await sidebar.getByText("Станции").click();
    await page.waitForURL(/\/partner\/stations/, { timeout: NAV_TIMEOUT });
    await expect(page).toHaveURL(/\/partner\/stations/);
  });
});
