import { useState } from "react";
import { Icon } from "@iconify/react";

interface GuidedStartModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  issues: string[];
  warnings: string[];
  summary?: {
    stationName?: string;
    stationAddress?: string;
    connectorId?: string | null;
    connectorType?: string | null;
    connectorPower?: number | null;
    isFullCharge?: boolean;
    estimatedEnergyKwh?: number | null;
    estimatedCostSom?: number | null;
    estimatedDurationMin?: number | null;
    pricePerKwh?: number | null;
  };
}

export function GuidedStartModal({
  open,
  onClose,
  onConfirm,
  issues,
  warnings,
  summary,
}: GuidedStartModalProps) {
  const [cableConnected, setCableConnected] = useState(false);

  if (!open) return null;

  const hasIssues = issues.length > 0;
  const hasWarnings = warnings.length > 0;
  const canStart = !hasIssues && cableConnected;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Header Navigation */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 z-20 shrink-0 transition-colors duration-300">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>

        <h1 className="text-lg font-bold font-display tracking-tight text-zinc-900 dark:text-white">
          Подтверждение
        </h1>

        <div className="w-10" />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto hide-scroll p-4 pb-48">
        <div className="space-y-4">
          {/* Issues / Warnings */}
          {hasIssues && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-[20px] flex items-start gap-3">
              <Icon icon="solar:danger-triangle-linear" width={18} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                  Проблемы для старта
                </p>
                <ul className="list-disc pl-4 text-sm text-red-600 dark:text-red-400 space-y-0.5">
                  {issues.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {hasWarnings && (
            <div className="p-4 bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 rounded-[20px] flex items-start gap-3">
              <Icon icon="solar:info-circle-linear" width={18} className="text-amber-500 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-yellow-400 mb-1">
                  Предупреждения
                </p>
                <ul className="list-disc pl-4 text-sm text-amber-600 dark:text-yellow-400 space-y-0.5">
                  {warnings.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!hasIssues && !hasWarnings && (
            <div className="p-4 bg-emerald-50 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/20 rounded-[20px] flex items-center gap-3">
              <Icon icon="solar:check-circle-bold" width={20} className="text-emerald-500 dark:text-green-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-green-400">
                Всё готово к запуску зарядки
              </span>
            </div>
          )}

          {/* Station & Connector Details Card */}
          {summary && (
            <div className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
              {/* Station Row */}
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-300 shrink-0 transition-colors">
                  <Icon icon="solar:ev-station-linear" width={22} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                    Станция
                  </div>
                  <div className="text-base font-bold text-zinc-900 dark:text-white font-display">
                    {summary.stationName ?? "—"}
                  </div>
                  {summary.stationAddress && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {summary.stationAddress}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Row */}
              <div className="p-5 flex items-start gap-4 bg-zinc-50/50 dark:bg-transparent">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-300 shrink-0 transition-colors">
                  <Icon icon="solar:plug-circle-linear" width={22} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                    Коннектор
                  </div>
                  <div className="text-base font-bold text-zinc-900 dark:text-white font-display">
                    Коннектор {summary.connectorId ?? "—"}
                    {summary.connectorType ? ` (${summary.connectorType})` : ""}
                  </div>
                  {summary.connectorPower && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 shadow-sm dark:shadow-none">
                        <Icon icon="solar:bolt-linear" width={12} />
                        {summary.connectorPower} кВт
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Card */}
          {summary && (
            <div className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-5 space-y-5 shadow-sm dark:shadow-none transition-colors duration-300">
              {/* Tariff */}
              {summary.pricePerKwh != null && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <Icon icon="solar:tag-price-linear" width={16} />
                      </div>
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        Тариф
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {summary.pricePerKwh} сом/кВтч
                    </span>
                  </div>
                  <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700/50" />
                </>
              )}

              {/* Cost / Full Charge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <Icon icon="solar:wallet-money-linear" width={16} />
                  </div>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {summary.isFullCharge ? "Режим" : "Резерв"}
                  </span>
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight font-display">
                  {summary.isFullCharge
                    ? "Полный заряд"
                    : summary.estimatedCostSom != null
                      ? `${Math.round(summary.estimatedCostSom)} сом`
                      : "—"}
                </span>
              </div>

              {/* Estimates (only for amount-limited charging) */}
              {!summary.isFullCharge &&
                (summary.estimatedEnergyKwh != null ||
                  summary.estimatedDurationMin != null) && (
                  <>
                    <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-700/50" />
                    <div className="grid grid-cols-2 gap-4">
                      {summary.estimatedEnergyKwh != null && (
                        <div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                            Энергия
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                            ~{summary.estimatedEnergyKwh.toFixed(2)} кВт·ч
                          </div>
                        </div>
                      )}
                      {summary.estimatedDurationMin != null && (
                        <div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
                            Время
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                            ~{Math.round(summary.estimatedDurationMin)} мин
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-500/5 rounded-xl p-3 border border-blue-100 dark:border-blue-500/10 flex gap-3 items-start">
                <Icon
                  icon="solar:info-circle-linear"
                  width={16}
                  className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"
                />
                <p className="text-[11px] leading-relaxed text-blue-600/80 dark:text-blue-300/80 font-medium">
                  {summary.isFullCharge
                    ? "Зарядка продолжится до полного заряда батареи или до нажатия кнопки «Стоп»."
                    : "Сумма резерва замораживается на карте. Неиспользованный остаток возвращается моментально."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Section */}
      <div className="absolute bottom-0 inset-x-0 bg-zinc-50 dark:bg-[#0A0E17] border-t border-zinc-200 dark:border-zinc-800 p-5 pb-8 z-30 flex flex-col gap-5 transition-colors duration-300">
        {/* Custom Checkbox */}
        <label className="group flex items-center gap-3.5 cursor-pointer pl-1">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={cableConnected}
              onChange={(e) => setCableConnected(e.target.checked)}
            />
            <div
              className="w-6 h-6 rounded-lg border-[1.5px] border-zinc-300 dark:border-zinc-600 bg-white dark:bg-transparent peer-checked:bg-red-600 peer-checked:border-red-600 flex items-center justify-center transition-all group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
              style={{
                transition:
                  "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s, border-color 0.2s",
              }}
            >
              {cableConnected && (
                <Icon
                  icon="solar:check-read-linear"
                  width={16}
                  className="text-white"
                />
              )}
            </div>
          </div>
          <span className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors select-none leading-snug">
            Я подключил кабель к автомобилю
          </span>
        </label>

        {/* Large CTA Button */}
        <button
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 group overflow-hidden relative transition-all duration-300 ${
            canStart
              ? "bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
          }`}
          disabled={!canStart}
          onClick={onConfirm}
        >
          {canStart && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          )}
          <Icon
            icon="solar:bolt-circle-bold"
            width={22}
            className={
              canStart ? "group-hover:scale-110 transition-transform" : ""
            }
          />
          <span className="tracking-tight">Начать зарядку</span>
        </button>
      </div>
    </div>
  );
}
