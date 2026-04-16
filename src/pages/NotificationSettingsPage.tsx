import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { PushNotificationSettings } from "@/features/settings/components/PushNotificationSettings";

export function NotificationSettingsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
      style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}
    >
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{"Уведомления"}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-2 mx-2 p-4">
        <PushNotificationSettings />
      </div>

      {/* Info */}
      <div className="mt-4 px-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          {
            "Push-уведомления позволяют получать информацию о зарядке и платежах даже когда приложение закрыто"
          }
        </p>
      </div>
    </div>
  );
}

export default NotificationSettingsPage;
