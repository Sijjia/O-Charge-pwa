import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePanelBase } from "@/shared/hooks/usePanelBase";
import { Icon } from "@iconify/react";
import {
  useTariffPlans,
  useAIAnalysis,
  useCompetitorPrices,
  useAddCompetitor,
  useDeleteCompetitor,
  useApplyRecommendation,
  useAnalyzeBatch,
  useAutoOptimize,
  useApplySelective,
} from "@/features/owner/hooks/useAdminTariffs";
import type { CompetitorPrice, CreateCompetitorBody, BatchStationRec, BatchLocation } from "@/features/owner/services/adminTariffsService";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminSearchBar } from "@/features/admin/components/AdminSearchBar";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";

const inputCls =
  "w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-red-500/50 transition-colors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const get = (obj: unknown, key: string): any => (obj as Record<string, unknown>)?.[key];

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-green-600",
  medium: "text-amber-600",
  low: "text-red-500",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

// ── Station Recommendation Row ───────────────────────────
function StationRecRow({
  rec,
  selected,
  onToggle,
  expanded,
  onExpand,
}: {
  rec: BatchStationRec;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const diff = rec.current_price && rec.recommended_price_per_kwh
    ? rec.recommended_price_per_kwh - rec.current_price
    : null;
  const diffPct = rec.price_change_pct;

  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        onClick={onExpand}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => { e.stopPropagation(); onToggle(); }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {rec.serial_number || rec.station_id.slice(0, 8)}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
              rec.station_type === "dc" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
            }`}>
              {rec.station_type.toUpperCase()}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[rec.confidence_level]} bg-current/10`}>
              {CONFIDENCE_LABELS[rec.confidence_level]}
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate">{rec.model}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-zinc-400">Текущая</p>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{rec.current_price?.toFixed(1) || "—"}</p>
          </div>
          <Icon icon="solar:arrow-right-linear" width={14} className="text-zinc-400" />
          <div className="text-right">
            <p className="text-xs text-zinc-400">Рекомендуемая</p>
            <p className="text-sm font-bold text-violet-600">{rec.recommended_price_per_kwh?.toFixed(1) || "—"}</p>
          </div>
          {diff !== null && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              diff > 0 ? "bg-green-500/10 text-green-600" : diff < 0 ? "bg-red-500/10 text-red-500" : "bg-zinc-100 text-zinc-500"
            }`}>
              {diff > 0 ? "+" : ""}{diff.toFixed(1)} ({diffPct != null ? `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%` : ""})
            </span>
          )}
          <Icon
            icon={expanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"}
            width={16}
            className="text-zinc-400"
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pl-11">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-sm">
            <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Обоснование</p>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{rec.reasoning}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase">Ночная</p>
                <p className="text-sm font-semibold text-blue-600">{rec.recommended_price_night?.toFixed(1)} KGS</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase">Сессий</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{get(rec.demand, "total_sessions") ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase">Загрузка</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {get(rec.demand, "utilization") === "high" ? "Высокая" :
                   get(rec.demand, "utilization") === "medium" ? "Средняя" : "Низкая"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase">Тренд</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {get(rec.revenue, "trend") === "growing" ? "Рост" :
                   get(rec.revenue, "trend") === "declining" ? "Спад" : "Стабильно"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Location Group ───────────────────────────────────────
function LocationGroup({
  location,
  selectedStations,
  onToggleStation,
  onToggleAll,
  expandedStations,
  onExpandStation,
}: {
  location: BatchLocation;
  selectedStations: Set<string>;
  onToggleStation: (id: string) => void;
  onToggleAll: (ids: string[], selected: boolean) => void;
  expandedStations: Set<string>;
  onExpandStation: (id: string) => void;
}) {
  const stationIds = location.stations.map((s) => s.station_id);
  const allSelected = stationIds.every((id) => selectedStations.has(id));
  const someSelected = stationIds.some((id) => selectedStations.has(id));

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
          onChange={() => onToggleAll(stationIds, !allSelected)}
          className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
        />
        <Icon icon="solar:map-point-linear" width={16} className="text-red-500" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">{location.location_name}</span>
          {location.location_city && (
            <span className="text-xs text-zinc-400 ml-2">{location.location_city}</span>
          )}
        </div>
        <span className="text-xs text-zinc-400">{location.station_count} станций</span>
        {location.recommended_avg_price && (
          <span className="text-xs font-semibold text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-full">
            ~{location.recommended_avg_price} KGS
          </span>
        )}
      </div>
      {location.stations.map((st) => (
        <StationRecRow
          key={st.station_id}
          rec={st}
          selected={selectedStations.has(st.station_id)}
          onToggle={() => onToggleStation(st.station_id)}
          expanded={expandedStations.has(st.station_id)}
          onExpand={() => onExpandStation(st.station_id)}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════

export function OwnerTariffsPage() {
  const navigate = useNavigate();
  const base = usePanelBase();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error } = useTariffPlans(showInactive);
  const plans = data?.data || [];

  // AI state
  const aiAnalysis = useAIAnalysis();
  const { data: competitorsData } = useCompetitorPrices();
  const competitors = competitorsData?.data || [];
  const addCompetitor = useAddCompetitor();
  const deleteCompetitor = useDeleteCompetitor();
  const applyRec = useApplyRecommendation();

  // Batch & Auto-optimize
  const analyzeBatch = useAnalyzeBatch();
  const autoOptimize = useAutoOptimize();
  const applySelective = useApplySelective();

  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [compForm, setCompForm] = useState<CreateCompetitorBody>({
    competitor_name: "",
    price_per_kwh: 0,
    charging_type: "DC",
    connector_type: "CCS2",
    power_kw: 60,
  });

  // Batch results state
  const [selectedStations, setSelectedStations] = useState<Set<string>>(new Set());
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());
  const [showAutoResult, setShowAutoResult] = useState(false);

  // Latest AI result (global)
  const aiResult = aiAnalysis.data?.data;
  // Batch results
  const batchResult = analyzeBatch.data?.data;
  const autoResult = autoOptimize.data?.data;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter((p) => p.name.toLowerCase().includes(q));
  }, [plans, searchQuery]);

  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter((p) => p.is_active).length,
    defaults: plans.filter((p) => p.is_default).length,
    withStations: plans.filter((p) => (p.stations_count || 0) > 0).length,
  }), [plans]);

  // Selection helpers
  const toggleStation = (id: string) => {
    setSelectedStations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllStations = (ids: string[], selected: boolean) => {
    setSelectedStations((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => selected ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedStations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!batchResult?.locations) return;
    const all = batchResult.locations.flatMap((l) => l.stations.map((s) => s.station_id));
    setSelectedStations(new Set(all));
  };

  const deselectAll = () => setSelectedStations(new Set());

  // Find first recommendation_id from selected stations for apply-selective
  const firstRecId = useMemo(() => {
    if (!batchResult?.locations) return null;
    for (const loc of batchResult.locations) {
      for (const st of loc.stations) {
        if (selectedStations.has(st.station_id) && st.recommendation_id) {
          return st.recommendation_id;
        }
      }
    }
    return null;
  }, [batchResult, selectedStations]);

  const handleApplySelected = async () => {
    if (!firstRecId || selectedStations.size === 0) return;
    await applySelective.mutateAsync({
      recommendation_id: firstRecId,
      station_ids: Array.from(selectedStations),
    });
    setSelectedStations(new Set());
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" width={32} className="text-red-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Загрузка тарифов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0 mt-0.5" width={18} />
          <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Не удалось загрузить тарифы"}</p>
        </div>
      </div>
    );
  }

  const handleAddCompetitor = async () => {
    if (!compForm.competitor_name || !compForm.price_per_kwh) return;
    await addCompetitor.mutateAsync(compForm);
    setShowAddCompetitor(false);
    setCompForm({ competitor_name: "", price_per_kwh: 0, charging_type: "DC", connector_type: "CCS2", power_kw: 60 });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Тарифы"
        helpText="AI-анализ оптимизирует цены по каждой станции на основе конкурентов, спроса и выручки."
        subtitle="Управление тарифами и AI ценообразование"
        actionLabel="Создать план"
        actionIcon="solar:add-circle-linear"
        onAction={() => navigate(`${base}/tariffs/create`)}
      />

      {/* ═══ AI Pricing Section ═══ */}
      <div className="bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 border border-violet-500/20 dark:border-violet-500/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Icon icon="solar:magic-stick-3-bold-duotone" width={18} className="text-violet-500" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">AI Ценообразование</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => aiAnalysis.mutate({})}
              disabled={aiAnalysis.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Icon icon={aiAnalysis.isPending ? "solar:refresh-linear" : "solar:magic-stick-3-linear"} width={14} className={aiAnalysis.isPending ? "animate-spin" : ""} />
              {aiAnalysis.isPending ? "Анализ..." : "Глобальный анализ"}
            </button>
            <button
              onClick={() => { analyzeBatch.mutate({}); setSelectedStations(new Set()); }}
              disabled={analyzeBatch.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Icon icon={analyzeBatch.isPending ? "solar:refresh-linear" : "solar:tuning-2-linear"} width={14} className={analyzeBatch.isPending ? "animate-spin" : ""} />
              {analyzeBatch.isPending ? "Анализ..." : "Анализ по станциям"}
            </button>
            <button
              onClick={() => { autoOptimize.mutate({}); setShowAutoResult(true); }}
              disabled={autoOptimize.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Icon icon={autoOptimize.isPending ? "solar:refresh-linear" : "solar:bolt-circle-linear"} width={14} className={autoOptimize.isPending ? "animate-spin" : ""} />
              {autoOptimize.isPending ? "Оптимизация..." : "Авто-оптимизация"}
            </button>
          </div>
        </div>

        {/* Global AI Result */}
        {aiResult && (
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Рекомендуемая</p>
                <p className="text-xl font-bold text-violet-600">{aiResult.recommended_price_per_kwh} <span className="text-sm font-normal text-zinc-400">KGS</span></p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Ночная</p>
                <p className="text-xl font-bold text-blue-600">{aiResult.recommended_price_night} <span className="text-sm font-normal text-zinc-400">KGS</span></p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Текущая средняя</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{aiResult.current_price_per_kwh?.toFixed(1) || "—"} <span className="text-sm font-normal text-zinc-400">KGS</span></p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Уверенность</p>
                <p className={`text-xl font-bold ${CONFIDENCE_COLORS[aiResult.confidence_level]}`}>
                  {CONFIDENCE_LABELS[aiResult.confidence_level]}
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1 font-medium">Обоснование</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{aiResult.reasoning}</p>
            </div>
            <button
              onClick={() => applyRec.mutate(aiResult.recommendation_id)}
              disabled={applyRec.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Icon icon="solar:check-circle-linear" width={16} />
              {applyRec.isPending ? "Применение..." : "Применить ко всем станциям"}
            </button>
          </div>
        )}

        {!aiResult && !batchResult && (
          <p className="text-sm text-zinc-500">Запустите анализ для получения рекомендаций по ценообразованию.</p>
        )}
      </div>

      {/* ═══ Auto-Optimize Results ═══ */}
      {showAutoResult && autoResult && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon="solar:bolt-circle-bold-duotone" width={20} className="text-green-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">Результат авто-оптимизации</h3>
            </div>
            <button onClick={() => setShowAutoResult(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded">
              <Icon icon="solar:close-circle-linear" width={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Всего станций</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">{autoResult.summary.total}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Применено</p>
              <p className="text-xl font-bold text-green-600">{autoResult.summary.applied_count}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Пропущено</p>
              <p className="text-xl font-bold text-amber-600">{autoResult.summary.skipped_count}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500">Ошибок</p>
              <p className="text-xl font-bold text-red-500">{autoResult.summary.error_count}</p>
            </div>
          </div>

          {/* Applied stations */}
          {autoResult.applied.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-3">
              <div className="px-4 py-2 bg-green-50 dark:bg-green-500/5 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">Применено ({autoResult.applied.length})</p>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                {autoResult.applied.map((item) => (
                  <div key={item.station_id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.station_name || item.station_id.slice(0, 8)}</p>
                      {item.location_name && <p className="text-xs text-zinc-400">{item.location_name}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-zinc-400">{item.old_price?.toFixed(1)}</span>
                      <Icon icon="solar:arrow-right-linear" width={12} className="text-zinc-400" />
                      <span className="text-sm font-bold text-green-600">{item.new_price.toFixed(1)} KGS</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        item.change_pct > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                      }`}>
                        {item.change_pct > 0 ? "+" : ""}{item.change_pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped stations */}
          {autoResult.skipped.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/5 border-b border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Пропущено ({autoResult.skipped.length})</p>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-40 overflow-y-auto">
                {autoResult.skipped.map((item, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{get(item, "station_name") || String(get(item, "station_id") ?? "").slice(0, 8)}</span>
                    <span className="text-xs text-zinc-400 shrink-0">{get(item, "reason")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Batch Results: Per-Station Recommendations ═══ */}
      {batchResult && batchResult.locations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Icon icon="solar:tuning-2-bold-duotone" width={20} className="text-blue-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Рекомендации по станциям
                <span className="text-sm font-normal text-zinc-400 ml-2">
                  ({get(batchResult.summary, "total_stations") ?? 0} станций)
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-violet-600 hover:underline">
                Выбрать все
              </button>
              <span className="text-zinc-300">|</span>
              <button onClick={deselectAll} className="text-xs text-zinc-500 hover:underline">
                Снять все
              </button>
              {selectedStations.size > 0 && (
                <button
                  onClick={handleApplySelected}
                  disabled={applySelective.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors ml-2"
                >
                  <Icon icon="solar:check-circle-linear" width={14} />
                  {applySelective.isPending ? "..." : `Применить к ${selectedStations.size} станциям`}
                </button>
              )}
            </div>
          </div>

          {/* Summary bar */}
          {batchResult.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">Средняя рекомендуемая</p>
                <p className="text-lg font-bold text-violet-600">{get(batchResult.summary, "avg_recommended_price") ?? "—"} KGS</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">Мин.</p>
                <p className="text-lg font-bold text-blue-600">{get(batchResult.summary, "min_recommended_price") ?? "—"} KGS</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">Макс.</p>
                <p className="text-lg font-bold text-amber-600">{get(batchResult.summary, "max_recommended_price") ?? "—"} KGS</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-500">Локаций</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{batchResult.locations.length}</p>
              </div>
            </div>
          )}

          {/* Location groups */}
          <div className="space-y-3">
            {batchResult.locations.map((loc) => (
              <LocationGroup
                key={loc.location_id || "no-loc"}
                location={loc}
                selectedStations={selectedStations}
                onToggleStation={toggleStation}
                onToggleAll={toggleAllStations}
                expandedStations={expandedStations}
                onExpandStation={toggleExpand}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Competitor Prices ═══ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Icon icon="solar:chart-2-bold-duotone" width={20} className="text-amber-500" />
            Цены конкурентов
            <span className="text-xs text-zinc-400 font-normal">({competitors.length})</span>
          </h3>
          <button
            onClick={() => setShowAddCompetitor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Icon icon="solar:add-circle-linear" width={14} />
            Добавить
          </button>
        </div>

        {competitors.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {competitors.map((c: CompetitorPrice) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:buildings-linear" width={16} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{c.competitor_name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {c.charging_type} {c.connector_type} {c.power_kw ? `${c.power_kw}kW` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{c.price_per_kwh} {c.currency}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{c.source}</span>
                  <button
                    onClick={() => deleteCompetitor.mutate(c.id)}
                    className="p-1 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" width={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-zinc-500">Нет данных о конкурентах</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard label="Всего планов" value={stats.total} icon="solar:tag-price-linear" />
        <AdminStatCard label="Активных" value={stats.active} icon="solar:check-circle-linear" />
        <AdminStatCard label="По умолчанию" value={stats.defaults} icon="solar:star-linear" />
        <AdminStatCard label="Станций с тарифом" value={stats.withStations} icon="solar:battery-charge-linear" />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <AdminSearchBar
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <label className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">Неактивные</span>
        </label>
      </div>

      {/* Tariff Plans Table */}
      {filtered.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_80px_60px] gap-4 px-5 py-3 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wider">
            <span>Название</span>
            <span>Правил</span>
            <span>Станций</span>
            <span>Умолч.</span>
            <span>Статус</span>
            <span />
          </div>
          {filtered.map((plan) => (
            <div
              key={plan.id}
              onClick={() => navigate(`${base}/tariffs/${plan.id}`)}
              className="flex flex-col md:grid md:grid-cols-[1fr_80px_80px_80px_80px_60px] gap-2 md:gap-4 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{plan.name}</p>
                {plan.description && (
                  <p className="text-xs text-zinc-500 truncate">{plan.description}</p>
                )}
              </div>
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 md:hidden mr-2">Правил:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{plan.rules_count ?? 0}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-zinc-400 md:hidden mr-2">Станций:</span>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{plan.stations_count ?? 0}</span>
              </div>
              <div className="flex items-center">
                {plan.is_default && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full">
                    По умолч.
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <AdminStatusBadge
                  variant={plan.is_active ? "online" : "offline"}
                  label={plan.is_active ? "Активен" : "Неактивен"}
                />
              </div>
              <div className="hidden md:flex items-center justify-end">
                <Icon icon="solar:alt-arrow-right-linear" width={16} className="text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Icon icon="solar:magnifer-linear" width={32} className="text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">Ничего не найдено по запросу &ldquo;{searchQuery}&rdquo;</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Icon icon="solar:tag-price-linear" width={36} className="text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Нет тарифных планов</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">Создайте первый тарифный план для ваших зарядных станций</p>
            <button
              onClick={() => navigate(`${base}/tariffs/create`)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            >
              <Icon icon="solar:add-circle-linear" width={18} />
              Создать план
            </button>
          </div>
        </div>
      )}

      {/* Add Competitor Modal */}
      {showAddCompetitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCompetitor(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Добавить конкурента</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Название компании *</label>
                <input className={inputCls} value={compForm.competitor_name} onChange={(e) => setCompForm({ ...compForm, competitor_name: e.target.value })} placeholder="Nol" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Цена за кВтч *</label>
                  <input className={inputCls} type="number" step="0.5" value={compForm.price_per_kwh || ""} onChange={(e) => setCompForm({ ...compForm, price_per_kwh: Number(e.target.value) })} placeholder="14.0" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Тип</label>
                  <select className={inputCls} value={compForm.charging_type} onChange={(e) => setCompForm({ ...compForm, charging_type: e.target.value })}>
                    <option value="DC">DC</option>
                    <option value="AC">AC</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Разъём</label>
                  <select className={inputCls} value={compForm.connector_type} onChange={(e) => setCompForm({ ...compForm, connector_type: e.target.value })}>
                    <option value="CCS2">CCS2</option>
                    <option value="Type2">Type2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="GBT">GBT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Мощность (кВт)</label>
                  <input className={inputCls} type="number" value={compForm.power_kw || ""} onChange={(e) => setCompForm({ ...compForm, power_kw: Number(e.target.value) })} placeholder="60" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Заметки</label>
                <input className={inputCls} value={compForm.notes || ""} onChange={(e) => setCompForm({ ...compForm, notes: e.target.value })} placeholder="Описание..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddCompetitor(false)} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
                Отмена
              </button>
              <button
                onClick={handleAddCompetitor}
                disabled={addCompetitor.isPending || !compForm.competitor_name || !compForm.price_per_kwh}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {addCompetitor.isPending ? "..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerTariffsPage;
