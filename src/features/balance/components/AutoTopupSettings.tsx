import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/api/unifiedClient";
import { z } from "zod";

const AutoTopupSchema = z.object({
  success: z.boolean(),
  auto_topup_enabled: z.boolean(),
  auto_topup_threshold: z.number(),
  auto_topup_amount: z.number(),
});

export function AutoTopupSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["balance", "auto-topup"],
    queryFn: () =>
      fetchJson("/api/v1/balance/auto-topup", { method: "GET" }, AutoTopupSchema),
  });

  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(100);
  const [amount, setAmount] = useState(500);

  useEffect(() => {
    if (data) {
      setEnabled(data.auto_topup_enabled);
      setThreshold(data.auto_topup_threshold);
      setAmount(data.auto_topup_amount);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetchJson(
        "/api/v1/balance/auto-topup",
        {
          method: "PUT",
          body: JSON.stringify({
            auto_topup_enabled: enabled,
            auto_topup_threshold: threshold,
            auto_topup_amount: amount,
          }),
        },
        z.object({ success: z.boolean() }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["balance", "auto-topup"] }),
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon icon="solar:refresh-circle-bold-duotone" width={24} className="text-red-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Автопополнение
          </h2>
        </div>
        <button
          onClick={() => {
            setEnabled(!enabled);
            setTimeout(() => saveMutation.mutate(), 100);
          }}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            enabled ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Порог баланса (сом)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 text-sm"
              min={0}
            />
            <p className="text-xs text-zinc-400 mt-1">
              Пополнение произойдёт когда баланс упадёт ниже этого значения
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Сумма пополнения (сом)
            </label>
            <div className="flex gap-2 flex-wrap">
              {[200, 500, 1000, 2000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    amount === v
                      ? "bg-red-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {v} сом
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Icon icon="solar:card-linear" width={16} />
              <span>Привязанная карта: нет</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Привязка карты будет доступна после интеграции с платёжной системой
            </p>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-400 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {saveMutation.isPending ? "Сохранение..." : "Сохранить настройки"}
          </button>
        </div>
      )}
    </div>
  );
}
