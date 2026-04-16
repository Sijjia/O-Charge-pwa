import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function PWADebugPanel() {
  const [supported, setSupported] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("—");
  const [cachesList, setCachesList] = useState<string[]>([]);

  useEffect(() => {
    setSupported("serviceWorker" in navigator);
    (async () => {
      await refresh();
    })();
  }, []);

  async function refresh() {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setStatus("Не зарегистрирован");
      } else if (reg.waiting) {
        setStatus("Ожидает активации (waiting)");
      } else if (reg.installing) {
        setStatus("Устанавливается (installing)");
      } else if (reg.active) {
        setStatus("Активен");
      } else {
        setStatus("Не активен");
      }
    } catch {
      // ignore
    }
    try {
      const names = await caches.keys();
      setCachesList(names);
    } catch {
      setCachesList([]);
    }
  }

  async function checkForUpdate() {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
    await refresh();
  }

  async function skipWaiting() {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
    // Небольшая задержка чтобы дождаться активации
    setTimeout(() => location.reload(), 400);
  }

  async function clearAllCaches() {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    await refresh();
  }

  async function unregisterSW() {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.unregister();
    await refresh();
  }

  if (!supported) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
        Браузер не поддерживает Service Worker.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Статус Service Worker</p>
            <p className="text-lg font-semibold">{status}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkForUpdate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-zinc-900/50"
              title="Проверить обновления"
            >
              <Icon icon="solar:refresh-linear" width={16} />
              Проверить
            </button>
            <button
              onClick={skipWaiting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-zinc-900/50"
              title="Активировать ожидающее обновление"
            >
              <Icon icon="solar:skip-next-linear" width={16} />
              Активировать
            </button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-sm text-gray-400 mb-2">Кэши</p>
        {cachesList.length === 0 ? (
          <p className="text-gray-500 text-sm">Нет записей</p>
        ) : (
          <ul className="text-xs text-gray-400 list-disc pl-5">
            {cachesList.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={clearAllCaches}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-zinc-900/50"
          >
            <Icon icon="solar:trash-bin-2-linear" width={16} />
            Очистить кэши
          </button>
          <button
            onClick={unregisterSW}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-zinc-900/50"
          >
            <Icon icon="solar:power-linear" width={16} />
            Unregister SW
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <Icon icon="solar:shield-warning-linear" width={12} />
          Внимание: очистка кэшей и unregister повлияют на оффлайн‑работу.
        </div>
      </div>
    </div>
  );
}
