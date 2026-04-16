import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { PWADebugPanel } from "@/features/pwa/debug/PWADebugPanel";

export function PWADebugPage() {
  const navigate = useNavigate();
  const enabled =
    import.meta.env["VITE_ENABLE_PWA_DEBUG"] === "true" || import.meta.env.DEV;

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#050507] pb-[calc(var(--nav-height)+16px)]"
    >
      <div className="bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full bg-yellow-400 hover:bg-yellow-500/100"
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">PWA Debug</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {enabled ? (
          <PWADebugPanel />
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
            Включите VITE_ENABLE_PWA_DEBUG=true чтобы открыть отладочную панель.
          </div>
        )}
      </div>
    </div>
  );
}
