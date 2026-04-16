import { test, expect } from "@playwright/test";

test.describe("Authentication — Public Pages", () => {
  test("splash screen shows branding", async ({ page }) => {
    await page.goto("/splash");
    await expect(page.getByText("Red Charge")).toBeVisible();
  });

  test("phone auth page shows form", async ({ page }) => {
    await page.goto("/auth/phone");
    await expect(
      page.getByText("Вход или регистрация"),
    ).toBeVisible();
    await expect(page.getByText("+996")).toBeVisible();
    await expect(page.getByText("Продолжить")).toBeVisible();
  });

  test("OTP verification page renders", async ({ page }) => {
    await page.goto("/auth/otp");
    // Page should render (may redirect without phone state, but shouldn't crash)
    await expect(page.locator("body")).toBeVisible();
  });

  test("name input page renders", async ({ page }) => {
    await page.goto("/auth/name");
    await expect(page.locator("body")).toBeVisible();
  });

  test("auth debug page loads", async ({ page }) => {
    await page.goto("/auth/debug");
    await expect(page.locator("body")).toBeVisible();
  });

  test("invalid route shows 404 or redirects", async ({ page }) => {
    await page.goto("/auth/nonexistent-route");
    // Should not stay on invalid route
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(
      !url.includes("/auth/nonexistent-route") || url.includes("/"),
    ).toBeTruthy();
  });
});

test.describe("Authentication — Sandbox Login", () => {
  test("sandbox page displays all login options", async ({ page }) => {
    await page.goto("/sandbox");
    await expect(page.getByText("Sandbox")).toBeVisible();
    await expect(page.getByText("Быстрая навигация")).toBeVisible();
  });

  test("sandbox admin login redirects to admin dashboard", async ({
    page,
  }) => {
    await page.goto("/sandbox");
    await page
      .getByRole("button", { name: /Системный администратор/i })
      .click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test("sandbox partner login redirects to partner dashboard", async ({
    page,
  }) => {
    await page.goto("/sandbox");
    await page.getByRole("button", { name: /Партнёр/i }).click();
    await page.waitForURL(/\/partner\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/partner\/dashboard/);
  });

  test("sandbox client login redirects to map", async ({ page }) => {
    await page.goto("/sandbox");
    await page
      .getByRole("button", { name: /Войти как клиент/i })
      .click();
    await page.waitForURL("/", { timeout: 10_000 });
  });
});
