import { test, expect } from "@playwright/test";

test.describe("Guest Charging Flow", () => {
  test("guest landing page loads for station", async ({ page }) => {
    await page.goto("/guest/st-001");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("guest phone page loads", async ({ page }) => {
    await page.goto("/guest/phone");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("guest payment page loads", async ({ page }) => {
    await page.goto("/guest/payment");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("guest QR payment page loads", async ({ page }) => {
    await page.goto("/guest/payment/qr");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("guest charging session page loads", async ({ page }) => {
    await page.goto("/guest/charging/session-001");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("guest completion page loads", async ({ page }) => {
    await page.goto("/guest/complete/session-001");
    await expect(page.locator("#root")).toBeVisible();
  });
});
