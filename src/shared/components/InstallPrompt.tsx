import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { addBreadcrumb, captureMessage } from "@/shared/monitoring/sentry";

// beforeinstallprompt is not yet in TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Определяем iOS устройства
const isIOSDevice = (): boolean => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in (window as unknown as Record<string, unknown>))
  );
};

// Определяем браузер на iOS
type IOSBrowser = "safari" | "chrome" | "firefox" | "other";

const getIOSBrowser = (): IOSBrowser => {
  const ua = navigator.userAgent;
  if (/CriOS/.test(ua)) return "chrome";
  if (/FxiOS/.test(ua)) return "firefox";
  if (/Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) return "safari";
  return "other";
};

// Инструкции для разных браузеров на iOS
const getIOSInstallInstructions = (
  browser: IOSBrowser,
): { icon: "share" | "menu"; text: string } => {
  switch (browser) {
    case "safari":
      return {
        icon: "share",
        text: "Нажмите «Поделиться» внизу экрана, затем «На экран Домой»",
      };
    case "chrome":
      return {
        icon: "menu",
        text: "Нажмите «...» вверху экрана, затем «Добавить на главный экран»",
      };
    case "firefox":
      return {
        icon: "menu",
        text: "Нажмите меню, затем «Поделиться» → «На экран Домой»",
      };
    default:
      return {
        icon: "share",
        text: "Откройте в Safari и нажмите «Поделиться» → «На экран Домой»",
      };
  }
};

export function InstallPrompt() {
  // Временно отключен — баннер установки PWA скрыт
  return null;

  /* eslint-disable no-unreachable */
  const ignoreError = (_: unknown): void => {
    // noop
  };
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosBrowser, setIOSBrowser] = useState<IOSBrowser>("safari");
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Do not show if already installed
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // iOS Safari PWA
      // @ts-expect-error non-standard
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Проверяем iOS
    const iosDevice = isIOSDevice();
    setIsIOS(iosDevice);

    // Для iOS показываем свой промпт (все браузеры на iOS используют WebKit
    // и не поддерживают beforeinstallprompt)
    if (iosDevice) {
      // Определяем браузер для показа правильной инструкции
      setIOSBrowser(getIOSBrowser());

      // Проверяем, не скрыл ли пользователь промпт ранее
      const iosDismissed = localStorage.getItem("ios_install_dismissed");
      const dismissedTime = iosDismissed ? parseInt(iosDismissed, 10) : 0;
      // Показываем снова через 7 дней
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (!iosDismissed || Date.now() - dismissedTime > weekInMs) {
        // Небольшая задержка перед показом
        setTimeout(() => setShowIOSPrompt(true), 2000);
      }
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
      try {
        addBreadcrumb({
          category: "pwa",
          message: "beforeinstallprompt(floating)",
          level: "info",
        });
      } catch (err) {
        ignoreError(err);
      }
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setVisible(false);
      try {
        addBreadcrumb({
          category: "pwa",
          message: "appinstalled(floating)",
          level: "info",
        });
        captureMessage("PWA appinstalled (floating prompt)");
      } catch (err) {
        ignoreError(err);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Обработчик для iOS - скрывает промпт и запоминает
  const dismissIOSPrompt = () => {
    setShowIOSPrompt(false);
    try {
      localStorage.setItem("ios_install_dismissed", Date.now().toString());
      addBreadcrumb({
        category: "pwa",
        message: "ios_install_dismissed",
        level: "info",
      });
    } catch {
      // ignore
    }
  };

  // iOS banner
  if (isIOS && showIOSPrompt) {
    const instructions = getIOSInstallInstructions(iosBrowser);
    const iconName =
      instructions.icon === "share" ? "solar:share-linear" : "solar:menu-dots-bold";

    return (
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/40">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0">
              <Icon icon={iconName} width={24} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                Установите Red Petroleum
              </h3>
              <p className="mt-1 text-sm text-gray-400">{instructions.text}</p>
            </div>
            <button
              type="button"
              onClick={dismissIOSPrompt}
              className="rounded-md p-1 text-gray-500 hover:bg-zinc-800"
              aria-label="Закрыть"
            >
              <Icon icon="solar:close-linear" width={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!visible || !deferredPrompt) return null;

  const onInstall = async () => {
    try {
      if (!deferredPrompt) return;

      addBreadcrumb({
        category: "pwa",
        message: "promptInstall:clicked(floating)",
        level: "info",
      });
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setDeferredPrompt(null);
        try {
          addBreadcrumb({
            category: "pwa",
            message: "promptInstall:accepted(floating)",
            level: "info",
          });
          captureMessage("PWA install accepted (floating)");
        } catch (err) {
          ignoreError(err);
        }
      } else {
        setVisible(false);
        try {
          addBreadcrumb({
            category: "pwa",
            message: "promptInstall:dismissed(floating)",
            level: "info",
          });
          captureMessage("PWA install dismissed (floating)");
        } catch (err) {
          ignoreError(err);
        }
      }
    } catch {
      setVisible(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 sm:px-6">
      <div className="mx-auto max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/40">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              Установите Red Petroleum как приложение
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Быстрый доступ с домашнего экрана, оффлайн‑режим и
              авто‑обновления.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onInstall}
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Установить
              </button>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-zinc-900/50 focus:outline-none"
              >
                Позже
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-md p-1 text-gray-500 hover:bg-zinc-800"
            aria-label="Закрыть"
          >
            <Icon icon="solar:close-circle-linear" width={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
