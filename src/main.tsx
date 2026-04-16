import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { logger } from "./shared/utils/logger";
import "./shared/utils/errorMonitoring";
import { initSentry, SentryErrorBoundary } from "./shared/monitoring/sentry";
import {
  initializePlatformServices,
  registerPlatformHandlers,
} from "./lib/platform/init";
import "./shared/monitoring/swClientEvents";
import { initInstallPromptCapture } from "./features/pwa/install/installPromptStore";
import { initCapacitor } from "./lib/capacitor";

// Register service worker using VitePWA
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    logger.info("New content available, please refresh.");
  },
  onOfflineReady() {
    logger.info("App ready to work offline");
  },
  onRegistered(registration) {
    logger.info("SW registered:", registration);
  },
  onRegisteredSW(swScriptUrl) {
    logger.info("SW registered:", swScriptUrl);
  },
  onRegisterError(error) {
    logger.error("SW registration error:", error);
  },
});

// Инициализируем Sentry (STUB активен без @sentry/react, реальная отправка после установки пакета)
initSentry();

// Инициализируем платформенные сервисы
initializePlatformServices().then(() => {
  registerPlatformHandlers();
  logger.info("Platform services ready");
});

// Инициализируем Capacitor (нативные плагины для Android/iOS)
initCapacitor();

// Инициализируем перехват beforeinstallprompt для явной установки из настроек
initInstallPromptCapture();

createRoot(document.getElementById("root")!).render(
  <SentryErrorBoundary>
    <App />
  </SentryErrorBoundary>,
);
