import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEGEND_ITEMS = [
    {
        color: "bg-emerald-500",
        glow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
        label: "Свободна",
    },
    {
        color: "bg-amber-400",
        glow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
        label: "Занята",
    },
    {
        color: "bg-red-500",
        glow: "shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        label: "Недоступна",
    },
    {
        color: "bg-violet-500",
        glow: "shadow-[0_0_8px_rgba(139,92,246,0.6)]",
        label: "Обслуживание",
    },
    {
        color: "bg-zinc-400",
        glow: "",
        label: "Офлайн",
    },
];

/**
 * Floating map legend button — shows colour-coded station status key.
 * Renders a small "?" pill; on click expands to a legend card.
 */
export function MapLegend() {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all active:scale-95"
                aria-label="Легенда карты"
                aria-expanded={open}
            >
                {/* Three coloured dots preview */}
                <span className="flex items-center gap-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                </span>
                <span>Легенда</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl p-3 min-w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                            Статус станции
                        </p>
                        <div className="space-y-2">
                            {LEGEND_ITEMS.map((item) => (
                                <div key={item.label} className="flex items-center gap-2.5">
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color} ${item.glow}`}
                                    />
                                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Arrow */}
                        <div className="absolute -bottom-[5px] left-5 w-2.5 h-2.5 bg-white dark:bg-zinc-900 rotate-45 border-r border-b border-zinc-200 dark:border-zinc-700" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
