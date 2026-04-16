import { test, expect } from "@playwright/test";
import { setupDemoAdmin, NAV_TIMEOUT } from "./helpers/auth";

test.describe("Admin Panel — Business Processes", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAdmin(page);
  });

  // ── Dashboard ──────────────────────────────────────────────
  test("dashboard loads with overview", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Red Charge").first()).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.locator("main")).toBeVisible();
  });

  // ── Stations ───────────────────────────────────────────────
  test("stations list page loads", async ({ page }) => {
    await page.goto("/admin/stations");
    await expect(page.getByText("Станции").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Sessions ───────────────────────────────────────────────
  test("sessions list page loads", async ({ page }) => {
    await page.goto("/admin/sessions");
    await expect(page.getByText("Сессии").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Partners ───────────────────────────────────────────────
  test("partners list page loads", async ({ page }) => {
    await page.goto("/admin/partners");
    await expect(page.getByText("Партнёры").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Clients ────────────────────────────────────────────────
  test("clients list page loads", async ({ page }) => {
    await page.goto("/admin/clients");
    await expect(page.getByText("Клиенты").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Analytics ──────────────────────────────────────────────
  test("analytics page loads", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page.getByText("Аналитика").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Revenue ────────────────────────────────────────────────
  test("revenue page loads", async ({ page }) => {
    await page.goto("/admin/revenue");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Tariffs ────────────────────────────────────────────────
  test("tariffs page loads", async ({ page }) => {
    await page.goto("/admin/tariffs");
    await expect(page.getByText("Тарифы").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Locations ──────────────────────────────────────────────
  test("locations page loads", async ({ page }) => {
    await page.goto("/admin/locations");
    await expect(page.getByText("Локации").first()).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── OCPP Logs ──────────────────────────────────────────────
  test("OCPP logs page loads", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Alerts ─────────────────────────────────────────────────
  test("alerts page loads", async ({ page }) => {
    await page.goto("/admin/alerts");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Reserves ───────────────────────────────────────────────
  test("reserves page loads", async ({ page }) => {
    await page.goto("/admin/reserves");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Reviews ────────────────────────────────────────────────
  test("reviews page loads", async ({ page }) => {
    await page.goto("/admin/reviews");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Settings ───────────────────────────────────────────────
  test("settings page loads", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Corporate ──────────────────────────────────────────────
  test("corporate groups page loads", async ({ page }) => {
    await page.goto("/admin/corporate");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Operators ──────────────────────────────────────────────
  test("operators page loads", async ({ page }) => {
    await page.goto("/admin/operators");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Users ──────────────────────────────────────────────────
  test("users page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  // ── Tools ──────────────────────────────────────────────────
  test("stress test page loads", async ({ page }) => {
    await page.goto("/admin/stress-test");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("station terminal page loads", async ({ page }) => {
    await page.goto("/admin/station-terminal");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("server logs page loads", async ({ page }) => {
    await page.goto("/admin/server-logs");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("error guide page loads", async ({ page }) => {
    await page.goto("/admin/error-guide");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });

  test("system map page loads", async ({ page }) => {
    await page.goto("/admin/system-map");
    await expect(page.locator("main")).toBeVisible({ timeout: NAV_TIMEOUT });
  });
});

test.describe("Admin Panel — Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAdmin(page);
  });

  test("sidebar shows all nav groups on desktop", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Инфраструктура")).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(sidebar.getByText("Бизнес")).toBeVisible();
    await expect(sidebar.getByText("Пользователи")).toBeVisible();
    await expect(sidebar.getByText("Система")).toBeVisible();
    await expect(sidebar.getByText("Инструменты")).toBeVisible();
  });

  test("sidebar has API Documentation link", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    const apiLink = sidebar.getByText("API Документация");
    await expect(apiLink).toBeVisible({ timeout: NAV_TIMEOUT });

    const anchor = sidebar.locator('a[target="_blank"]:has-text("API Документация")');
    await expect(anchor).toHaveAttribute("href", /\/scalar$/);
  });

  test("clicking sidebar item navigates to page", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await sidebar.getByText("Партнёры").click();
    await page.waitForURL(/\/admin\/partners/, { timeout: NAV_TIMEOUT });
    await expect(page).toHaveURL(/\/admin\/partners/);
  });
});

test.describe("Admin Panel — Responsive", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAdmin(page);
  });

  test("mobile viewport hides desktop sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Desktop sidebar should be hidden on mobile (has hidden lg:flex)
    const sidebar = page.locator("aside.hidden");
    await expect(sidebar).toBeHidden({ timeout: NAV_TIMEOUT });
    // Main content should still be visible
    await expect(page.locator("main")).toBeVisible();
  });
});
