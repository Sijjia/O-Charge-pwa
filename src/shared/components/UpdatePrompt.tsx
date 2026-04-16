/**
 * UpdatePrompt Component
 *
 * Registers Service Worker and checks for updates silently.
 * No visible banner — updates apply on next page load.
 */

import { useRegisterSW } from "virtual:pwa-register/react";
import { logger } from "@/shared/utils/logger";

export const UpdatePrompt = () => {
  // SW registration only — no update banner shown to users
  useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      logger.info("[UpdatePrompt] SW registered:", { swUrl });

      // Check for updates every hour and auto-apply silently
      if (registration) {
        setInterval(
          () => {
            logger.debug("[UpdatePrompt] Checking for updates...");
            registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      logger.error("[UpdatePrompt] SW registration error", { error });
    },
  });

  // No visible UI — updates apply silently on next page load
  return null;
};
