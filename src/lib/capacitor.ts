/**
 * Capacitor — утилиты определения платформы и инициализации нативных плагинов
 */
import { Capacitor } from "@capacitor/core";
import { logger } from "@/shared/utils/logger";

/** Текущая платформа: 'web' | 'android' | 'ios' */
export const platform = Capacitor.getPlatform();

export const isNative = Capacitor.isNativePlatform();
export const isAndroid = platform === "android";
export const isIOS = platform === "ios";
export const isWeb = platform === "web";

/**
 * Инициализация нативных плагинов (вызывать при старте приложения).
 * На web-платформе — no-op для всех нативных API.
 */
export async function initCapacitor(): Promise<void> {
  if (!isNative) {
    logger.info("[Capacitor] Running on web — native plugins skipped");
    return;
  }

  logger.info(`[Capacitor] Initializing on ${platform}...`);

  try {
    // StatusBar — тёмный стиль, прозрачный фон
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: "#050507" });
    }
    logger.info("[Capacitor] StatusBar configured");
  } catch (e) {
    logger.warn("[Capacitor] StatusBar init failed:", e);
  }

  try {
    // Keyboard — автоматический resize
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("keyboard-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("keyboard-open");
    });
    logger.info("[Capacitor] Keyboard listeners registered");
  } catch (e) {
    logger.warn("[Capacitor] Keyboard init failed:", e);
  }

  try {
    // App — обработка deep links и back button
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
    logger.info("[Capacitor] App listeners registered");
  } catch (e) {
    logger.warn("[Capacitor] App init failed:", e);
  }

  logger.info("[Capacitor] Native plugins initialized");
}
