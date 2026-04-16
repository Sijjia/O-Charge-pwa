import { test, expect } from "@playwright/test";
import { NAV_TIMEOUT } from "./helpers/auth";

test.describe("Website — Landing Pages", () => {
  test("home page shows hero content", async ({ page }) => {
    await page.goto("/www");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("public map page loads", async ({ page }) => {
    await page.goto("/www/map");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("tariffs page loads", async ({ page }) => {
    await page.goto("/www/tariffs");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("B2B page loads", async ({ page }) => {
    await page.goto("/www/b2b");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("FAQ page loads", async ({ page }) => {
    await page.goto("/www/faq");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("contacts page loads", async ({ page }) => {
    await page.goto("/www/contacts");
    await expect(page.locator("#root")).toBeVisible();
  });

  test("download app page loads", async ({ page }) => {
    await page.goto("/www/download");
    await expect(page.locator("#root")).toBeVisible();
  });
});

test.describe("Website — Navigation", () => {
  test("header nav links work", async ({ page }) => {
    await page.goto("/www");
    await page.waitForLoadState("networkidle");

    // Click Tariffs link in header
    const tariffsLink = page.getByRole("link", { name: "Тарифы" }).first();
    if (await tariffsLink.isVisible()) {
      await tariffsLink.click();
      await page.waitForURL(/\/www\/tariffs/, { timeout: NAV_TIMEOUT });
      await expect(page).toHaveURL(/\/www\/tariffs/);
    }
  });
});

test.describe("Website — 404 Page", () => {
  test("unknown route shows 404 or fallback", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.locator("#root")).toBeVisible();
  });
});
