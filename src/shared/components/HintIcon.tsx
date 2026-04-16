import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

interface HintIconProps {
    text: string;
    icon?: string;
    size?: number;
}

export function HintIcon({ text, icon = "solar:info-circle-linear", size = 18 }: HintIconProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            <Icon
                icon={icon}
                width={size}
                className="text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 cursor-help transition-colors"
            />

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] p-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-xl pointer-events-none"
                    >
                        <p className="text-xs leading-relaxed font-medium">
                            {text}
                        </p>
                        {/* Arrow down */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
