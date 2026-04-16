import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAdminPartnerDetail } from "@/features/admin/hooks/useAdminPartnerDetail";
import { PartnerInfoHeader } from "@/features/admin/components/PartnerInfoHeader";
import { PartnerKPICards } from "@/features/admin/components/PartnerKPICards";
import { PartnerStationsTable } from "@/features/admin/components/PartnerStationsTable";
import { PartnerRevenueChart } from "@/features/admin/components/PartnerRevenueChart";
import { CardSkeleton } from "@/shared/components/SkeletonLoaders";

export function AdminPartnerDetailPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminPartnerDetail(partnerId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate("/admin/partners")}
          className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mb-6"
        >
          <Icon icon="solar:arrow-left-linear" width={18} />
          Назад к партнёрам
        </button>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">
            Ошибка загрузки данных партнёра
          </p>
        </div>
      </div>
    );
  }

  const partner = data.data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/admin/partners")}
        className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <Icon icon="solar:arrow-left-linear" width={18} />
        <span className="text-sm">Назад к партнёрам</span>
      </button>

      {/* Partner Info Header */}
      <PartnerInfoHeader partner={partner} />

      {/* KPI Cards */}
      <PartnerKPICards kpi={partner.kpi} />

      {/* Stations Section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Станции
          </h2>
          <p className="text-sm text-zinc-600 dark:text-gray-400">
            Зарядные станции партнёра
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <PartnerStationsTable stations={partner.stations} />
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div>
        <PartnerRevenueChart data={partner.revenue_by_day} />
      </div>
    </div>
  );
}
