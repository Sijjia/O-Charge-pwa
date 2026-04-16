import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { usePhoneAuth } from "../hooks/usePhoneAuth";

export function PhoneAuthPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPhone, setLocalPhone] = useState("");

  const { isLoading, error, setPhone, setError } = usePhoneAuth();

  const fullPhone = "+996" + localPhone.replace(/\D/g, "");
  const isValid = localPhone.replace(/\D/g, "").length >= 9;

  const doSubmit = async () => {
    if (!isValid || isLoading) return;

    setPhone(fullPhone);
    setError(null);

    const { validatePhone, sendOTP } = await import("../services/otpService");
    const validation = validatePhone(fullPhone);
    if (!validation.valid) {
      setError(validation.error || "Неверный номер телефона");
      return;
    }

    const result = await sendOTP(fullPhone);
    if (result.success) {
      navigate("/auth/otp", { state: { phone: fullPhone } });
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white h-screen flex flex-col relative overflow-hidden selection:bg-red-500/30">
      {/* Decorative Top Gradient */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-red-500/5 via-zinc-200/20 to-transparent dark:from-red-900/10 dark:via-zinc-900/5 dark:to-transparent pointer-events-none select-none" />

      {/* Header / Nav */}
      <header className="flex justify-between items-center px-6 py-6 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors"
          aria-label="Назад"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
          Помощь
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 z-10 relative mt-16 sm:mt-24">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm mx-auto flex flex-col h-full"
        >
          {/* Headers */}
          <div className="mb-10 text-center flex flex-col items-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 w-fit mb-2 shadow-sm dark:shadow-none">
              <Icon
                icon="solar:shield-check-linear"
                className="text-red-500"
                width={16}
              />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                Безопасный вход
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight font-display text-zinc-900 dark:text-white">
              Вход или <br /> регистрация
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
              Введите номер телефона. Если у вас нет аккаунта, мы создадим его
              автоматически.
            </p>
          </div>

          {/* Input Group */}
          <div className="space-y-4">
            <div
              className={`group relative bg-white dark:bg-zinc-900/50 rounded-2xl border transition-all duration-300 shadow-sm dark:shadow-none ${
                error
                  ? "border-red-500/50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
                  : "border-zinc-200 dark:border-zinc-800 focus-within:border-red-500/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:shadow-[0_0_0_1px_rgba(239,68,68,0.2)]"
              }`}
              onClick={() => inputRef.current?.focus()}
            >
              <label className="flex items-center h-[72px] px-5 w-full cursor-text">
                {/* Country Flag & Code Prefix */}
                <div className="flex items-center gap-3 pr-4 border-r border-zinc-200 dark:border-zinc-800 mr-4 h-6">
                  {/* Flag */}
                  <img
                    src="https://flagcdn.com/kg.svg"
                    alt="Кыргызстан"
                    className="w-6 h-6 rounded-full object-cover shadow-sm border border-zinc-100 dark:border-zinc-700/50"
                  />
                  {/* Code */}
                  <span className="text-zinc-900 dark:text-zinc-300 font-mono text-lg pt-0.5 select-none">
                    +996
                  </span>
                </div>

                {/* Phone Input */}
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
                  disabled={isLoading}
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

          {/* Spacer */}
          <div className="flex-1" />
        </form>
      </main>

      {/* Sticky Footer */}
      <footer className="p-6 pb-8 z-10 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="w-full max-w-sm mx-auto space-y-5">
          {/* Continue Button */}
          <button
            onClick={doSubmit}
            disabled={!isValid || isLoading}
            className={`group w-full h-14 text-base font-medium rounded-xl flex items-center justify-center gap-2 px-6 transition-all duration-300 active:scale-[0.98] ${
              !isValid || isLoading
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Отправка...
              </span>
            ) : (
              <>
                <span>Продолжить</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  width={20}
                  className="text-white/80 group-hover:text-white transition-colors"
                />
              </>
            )}
          </button>

          {/* Legal Link */}
          <div className="text-center px-4">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-600 leading-normal">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <a
                href="/legal/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors underline decoration-zinc-300 dark:decoration-zinc-800 underline-offset-2"
              >
                Условиями использования
              </a>{" "}
              и{" "}
              <a
                href="/legal/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors underline decoration-zinc-300 dark:decoration-zinc-800 underline-offset-2"
              >
                Политикой конфиденциальности
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PhoneAuthPage;
