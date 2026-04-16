import { Icon } from "@iconify/react";
import { HelpTip } from "@/shared/components/HelpTip";

interface AdminPageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  helpText?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  helpText,
  actionLabel,
  actionIcon = "solar:add-circle-linear",
  onAction,
  secondaryActionLabel,
  secondaryActionIcon = "solar:export-linear",
  onSecondaryAction,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          {title}
          {helpText && <HelpTip text={helpText} />}
        </h1>
        {subtitle && (
          <div className="text-sm text-zinc-500 mt-1">{subtitle}</div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Icon icon={secondaryActionIcon} width={18} />
            {secondaryActionLabel}
          </button>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Icon icon={actionIcon} width={18} />
            {actionLabel}
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
