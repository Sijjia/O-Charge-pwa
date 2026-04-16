import { Icon } from "@iconify/react";
import { useThemeStore, type ThemeMode } from "@/shared/stores/themeStore";

const modes: { value: ThemeMode; icon: string; label: string }[] = [
  { value: "light", icon: "solar:sun-2-bold-duotone", label: "Светлая" },
  { value: "system", icon: "solar:monitor-bold-duotone", label: "Системная" },
  { value: "dark", icon: "solar:moon-bold-duotone", label: "Тёмная" },
];

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { mode, setMode } = useThemeStore();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          title={m.label}
          className={`flex items-center justify-center rounded-lg transition-all ${
            compact ? "h-8 w-8" : "h-8 px-2.5 gap-1.5"
          } ${
            mode === m.value
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Icon icon={m.icon} width={16} />
          {!compact && (
            <span className="text-xs font-medium hidden sm:inline">
              {m.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
