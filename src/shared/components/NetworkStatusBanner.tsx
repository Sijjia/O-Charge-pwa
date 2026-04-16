import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function NetworkStatusBanner() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [show, setShow] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setShow(true);
      // Auto-hide after short delay
      const t = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(t);
    };
    const onOffline = () => {
      setOnline(false);
      setShow(true);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div
        className={`mx-auto max-w-screen-md m-2 rounded-xl px-3 py-2 text-sm font-medium shadow-lg shadow-black/40 border
        ${online ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 justify-center">
          {online ? (
            <Icon icon="solar:wi-fi-square-linear" width={16} />
          ) : (
            <Icon icon="solar:wi-fi-router-minimalistic-linear" width={16} />
          )}
          <span>
            {online
              ? "Соединение восстановлено"
              : "Вы оффлайн. Некоторые функции недоступны"}
          </span>
          {!online ? (
            <button
              className="ml-2 underline underline-offset-2"
              onClick={() => location.reload()}
            >
              Обновить
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
