import { Icon } from "@iconify/react";
import { HelpTip } from "@/shared/components/HelpTip";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  helpText?: string;
}

export function AdminStatCard({
  label,
  value,
  icon,
  trend,
  trendUp = true,
  helpText,
}: AdminStatCardProps) {
  return (
    <div className="bg-white dark:bg-[#111621] border border-zinc-100 dark:border-white/[0.04] rounded-3xl p-5 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.4)] relative group transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-[#1C212B] flex items-center justify-center border border-zinc-100 dark:border-white/5 text-zinc-600 dark:text-zinc-400 group-hover:text-red-500 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:border-red-100 dark:group-hover:border-red-500/20 transition-colors duration-300">
          <Icon icon={icon} width={24} />
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {label}
              {helpText && <HelpTip text={helpText} />}
            </div>
            <div className="text-2xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">
              {value}
            </div>
          </div>
          {trend && (
            <div
              className={`flex shrink items-center justify-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border whitespace-nowrap truncate max-w-[55%] ${trendUp
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20"
                }`}
            >
              <Icon
                icon={trendUp ? "solar:graph-up-bold" : "solar:graph-down-bold"}
                width={12}
                className="mr-0.5 sm:mr-1 sm:w-[14px]"
              />
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
