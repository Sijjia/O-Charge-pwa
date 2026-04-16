import { useState, useRef, useEffect } from "react";

const SEEN_KEY = "rp_help_seen";

function isFirstSession(): boolean {
  return !localStorage.getItem(SEEN_KEY);
}

export function markHelpSeen() {
  localStorage.setItem(SEEN_KEY, "1");
}

/**
 * HelpTip — маленький вопросик.
 *
 * Первая сессия → мягкий пульс привлекает внимание.
 * Потом → тихий, почти невидимый, но при hover/click — показывает тултип.
 */
export function HelpTip({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<"top" | "bottom">("top");
  const [firstTime] = useState(isFirstSession);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 160 ? "bottom" : "top");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    setTimeout(() => document.addEventListener("click", handler), 0);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <span className={`relative inline-flex items-center ml-1 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          markHelpSeen();
        }}
        className={[
          "inline-flex items-center justify-center rounded-full cursor-help transition-all duration-300",
          "w-[17px] h-[17px] border",
          open
            ? "bg-blue-500 border-blue-400 opacity-100 scale-110"
            : firstTime
              ? "bg-blue-500/10 border-blue-400/40 opacity-80 animate-help-pulse hover:opacity-100 hover:bg-blue-500/20 hover:scale-110"
              : "bg-transparent border-zinc-300/40 dark:border-zinc-600/40 opacity-30 hover:opacity-90 hover:border-blue-400/60 hover:bg-blue-500/10 hover:scale-110",
        ].join(" ")}
        aria-label="Подсказка"
      >
        <span
          className={[
            "text-[10px] font-bold leading-none select-none",
            open ? "text-white" : firstTime ? "text-blue-400" : "text-zinc-400 dark:text-zinc-500",
          ].join(" ")}
        >
          ?
        </span>
      </button>
      {open && (
        <div
          className={[
            "fixed sm:absolute z-[100] px-3.5 py-3",
            "left-4 right-4 sm:left-1/2 sm:right-auto sm:w-64 sm:-translate-x-1/2",
            "bg-zinc-900 dark:bg-zinc-800 text-white text-[13px] leading-relaxed",
            "rounded-xl shadow-2xl border border-zinc-700/80",
            "animate-toast-in",
            pos === "top"
              ? "sm:bottom-full sm:mb-2"
              : "sm:top-full sm:mt-2",
          ].join(" ")}
          style={typeof window !== "undefined" && window.innerWidth < 640 ? { top: (ref.current?.getBoundingClientRect().bottom ?? 0) + 8 } : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          {text}
          <div
            className={[
              "hidden sm:block absolute w-2.5 h-2.5 bg-zinc-900 dark:bg-zinc-800 rotate-45 left-1/2 -translate-x-1/2",
              pos === "top"
                ? "-bottom-[5px] border-r border-b border-zinc-700/80"
                : "-top-[5px] border-l border-t border-zinc-700/80",
            ].join(" ")}
          />
        </div>
      )}
    </span>
  );
}
