import { useChargingStatusPolling } from "../hooks/useChargingStatusPolling";
import { useCharging } from "../hooks/useCharging";
import { logger } from "@/shared/utils/logger";

// Адаптер для обратной совместимости с ChargingStatus компонентом
interface ChargingSession {
  sessionId: string;
  stationId: string;
  connectorId: string | undefined;
  status:
    | "preparing"
    | "charging"
    | "suspended"
    | "finishing"
    | "finished"
    | "faulted";
  energy: number; // kWh
  duration: number; // seconds
  cost: number; // som
  power: number; // kW
  startTime: string;
  endTime?: string;
}

interface ChargingStatusProps {
  sessionId: string;
  onSessionEnd?: () => void;
}

export function ChargingStatus({
  sessionId,
  onSessionEnd,
}: ChargingStatusProps) {
  const { chargingData, isLoading } = useChargingStatusPolling(sessionId, {
    onComplete: () => {
      onSessionEnd?.();
    },
  });
  const { stopCharging, isStoppingCharging } = useCharging();

  // Адаптер: преобразуем chargingData в формат ChargingSession
  const session: ChargingSession | null = chargingData
    ? {
        sessionId: chargingData.sessionId,
        stationId: chargingData.stationId,
        connectorId: undefined, // API не возвращает connectorId напрямую
        status: mapChargingStatus(chargingData.status),
        energy: chargingData.energyConsumedKwh,
        duration: chargingData.duration,
        cost: chargingData.currentAmount,
        power: chargingData.chargingPower || 0,
        startTime: new Date().toISOString(), // API не возвращает startTime, используем текущее время
        endTime: undefined,
      }
    : null;

  // Маппинг статусов из useChargingStatusPolling в локальный формат
  function mapChargingStatus(status: string): ChargingSession["status"] {
    switch (status) {
      case "preparing":
        return "preparing";
      case "started":
      case "charging":
        return "charging";
      case "suspended":
        return "suspended";
      case "finishing":
        return "finishing";
      case "stopped":
      case "completed":
        return "finished";
      case "error":
        return "faulted";
      default:
        return "preparing";
    }
  }

  const handleStopCharging = async () => {
    try {
      const result = await stopCharging(sessionId);
      if (result.success) {
        onSessionEnd?.();
      }
    } catch (error) {
      logger.error("Error stopping charging:", error);
    }
  };

  const getStatusText = (status: ChargingSession["status"]) => {
    switch (status) {
      case "preparing":
        return "Подготовка к зарядке";
      case "charging":
        return "Идет зарядка";
      case "suspended":
        return "Зарядка приостановлена";
      case "finishing":
        return "Завершение зарядки";
      case "finished":
        return "Зарядка завершена";
      case "faulted":
        return "Ошибка зарядки";
      default:
        return "Неизвестный статус";
    }
  };

  const getStatusColor = (status: ChargingSession["status"]) => {
    switch (status) {
      case "preparing":
        return "text-yellow-600 bg-yellow-500/10";
      case "charging":
        return "text-green-600 bg-green-500/10";
      case "suspended":
        return "text-orange-600 bg-orange-500/10";
      case "finishing":
        return "text-blue-600 bg-blue-500/10";
      case "finished":
        return "text-gray-400 bg-zinc-900/50";
      case "faulted":
        return "text-red-600 bg-red-500/10";
      default:
        return "text-gray-400 bg-zinc-900/50";
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  if (isLoading || !session) {
    return (
      <div className="bg-zinc-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Статус зарядки</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}
        >
          {getStatusText(session.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Энергия</div>
          <div className="text-2xl font-bold text-white">
            {session.energy.toFixed(2)}{" "}
            <span className="text-lg font-normal">кВт⋅ч</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Мощность</div>
          <div className="text-2xl font-bold text-white">
            {session.power.toFixed(1)}{" "}
            <span className="text-lg font-normal">кВт</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Время</div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(session.duration)}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Стоимость</div>
          <div className="text-2xl font-bold text-green-600">
            {session.cost.toFixed(2)}{" "}
            <span className="text-lg font-normal">сом</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Станция: {session.stationId}</span>
          {session.connectorId && <span>Разъем: {session.connectorId}</span>}
        </div>
        <div className="text-sm text-gray-400">
          Начало: {new Date(session.startTime).toLocaleString("ru-RU")}
        </div>
      </div>

      {(session.status === "charging" || session.status === "suspended") && (
        <button
          onClick={handleStopCharging}
          disabled={isStoppingCharging}
          className="w-full mt-6 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {isStoppingCharging ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Останавливаем...
            </>
          ) : (
            "Остановить зарядку"
          )}
        </button>
      )}
    </div>
  );
}
