import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthStatus } from "@/features/auth/hooks/useAuth";
import { useUnifiedAuthStore } from "@/features/auth/unifiedAuthStore";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStatus();
  const login = useUnifiedAuthStore((s) => s.login);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    name.trim() !== (user?.name || "") || email.trim() !== (user?.email || "");

  const handleSave = async () => {
    if (!hasChanges || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const updates: Record<string, string> = {};
      if (name.trim() !== (user?.name || "")) updates["name"] = name.trim();
      if (email.trim() !== (user?.email || "")) updates["email"] = email.trim();

      await rpApi.updateProfile(updates);

      if (user) {
        login({
          ...user,
          name: updates["name"] || user.name,
          email: updates["email"] !== undefined ? updates["email"] : user.email,
        });
      }

      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      logger.error("[EditProfilePage] Failed to update profile:", err);
      setError("Не удалось сохранить изменения. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative transition-colors duration-300">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 dark:bg-red-600/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between z-20 relative shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <span className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
          Редактирование
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pb-32 w-full max-w-md mx-auto pt-6">
        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex items-center justify-center shadow-sm dark:shadow-none transition-colors">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Icon icon="solar:user-bold" width={40} className="text-white" />
              </div>
            </div>
            <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full z-[-1] transform translate-y-2" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
              Имя
            </label>
            <div className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:border-red-500/50 transition-all duration-300 shadow-sm dark:shadow-none">
              <label className="flex items-center h-[56px] px-4 w-full cursor-text">
                <div className="text-zinc-400 dark:text-zinc-500 mr-3">
                  <Icon icon="solar:user-linear" width={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                    setSuccess(false);
                  }}
                  placeholder="Ваше имя"
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </label>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
              Email
            </label>
            <div className="group relative bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:border-red-500/50 transition-all duration-300 shadow-sm dark:shadow-none">
              <label className="flex items-center h-[56px] px-4 w-full cursor-text">
                <div className="text-zinc-400 dark:text-zinc-500 mr-3">
                  <Icon icon="solar:letter-linear" width={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                    setSuccess(false);
                  }}
                  placeholder="email@example.com"
                  className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-white text-base placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </label>
            </div>
          </div>

          {/* Phone (read-only) */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-1">
              Телефон
            </label>
            <div className="group relative bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 transition-colors">
              <div className="flex items-center h-[56px] px-4 w-full">
                <div className="text-zinc-400 dark:text-zinc-600 mr-3">
                  <Icon icon="solar:smartphone-linear" width={20} />
                </div>
                <span className="text-zinc-500 text-base font-mono">
                  {user?.phone || "Не указан"}
                </span>
                <div className="ml-auto">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-600 bg-zinc-200 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full">
                    Нельзя изменить
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
            <Icon icon="solar:danger-triangle-linear" className="text-red-400 shrink-0" width={16} />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
            <Icon icon="solar:check-circle-linear" className="text-emerald-400 shrink-0" width={16} />
            <p className="text-emerald-400 text-sm">Профиль успешно обновлён</p>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-[#0A0E17]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-5 pb-8 z-30 transition-colors duration-300">
        <div className="w-full max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
              !hasChanges || isLoading
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Сохранение...
              </span>
            ) : success ? (
              <span className="flex items-center gap-2">
                <Icon icon="solar:check-circle-linear" width={20} />
                Сохранено
              </span>
            ) : (
              "Сохранить изменения"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;
