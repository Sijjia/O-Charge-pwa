/**
 * Partner Stations — карточки станций (read-only)
 */

import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { usePartnerStations } from "@/features/partner/hooks/usePartnerStations";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

const statusConfig = {
  online: { label: "Онлайн", color: "text-green-400 bg-green-400/10", icon: "solar:check-circle-linear" },
  charging: { label: "Заряжает", color: "text-blue-400 bg-blue-400/10", icon: "solar:bolt-linear" },
  offline: { label: "Оффлайн", color: "text-gray-400 bg-gray-400/10", icon: "solar:close-circle-linear" },
  maintenance: { label: "Обслуживание", color: "text-yellow-400 bg-yellow-400/10", icon: "solar:danger-triangle-linear" },
} as const;

const defaultStatus = statusConfig.offline;

export function PartnerStationsPage() {
  const navigate = useNavigate();
  const { data: stations, isLoading } = usePartnerStations();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminPageHeader
            title="Мои станции"
            subtitle={`${stations?.length ?? 0} станций`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stations?.map((station) => {
            const cfg = statusConfig[station.status as keyof typeof statusConfig] ?? defaultStatus;
            return (
              <div
                key={station.id}
                onClick={() => navigate(`/partner/stations/${station.id}`)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm dark:shadow-none transition-all hover:shadow-md dark:hover:bg-zinc-800/50 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-zinc-900 dark:text-white font-semibold truncate">{station.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-gray-400 truncate">{station.address}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <Icon icon={cfg.icon} width={14} />
                    {cfg.label}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-gray-400">
                    <Icon icon="solar:bolt-linear" width={16} className="text-yellow-400" />
                    <span>{station.power_kw} кВт</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-gray-400">
                    <Icon icon="solar:plug-circle-linear" width={16} className="text-blue-400" />
                    <span>{station.connectors} конн.</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-gray-400">
                    <Icon icon="solar:tag-price-linear" width={16} className="text-green-400" />
                    <span>{station.price_per_kwh} сом/кВтч</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-gray-400">
                    <Icon icon="solar:cpu-linear" width={16} className="text-purple-400" />
                    <span className="truncate">{station.model}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-gray-500">
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:clock-circle-linear" width={14} />
                    <span>SN: {station.serial_number}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                    <span>Подробнее</span>
                    <Icon icon="solar:arrow-right-linear" width={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(!stations || stations.length === 0) && (
          <div className="text-center py-16">
            <Icon icon="solar:battery-charge-linear" width={48} className="text-zinc-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-gray-400">Станции не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
