/**
 * ActiveBookingBanner — Shows active booking with countdown timer
 * Displayed on ChargingPage and MapHome
 */
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useBooking } from "../hooks/useBooking";

export function ActiveBookingBanner() {
  const { activeBooking, cancel, isCancelling } = useBooking();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!activeBooking?.expires_at) return;

    const updateRemaining = () => {
      const now = Date.now();
      const expires = new Date(activeBooking.expires_at).getTime();
      setRemaining(Math.max(0, Math.floor((expires - now) / 1000)));
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [activeBooking?.expires_at]);

  if (!activeBooking) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isExpiring = remaining < 120; // < 2 min

  const handleCancel = async () => {
    if (isCancelling) return;
    await cancel(activeBooking.id);
  };

  return (
    <div className={`rounded-2xl border p-4 ${
      isExpiring
        ? "bg-amber-500/10 border-amber-500/30"
        : "bg-blue-500/10 border-blue-500/30"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isExpiring ? "bg-amber-500/20" : "bg-blue-500/20"
          }`}>
            <Icon
              icon="solar:clock-circle-bold"
              width={22}
              className={isExpiring ? "text-amber-500" : "text-blue-500"}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Коннектор забронирован
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Станция {activeBooking.station_id}, коннектор #{activeBooking.connector_id}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold tabular-nums ${
            isExpiring ? "text-amber-500" : "text-blue-500"
          }`}>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
        </div>
      </div>
      <button
        onClick={handleCancel}
        disabled={isCancelling}
        className="mt-3 w-full py-2 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {isCancelling ? "Отмена..." : "Отменить бронирование"}
      </button>
    </div>
  );
}
