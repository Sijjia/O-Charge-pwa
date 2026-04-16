import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAdminAlerts } from "../hooks/useAdminAlerts";
import { useNavigate } from "react-router-dom";

export function AlertBell() {
  const { data } = useAdminAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);
  const navigate = useNavigate();

  const alerts = data?.alerts ?? [];
  const unack = data?.unacknowledged ?? 0;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  // Play sound on new critical alerts
  useEffect(() => {
    if (criticalCount > prevCount.current && criticalCount > 0) {
      try {
        const audio = new Audio("/alert.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    }
    prevCount.current = criticalCount;
  }, [criticalCount]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <Icon icon="solar:bell-bold-duotone" width={20} />
        {unack > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
            {unack > 99 ? "99+" : unack}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Уведомления
            </h3>
            <button
              onClick={() => { setOpen(false); navigate("/admin/alerts"); }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Все
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="p-4 text-sm text-zinc-400 text-center">Нет уведомлений</p>
            ) : (
              alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      icon={
                        alert.severity === "critical"
                          ? "solar:danger-circle-bold"
                          : alert.severity === "warning"
                            ? "solar:shield-warning-bold"
                            : "solar:info-circle-bold"
                      }
                      width={16}
                      className={
                        alert.severity === "critical"
                          ? "text-red-500 mt-0.5"
                          : alert.severity === "warning"
                            ? "text-amber-500 mt-0.5"
                            : "text-blue-500 mt-0.5"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
