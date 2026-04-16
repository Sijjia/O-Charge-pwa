/**
 * OwnerStationCard Component
 * Display station card with status and quick info
 */

import { Icon } from '@iconify/react';
import { OwnerStation } from '../hooks/useOwnerStations';

export interface OwnerStationCardProps {
  station: OwnerStation;
  onClick?: () => void;
  className?: string;
}

export function OwnerStationCard({
  station,
  onClick,
  className = '',
}: OwnerStationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'maintenance':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'inactive':
        return 'bg-zinc-800 text-gray-100 border-zinc-800';
      default:
        return 'bg-zinc-800 text-gray-100 border-zinc-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'maintenance':
        return 'На обслуживании';
      case 'inactive':
        return 'Неактивна';
      default:
        return status;
    }
  };

  const getStatusIndicatorColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'maintenance':
        return 'text-amber-500';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:battery-charge-linear" width={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
              {station.model || 'Станция'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-gray-400">{station.serial_number}</p>
          </div>
        </div>

        {/* Status Indicator */}
        <Icon
          icon="solar:record-circle-linear"
          width={12}
          className={`fill-current ${getStatusIndicatorColor(station.status)}`}
        />
      </div>

      {/* Station Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400">
          <Icon icon="solar:map-point-linear" width={16} />
          <span>
            {station.location?.name || 'Локация не указана'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400">
          <Icon icon="solar:bolt-linear" width={16} />
          <span>{station.power_capacity} кВт</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-gray-400">
          <Icon icon="solar:battery-charge-linear" width={16} />
          <span>
            {station.connectors_count}{' '}
            {station.connectors_count === 1
              ? 'разъём'
              : station.connectors_count < 5
                ? 'разъёма'
                : 'разъёмов'}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(station.status)}`}
        >
          {getStatusText(station.status)}
        </span>

        {station.active_sessions !== undefined && station.active_sessions > 0 && (
          <span className="text-sm font-medium text-red-500">
            {station.active_sessions}{' '}
            {station.active_sessions === 1 ? 'активная' : 'активных'}
          </span>
        )}
      </div>
    </div>
  );
}
