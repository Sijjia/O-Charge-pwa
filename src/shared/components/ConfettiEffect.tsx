import { useEffect, useRef } from "react";

const COLORS = [
    "#dc2626", // red
    "#ef4444", // light red
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
];

const PIECES_COUNT = 60;

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

/**
 * CSS confetti effect — spawns fixed-position confetti pieces on mount.
 * Automatically cleans up after animation completes (~2.5s).
 * Used on ChargingCompletePage.
 */
export function ConfettiEffect() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const pieces: HTMLSpanElement[] = [];

        for (let i = 0; i < PIECES_COUNT; i++) {
            const piece = document.createElement("span");
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const duration = rand(1.2, 2.2);
            const delay = rand(0, 0.8);
            const left = rand(5, 95);
            const size = rand(7, 13);
            const isCircle = Math.random() > 0.5;

            piece.className = "confetti-piece";
            piece.style.cssText = `
        left: ${left}vw;
        top: -20px;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: ${isCircle ? "50%" : "2px"};
        --duration: ${duration}s;
        --delay: ${delay}s;
      `;

            container.appendChild(piece);
            pieces.push(piece);
        }

        // Clean up after all animations complete
        const maxDuration = (2.2 + 0.8) * 1000 + 500;
        const cleanup = setTimeout(() => {
            pieces.forEach((p) => p.remove());
        }, maxDuration);

        return () => {
            clearTimeout(cleanup);
            pieces.forEach((p) => p.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
            aria-hidden="true"
        />
    );
}
