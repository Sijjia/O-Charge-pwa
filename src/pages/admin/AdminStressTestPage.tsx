import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { HelpTip } from "@/shared/components/HelpTip";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/components/AdminStatCard";
import {
  useStressTestStatus,
  useStressTestResults,
  useRunStressTest,
} from "@/features/admin/hooks/useStressTest";

const SCENARIOS = [
  { value: "mixed", label: "Смешанный", icon: "solar:shuffle-bold-duotone" },
  { value: "auth_flow", label: "Авторизация", icon: "solar:shield-keyhole-bold-duotone" },
  { value: "charging_flow", label: "Зарядка", icon: "solar:bolt-circle-bold-duotone" },
  { value: "balance_check", label: "Баланс", icon: "solar:wallet-bold-duotone" },
];

const USER_COUNTS = [10, 100, 1000, 10000, 100000];

/* ------------------------------------------------------------------ */
/*  Live Modal                                                         */
/* ------------------------------------------------------------------ */

function LiveModal({
  onClose,
  params,
}: {
  onClose: () => void;
  params: { concurrent_users: number; duration_seconds: number; scenario: string };
}) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<"starting" | "running" | "done" | "error">("starting");
  const logRef = useRef<HTMLDivElement>(null);
  const startTime = useRef(Date.now());
  const sawRunning = useRef(false);
  const lastProgress = useRef(-1);

  const isPolling = phase === "running" || phase === "starting";
  const { data: statusData } = useStressTestStatus(isPolling);
  const { data: resultsData, refetch: refetchResults } = useStressTestResults();
  const runMutation = useRunStressTest();

  const progress = statusData?.running
    ? (statusData.progress ?? 0)
    : phase === "done"
      ? 100
      : sawRunning.current
        ? 99
        : 0;
  const results = phase === "done" ? resultsData : null;

  const addLog = useCallback((msg: string) => {
    const ts = ((Date.now() - startTime.current) / 1000).toFixed(1);
    setLogs((prev) => [...prev, `[${ts}s] ${msg}`]);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Elapsed timer
  useEffect(() => {
    if (phase === "done" || phase === "error") return;
    const iv = setInterval(() => setElapsed((Date.now() - startTime.current) / 1000), 100);
    return () => clearInterval(iv);
  }, [phase]);

  // Start test
  useEffect(() => {
    addLog(`🚀 Запуск: ${params.concurrent_users.toLocaleString()} юзеров, ${params.duration_seconds}с, сценарий "${params.scenario}"`);
    addLog("⏳ Отправка запроса на сервер...");

    runMutation.mutate(params, {
      onSuccess: () => {
        setPhase("running");
        addLog("✅ Тест запущен на сервере");
        addLog("⏳ Ожидание старта background task...");
      },
      onError: (err) => {
        setPhase("error");
        const msg = err instanceof Error ? err.message : typeof err === "object" ? JSON.stringify(err) : String(err);
        addLog(`❌ Ошибка запуска: ${msg}`);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch status updates
  useEffect(() => {
    if (!statusData || phase === "done" || phase === "error") return;

    if (statusData.running) {
      // Backend confirmed it's running
      if (!sawRunning.current) {
        sawRunning.current = true;
        addLog("🔥 Тест выполняется...");
      }
      // Log progress changes (not every poll)
      const p = Math.floor(statusData.progress ?? 0);
      const bucket = Math.floor(p / 5) * 5; // round to nearest 5%
      if (bucket > 0 && bucket > lastProgress.current) {
        lastProgress.current = bucket;
        addLog(`📊 Прогресс: ${bucket}%`);
      }
    } else if (sawRunning.current && phase === "running") {
      // Was running, now stopped — test finished!
      addLog("🏁 Тест завершён! Загрузка результатов...");
      refetchResults().then(() => {
        setPhase("done");
        addLog("📈 Результаты получены");
      });
    }
    // If !running && !sawRunning — backend hasn't started yet, keep polling
  }, [statusData, phase, addLog, refetchResults]);

  const scenarioLabel = SCENARIOS.find((s) => s.value === params.scenario)?.label ?? params.scenario;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              phase === "running" ? "bg-yellow-500 animate-pulse" :
              phase === "done" ? "bg-emerald-500" :
              phase === "error" ? "bg-red-500" :
              "bg-zinc-400 animate-pulse"
            }`} />
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {phase === "starting" ? "Запуск теста..." :
                 phase === "running" ? "Тест выполняется" :
                 phase === "done" ? "Тест завершён" :
                 "Ошибка"}
              </h2>
              <p className="text-xs text-zinc-500">
                {scenarioLabel} • {params.concurrent_users.toLocaleString()} юзеров • {params.duration_seconds}с
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-zinc-500 tabular-nums">
              {elapsed.toFixed(1)}s
            </span>
            {(phase === "done" || phase === "error") && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                phase === "error" ? "bg-red-500" :
                phase === "done" ? "bg-emerald-500" :
                "bg-red-600"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-400">{progress.toFixed(1)}%</span>
            <span className="text-[10px] text-zinc-400">
              {phase === "running" ? `~${Math.max(0, params.duration_seconds - elapsed).toFixed(0)}s осталось` : ""}
            </span>
          </div>
        </div>

        {/* Live logs */}
        <div
          ref={logRef}
          className="mx-5 mt-3 h-40 overflow-y-auto bg-zinc-950 rounded-xl p-3 font-mono text-xs text-emerald-400 space-y-0.5 scrollbar-thin"
        >
          {logs.map((log, i) => (
            <div key={i} className={`${
              log.includes("❌") ? "text-red-400" :
              log.includes("✅") || log.includes("🏁") ? "text-emerald-400" :
              log.includes("📊") ? "text-yellow-400" :
              "text-zinc-400"
            }`}>
              {log}
            </div>
          ))}
          {(phase === "starting" || phase === "running") && (
            <div className="text-zinc-600 animate-pulse">▌</div>
          )}
        </div>

        {/* Results */}
        {results && phase === "done" && (
          <div className="px-5 py-4 space-y-3">
            {/* Big numbers */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "RPS", value: results.rps.toLocaleString(), color: "text-emerald-500", help: "Requests Per Second — сколько запросов сервер обрабатывает в секунду. Чем больше — тем лучше." },
                { label: "Всего", value: results.total_requests.toLocaleString(), color: "text-zinc-900 dark:text-white", help: "Общее количество HTTP-запросов отправленных во время теста." },
                { label: "Ошибки", value: `${results.error_rate}%`, color: results.error_rate > 5 ? "text-red-500" : "text-emerald-500", help: "Процент запросов которые вернули ошибку. 0% — идеально, >5% — проблема." },
                { label: "Avg", value: `${results.avg_latency_ms.toFixed(1)}ms`, color: results.avg_latency_ms > 500 ? "text-yellow-500" : "text-emerald-500", help: "Среднее время ответа сервера в миллисекундах. <200мс — отлично, >1000мс — медленно." },
              ].map((m) => (
                <div key={m.label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center justify-center gap-1">
                    {m.label}
                    {"help" in m && m.help && <HelpTip text={m.help as string} />}
                  </p>
                  <p className={`text-xl font-bold mt-0.5 ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Latency bar */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                Latency Distribution
                <HelpTip text="Распределение задержек: p50 — половина запросов быстрее этого, p95 — 95% быстрее, p99 — 99% быстрее. Чем ниже столбик — тем быстрее сервер." />
              </p>
              <div className="flex items-end gap-1 h-16">
                {[
                  { label: "p50", value: results.p50_latency_ms, max: results.p99_latency_ms },
                  { label: "p95", value: results.p95_latency_ms, max: results.p99_latency_ms },
                  { label: "p99", value: results.p99_latency_ms, max: results.p99_latency_ms },
                ].map((p) => (
                  <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono text-zinc-400">{p.value.toFixed(0)}ms</span>
                    <div
                      className={`w-full rounded-t ${
                        p.label === "p50" ? "bg-emerald-500" :
                        p.label === "p95" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ height: `${Math.max(4, (p.value / Math.max(p.max, 1)) * 48)}px` }}
                    />
                    <span className="text-[10px] text-zinc-500">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Успешных", value: results.successful_requests.toLocaleString() },
                { label: "Ошибок", value: results.failed_requests.toLocaleString() },
                { label: "Юзеров", value: results.concurrent_users.toLocaleString() },
                { label: "Время", value: `${results.duration_seconds.toFixed(1)}с` },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[10px] text-zinc-500">{m.label}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
          {phase === "done" || phase === "error" ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Закрыть
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />
              Выполняется...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function AdminStressTestPage() {
  const [users, setUsers] = useState(100);
  const [duration, setDuration] = useState(30);
  const [scenario, setScenario] = useState("mixed");
  const [showModal, setShowModal] = useState(false);

  const { data: resultsData } = useStressTestResults();
  const results = resultsData;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <AdminPageHeader
        title="Стресс-тест" helpText="Нагрузочное тестирование API сервера. Симулирует сотни/тысячи пользователей одновременно. Показывает RPS (запросов в секунду), задержки и процент ошибок."
        subtitle="Нагрузочное тестирование API в реальном времени"
      />

      {/* Config */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Icon icon="solar:settings-bold-duotone" width={18} className="text-red-500" />
          Параметры теста
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Users */}
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">
              Виртуальные пользователи
            </label>
            <div className="flex flex-wrap gap-2">
              {USER_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setUsers(n)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    users === n
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25 scale-105"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">
              Длительность (секунды)
            </label>
            <input
              type="range"
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
              min={5}
              max={120}
              step={5}
              className="w-full accent-red-600"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>5с</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white">{duration}с</span>
              <span>120с</span>
            </div>
          </div>

          {/* Scenario */}
          <div>
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">
              Сценарий
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScenario(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    scenario === s.value
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon icon={s.icon} width={14} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Icon icon="solar:play-bold" width={18} />
          Запустить тест
        </button>
      </div>

      {/* Last Results */}
      {results && (
        <>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Icon icon="solar:chart-square-bold-duotone" width={18} className="text-emerald-500" />
            Последние результаты
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AdminStatCard
              label="RPS"
              helpText="Запросов в секунду — основной показатель производительности сервера"
              value={results.rps.toLocaleString()}
              icon="solar:bolt-circle-linear"
              trend={`${results.successful_requests.toLocaleString()} успешных`}
              trendUp
            />
            <AdminStatCard
              label="Всего запросов" helpText="Общее количество запросов отправленных за время теста"
              value={results.total_requests.toLocaleString()}
              icon="solar:server-bold-duotone"
            />
            <AdminStatCard
              label="Error Rate" helpText="Процент ошибочных запросов. Идеал — 0%. Больше 5% — повод для беспокойства"
              value={`${results.error_rate}%`}
              icon="solar:danger-triangle-linear"
              trend={`${results.failed_requests} ошибок`}
              trendUp={results.error_rate === 0}
            />
            <AdminStatCard
              label="Avg Latency" helpText="Среднее время ответа сервера. Меньше 200мс — отлично, больше 1с — медленно"
              value={`${results.avg_latency_ms.toFixed(1)} мс`}
              icon="solar:clock-circle-linear"
              trend={`p99: ${results.p99_latency_ms.toFixed(0)} мс`}
            />
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <LiveModal
          params={{ concurrent_users: users, duration_seconds: duration, scenario }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
