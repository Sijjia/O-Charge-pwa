import { test, expect } from "@playwright/test";
import { setupDemoClient, NAV_TIMEOUT } from "./helpers/auth";

test.describe("Client — Map & Stations", () => {
  test("home page (map) renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("stations list page loads", async ({ page }) => {
    await page.goto("/stations");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("QR scanner page loads", async ({ page }) => {
    await page.goto("/qr-scanner");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Client — Charging Flow", () => {
  test("charging page loads", async ({ page }) => {
    await page.goto("/charging");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("charging page with station ID loads", async ({ page }) => {
    await page.goto("/charging/st-001");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("charging process page loads", async ({ page }) => {
    await page.goto("/charging-process/session-001");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("charging complete page loads", async ({ page }) => {
    await page.goto("/charging-complete/session-001");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Client — Balance & Payments", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoClient(page);
  });

  test("payments page renders", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("topup page loads", async ({ page }) => {
    await page.goto("/topup");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("topup success page loads", async ({ page }) => {
    await page.goto("/topup/success");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Client — History & Profile", () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoClient(page);
  });

  test("history page loads", async ({ page }) => {
    await page.goto("/history");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("profile edit page loads", async ({ page }) => {
    await page.goto("/profile/edit");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("notification settings page loads", async ({ page }) => {
    await page.goto("/settings/notifications");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Client — Info Pages", () => {
  test("about page shows app info", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("О приложении")).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.getByText("Red Petroleum EV")).toBeVisible();
  });

  test("support page loads", async ({ page }) => {
    await page.goto("/support");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("install page loads", async ({ page }) => {
    await page.goto("/install");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Client — Error States", () => {
  test("low balance error page loads", async ({ page }) => {
    await page.goto("/error/balance");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("charging error page loads", async ({ page }) => {
    await page.goto("/error/charging");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("connectors busy page loads", async ({ page }) => {
    await page.goto("/error/connectors");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("station unavailable page loads", async ({ page }) => {
    await page.goto("/error/station");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("payment error page loads", async ({ page }) => {
    await page.goto("/error/payment");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("offline error page loads", async ({ page }) => {
    await page.goto("/error/offline");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("limit reached page loads", async ({ page }) => {
    await page.goto("/error/limit");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("app update required page loads", async ({ page }) => {
    await page.goto("/error/update");
    await expect(page.locator("#root")).toBeVisible();
  });
});
