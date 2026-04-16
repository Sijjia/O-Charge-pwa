import { AdminStatCard } from "./AdminStatCard";

interface PartnerKPICardsProps {
  kpi: {
    total_stations: number;
    active_sessions: number;
    today_revenue: number;
    month_revenue: number;
  };
}

export function PartnerKPICards({ kpi }: PartnerKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        label="Станций"
        value={kpi.total_stations}
        icon="solar:battery-charge-linear"
      />
      <AdminStatCard
        label="Активные сессии"
        value={kpi.active_sessions}
        icon="solar:bolt-linear"
      />
      <AdminStatCard
        label="Доход сегодня"
        value={`${kpi.today_revenue.toLocaleString("ru-KG")} с.`}
        icon="solar:wallet-linear"
      />
      <AdminStatCard
        label="Доход месяца"
        value={`${kpi.month_revenue.toLocaleString("ru-KG")} с.`}
        icon="solar:chart-square-linear"
      />
    </div>
  );
}
