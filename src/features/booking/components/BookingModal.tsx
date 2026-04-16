/**
 * BookingModal — Modal for creating a connector reservation
 * ТЗ CHG-09: Booking flow
 */
import { useState } from "react";
import { Icon } from "@iconify/react";
import { useCreateBooking } from "../hooks/useBooking";

interface BookingModalProps {
  stationId: string;
  connectorId: number;
  connectorType?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 45, label: "45 мин" },
  { value: 60, label: "1 час" },
];

export function BookingModal({
  stationId,
  connectorId,
  connectorType,
  isOpen,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const createBooking = useCreateBooking();

  if (!isOpen) return null;

  const handleBook = async () => {
    setError(null);
    const result = await createBooking.mutateAsync({
      stationId,
      connectorId,
      durationMinutes: duration,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.message || "Не удалось забронировать");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4">
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Забронировать
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Icon icon="solar:close-linear" width={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Station info */}
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Icon icon="solar:plug-circle-bold" width={22} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Коннектор #{connectorId}
              </p>
              {connectorType && (
                <p className="text-xs text-zinc-500">{connectorType}</p>
              )}
            </div>
          </div>

          {/* Duration selector */}
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Длительность бронирования
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    duration === opt.value
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
            <Icon icon="solar:info-circle-linear" width={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Коннектор будет зарезервирован на выбранное время. Бронирование бесплатное.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleBook}
            disabled={createBooking.isPending}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {createBooking.isPending ? "Бронирую..." : "Забронировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
