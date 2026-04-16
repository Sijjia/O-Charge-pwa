/**
 * Инициализация платформенных сервисов - PWA version
 * PWA не требует инициализации нативных плагинов (SplashScreen, StatusBar, App)
 */

import { logger } from "@/shared/utils/logger";

/**
 * Инициализирует все платформенные сервисы при запуске приложения
 * PWA: Заглушка - браузер управляет всем автоматически
 */
export const initializePlatformServices = async () => {
  try {
    logger.info("Platform: Initializing PWA services", {
      platform: "web",
      isNative: false,
      userAgent: navigator.userAgent,
    });

    // В PWA не нужны SplashScreen, StatusBar и другие нативные плагины
    // Браузер/OS управляет всем автоматически

    logger.info("Platform: PWA services initialized successfully");
  } catch (error) {
    logger.error("Platform: Initialization error", error);
  }
};

/**
 * Регистрирует обработчики для платформенных событий
 * PWA: Заглушка - браузер управляет навигацией
 */
export const registerPlatformHandlers = () => {
  logger.info("Platform: PWA handlers registered");

  // В PWA нет Android back button и app state events
  // Браузер управляет history API и visibility API автоматически

  // Опционально можно добавить обработчики для PWA-специфичных событий:
  // - beforeinstallprompt (для установки PWA)
  // - appinstalled (когда PWA установлено)
  // - visibilitychange (когда вкладка становится активной/неактивной)

  // Обработка события установки PWA
  window.addEventListener("beforeinstallprompt", () => {
    logger.info("Platform: PWA install prompt available");
    // Можно сохранить событие для показа кастомного диалога установки
  });

  window.addEventListener("appinstalled", () => {
    logger.info("Platform: PWA successfully installed");
  });

  // Обработка visibility change (аналог appStateChange в Capacitor)
  document.addEventListener("visibilitychange", () => {
    const isVisible = document.visibilityState === "visible";
    logger.debug("Platform: Visibility changed", { isVisible });

    if (isVisible) {
      // Приложение стало видимым
      // Можно возобновить polling или обновить данные
    } else {
      // Приложение скрыто
      // Можно приостановить операции для экономии ресурсов
    }
  });
};
