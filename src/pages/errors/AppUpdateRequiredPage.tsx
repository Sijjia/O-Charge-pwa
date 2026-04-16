import { Icon } from "@iconify/react";

export function AppUpdateRequiredPage() {
  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Icon
            icon="solar:download-minimalistic-bold-duotone"
            width={40}
            className="text-red-500"
          />
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Доступно обновление
        </h1>

        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          Для продолжения работы необходимо обновить приложение до последней
          версии. Это займёт несколько секунд.
        </p>

        <button
          onClick={handleUpdate}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-red-600/20"
        >
          <Icon icon="solar:restart-bold" width={20} />
          Обновить сейчас
        </button>

        <p className="text-xs text-zinc-400 mt-4">
          Версия приложения устарела
        </p>
      </div>
    </div>
  );
}
