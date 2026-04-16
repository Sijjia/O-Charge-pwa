import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import rpLogo from "@/assets/rp-logo.svg";

export function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUnifiedAuthStore();
  const [progress, setProgress] = useState(0);

  const handleLoadComplete = useCallback(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    } else {
      navigate("/auth/phone", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const duration = 2500;
    const interval = 30;
    let current = 0;

    const timer = setInterval(() => {
      current += 100 / (duration / interval);
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
        setTimeout(handleLoadComplete, 400);
      }
      setProgress(Math.round(current));
    }, interval);

    return () => clearInterval(timer);
  }, [handleLoadComplete]);

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-white min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-red-500/20">
      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-xs px-6">
        {/* Logo Container with Energy Pulse */}
        <div className="relative mb-10 group">
          {/* Energy Pulse Background */}
          <div className="absolute inset-0 rounded-full bg-[#D31010]/20 dark:bg-[#D31010]/30 blur-2xl animate-pulse w-32 h-32 -left-4 -top-2 z-0" />

          {/* RP Logo Image */}
          <div className="relative z-10 w-28 h-28 drop-shadow-2xl animate-fade-in overflow-hidden rounded-[24px]">
            <img src={rpLogo} alt="RP Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center mb-16">
          <h1 className="text-2xl font-semibold tracking-tight dark:text-white text-zinc-900">
            Red Charge
          </h1>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mt-1 uppercase tracking-widest opacity-80">
            Зарядные станции
          </p>
        </div>

        {/* Loader */}
        <div className="w-full">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              Загрузка данных...
            </span>
            <span className="text-xs font-medium text-[#D31010]">
              {progress}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D31010] rounded-full shadow-[0_0_10px_rgba(211,16,16,0.5)] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </main>

      {/* Version Footer */}
      <footer className="absolute bottom-8 text-center w-full opacity-60">
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 tracking-widest">
          v1.1.0
        </p>
      </footer>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D31010]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}

export default SplashScreen;
