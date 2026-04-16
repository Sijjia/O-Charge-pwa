import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { versionManager } from "@/lib/versionManager";

export function AboutPage() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<string>("1.0.0");

  useEffect(() => {
    try {
      const info = versionManager.getVersionInfo();
      if (info?.version) setAppVersion(String(info.version));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className="min-h-screen bg-zinc-100 dark:bg-zinc-800 pb-[calc(var(--nav-height)+16px)]"
    >
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">О приложении</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Logo & Version */}
      <div className="bg-white dark:bg-zinc-900 mt-2 px-4 py-8 border border-zinc-200 dark:border-zinc-800 mx-4 rounded-2xl shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col items-center">
          <img
            src="/icons/icon-192x192.png"
            alt="Red Petroleum EV"
            className="w-20 h-20 rounded-2xl shadow-lg shadow-black/20 dark:shadow-black/40 mb-4"
          />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Red Petroleum EV</h2>
          <p className="text-sm text-zinc-500 dark:text-gray-500 mt-1">Версия {appVersion}</p>
          <p className="text-sm text-zinc-600 dark:text-gray-400 mt-3 text-center max-w-xs">
            Зарядка электромобилей в Кыргызстане
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-zinc-900 mt-4 border border-zinc-200 dark:border-zinc-800 mx-4 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-gray-400 uppercase tracking-wide">
            Контакты
          </p>
        </div>
        <a
          href="tel:+996559974545"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon icon="solar:phone-linear" width={20} className="text-zinc-500 dark:text-gray-500" />
            <span className="font-medium text-zinc-900 dark:text-white">+996 559 974 545</span>
          </div>
        </a>
        <a
          href="mailto:support@redpetroleum.kg"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon icon="solar:letter-linear" width={20} className="text-zinc-500 dark:text-gray-500" />
            <span className="font-medium text-zinc-900 dark:text-white">
              support@redpetroleum.kg
            </span>
          </div>
        </a>
      </div>

      {/* Legal */}
      <div className="bg-white dark:bg-zinc-900 mt-4 border border-zinc-200 dark:border-zinc-800 mx-4 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-gray-400 uppercase tracking-wide">
            Документы
          </p>
        </div>
        <button
          onClick={() => window.open("/legal/privacy.html", "_blank")}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="font-medium text-zinc-900 dark:text-white">
            Политика конфиденциальности
          </span>
          <Icon icon="solar:square-arrow-right-up-linear" width={16} className="text-zinc-400 dark:text-gray-400" />
        </button>
        <button
          onClick={() => window.open("/legal/terms.html", "_blank")}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="font-medium text-zinc-900 dark:text-white">
            Условия использования
          </span>
          <Icon icon="solar:square-arrow-right-up-linear" width={16} className="text-zinc-400 dark:text-gray-400" />
        </button>
      </div>

      {/* Copyright */}
      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-500 dark:text-gray-400">
          © {new Date().getFullYear()} Red Petroleum. Все права защищены.
        </p>
      </div>
    </div>
  );
}
