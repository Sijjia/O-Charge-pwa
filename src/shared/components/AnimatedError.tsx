import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";

interface AnimatedErrorProps {
    error: string | null | undefined;
    className?: string;
    icon?: boolean;
}

export function AnimatedError({ error, className = "", icon = true }: AnimatedErrorProps) {
    return (
        <AnimatePresence mode="wait">
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`overflow-hidden ${className}`}
                >
                    <div className="flex items-start gap-1.5 mt-1.5 text-sm text-red-600 dark:text-red-400">
                        {icon && (
                            <Icon
                                icon="solar:danger-circle-linear"
                                width={16}
                                className="mt-0.5 flex-shrink-0"
                            />
                        )}
                        <p role="alert">{error}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
