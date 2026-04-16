/**
 * Partner Revenue — графики дохода: today/week/month + breakdown
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { usePartnerRevenue } from "@/features/partner/hooks/usePartnerRevenue";
import { demoDashboard } from "@/shared/demo/demoData";

type Period = "today" | "week" | "month";

const periodLabels: Record<Period, string> = {
  today: "Сегодня",
  week: "Неделя",
  month: "Месяц",
};

export function PartnerRevenuePage() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading } = usePartnerRevenue(period);

  const totalRevenue = data?.reduce((sum, item) => sum + item.revenue, 0) ?? 0;
  const totalEnergy = data?.reduce((sum, item) => sum + (item.energy_kwh ?? 0), 0) ?? 0;
  const totalSessions = data?.reduce((sum, item) => sum + (item.sessions ?? 0), 0) ?? 0;
  const totalPartnerShare = data?.reduce((sum, item) => sum + (item.partner_share ?? 0), 0) ?? 0;

  // Simple bar chart - max value for scaling
  const maxRevenue = data ? Math.max(...data.map((d) => d.revenue), 1) : 1;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Доходы</h1>
        <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">Доля: {demoDashboard.partner_share_percent}%</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                ? "bg-red-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-gray-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-400">Общий доход</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{totalRevenue.toLocaleString()} сом</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-400">Ваша доля</p>
          <p className="text-xl font-bold text-green-400 mt-1">{totalPartnerShare.toLocaleString()} сом</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-400">Энергия</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{totalEnergy.toLocaleString()} кВтч</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm dark:shadow-none transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-400">Сессий</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{totalSessions}</p>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Доход по периодам</h3>

          {/* Simple bar chart */}
          <div className="space-y-2">
            {data?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 dark:text-gray-400 w-16 flex-shrink-0 text-right">{item.date}</span>
                <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-700 dark:text-gray-300 w-20 flex-shrink-0">{item.revenue.toLocaleString()} сом</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {data && data.length > 0 && (
        <div className="bg-white dark:bg-[#111621] md:rounded-3xl border-y md:border border-zinc-200 dark:border-white/[0.04] overflow-hidden md:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] transition-all">
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Детализация</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Период</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Доход</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Ваша доля</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Энергия</th>
                  <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Сессий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.02]">
                {data.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm text-zinc-700 dark:text-gray-300">
                    <td className="py-4 px-6 whitespace-nowrap align-middle">{item.date}</td>
                    <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{item.revenue.toLocaleString()} сом</td>
                    <td className="py-4 px-6 whitespace-nowrap align-middle text-right text-green-400 font-medium">{(item.partner_share ?? 0).toLocaleString()} сом</td>
                    <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{(item.energy_kwh ?? 0).toLocaleString()} кВтч</td>
                    <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{item.sessions ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
