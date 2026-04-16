/**
 * StatCard Component
 * Display KPI metric card with icon, value, and trend
 */

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  className = '',
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse ${className}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24 mb-3"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-20"></div>
          </div>
          <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm dark:shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-zinc-500 dark:text-gray-400 mb-1">{title}</p>

          {/* Value */}
          <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{value}</h3>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600'
                    : trend.isPositive === false
                      ? 'text-red-600'
                      : 'text-zinc-500 dark:text-gray-400'
                }`}
              >
                {trend.isPositive && '+'}
                {trend.value}%
              </span>
              <span className="text-sm text-zinc-400 dark:text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className="w-12 h-12 bg-red-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-red-500" />
        </div>
      </div>
    </div>
  );
}
