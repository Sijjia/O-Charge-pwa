import { Icon } from "@iconify/react";

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AdminEmptyState({
  icon = "solar:inbox-linear",
  title,
  description,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Icon icon={icon} width={32} className="text-zinc-400 dark:text-zinc-500" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-600/20"
        >
          <Icon icon="solar:add-circle-linear" width={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
