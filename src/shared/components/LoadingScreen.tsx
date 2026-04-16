export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#050507] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full animate-pulse" />

      {/* Logo & Branding */}
      <div className="z-10 flex flex-col items-center gap-6">
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Red Petroleum <span className="text-red-500">EV</span>
          </h1>
          <p className="text-xs text-white/40 tracking-widest uppercase mt-1">
            Energy Network
          </p>
        </div>
      </div>

      {/* Spinner */}
      <div className="spinner mt-8 z-10" />

      {/* Bottom Version */}
      <div className="absolute bottom-8 text-white/20 text-[10px] font-mono tracking-wider">
        v1.0.0 (Beta)
      </div>
    </div>
  );
}
