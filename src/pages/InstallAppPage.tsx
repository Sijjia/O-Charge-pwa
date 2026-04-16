import { useInstallSupport } from "@/features/pwa/install/useInstallSupport";
import { Icon } from "@iconify/react";

export function InstallAppPage() {
  const { canInstall, isStandalone, isIOS, promptInstall } =
    useInstallSupport();

  const onInstall = async () => {
    await promptInstall();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] transition-colors">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Установка приложения
          </h1>
          <p className="text-zinc-500 dark:text-gray-400 mt-1">
            Установите Red Petroleum на устройство для быстрого доступа,
            оффлайн‑режима и авто‑обновлений.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!isStandalone && canInstall && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
              Установить сейчас
            </h2>
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <Icon icon="solar:alt-arrow-down-linear" width={20} />
              Установить приложение
            </button>
            <p className="text-sm text-zinc-500 dark:text-gray-400 mt-3">
              Кнопка появится, когда браузер разрешит установку. Если её нет —
              воспользуйтесь инструкцией ниже.
            </p>
          </div>
        )}

        {!isStandalone && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
              Инструкция по установке
            </h2>
            {isIOS ? (
              <div className="space-y-2 text-sm text-zinc-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:share-linear" width={16} className="text-red-500" />
                  <span>Откройте меню «Поделиться» в Safari.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:smartphone-linear" width={16} className="text-red-500" />
                  <span>Выберите «На экран Домой».</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:alt-arrow-down-linear" width={16} className="text-red-500" />
                  <span>Подтвердите добавление ярлыка.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-zinc-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:smartphone-linear" width={16} className="text-red-500" />
                  <span>
                    В Chrome/Edge нажмите «Установить приложение» в адресной
                    строке.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:alt-arrow-down-linear" width={16} className="text-red-500" />
                  <span>Подтвердите установку.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isStandalone && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Приложение установлено
            </h2>
            <p className="text-sm text-zinc-600 dark:text-gray-300">
              Вы уже используете установленную версию. Обновления приходят
              автоматически через Service Worker.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
