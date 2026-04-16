import { Icon } from "@iconify/react";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export function PartnerSettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Настройки
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Настройки партнёрской панели
        </p>
      </div>

      <div className="grid gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Icon icon="solar:palette-round-bold-duotone" width={20} className="text-zinc-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Тема оформления
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Выберите тему интерфейса
              </p>
              <div className="mt-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Icon icon="solar:bell-bold-duotone" width={20} className="text-zinc-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Уведомления
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Настройте уведомления о станциях и доходах
              </p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Статус станций", enabled: true },
                  { label: "Новые сессии", enabled: true },
                  { label: "Отчёты о доходах", enabled: false },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {n.label}
                    </span>
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        n.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                          n.enabled ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Icon icon="solar:info-circle-bold-duotone" width={20} className="text-zinc-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                О панели
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Информация о партнёрской панели
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Версия", value: "1.0.0" },
                  { label: "Платформа", value: "Red Charge" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    <span className="text-xs text-zinc-500">{item.label}</span>
                    <span className="text-xs font-mono text-zinc-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
