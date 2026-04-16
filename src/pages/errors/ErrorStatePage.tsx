import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

interface ErrorAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface ErrorStatePageProps {
  icon: string;
  iconColor: "red" | "amber" | "gray" | "blue";
  title: string;
  message: string;
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  showSupport?: boolean;
}

const colorMap = {
  red: {
    glow: "bg-red-500/5 dark:bg-red-500/10",
    iconBg: "bg-red-50 dark:bg-red-500/10",
    iconBorder: "border-red-200 dark:border-red-500/20",
    iconText: "text-red-500",
    ambient: "bg-red-600/5 dark:bg-red-600/10",
  },
  amber: {
    glow: "bg-amber-500/5 dark:bg-amber-500/10",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconBorder: "border-amber-200 dark:border-amber-500/20",
    iconText: "text-amber-500",
    ambient: "bg-amber-600/5 dark:bg-amber-600/10",
  },
  gray: {
    glow: "bg-zinc-500/5 dark:bg-zinc-500/10",
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconBorder: "border-zinc-200 dark:border-zinc-700",
    iconText: "text-zinc-400",
    ambient: "bg-zinc-600/3 dark:bg-zinc-600/5",
  },
  blue: {
    glow: "bg-blue-500/5 dark:bg-blue-500/10",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconBorder: "border-blue-200 dark:border-blue-500/20",
    iconText: "text-blue-500",
    ambient: "bg-blue-600/5 dark:bg-blue-600/10",
  },
};

export function ErrorStatePage({
  icon,
  iconColor,
  title,
  message,
  primaryAction,
  secondaryAction,
  showSupport = false,
}: ErrorStatePageProps) {
  const navigate = useNavigate();
  const colors = colorMap[iconColor];

  const handleAction = (action: ErrorAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.to) {
      navigate(action.to);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Ambient Glow */}
      <div
        className={`fixed top-[-20%] right-[-10%] w-[500px] h-[500px] ${colors.ambient} blur-[100px] rounded-full pointer-events-none z-0`}
      />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center z-20 shrink-0 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 relative">
        {/* Icon with Glow Circle */}
        <div className="relative mb-8">
          <div
            className={`absolute inset-0 ${colors.glow} blur-[60px] rounded-full scale-150`}
          />
          <div
            className={`relative w-24 h-24 rounded-full ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center transition-colors`}
          >
            <Icon icon={icon} width={48} className={colors.iconText} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold font-display tracking-tight text-zinc-900 dark:text-white text-center mb-3">
          {title}
        </h1>

        {/* Message */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center leading-relaxed max-w-[300px]">
          {message}
        </p>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-5 pb-8 z-30 space-y-3 w-full max-w-md mx-auto">
        {/* Primary Action */}
        <button
          onClick={() => handleAction(primaryAction)}
          className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] rounded-2xl text-white font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
        >
          {primaryAction.label}
        </button>

        {/* Secondary Action */}
        {secondaryAction && (
          <button
            onClick={() => handleAction(secondaryAction)}
            className="w-full py-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 active:scale-[0.98] rounded-2xl text-zinc-700 dark:text-zinc-300 font-medium text-base transition-all duration-300 flex items-center justify-center gap-2"
          >
            {secondaryAction.label}
          </button>
        )}

        {/* Support Link */}
        {showSupport && (
          <button
            onClick={() => navigate("/support")}
            className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="solar:chat-round-dots-linear" width={16} />
            Связаться с поддержкой
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorStatePage;
