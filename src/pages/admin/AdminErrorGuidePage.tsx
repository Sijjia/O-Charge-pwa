import { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { OCPP_ERRORS, getSeverityColor, type OcppErrorInfo } from "@/shared/utils/ocppErrors";
import { fetchJson } from "@/api/unifiedClient";
import { z } from "zod";

const FILTERS = [
  { value: "all", label: "Все" },
  { value: "critical", label: "🔴 Критические" },
  { value: "warning", label: "🟡 Предупреждения" },
  { value: "info", label: "🟢 Информация" },
] as const;

const CATEGORIES = [
  { value: "errors", label: "Ошибки станций", filter: (e: OcppErrorInfo) => !["Available","Preparing","Charging","SuspendedEVSE","SuspendedEV","Finishing","Reserved","Unavailable","Faulted","Offline","NoError"].includes(e.code) },
  { value: "statuses", label: "Статусы станций", filter: (e: OcppErrorInfo) => ["Available","Preparing","Charging","SuspendedEVSE","SuspendedEV","Finishing","Reserved","Unavailable","Faulted","Offline"].includes(e.code) },
] as const;

const SimSchema = z.object({ success: z.boolean() }).passthrough();

async function simulateError(code: string) {
  return fetchJson("/api/v1/admin/simulate/ocpp-error", { method: "POST", body: { error_code: code } }, SimSchema);
}

async function simulateAll() {
  return fetchJson("/api/v1/admin/simulate/ocpp-error/all", { method: "POST" }, SimSchema);
}

function ErrorCard({ error, expanded, onToggle, onSimulate }: { error: OcppErrorInfo; expanded: boolean; onToggle: () => void; onSimulate: () => void }) {
  const colors = getSeverityColor(error.severity);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${colors.border} ${expanded ? colors.bg : "bg-white dark:bg-zinc-900"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <Icon icon={error.icon} width={24} className={colors.text} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{error.title}</span>
            <code className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 font-mono">{error.code}</code>
            {error.callSupport && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                📞 Звонить
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{error.description}</p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
        <Icon
          icon="solar:alt-arrow-down-linear"
          width={16}
          className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className={`px-4 pb-4 space-y-3 ${colors.bg}`}>
          <div>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Описание</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{error.description}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Что делать</p>
            <div className="space-y-1">
              {error.action.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex gap-1.5">
                  {line}
                </p>
              ))}
            </div>
          </div>
          {error.callSupport && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Icon icon="solar:phone-calling-bold-duotone" width={18} className="text-red-500" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Требуется обращение в поддержку Red Petroleum
              </p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSimulate(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
          >
            <Icon icon="solar:test-tube-bold-duotone" width={14} />
            Симулировать в OCPP логах
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminErrorGuidePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const [category, setCategory] = useState<string>("errors");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [simulating, setSimulating] = useState<string | null>(null);

  const handleSimulate = async (code: string) => {
    setSimulating(code);
    try {
      await simulateError(code);
      navigate("/admin/logs");
    } catch { /* ignore */ }
    setSimulating(null);
  };

  const handleSimulateAll = async () => {
    setSimulating("ALL");
    try {
      await simulateAll();
      navigate("/admin/logs");
    } catch { /* ignore */ }
    setSimulating(null);
  };

  const allErrors = Object.values(OCPP_ERRORS).filter((e) => e.code !== "NoError");

  const categoryFilter = CATEGORIES.find((c) => c.value === category)?.filter ?? (() => true);

  const filtered = allErrors
    .filter(categoryFilter)
    .filter((e) => filter === "all" || e.severity === filter)
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.code.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    });

  const criticalCount = allErrors.filter(categoryFilter).filter((e) => e.severity === "critical").length;
  const warningCount = allErrors.filter(categoryFilter).filter((e) => e.severity === "warning").length;
  const callSupportCount = allErrors.filter(categoryFilter).filter((e) => e.callSupport).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader
        title="Справочник ошибок" helpText="Полный справочник всех OCPP ошибок зарядных станций с расшифровкой на русском языке. Для каждой ошибки — описание, инструкция что делать и нужно ли звонить в поддержку."
        subtitle="Расшифровка OCPP ошибок зарядных станций — что делать и когда звонить"
      />

      {/* Simulate All */}
      <button
        onClick={handleSimulateAll}
        disabled={simulating !== null}
        className="flex items-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold text-sm hover:opacity-80 transition-all disabled:opacity-50"
      >
        <Icon icon={simulating === "ALL" ? "solar:refresh-bold-duotone" : "solar:test-tube-minimalistic-bold-duotone"} width={18} className={simulating === "ALL" ? "animate-spin" : ""} />
        {simulating === "ALL" ? "Генерация..." : "🧪 Симулировать все ошибки → OCPP Логи"}
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-xs text-red-500">Критических</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
          <p className="text-xs text-yellow-500">Предупреждений</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">{callSupportCount}</p>
          <p className="text-xs text-zinc-500">Нужен звонок</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              category === c.value
                ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Icon icon="solar:magnifer-linear" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Поиск по коду, названию или описанию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f.value
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error list */}
      <div className="space-y-2">
        {filtered.map((error) => (
          <ErrorCard
            key={error.code}
            error={error}
            expanded={expandedCode === error.code}
            onToggle={() => setExpandedCode(expandedCode === error.code ? null : error.code)}
            onSimulate={() => handleSimulate(error.code)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <Icon icon="solar:document-text-bold-duotone" width={48} className="mx-auto mb-3 opacity-50" />
            <p>Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
