import { useState, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
} from "recharts";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminDataTable, type Column } from "@/features/admin/components/AdminDataTable";
import { AdminFilterBar, FilterSelect } from "@/features/admin/components/AdminFilterBar";
import { usePartnersSelect } from "@/features/admin/hooks/useAdminPartners";
import {
  useRevenueByPartner,
  useRevenueByLocation,
  useRevenueTimeSeries,
} from "@/features/admin/hooks/useAdminRevenue";
import type {
  RevenueByPartnerItem,
  RevenueByLocationItem,
  RevenueFilters,
} from "@/features/admin/services/adminAnalyticsService";

type PeriodPreset = "7d" | "30d" | "90d" | "custom";

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "7d", label: "7д" },
  { value: "30d", label: "30д" },
  { value: "90d", label: "90д" },
  { value: "custom", label: "Период" },
];

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function getDatesForPreset(preset: PeriodPreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = toDateStr(now);
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const dateFrom = toDateStr(new Date(Date.now() - days * 86_400_000));
  return { dateFrom, dateTo };
}

function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}

export function AdminRevenuePage() {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [partnerId, setPartnerId] = useState("");

  const filters: RevenueFilters = useMemo(() => {
    const dates = period === "custom" && customFrom && customTo
      ? { dateFrom: customFrom, dateTo: customTo }
      : getDatesForPreset(period === "custom" ? "30d" : period);
    return {
      ...dates,
      partnerId: partnerId || undefined,
      groupBy: period === "7d" ? "day" as const : period === "90d" ? "week" as const : "day" as const,
    };
  }, [period, customFrom, customTo, partnerId]);

  const { data: partnerData, isLoading: loadingPartners } = useRevenueByPartner(filters);
  const { data: locationData, isLoading: loadingLocations } = useRevenueByLocation(filters);
  const { data: timeSeriesData, isLoading: loadingChart } = useRevenueTimeSeries(filters);
  const { data: partnersSelect } = usePartnersSelect();

  const totals = partnerData?.totals ?? { sessions: 0, revenue: 0, energy_kwh: 0, partner_share: 0, platform_share: 0 };
  const avgCheck = totals.sessions > 0 ? Math.round(totals.revenue / totals.sessions) : 0;

  const partnerOptions = useMemo(() => {
    const opts = [{ value: "", label: "Все партнёры" }];
    if (partnersSelect?.partners) {
      for (const p of partnersSelect.partners) {
        opts.push({ value: p.id, label: p.label });
      }
    }
    return opts;
  }, [partnersSelect]);

  const chartData = useMemo(() => {
    if (!timeSeriesData?.data) return [];
    return timeSeriesData.data.map((d) => ({
      date: d.period ? new Date(d.period).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : "",
      revenue: d.total_revenue,
      sessions: d.sessions,
    }));
  }, [timeSeriesData]);

  // CSV export
  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [];

    // Partners section
    rows.push(["=== Выручка по партнёрам ==="]);
    rows.push(["Партнёр", "Выручка", "Платформа", "Партнёр", "Сессии", "кВтч", "Станций"]);
    for (const p of partnerData?.data ?? []) {
      rows.push([
        `"${p.partner_name}"`,
        String(p.total_revenue),
        String(p.total_platform_share),
        String(p.total_partner_share),
        String(p.sessions),
        String(p.total_energy_kwh),
        String(p.station_count),
      ]);
    }

    rows.push([]);
    rows.push(["=== Выручка по локациям ==="]);
    rows.push(["Локация", "Адрес", "Выручка", "Сессии", "кВтч", "Станций"]);
    for (const l of locationData?.data ?? []) {
      rows.push([
        `"${l.location_name}"`,
        `"${l.location_address}"`,
        String(l.total_revenue),
        String(l.sessions),
        String(l.total_energy_kwh),
        String(l.station_count),
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `revenue_${filters.dateFrom}_${filters.dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [partnerData, locationData, filters]);

  // Max revenue for percentage bars
  const maxPartnerRevenue = useMemo(() => {
    const items = partnerData?.data ?? [];
    return items.length > 0 ? Math.max(...items.map((i) => i.total_revenue)) : 1;
  }, [partnerData]);

  const maxLocationRevenue = useMemo(() => {
    const items = locationData?.data ?? [];
    return items.length > 0 ? Math.max(...items.map((i) => i.total_revenue)) : 1;
  }, [locationData]);

  // Table columns
  const partnerColumns: Column<RevenueByPartnerItem>[] = [
    {
      key: "partner_name",
      header: "Партнёр",
      render: (row) => (
        <span className="text-sm font-medium text-zinc-900 dark:text-white">
          {row.partner_name}
        </span>
      ),
    },
    {
      key: "total_revenue",
      header: "Выручка",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-white min-w-[70px]">
            {fmt(row.total_revenue)} сом
          </span>
          <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(row.total_revenue / maxPartnerRevenue) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "total_platform_share",
      header: "Платформа",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {fmt(row.total_platform_share)} сом
        </span>
      ),
    },
    {
      key: "total_partner_share",
      header: "Партнёр",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {fmt(row.total_partner_share)} сом
        </span>
      ),
    },
    {
      key: "sessions",
      header: "Сессии",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">{fmt(row.sessions)}</span>
      ),
    },
    {
      key: "total_energy_kwh",
      header: "кВтч",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-500">{row.total_energy_kwh.toFixed(1)}</span>
      ),
    },
    {
      key: "station_count",
      header: "Станций",
      render: (row) => (
        <span className="text-sm text-zinc-500">{row.station_count}</span>
      ),
    },
  ];

  const locationColumns: Column<RevenueByLocationItem>[] = [
    {
      key: "location_name",
      header: "Локация",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">{row.location_name}</p>
          <p className="text-xs text-zinc-500">{row.location_address}{row.location_city ? `, ${row.location_city}` : ""}</p>
        </div>
      ),
    },
    {
      key: "total_revenue",
      header: "Выручка",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-white min-w-[70px]">
            {fmt(row.total_revenue)} сом
          </span>
          <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(row.total_revenue / maxLocationRevenue) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "sessions",
      header: "Сессии",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">{fmt(row.sessions)}</span>
      ),
    },
    {
      key: "total_energy_kwh",
      header: "кВтч",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-500">{row.total_energy_kwh.toFixed(1)}</span>
      ),
    },
    {
      key: "station_count",
      header: "Станций",
      render: (row) => (
        <span className="text-sm text-zinc-500">{row.station_count}</span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Выручка"
        subtitle="Финансовая аналитика по партнёрам и локациям"
        helpText="Общая выручка за выбранный период с разбивкой по партнёрам и локациям. Доля платформы и партнёра рассчитывается автоматически по договору."
        actionLabel="Экспорт CSV"
        actionIcon="solar:export-linear"
        onAction={handleExportCSV}
      />

      {/* Period toggles + Partner filter */}
      <AdminFilterBar>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.value
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <span className="text-zinc-400">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>
        )}

        <FilterSelect
          label="Партнёр"
          options={partnerOptions}
          value={partnerId}
          onChange={setPartnerId}
        />
      </AdminFilterBar>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard
          label="Общая выручка"
          value={`${fmtMoney(totals.revenue)} сом`}
          icon="solar:wallet-money-linear"
          helpText="Суммарная выручка за выбранный период по всем партнёрам"
        />
        <AdminStatCard
          label="Доля платформы"
          value={`${fmtMoney(totals.platform_share)} сом`}
          icon="solar:hand-money-linear"
          helpText="Комиссия платформы Red Charge за период"
        />
        <AdminStatCard
          label="Доля партнёров"
          value={`${fmtMoney(totals.partner_share)} сом`}
          icon="solar:handshake-linear"
          helpText="Суммарная доля всех партнёров за период"
        />
        <AdminStatCard
          label="Сессий"
          value={fmt(totals.sessions)}
          icon="solar:bolt-circle-linear"
          helpText="Количество завершённых зарядных сессий"
        />
        <AdminStatCard
          label="Энергия"
          value={`${totals.energy_kwh.toFixed(0)} кВтч`}
          icon="solar:flash-circle-linear"
          helpText="Суммарная отданная энергия за период"
        />
        <AdminStatCard
          label="Средний чек"
          value={`${fmt(avgCheck)} сом`}
          icon="solar:tag-price-linear"
          helpText="Средняя стоимость одной зарядной сессии"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Динамика выручки
        </h3>
        {loadingChart ? (
          <div className="h-64 flex items-center justify-center">
            <Icon icon="svg-spinners:ring-resize" width={32} className="text-zinc-400" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-zinc-200, #e4e4e7)" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmtMoney(v)}
              />
              <YAxis
                yAxisId="sessions"
                orientation="right"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-zinc-900, #18181b)",
                  border: "1px solid var(--color-zinc-700, #3f3f46)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
                formatter={(value: any, name: any) => [
                  name === "revenue" ? `${fmt(value)} сом` : fmt(value),
                  name === "revenue" ? "Выручка" : "Сессии",
                ]}
              />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
              <Bar
                yAxisId="sessions"
                dataKey="sessions"
                fill="#3b82f6"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* By Partners table */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
          <Icon icon="solar:handshake-bold-duotone" width={18} className="text-red-500" />
          По партнёрам
        </h3>
        <AdminDataTable<RevenueByPartnerItem>
          columns={partnerColumns}
          data={partnerData?.data ?? []}
          keyExtractor={(row) => row.partner_id}
          loading={loadingPartners}
          emptyMessage="Нет данных о выручке партнёров за выбранный период"
        />
      </div>

      {/* By Locations table */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
          <Icon icon="solar:map-point-bold-duotone" width={18} className="text-blue-500" />
          По локациям
        </h3>
        <AdminDataTable<RevenueByLocationItem>
          columns={locationColumns}
          data={locationData?.data ?? []}
          keyExtractor={(row) => row.location_id}
          loading={loadingLocations}
          emptyMessage="Нет данных о выручке по локациям за выбранный период"
        />
      </div>
    </div>
  );
}
