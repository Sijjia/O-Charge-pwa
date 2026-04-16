import { Icon } from "@iconify/react";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { HelpTip } from "@/shared/components/HelpTip";
import { PushNotificationSettings } from "@/features/settings/components/PushNotificationSettings";

interface SettingSection {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingCard({ icon, title, description, children }: SettingSection) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Icon icon={icon} width={20} className="text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AdminSettingsPage() {

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader
        title="Настройки" helpText="Системные настройки: тема оформления, уведомления, интеграции. Изменения сохраняются локально в вашем браузере."
        subtitle="Конфигурация системы"
      />

      <div className="grid gap-4">
        <SettingCard
          icon="solar:palette-round-bold-duotone"
          title="Тема оформления"
          description="Выберите светлую, тёмную или системную тему"
        >
          <ThemeToggle />
        </SettingCard>

        <SettingCard
          icon="solar:bell-bold-duotone"
          title="Push-уведомления"
          description="Получайте уведомления о зарядках, ошибках станций и низком балансе прямо в браузер"
        >
          <PushNotificationSettings />
        </SettingCard>

        <SettingCard
          icon="solar:server-bold-duotone"
          title="Информация о системе"
          description="Версия и конфигурация"
        >
          <div className="space-y-2">
            {[
              { label: "Версия API", value: "1.0.0", help: "Версия серверного API. Обновляется при выпуске новых функций." },
              { label: "OCPP протокол", value: "1.6 / 2.0.1", help: "Протокол связи с зарядными станциями. 1.6 — для большинства станций, 2.0.1 — для новых моделей." },
              { label: "База данных", value: "PostgreSQL", help: "Система хранения всех данных: клиенты, сессии, станции, платежи." },
              { label: "Среда", value: import.meta.env.MODE, help: "Текущий режим работы. production — боевой сервер, development — тестовый." },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  {item.label}
                  {item.help && <HelpTip text={item.help} />}
                </span>
                <span className="text-xs font-mono text-zinc-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
