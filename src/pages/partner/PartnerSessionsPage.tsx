/**
 * Partner Sessions — таблица сессий с колонкой "Ваша доля"
 */

import { useState } from "react";
import { Icon } from "@iconify/react";
import { usePartnerSessions } from "@/features/partner/hooks/usePartnerSessions";

export function PartnerSessionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePartnerSessions({ page });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin" />
      </div>
    );
  }

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Сессии зарядки</h1>
        <p className="text-zinc-500 dark:text-gray-400 text-sm mt-1">{total} сессий всего</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-[#111621] md:rounded-3xl border-y md:border border-zinc-200 dark:border-white/[0.04] overflow-hidden md:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5">
              <tr>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Станция</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Статус</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Энергия</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Сумма</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Ваша доля</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-left">Дата</th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-right">Длит.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.02]">
              {sessions.map((s) => (
                <tr key={s.id} className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors text-sm text-zinc-700 dark:text-gray-300">
                  <td className="py-4 px-6 whitespace-nowrap align-middle">
                    <div className="font-medium text-zinc-900 dark:text-white">{s.station_name}</div>
                    <div className="text-xs text-zinc-400 dark:text-gray-500">Конн. #{s.connector_id}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "completed"
                          ? "text-green-400 bg-green-400/10"
                          : s.status === "in_progress"
                            ? "text-blue-400 bg-blue-400/10"
                            : "text-yellow-400 bg-yellow-400/10"
                        }`}
                    >
                      {s.status === "completed" ? "Завершена" : s.status === "in_progress" ? "В процессе" : "Остановлена"}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{s.energy_kwh.toFixed(1)} кВтч</td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{s.amount.toFixed(2)} сом</td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle text-right text-green-400 font-medium">{s.partner_share ?? Math.round(s.amount * 0.8)} сом</td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle text-zinc-500 dark:text-gray-400">
                    {new Date(s.started_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    {" "}
                    {new Date(s.started_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap align-middle text-right">{s.duration_minutes ?? "-"} мин</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 shadow-sm dark:shadow-none transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-zinc-900 dark:text-white font-medium">{s.station_name}</p>
                <p className="text-xs text-zinc-400 dark:text-gray-500">
                  {new Date(s.started_at).toLocaleDateString("ru-RU")} {new Date(s.started_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "completed"
                    ? "text-green-400 bg-green-400/10"
                    : s.status === "in_progress"
                      ? "text-blue-400 bg-blue-400/10"
                      : "text-yellow-400 bg-yellow-400/10"
                  }`}
              >
                {s.status === "completed" ? "Завершена" : s.status === "in_progress" ? "В процессе" : "Остановлена"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-gray-400">{s.energy_kwh.toFixed(1)} кВтч</span>
              <span className="text-zinc-900 dark:text-white">{s.amount.toFixed(2)} сом</span>
              <span className="text-green-400 font-medium">{s.partner_share ?? Math.round(s.amount * 0.8)} сом</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-gray-300 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Icon icon="solar:alt-arrow-left-linear" width={16} />
          </button>
          <span className="text-sm text-zinc-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-gray-300 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Icon icon="solar:alt-arrow-right-linear" width={16} />
          </button>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-16">
          <Icon icon="solar:history-linear" width={48} className="text-zinc-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-gray-400">Сессии не найдены</p>
        </div>
      )}
    </div>
  );
}
