import { addBreadcrumb, captureMessage } from "../monitoring/sentry";
import { logger } from "../utils/logger";

function setupSwClientEvents() {
  if (!("serviceWorker" in navigator)) return;
  try {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = event.data || {};
      if (!data || data.source !== "rp-sw") return;
      const { type, payload } = data as {
        type?: string;
        payload?: Record<string, unknown>;
      };
      logger.info("[SW_EVENT]", { type, payload });
      addBreadcrumb({
        category: "service-worker",
        message: type || "unknown",
        data: payload,
        level: "info",
      });
      if (type === "OFFLINE_FALLBACK_USED") {
        captureMessage("SW offline fallback used");
      }
      if (type === "BG_SYNC_TRIGGER") {
        captureMessage("Background Sync triggered");
      }
    });
  } catch {
    // ignore
  }
}

setupSwClientEvents();
