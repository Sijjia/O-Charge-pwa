import { Icon } from "@iconify/react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useAdminAnalyticsOverview,
  useAdminAnalyticsChart,
  useHeatmap,
  useUserGrowth,
  useUptime,
} from "@/features/admin/hooks/useAdminAnalytics";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminDataTable, type Column } from "@/features/admin/components/AdminDataTable";
import type { ChartPeriod, ChartData, UptimeStation } from "@/features/admin/services/adminAnalyticsService";

const PERIODS: { value: ChartPeriod; label: string }[] = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const HEATMAP_COLORS = [
  "bg-zinc-100 dark:bg-zinc-800",
  "bg-emerald-100 dark:bg-emerald-900/40",
  "bg-emerald-200 dark:bg-emerald-800/50",
  "bg-amber-200 dark:bg-amber-700/50",
  "bg-red-300 dark:bg-red-700/50",
];

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return HEATMAP_COLORS[0]!;
  const idx = Math.min(Math.ceil((value / max) * 4), 4);
  return HEATMAP_COLORS[idx]!;
}

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<ChartPeriod>("30d");

  const {
    data: overviewData,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErr,
  } = useAdminAnalyticsOverview();

  const { data: chartData, isLoading: chartLoading } =
    useAdminAnalyticsChart(period);

  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(30);
  const { data: userGrowthData, isLoading: growthLoading } = useUserGrowth("week");
  const { data: uptimeData, isLoading: uptimeLoading } = useUptime(30);

  const overview = overviewData?.data;
  const chartRows = chartData?.data ?? [];
  const heatmapMatrix = heatmapData?.matrix ?? [];
  const dayLabels = heatmapData?.day_labels ?? [];
  const heatmapMax = Math.max(...heatmapMatrix.flat(), 1);

  if (overviewError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <AdminPageHeader title="Аналитика" helpText="Графики и статистика по всей сети: выручка, количество зарядок, рост пользователей, тепловая карта нагрузки, аптайм станций." subtitle="Обзор показателей" />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center">
          <Icon icon="solar:danger-triangle-linear" width={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-sm text-zinc-500">
            {overviewErr instanceof Error
              ? overviewErr.message
              : "Не удалось загрузить аналитику"}
          </p>
        </div>
      </div>
    );
  }

  // Chart table columns (substitute for real charts)
  const chartColumns: Column<ChartData>[] = [
    {
      key: "date",
      header: "Дата",
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">{row.date}</span>
      ),
    },
    {
      key: "sessions",
      header: "Сессии",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white font-medium">
          {row.sessions}
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Доход",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-900 dark:text-white">
          {row.revenue.toLocaleString()} сом
        </span>
      ),
    },
    {
      key: "energy",
      header: "Энергия кВтч",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-zinc-500">
          {row.energy.toFixed(1)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader title="Аналитика" helpText="Графики и статистика по всей сети: выручка, количество зарядок, рост пользователей, тепловая карта нагрузки, аптайм станций." subtitle="Обзор показателей" />

      {/* Stats */}
      {overviewLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminStatCard
            label="Сессий" helpText="Количество завершённых зарядных сессий за выбранный период"
            value={overview.total_sessions.toLocaleString()}
            icon="solar:bolt-circle-linear"
            trend={`Сегодня: ${overview.sessions_today}`}
            trendUp={overview.sessions_today > 0}
          />
          <AdminStatCard
            label="Доход" helpText="Суммарная выручка от всех зарядных сессий за период"
            value={`${overview.total_revenue.toLocaleString()} сом`}
            icon="solar:wallet-linear"
            trend={`Сегодня: ${overview.revenue_today.toLocaleString()} сом`}
            trendUp={overview.revenue_today > 0}
          />
          <AdminStatCard
            label="Энергия кВтч" helpText="Суммарное количество отпущенной электроэнергии в кВтч"
            value={overview.total_energy_kwh.toFixed(0)}
            icon="solar:flash-drive-linear"
            trend={`Сегодня: ${overview.energy_today.toFixed(1)} кВтч`}
            trendUp={overview.energy_today > 0}
          />
          <AdminStatCard
            label="Активных пользователей" helpText="Количество уникальных пользователей которые заряжались за период"
            value={overview.active_users}
            icon="solar:users-group-rounded-linear"
          />
        </div>
      ) : null}

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Доход и сессии
        </h2>
        {chartLoading ? (
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        ) : chartRows.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-zinc-400">Нет данных за выбранный период</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24,24,27,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Доход (сом)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="sessions"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSessions)"
                name="Сессии"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom: top data by period as table */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
          Данные по периоду
        </h2>
        <AdminDataTable<ChartData>
          columns={chartColumns}
          data={chartRows}
          keyExtractor={(row) => row.date}
          loading={chartLoading}
          emptyMessage="Нет данных за выбранный период"
        />
      </div>

      {/* STAT-01: Heatmap */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Тепловая карта загруженности
        </h2>
        {heatmapLoading ? (
          <div className="h-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        ) : heatmapMatrix.length === 0 ? (
          <p className="text-zinc-400 text-sm">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-zinc-500 pr-2 py-1 w-10" />
                  {HOUR_LABELS.map((h) => (
                    <th key={h} className="text-center text-zinc-400 px-0.5 py-1 font-normal">
                      {h.split(":")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapMatrix.map((row, dayIdx) => (
                  <tr key={dayIdx}>
                    <td className="text-zinc-500 pr-2 py-0.5 font-medium">
                      {dayLabels[dayIdx] || dayIdx}
                    </td>
                    {row.map((val, hourIdx) => (
                      <td key={hourIdx} className="px-0.5 py-0.5">
                        <div
                          className={`w-full aspect-square rounded-sm ${getHeatColor(val, heatmapMax)}`}
                          title={`${dayLabels[dayIdx] || ""} ${hourIdx}:00 — ${val} сессий`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STAT-03: User Growth */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          Рост пользователей
        </h2>
        {growthLoading ? (
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        ) : !userGrowthData?.data?.length ? (
          <p className="text-zinc-400 text-sm">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={userGrowthData.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v ? new Date(v).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : ""}
              />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(24,24,27,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  value ?? 0,
                  name === "cumulative" ? "Всего" : "Новых",
                ]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorGrowth)"
                name="cumulative"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* STAT-04: Uptime / SLA */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-2">
          Uptime / SLA станций
          {uptimeData && (
            <span className="ml-2 text-xs font-normal text-zinc-400">
              Среднее: {uptimeData.avg_uptime_pct}%
            </span>
          )}
        </h2>
        {uptimeLoading ? (
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ) : (
          <AdminDataTable<UptimeStation>
            columns={[
              {
                key: "station_id",
                header: "Станция",
                render: (row) => (
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{row.station_id}</span>
                ),
              },
              {
                key: "uptime_pct",
                header: "Uptime %",
                sortable: true,
                render: (row) => (
                  <span className={`text-sm font-semibold ${row.uptime_pct >= 99 ? "text-emerald-500" : row.uptime_pct >= 95 ? "text-amber-500" : "text-red-500"}`}>
                    {row.uptime_pct}%
                  </span>
                ),
              },
              {
                key: "downtime_minutes",
                header: "Даунтайм (мин)",
                sortable: true,
                render: (row) => (
                  <span className="text-sm text-zinc-500">{row.downtime_minutes}</span>
                ),
              },
              {
                key: "incidents_count",
                header: "Инцидентов",
                sortable: true,
                render: (row) => (
                  <span className="text-sm text-zinc-500">{row.incidents_count}</span>
                ),
              },
            ]}
            data={uptimeData?.stations ?? []}
            keyExtractor={(row) => row.station_id}
            loading={uptimeLoading}
            emptyMessage="Нет данных по станциям"
          />
        )}
      </div>
    </div>
  );
}
