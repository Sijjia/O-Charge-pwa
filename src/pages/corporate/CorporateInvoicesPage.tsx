import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson } from "@/api/unifiedClient";
import { useQuery } from "@tanstack/react-query";

const InvoicesResponseSchema = z.object({
  success: z.boolean(),
  invoices: z.array(z.record(z.unknown())).optional(),
}).passthrough();

function corporateHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("corporateToken") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function CorporateInvoicesPage() {
  const { data, error } = useQuery({
    queryKey: ["corporate-invoices"],
    queryFn: () =>
      fetchJson(
        "/api/v1/corporate/invoices",
        { method: "GET", headers: corporateHeaders() },
        InvoicesResponseSchema,
      ),
    retry: false,
  });

  const invoices = data?.invoices || [];
  const isUnavailable = !!error;

  return (
    <div className="p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display tracking-tight">
            Счета
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Счета и акты за услуги зарядки
          </p>
        </div>
      </div>

      {isUnavailable ? (
        /* Feature not available */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Icon
                icon="solar:settings-linear"
                width={36}
                className="text-amber-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Функция в разработке
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Модуль выставления счетов находится в разработке и будет доступен в ближайшее время.
              Вы получите уведомление, когда функция станет доступна.
            </p>
          </div>
        </div>
      ) : invoices.length > 0 ? (
        /* Has invoices — placeholder for future table */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
          <p className="text-sm text-zinc-500">Найдено счетов: {invoices.length}</p>
        </div>
      ) : (
        /* No invoices yet */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm dark:shadow-none transition-colors">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon
                icon="solar:document-text-linear"
                width={36}
                className="text-zinc-400 dark:text-zinc-600"
              />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Нет счетов
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Счета формируются автоматически в конце каждого расчётного периода
            </p>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Icon
            icon="solar:info-circle-linear"
            width={20}
            className="text-blue-400 shrink-0 mt-0.5"
          />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
              Как это работает
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Счёт за услуги зарядки формируется автоматически в конце каждого
              месяца. Вы получите уведомление на email с деталями и ссылкой на
              скачивание документов.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CorporateInvoicesPage;
