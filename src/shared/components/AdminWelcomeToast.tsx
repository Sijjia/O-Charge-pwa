import { useState, useEffect } from "react";
import { markHelpSeen } from "./HelpTip";

const TOAST_KEY = "rp_admin_welcome_shown";

/**
 * Одноразовый welcome-toast для первого входа в админку.
 * Показывается 1 раз, потом больше никогда.
 */
export function AdminWelcomeToast() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOAST_KEY)) return;
    // Показываем через 1.5с после загрузки
    const showTimer = setTimeout(() => setVisible(true), 1500);
    // Автоматически скрываем через 12с
    const hideTimer = setTimeout(() => dismiss(), 13500);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  const dismiss = () => {
    setLeaving(true);
    localStorage.setItem(TOAST_KEY, "1");
    markHelpSeen();
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-sm sm:max-w-md ${leaving ? "animate-toast-out" : "animate-toast-in"}`}>
      <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl shadow-2xl border border-zinc-700/60 px-3 py-3 sm:px-5 sm:py-4 flex gap-2 sm:gap-3 items-start">
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-blue-400 text-sm sm:text-lg font-bold animate-help-pulse">?</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1">Добро пожаловать!</p>
          <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
            Нажмите на <span className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-blue-500/20 border border-blue-400/40 mx-0.5 align-middle"><span className="text-[8px] sm:text-[9px] font-bold text-blue-400">?</span></span> рядом с элементами — там подсказки.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-zinc-500 hover:text-white transition-colors shrink-0 mt-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
    </div>
  );
}
