import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

interface AdminSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function AdminSearchBar({
  placeholder = "Поиск...",
  value: externalValue,
  onChange,
  debounceMs = 300,
}: AdminSearchBarProps) {
  const [internal, setInternal] = useState(externalValue ?? "");

  useEffect(() => {
    if (externalValue !== undefined) setInternal(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const timer = setTimeout(() => onChange(internal), debounceMs);
    return () => clearTimeout(timer);
  }, [internal, debounceMs, onChange]);

  return (
    <div className="flex-1 relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon
          icon="solar:magnifer-linear"
          width={18}
          className="text-zinc-400 group-focus-within:text-red-500 transition-colors"
        />
      </div>
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm transition-all shadow-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
