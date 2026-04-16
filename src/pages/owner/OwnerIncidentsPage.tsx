import { Icon } from "@iconify/react";
import { RequireRole } from "@/shared/components/RequireRole";
import type { UserRole } from "@/features/auth/types/unified.types";

export function OwnerIncidentsPage() {
  return (
    <RequireRole
      allowed={["admin", "superadmin"] as ReadonlyArray<UserRole>}
      fallback={
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
          Недостаточно прав для просмотра инцидентов.
        </div>
      }
    >
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Инциденты</h1>
            <p className="text-zinc-500 dark:text-gray-400 mt-1">
              Оффлайн станции, ошибки коннекторов, сбои сессий
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Empty State */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Icon icon="solar:shield-check-linear" width={32} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                Нет активных инцидентов
              </h3>
              <p className="text-zinc-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                Все станции работают в штатном режиме.
                Инциденты будут автоматически отображаться при обнаружении проблем.
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon icon="solar:info-circle-linear" width={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-600 dark:text-blue-300 mb-2">О мониторинге инцидентов</h3>
                <ul className="space-y-2 text-sm text-blue-400">
                  <li>&#8226; Система автоматически отслеживает оффлайн-статус станций</li>
                  <li>&#8226; Ошибки коннекторов фиксируются по OCPP протоколу</li>
                  <li>&#8226; Сбои в сессиях зарядки логируются в реальном времени</li>
                  <li>&#8226; Уведомления отправляются при критических инцидентах</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
