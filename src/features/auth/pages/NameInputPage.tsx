import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUnifiedAuthStore } from "../unifiedAuthStore";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";

export function NameInputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, login } = useUnifiedAuthStore();
  const redirectTo =
    (location.state as { redirectTo?: string })?.redirectTo || "/";

  const isValid = name.trim().length >= 2;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await rpApi.updateProfile({ name: name.trim() });
      if (user) {
        login({ ...user, name: name.trim() });
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      logger.error("[NameInputPage] Failed to update name:", err);
      setError("Не удалось сохранить имя. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-white min-h-screen flex flex-col relative antialiased selection:bg-red-500/30 transition-colors duration-300">
      {/* Header / Back Button */}
      <header className="p-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
          aria-label="Назад"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 flex flex-col pt-4">
        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col"
        >
          {/* Welcome Text */}
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight mb-3 flex items-center gap-2 text-zinc-900 dark:text-white">
              Добро пожаловать!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-light">
              Как вас зовут?
            </p>
          </div>

          {/* Input */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#D02020] transition-colors">
                <Icon icon="solar:user-linear" width={20} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Введите ваше имя"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl py-4 pl-12 pr-4 text-base placeholder-zinc-400 dark:placeholder-zinc-600 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#D02020] focus:ring-1 focus:ring-[#D02020] transition-all duration-300 outline-none"
                autoComplete="name"
                autoFocus
              />
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1 leading-relaxed">
              Имя будет отображаться в вашем профиле и на электронных чеках.
            </p>

            {error && (
              <p className="text-sm text-red-500 px-1" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Action Buttons */}
          <div className="pb-10 pt-6 space-y-6">
            {/* Continue Button */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full h-14 font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                !isValid || isLoading
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  : "bg-[#D02020] hover:bg-[#b01b1b] text-white shadow-[0_4px_20px_-4px_rgba(208,32,32,0.3)]"
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
                  Сохранение...
                </span>
              ) : (
                <>
                  <span>ПРОДОЛЖИТЬ</span>
                  <Icon icon="solar:arrow-right-linear" width={20} />
                </>
              )}
            </button>

            {/* Skip Link */}
            <button
              type="button"
              onClick={() => navigate(redirectTo, { replace: true })}
              className="w-full flex items-center justify-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors gap-1 group"
            >
              <span>Пропустить</span>
              <Icon
                icon="solar:arrow-right-linear"
                width={16}
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default NameInputPage;
