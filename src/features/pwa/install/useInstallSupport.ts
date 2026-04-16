import { useEffect, useSyncExternalStore, useState } from "react";
import {
  canPromptInstall,
  initInstallPromptCapture,
  promptInstall,
  subscribe,
} from "./installPromptStore";

export function useInstallSupport() {
  const canInstall = useSyncExternalStore(
    subscribe,
    canPromptInstall,
    canPromptInstall,
  );
  const [isStandalone, setStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    initInstallPromptCapture();
    setStandalone(
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
        // @ts-expect-error iOS Safari
        window.navigator.standalone === true,
    );
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in (window as unknown as Record<string, unknown>)),
    );
  }, []);

  return {
    canInstall,
    isStandalone,
    isIOS,
    promptInstall,
  };
}
