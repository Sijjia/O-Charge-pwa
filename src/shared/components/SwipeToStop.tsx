import { useState, useRef } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Icon } from "@iconify/react";

interface SwipeToStopProps {
    onStop: () => void;
    isLoading: boolean;
}

export function SwipeToStop({ onStop, isLoading }: SwipeToStopProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const [isUnlocked, setIsUnlocked] = useState(false);

    const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.offsetWidth;
        const threshold = containerWidth - 72; // Appox. thumb width and margin

        if (info.offset.x >= threshold * 0.75) {
            setIsUnlocked(true);
            await controls.start({ x: threshold });
            onStop();
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[64px] rounded-2xl overflow-hidden flex items-center justify-center border transition-colors ${isLoading || isUnlocked
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
                : "bg-white dark:bg-[#1C212B] border-zinc-200 dark:border-white/10"
                }`}
        >
            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                {isLoading ? (
                    <span className="text-red-600 dark:text-red-500 font-semibold tracking-wide flex items-center gap-2">
                        <Icon icon="solar:stop-circle-bold" width={20} className="animate-pulse" />
                        Останавливаем...
                    </span>
                ) : (
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium tracking-wide pl-10">Смахнуть для остановки</span>
                )}
            </div>

            {/* Track Background */}
            {!isLoading && !isUnlocked && (
                <div className="absolute left-1.5 top-1.5 bottom-1.5 right-1.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl pointer-events-none" />
            )}

            {/* Draggable Thumb */}
            {!isLoading && !isUnlocked && (
                <motion.div
                    drag="x"
                    dragConstraints={containerRef}
                    dragElastic={0.05}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    className="absolute left-2 top-2 bottom-2 w-[54px] bg-red-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(220,38,38,0.3)] cursor-grab active:cursor-grabbing hover:bg-red-700 transition-colors z-10"
                >
                    <Icon icon="solar:double-alt-arrow-right-bold" width={28} className="text-white" />
                </motion.div>
            )}
        </div>
    );
}
