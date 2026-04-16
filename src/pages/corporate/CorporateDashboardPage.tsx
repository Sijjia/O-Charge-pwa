import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useQuery } from "@tanstack/react-query";

const DashboardSchema = z.object({
  success: z.boolean(),
  data: z.object({
    company: z.object({
      name: z.string(),
      billing_type: z.string(),
      balance: z.number(),
      credit_limit: z.number(),
    }),
    current_month: z.object({
      spent: z.number(),
      limit: z.number().nullable(),
      remaining: z.number().nullable(),
    }),
    employees: z.object({
      total: z.number(),
      active_today: z.number(),
    }),
    recent_transactions: z.array(z.object({
      amount: z.number(),
      type: z.string(),
      description: z.string().nullable(),
      created_at: z.string().nullable(),
      employee_name: z.string().nullable(),
    })),
  }),
}).passthrough();

function corporateHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("corporateToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CorporateDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["corporate-dashboard"],
    queryFn: () =>
      fetchJson(
        "/api/v1/corporate/dashboard",
        { method: "GET", headers: corporateHeaders() },
        DashboardSchema,
      ),
  });

  const dashboard = data?.data;

  const stats = [
    {
      label: "Сотрудников",
      value: dashboard ? String(dashboard.employees.total) : "—",
      sub: dashboard ? `${dashboard.employees.active_today} активных сегодня` : null,
      icon: "solar:users-group-rounded-linear",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Расход за месяц",
      value: dashboard ? `${Math.round(dashboard.current_month.spent)} с` : "—",
      sub: dashboard?.current_month.limit
        ? `лимит ${Math.round(dashboard.current_month.limit)} с`
        : null,
      icon: "solar:wallet-money-linear",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Баланс",
      value: dashboard ? `${Math.round(dashboard.company.balance)} с` : "—",
      sub: dashboard?.company.billing_type === "postpaid"
        ? `кредит ${Math.round(dashboard.company.credit_limit)} с`
        : dashboard?.company.billing_type === "prepaid" ? "предоплата" : null,
      icon: "solar:card-linear",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Остаток лимита",
      value: dashboard?.current_month.remaining != null
        ? `${Math.round(dashboard.current_month.remaining)} с`
        : "∞",
      sub: dashboard?.current_month.limit ? "до конца месяца" : "без лимита",
      icon: "solar:graph-up-linear",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <div>
            <p className="text-red-400 text-sm font-medium">Ошибка загрузки</p>
            <p className="text-red-400/70 text-xs mt-1">
              {error instanceof Error ? error.message : "Не удалось загрузить данные"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
          Обзор
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {dashboard?.company.name || "Корпоративная панель управления"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <Icon icon={stat.icon} width={22} className={stat.color} />
              </div>
              <span className="text-xs text-zinc-500 font-medium">
                {stat.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 font-display">
          Последние операции
        </h2>

        {dashboard && dashboard.recent_transactions.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recent_transactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === "charge" ? "bg-red-500/10" :
                    tx.type === "topup" ? "bg-emerald-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    <Icon
                      icon={
                        tx.type === "charge" ? "solar:bolt-linear" :
                        tx.type === "topup" ? "solar:wallet-money-linear" :
                        "solar:undo-left-linear"
                      }
                      width={16}
                      className={
                        tx.type === "charge" ? "text-red-400" :
                        tx.type === "topup" ? "text-emerald-400" :
                        "text-blue-400"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-900 dark:text-white">
                      {tx.description || (tx.type === "charge" ? "Зарядка" : tx.type === "topup" ? "Пополнение" : "Возврат")}
                    </p>
                    {tx.employee_name && (
                      <p className="text-xs text-zinc-500">{tx.employee_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    tx.type === "charge" ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {tx.type === "charge" ? "-" : "+"}{Math.round(tx.amount)} с
                  </p>
                  {tx.created_at && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600">
                      {new Date(tx.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon icon="solar:history-linear" width={28} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm">
              Нет операций
            </p>
            <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">
              Добавьте сотрудников для начала работы
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CorporateDashboardPage;
