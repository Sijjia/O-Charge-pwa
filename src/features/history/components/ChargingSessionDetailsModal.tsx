/**
 * Модалка деталей сессии зарядки для пользователя
 * Показывает подробную информацию о зарядной сессии из истории
 */

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import type { ChargingHistoryItem } from "../types";

interface ChargingSessionDetailsModalProps {
  session: ChargingHistoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ChargingSessionDetailsModal({
  session,
  isOpen,
  onClose,
}: ChargingSessionDetailsModalProps) {
  if (!isOpen || !session) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes} мин`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/15 text-green-400";
      case "in_progress":
        return "bg-blue-500/15 text-blue-400";
      case "stopped":
        return "bg-orange-500/15 text-orange-400";
      case "failed":
        return "bg-red-500/15 text-red-400";
      default:
        return "bg-zinc-800 text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Завершена";
      case "in_progress":
        return "В процессе";
      case "stopped":
        return "Остановлена";
      case "failed":
        return "Ошибка";
      default:
        return status;
    }
  };

  const getLimitText = (limitType?: string, limitValue?: number) => {
    if (!limitType || limitType === "none") return "Без ограничений";
    if (limitType === "energy") return `${limitValue} кВт·ч`;
    if (limitType === "amount") return `${limitValue} сом`;
    return "—";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="fixed inset-x-4 inset-y-4 z-[60] max-w-lg mx-auto flex items-center"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl dark:shadow-black/50 max-h-[calc(100vh-2rem)] overflow-y-auto transition-colors w-full">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between rounded-t-2xl transition-colors">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Детали сессии
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-gray-500 mt-0.5">
                    ID: {session.sessionId.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  aria-label="Закрыть"
                >
                  <Icon icon="solar:close-linear" width={24} className="text-zinc-400 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}
                  >
                    {getStatusText(session.status)}
                  </span>
                  {session.limitType && session.limitType !== "none" && (
                    <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-gray-300 rounded-full text-sm transition-colors">
                      Лимит:{" "}
                      {getLimitText(session.limitType, session.limitValue)}
                    </span>
                  )}
                </div>

                {/* Station Info */}
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700/50 rounded-full flex items-center justify-center flex-shrink-0 text-zinc-600 dark:text-white transition-colors">
                      <Icon icon="solar:map-point-linear" width={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {session.stationName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-gray-400">
                        {session.stationAddress}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-gray-500 mt-1">
                        Коннектор {session.connectorId} •{" "}
                        {session.connectorType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 space-y-3 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Начало</span>
                    <span className="font-medium tabular-nums text-zinc-900 dark:text-white">
                      {formatDate(session.startTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Окончание</span>
                    <span className="font-medium tabular-nums text-zinc-900 dark:text-white">
                      {session.endTime ? formatDate(session.endTime) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Длительность</span>
                    <span className="font-medium tabular-nums text-zinc-900 dark:text-white">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                </div>

                {/* Main Stats */}
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 space-y-3 transition-colors">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <Icon icon="solar:bolt-linear" className="text-yellow-600 dark:text-yellow-500" width={16} />
                      Энергия
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {session.energyConsumed.toFixed(2)} кВтч
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Ср. мощность</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {session.averagePower.toFixed(1)} кВт
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Макс. мощность</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {session.maxPower.toFixed(1)} кВт
                    </span>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-white/5 transition-colors" />

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <Icon icon="solar:wallet-money-linear" className="text-green-600 dark:text-green-500" width={16} />
                      Стоимость
                    </span>
                    <span className="font-bold text-lg text-zinc-900 dark:text-white">
                      {session.totalCost.toFixed(2)} c
                    </span>
                  </div>
                </div>

                {/* Additional Details */}
                {(session.meterStart !== undefined || session.stopReason) && (
                <div className="bg-zinc-100 dark:bg-zinc-800/30 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-white/5 transition-colors">
                  <div className="space-y-2 text-sm">
                    {session.meterStart !== undefined &&
                      session.meterStop !== undefined && (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                              <Icon icon="solar:lock-linear" width={14} />
                              Показания начало
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {session.meterStart.toFixed(2)} кВт·ч
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                              <Icon icon="solar:lock-linear" width={14} />
                              Показания конец
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {session.meterStop.toFixed(2)} кВт·ч
                            </span>
                          </div>
                        </>
                      )}
                    {session.stopReason && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Причина остановки</span>
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {session.stopReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Error Info */}
                {session.errorCode && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-sm text-red-400">
                      <span className="font-medium">Ошибка:</span>{" "}
                      {session.errorCode}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-4 space-y-3 transition-colors">
                <button
                  onClick={onClose}
                  className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors active:scale-[0.98]"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
