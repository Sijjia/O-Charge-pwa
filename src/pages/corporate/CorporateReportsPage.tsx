import { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useQuery } from "@tanstack/react-query";

const ReportSchema = z.object({
  success: z.boolean(),
  data: z.object({
    company_name: z.string(),
    period: z.object({
      start: z.string(),
      end: z.string(),
    }),
    summary: z.object({
      total_amount: z.number(),
      sessions_count: z.number(),
      employees_charged: z.number(),
    }),
    by_employee: z.array(z.object({
      employee_id: z.string(),
      name: z.string(),
      position: z.string().nullable().optional(),
      sessions_count: z.number(),
      amount: z.number(),
    })),
  }),
}).passthrough();

function corporateHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("corporateToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getPeriodDates(period: "week" | "month" | "quarter"): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0]!;

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: start.toISOString().split("T")[0]!, end };
  }
  if (period === "quarter") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 3);
    return { start: start.toISOString().split("T")[0]!, end };
  }
  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.toISOString().split("T")[0]!, end };
}

export function CorporateReportsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  const dates = useMemo(() => getPeriodDates(period), [period]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["corporate-reports", period],
    queryFn: () =>
      fetchJson(
        `/api/v1/corporate/reports?period_start=${dates.start}&period_end=${dates.end}`,
        { method: "GET", headers: corporateHeaders() },
        ReportSchema,
      ),
  });

  const report = data?.data;

  const summaryCards = [
    {
      label: "Расход, сом",
      value: report ? `${Math.round(report.summary.total_amount)}` : "—",
      icon: "solar:wallet-money-linear",
      color: "text-amber-400",
    },
    {
      label: "Сессий",
      value: report ? String(report.summary.sessions_count) : "—",
      icon: "solar:history-linear",
      color: "text-blue-400",
    },
    {
      label: "Сотрудников",
      value: report ? String(report.summary.employees_charged) : "—",
      icon: "solar:users-group-rounded-linear",
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
            Отчёты
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Аналитика по зарядкам сотрудников
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "week" as const, label: "Неделя" },
          { key: "month" as const, label: "Месяц" },
          { key: "quarter" as const, label: "Квартал" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === item.key
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">
            {error instanceof Error ? error.message : "Не удалось загрузить отчёт"}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Icon icon={card.icon} width={18} className={card.color} />
              <span className="text-xs text-zinc-500">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white font-display">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              ) : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Employee Breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 font-display">
          Детализация по сотрудникам
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-linear" width={24} className="text-red-500 animate-spin" />
          </div>
        ) : report && report.by_employee.length > 0 ? (
          <div className="space-y-2">
            {report.by_employee.map((emp) => {
              const pct = report.summary.total_amount > 0
                ? (emp.amount / report.summary.total_amount) * 100
                : 0;

              return (
                <div
                  key={emp.employee_id}
                  className="flex items-center gap-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Icon icon="solar:user-linear" width={16} className="text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-zinc-900 dark:text-white font-medium truncate">
                        {emp.name || "Без имени"}
                      </p>
                      <span className="text-sm text-zinc-900 dark:text-white font-semibold ml-2 shrink-0">
                        {Math.round(emp.amount)} с
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {emp.sessions_count} сессий
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon icon="solar:graph-up-linear" width={28} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm">
              Нет данных за выбранный период
            </p>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">
              Данные появятся после первых зарядок сотрудников
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CorporateReportsPage;
