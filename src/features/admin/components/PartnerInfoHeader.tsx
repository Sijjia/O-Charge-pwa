import { Icon } from "@iconify/react";
import type { DemoPartnerDetail } from "@/shared/demo/demoData";
import { AdminStatusBadge } from "./AdminStatusBadge";

interface PartnerInfoHeaderProps {
  partner: DemoPartnerDetail;
}

export function PartnerInfoHeader({ partner }: PartnerInfoHeaderProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            {partner.company_name}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-gray-400">
            {partner.contact_name}
          </p>
        </div>
        <AdminStatusBadge variant="success" label="Активен" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-gray-400 mb-1">Контакт</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-white">
              <Icon icon="solar:phone-linear" width={16} className="text-blue-500" />
              {partner.phone}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-white">
              <Icon icon="solar:letter-linear" width={16} className="text-purple-500" />
              {partner.email}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-500 dark:text-gray-400 mb-1">Доля доходов</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">
            {Math.round(partner.revenue_share * 100)}%
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 dark:text-gray-400 mb-1">Баланс</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {partner.balance.toLocaleString("ru-KG")} с.
          </p>
        </div>
      </div>
    </div>
  );
}
