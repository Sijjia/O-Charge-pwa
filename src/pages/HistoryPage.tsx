import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useChargingHistory,
  useTransactionHistory,
  useUsageStatistics,
} from "../features/history/hooks/useChargingHistory";
import { ChargingHistoryCard } from "../features/history/components/ChargingHistoryCard";
import { TransactionCard } from "../features/history/components/TransactionCard";
import { ExportButton } from "../features/history/components/ExportButton";
import { ChargingSessionDetailsModal } from "../features/history/components/ChargingSessionDetailsModal";
import type { ChargingHistoryItem } from "../features/history/types";
import {
  ListSkeleton,
  CardSkeleton,
} from "@/shared/components/SkeletonLoaders";

type TabType = "charging" | "transactions" | "statistics";

export function HistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("charging");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("last30");
  const [selectedSession, setSelectedSession] =
    useState<ChargingHistoryItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: chargingHistory, isLoading: isLoadingCharging } =
    useChargingHistory();
  const { data: transactionHistory, isLoading: isLoadingTransactions } =
    useTransactionHistory();
  const { data: statistics, isLoading: isLoadingStats } = useUsageStatistics();

  const handleChargingItemClick = (item: ChargingHistoryItem) => {
    setSelectedSession(item);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedSession(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(Math.round(amount));
  };

  // Virtualization setup for charging history (threshold: 100+ items)
  const chargingListRef = useRef<HTMLDivElement>(null);
  const shouldVirtualizeCharging = (chargingHistory?.length ?? 0) >= 100;

  const chargingVirtualizer = useVirtualizer({
    count: chargingHistory?.length ?? 0,
    getScrollElement: () => chargingListRef.current,
    estimateSize: () => 200, // Estimated height of each charging history card
    enabled: shouldVirtualizeCharging,
  });

  // Virtualization setup for transaction history (threshold: 100+ items)
  const transactionListRef = useRef<HTMLDivElement>(null);
  const shouldVirtualizeTransactions = (transactionHistory?.length ?? 0) >= 100;

  const transactionVirtualizer = useVirtualizer({
    count: transactionHistory?.length ?? 0,
    getScrollElement: () => transactionListRef.current,
    estimateSize: () => 150, // Estimated height of each transaction card
    enabled: shouldVirtualizeTransactions,
  });

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 transition-colors duration-300"
      style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}
    >
      {/* Header */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-white/5 sticky-header-safe z-10 transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">История</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 -mr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300"
          >
            <Icon icon="solar:tuning-2-linear" width={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("charging")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "charging"
              ? "text-red-500"
              : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon icon="solar:bolt-linear" width={16} />
              <span>Зарядки</span>
            </div>
            {activeTab === "charging" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "transactions"
              ? "text-red-500"
              : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon icon="solar:card-linear" width={16} />
              <span>Платежи</span>
            </div>
            {activeTab === "transactions" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("statistics")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "statistics"
              ? "text-red-500"
              : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon icon="solar:graph-up-linear" width={16} />
              <span>Статистика</span>
            </div>
            {activeTab === "statistics" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Filters (показываем если нажата кнопка фильтра) */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 transition-colors">
          <div className="flex items-center gap-2 overflow-x-auto">
            {([
              { key: "last30", label: "Последние 30 дней" },
              { key: "week", label: "Эта неделя" },
              { key: "month", label: "Этот месяц" },
              { key: "all", label: "Весь период" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === f.key
                  ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-transparent"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Charging History Tab */}
        {activeTab === "charging" && (
          <div className="space-y-3">
            {/* Export Button */}
            {chargingHistory && chargingHistory.length > 0 && (
              <div className="flex justify-end mb-3">
                <ExportButton data={chargingHistory} type="charging" />
              </div>
            )}

            {isLoadingCharging ? (
              <ListSkeleton count={5} />
            ) : chargingHistory && chargingHistory.length > 0 ? (
              shouldVirtualizeCharging ? (
                // Virtualized rendering for 100+ items
                <div
                  ref={chargingListRef}
                  style={{
                    height: "calc(100vh - 300px)",
                    overflow: "auto",
                  }}
                >
                  <div
                    style={{
                      height: `${chargingVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {chargingVirtualizer
                      .getVirtualItems()
                      .map((virtualItem) => {
                        const item = chargingHistory[virtualItem.index];
                        if (!item) return null;
                        return (
                          <div
                            key={item.id}
                            data-index={virtualItem.index}
                            ref={chargingVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <ChargingHistoryCard
                              item={item}
                              onClick={handleChargingItemClick}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                // Non-virtualized rendering for < 100 items
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {chargingHistory.map((item) => (
                    <ChargingHistoryCard
                      key={item.id}
                      item={item}
                      onClick={handleChargingItemClick}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-[#111621] border border-zinc-100 dark:border-white/[0.04] rounded-3xl p-8 mt-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute inset-0 bg-blue-100 dark:bg-blue-500/10 rounded-full animate-pulse-glow" />
                  <div className="absolute inset-2 bg-blue-200 dark:bg-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600 dark:text-blue-500">
                    <Icon icon="solar:bolt-circle-bold-duotone" width={48} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Зарядок пока нет</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] leading-relaxed mb-6">
                  Здесь будут отображаться ваши завершенные зарядные сессии. Найдите ближайшую станцию на карте!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-secondary w-full py-3.5 text-sm"
                >
                  Карта станций
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-3">
            {/* Export Button */}
            {transactionHistory && transactionHistory.length > 0 && (
              <div className="flex justify-end mb-3">
                <ExportButton data={transactionHistory} type="transaction" />
              </div>
            )}

            {isLoadingTransactions ? (
              <ListSkeleton count={5} />
            ) : transactionHistory && transactionHistory.length > 0 ? (
              shouldVirtualizeTransactions ? (
                // Virtualized rendering for 100+ items
                <div
                  ref={transactionListRef}
                  style={{
                    height: "calc(100vh - 300px)",
                    overflow: "auto",
                  }}
                >
                  <div
                    style={{
                      height: `${transactionVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {transactionVirtualizer
                      .getVirtualItems()
                      .map((virtualItem) => {
                        const transaction =
                          transactionHistory[virtualItem.index];
                        if (!transaction) return null;
                        return (
                          <div
                            key={transaction.id}
                            data-index={virtualItem.index}
                            ref={transactionVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <TransactionCard transaction={transaction} />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                // Non-virtualized rendering for < 100 items
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {transactionHistory.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-[#111621] border border-zinc-100 dark:border-white/[0.04] rounded-3xl p-8 mt-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4">
                  <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/10 rounded-full animate-pulse-glow" />
                  <div className="absolute inset-2 bg-emerald-200 dark:bg-emerald-500/20 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                    <Icon icon="solar:card-linear" width={48} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">История платежей пуста</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] leading-relaxed">
                  Здесь будут отображаться ваши транзакции: пополнения баланса и списания за зарядку.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <div className="space-y-4">
            {isLoadingStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : statistics ? (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Всего сессий</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {statistics.totalSessions}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Всего энергии</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {statistics.totalEnergy.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">кВт·ч</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                      Всего потрачено
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(statistics.totalCost)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">сом</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Время зарядки</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {Math.round(statistics.totalDuration)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">минут</p>
                  </div>
                </div>

                {/* Average Stats + Favorite Station — side by side on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
                      Средние показатели
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Энергия за сессию
                        </span>
                        <span className="font-medium">
                          {statistics.averageSessionEnergy.toFixed(1)} кВт·ч
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Стоимость сессии
                        </span>
                        <span className="font-medium">
                          {formatCurrency(statistics.averageSessionCost)} сом
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          Длительность сессии
                        </span>
                        <span className="font-medium">
                          {Math.round(statistics.averageSessionDuration)} мин
                        </span>
                      </div>
                    </div>
                  </div>

                  {statistics.favoriteStation && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
                        Любимая станция
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/15 rounded-lg flex items-center justify-center">
                          <Icon icon="solar:bolt-linear" width={20} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {statistics.favoriteStation.name}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {statistics.favoriteStation.visitsCount} посещений
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Monthly Chart */}
                {statistics.monthlyData &&
                  statistics.monthlyData.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
                        По месяцам
                      </h3>
                      <div className="space-y-3">
                        {statistics.monthlyData.map((month) => (
                          <div key={month.month}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {month.month}
                              </span>
                              <span className="text-sm text-zinc-500">
                                {month.sessions} сессий
                              </span>
                            </div>
                            <div className="bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 transition-colors">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{
                                  width: `${(month.energy / Math.max(...statistics.monthlyData.map((m) => m.energy))) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                {month.energy.toFixed(1)} кВт·ч
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                {formatCurrency(month.cost)} сом
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-center mx-auto mb-4 text-zinc-400 dark:text-zinc-500 transition-colors">
                  <Icon icon="solar:graph-up-linear" width={32} />
                </div>
                <p className="text-zinc-600 dark:text-zinc-500 font-medium">Нет данных для статистики</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-400 mt-1">
                  Статистика появится после первой зарядки
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модалка деталей сессии */}
      <ChargingSessionDetailsModal
        session={selectedSession}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
}
