/**
 * ConnectorStatusGrid Component
 * Display real-time status of station connectors
 */

import { Icon } from "@iconify/react";

export interface ConnectorStatus {
  id: string;
  connector_number: number;
  connector_type: string;
  power_kw: number;
  status: "available" | "occupied" | "faulted" | "unavailable";
  current_session_id?: string;
  session_start?: string;
  energy_delivered?: number;
}

export interface ConnectorStatusGridProps {
  connectors: ConnectorStatus[];
  loading?: boolean;
  onConnectorClick?: (connectorId: string) => void;
  className?: string;
}

export function ConnectorStatusGrid({
  connectors,
  loading = false,
  onConnectorClick,
  className = "",
}: ConnectorStatusGridProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Icon icon="solar:check-circle-bold" width={24} className="text-green-600" />;
      case "occupied":
        return <Icon icon="solar:record-circle-bold" width={24} className="text-blue-600" />;
      case "faulted":
        return <Icon icon="solar:close-circle-bold" width={24} className="text-red-600" />;
      case "unavailable":
        return <Icon icon="solar:danger-triangle-linear" width={24} className="text-gray-400" />;
      default:
        return <Icon icon="solar:record-circle-bold" width={24} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 border-green-500/20 hover:bg-green-500/15";
      case "occupied":
        return "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15";
      case "faulted":
        return "bg-red-500/10 border-red-500/20 hover:bg-red-500/15";
      case "unavailable":
        return "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800";
      default:
        return "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Доступен";
      case "occupied":
        return "Занят";
      case "faulted":
        return "Ошибка";
      case "unavailable":
        return "Недоступен";
      default:
        return status;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/15 text-green-400 border-green-500/20";
      case "occupied":
        return "bg-blue-500/15 text-blue-400 border-blue-500/20";
      case "faulted":
        return "bg-red-500/15 text-red-400 border-red-500/20";
      case "unavailable":
        return "bg-zinc-800 text-gray-100 border-zinc-800";
      default:
        return "bg-zinc-800 text-gray-100 border-zinc-800";
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
              <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center ${className}`}
      >
        <Icon icon="solar:plug-circle-linear" width={48} className="text-zinc-500 dark:text-gray-400 mx-auto mb-4" />
        <p className="text-zinc-500 dark:text-gray-400 font-medium mb-2">Нет разъёмов</p>
        <p className="text-sm text-zinc-400 dark:text-gray-500">
          Добавьте разъёмы для отображения их статуса
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
    >
      {connectors.map((connector) => (
        <div
          key={connector.id}
          onClick={() => onConnectorClick?.(connector.id)}
          className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${getStatusColor(connector.status)} ${
            onConnectorClick ? "hover:shadow-md" : ""
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {/* Connector Icon & Number */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center shadow-sm dark:shadow-black/20">
                <Icon icon="solar:plug-circle-linear" width={24} className="text-zinc-600 dark:text-gray-300" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  Разъём {connector.connector_number}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  {connector.connector_type}
                </p>
              </div>
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">
              {getStatusIcon(connector.status)}
            </div>
          </div>

          {/* Connector Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-gray-400">Мощность:</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                {connector.power_kw} кВт
              </span>
            </div>

            {connector.status === "occupied" && connector.session_start && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-gray-400">Длительность:</span>
                  <span className="font-medium text-blue-400">
                    {formatDuration(connector.session_start)}
                  </span>
                </div>
                {connector.energy_delivered !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-gray-400">Энергия:</span>
                    <span className="font-medium text-blue-400">
                      {connector.energy_delivered.toFixed(2)} кВт⋅ч
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status Badge */}
          <div
            className={`px-3 py-1.5 text-xs font-medium rounded-full border text-center ${getStatusBadgeColor(connector.status)}`}
          >
            {getStatusText(connector.status)}
          </div>

          {/* Session ID (for debugging/support) */}
          {connector.current_session_id && (
            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-400 dark:text-gray-500 truncate">
                ID: {connector.current_session_id}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
