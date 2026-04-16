import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

export function GuestPhonePage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPhone, setLocalPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValid = localPhone.replace(/\D/g, "").length >= 9;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValid) return;

    const fullPhone = "+996" + localPhone.replace(/\D/g, "");
    sessionStorage.setItem("guestPhone", fullPhone);
    navigate("/guest/payment");
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-white h-screen flex flex-col relative overflow-hidden selection:bg-red-500/30 transition-colors duration-300">
      {/* Decorative Top Gradient */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-red-900/5 dark:from-red-900/10 via-zinc-100/5 dark:via-zinc-900/5 to-transparent pointer-events-none select-none" />

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Назад"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
          Гостевая зарядка
        </span>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 z-10 relative mt-16 sm:mt-24">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto flex flex-col h-full"
        >
          {/* Headers */}
          <div className="mb-10 text-center flex flex-col items-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 w-fit mb-2">
              <Icon
                icon="solar:smartphone-linear"
                className="text-red-500"
                width={16}
              />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                Для получения чека
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight font-display text-zinc-900 dark:text-white">
              Номер <br /> телефона
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
              Укажите номер, на который придёт SMS-чек после завершения зарядки.
            </p>
          </div>

          {/* Input Group */}
          <div className="space-y-4">
            <div
              className={`group relative bg-white dark:bg-zinc-900/50 rounded-2xl border transition-all duration-300 shadow-sm dark:shadow-none ${
                error
                  ? "border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                  : "border-zinc-200 dark:border-zinc-800 focus-within:border-red-500/50 focus-within:bg-zinc-50 dark:focus-within:bg-zinc-900 focus-within:shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
              }`}
              onClick={() => inputRef.current?.focus()}
            >
              <label className="flex items-center h-[72px] px-5 w-full cursor-text">
                <div className="text-zinc-400 dark:text-zinc-500 mr-4 flex items-center justify-center">
                  <Icon icon="solar:smartphone-linear" width={24} />
                </div>

                <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-800 mr-4 h-6">
                  <span className="text-zinc-600 dark:text-zinc-300 font-mono text-lg pt-0.5 select-none">
                    +996
                  </span>
                </div>

                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="tel"
                  placeholder="700 000 000"
                  value={localPhone}
                  onChange={(e) => {
                    setLocalPhone(e.target.value);
                    setError(null);
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-xl font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600 h-full w-full pt-0.5 tracking-wide"
                  autoComplete="tel"
                  autoFocus
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500 px-2" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex-1" />
        </form>
      </main>

      {/* Sticky Footer */}
      <footer className="p-6 pb-8 z-10 bg-zinc-50 dark:bg-[#0A0E17] transition-colors">
        <div className="w-full max-w-sm mx-auto space-y-5">
          <button
            onClick={() => handleSubmit()}
            disabled={!isValid}
            className={`group w-full h-14 text-white text-base font-medium rounded-xl flex items-center justify-center gap-2 px-6 transition-all duration-300 active:scale-[0.98] ${
              !isValid
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20"
            }`}
          >
            <span>Далее</span>
            <Icon
              icon="solar:arrow-right-linear"
              width={20}
              className="text-white/80 group-hover:text-white transition-colors"
            />
          </button>

          <div className="text-center px-4">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-600 leading-normal">
              Номер используется только для отправки SMS-чека
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GuestPhonePage;
