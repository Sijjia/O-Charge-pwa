import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

function MenuItem({
  icon,
  label,
  description,
  onClick,
  rightElement,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-zinc-500 dark:text-gray-500">{icon}</span>
        <div className="text-left">
          <span className="font-medium text-zinc-900 dark:text-white block">{label}</span>
          {description && (
            <span className="text-sm text-zinc-500 dark:text-gray-500">{description}</span>
          )}
        </div>
      </div>
      {rightElement || <Icon icon="solar:alt-arrow-right-linear" width={20} className="text-zinc-400 dark:text-gray-400" />}
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearCache = async () => {
    setShowClearConfirm(false);
    setIsClearing(true);
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      showNotification("success", "Кэш очищен. Перезагрузка...");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showNotification("error", "Не удалось очистить кэш");
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        await registration.update();
        showNotification("success", "Проверка обновлений завершена");
      } else {
        showNotification("error", "Service Worker не найден");
      }
    } catch {
      showNotification("error", "Не удалось проверить обновления");
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
      style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Настройки</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl mx-4 mt-4 overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-gray-400 uppercase tracking-widest">
            Оформление
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 dark:text-gray-500">
                <Icon icon="solar:palette-round-linear" width={20} />
              </span>
              <span className="font-medium text-zinc-900 dark:text-white">Тема</span>
            </div>
            <ThemeToggle compact />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl mx-4 mt-4 overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-gray-400 uppercase tracking-widest">
            Уведомления
          </p>
        </div>
        <MenuItem
          icon={<Icon icon="solar:bell-linear" width={20} />}
          label="Push-уведомления"
          description="Настройки уведомлений"
          onClick={() => navigate("/settings/notifications")}
        />
      </div>

      {/* App */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl mx-4 mt-4 overflow-hidden shadow-sm dark:shadow-none transition-colors">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-gray-400 uppercase tracking-widest">
            Приложение
          </p>
        </div>
        <MenuItem
          icon={<Icon icon="solar:alt-arrow-down-linear" width={20} />}
          label="Установить приложение"
          description="Добавить на главный экран"
          onClick={() => navigate("/install")}
        />
        <MenuItem
          icon={<Icon icon="solar:refresh-linear" width={20} />}
          label="Проверить обновления"
          onClick={handleCheckUpdate}
        />
        <MenuItem
          icon={<Icon icon="solar:trash-bin-trash-linear" width={20} />}
          label="Очистить кэш"
          description={isClearing ? "Очистка..." : "Освободить место"}
          onClick={() => setShowClearConfirm(true)}
        />
      </div>

      {/* Info */}
      <div className="mt-8 px-4">
        <p className="text-xs text-zinc-400 dark:text-gray-400 text-center">
          Данные приложения хранятся локально на вашем устройстве
        </p>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center ${
          notification.type === "success"
            ? "bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400"
            : "bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
        }`}>
          {notification.message}
        </div>
      )}

      {/* Clear Cache Confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 px-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl dark:shadow-none transition-colors">
            <h3 className="text-zinc-900 dark:text-white font-semibold text-lg mb-2">Очистить кэш?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">Это может замедлить загрузку при следующем запуске.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
