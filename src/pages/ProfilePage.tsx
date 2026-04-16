import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuthStatus, useLogout } from "../features/auth/hooks/useAuth";
import { formatPhone } from "@/shared/utils/formatters";
import { useUnifiedAuthStore } from "../features/auth/unifiedAuthStore";
import { useBalance } from "../features/balance/hooks/useBalance";
import { useLowBalanceNotification } from "../features/balance/hooks/useLowBalanceNotification";
import { useState } from "react";
import { rpApi } from "@/services/rpApi";
import { logger } from "@/shared/utils/logger";
import { Skeleton } from "@/shared/components/SkeletonLoaders";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { SimpleTopup } from "../features/balance/components/SimpleTopup";
import { useOwnerStations } from "@/features/owner/hooks/useOwnerStations";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStatus();
  const userType = useUnifiedAuthStore((s) => s.userType);
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  useLowBalanceNotification();

  const logoutMutation = useLogout();

  const isOwner = userType === "owner";

  const { data: ownerStations } = useOwnerStations(
    isOwner ? user?.id : undefined,
  );
  const stationCount = ownerStations?.length ?? 0;

  const handleLogout = async () => {
    logger.debug("[ProfilePage] Logout button clicked");
    try {
      await logoutMutation.mutateAsync();
      logger.debug("[ProfilePage] Logout mutation completed successfully");
    } catch (error) {
      logger.error("[ProfilePage] Logout mutation failed:", error);
    }
  };

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteAccount = async () => {
    try {
      await rpApi.requestAccountDeletion();
      setShowDeleteConfirm(false);
      setDeleteRequested(true);
      showNotification("success", "Запрос на удаление отправлен. Мы обработаем его в ближайшее время.");
      await handleLogout();
    } catch (e) {
      showNotification("error", "Не удалось запросить удаление. Попробуйте позже.");
      logger.error("Failed to delete account:", e);
    }
  };

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 relative transition-colors duration-300"
      style={{ paddingBottom: "calc(var(--nav-height) + 16px)" }}
    >
      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 dark:bg-red-600/10 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-red-800/3 dark:bg-red-800/5 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-5 py-4 flex items-center justify-between transition-colors duration-300">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm dark:shadow-none"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
        <span className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
          Профиль
        </span>
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <Icon icon="solar:settings-linear" width={24} />
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-center animate-fade-in ${
          notification.type === "success"
            ? "bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400"
            : "bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400"
        }`}>
          {notification.message}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="relative z-10 px-5 pb-10 w-full max-w-md mx-auto">
        {/* Profile Header */}
        {user ? (
          <div className="flex flex-col items-center pt-4 pb-8">
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative z-10 flex items-center justify-center shadow-sm dark:shadow-none transition-colors">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <Icon
                    icon="solar:user-bold"
                    width={40}
                    className="text-white"
                  />
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-zinc-50 dark:bg-[#0A0E17] rounded-full flex items-center justify-center z-20">
                <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-50 dark:border-[#0A0E17]" />
              </div>
              {/* Red Glow */}
              <div className="absolute inset-0 bg-red-600/10 dark:bg-red-600/20 blur-xl rounded-full z-0 transform translate-y-2" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight font-display text-center">
              {user.name || "Пользователь"}
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              {formatPhone(user.phone) || user.email}
            </p>
            {isOwner && (
              <span className="mt-2 px-3 py-1 bg-red-50 dark:bg-red-600/10 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full border border-red-200 dark:border-red-500/20 transition-colors">
                Партнёр
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center pt-4 pb-8">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative z-10 flex items-center justify-center shadow-sm dark:shadow-none transition-colors">
                <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Icon
                    icon="solar:user-linear"
                    width={40}
                    className="text-zinc-400 dark:text-zinc-500"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="text-base font-semibold text-zinc-900 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Войти в аккаунт
            </button>
            <p className="text-xs text-zinc-500 mt-1">
              Для доступа ко всем функциям
            </p>
          </div>
        )}

        {/* Balance Card */}
        {user && (
          <div className="mb-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors">
                  <Icon icon="solar:wallet-money-linear" width={20} />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Баланс</p>
                  {isBalanceLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                      {balanceData?.balance ?? 0}
                      <span className="text-sm font-medium text-zinc-500 ml-1">
                        сом
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 active:scale-95 transition-all"
              >
                <Icon icon="solar:add-circle-linear" width={18} />
                <span>Пополнить</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Client Menu */}
        <div className="mb-8">
          <h2 className="px-2 mb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Клиентское меню
          </h2>
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
            {/* История зарядок */}
            <button
              onClick={() =>
                navigate("/history" + (!user ? "?auth=required" : ""))
              }
              className="flex items-center justify-between w-full p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
                  <Icon icon="solar:history-linear" width={20} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                  История зарядок
                </span>
              </div>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                width={20}
              />
            </button>

            {/* Избранное */}
            <button
              onClick={() =>
                navigate("/favorites" + (!user ? "?auth=required" : ""))
              }
              className="flex items-center justify-between w-full p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
                  <Icon icon="solar:heart-linear" width={20} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                  Избранное
                </span>
              </div>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                width={20}
              />
            </button>
          </div>
        </div>

        {/* Section 2: Partner Cabinet (Red Branding) */}
        {isOwner && (
          <div className="mb-6">
            <h2 className="px-2 mb-3 text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
              Партнёрский кабинет
            </h2>
            <div className="flex flex-col divide-y divide-red-100 dark:divide-red-500/10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
              {/* Мои станции */}
              <button
                onClick={() => navigate("/owner/stations")}
                className="flex items-center justify-between w-full p-4 hover:bg-red-50/50 dark:hover:bg-zinc-800/80 active:bg-red-50 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 group-hover:text-red-400 transition-colors">
                    <Icon icon="solar:ev-station-linear" width={20} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                    Мои станции
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {stationCount > 0 && (
                    <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md transition-colors">
                      {stationCount}
                    </span>
                  )}
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                    width={20}
                  />
                </div>
              </button>

              {/* Мой доход */}
              <button
                onClick={() => navigate("/owner/revenue")}
                className="flex items-center justify-between w-full p-4 hover:bg-red-50/50 dark:hover:bg-zinc-800/80 active:bg-red-50 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 group-hover:text-red-400 transition-colors">
                    <Icon icon="solar:wallet-money-linear" width={20} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                    Мой доход
                  </span>
                </div>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                  width={20}
                />
              </button>

              {/* Статистика */}
              <button
                onClick={() => navigate("/owner/dashboard")}
                className="flex items-center justify-between w-full p-4 hover:bg-red-50/50 dark:hover:bg-zinc-800/80 active:bg-red-50 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 group-hover:text-red-400 transition-colors">
                    <Icon icon="solar:graph-new-linear" width={20} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                    Статистика
                  </span>
                </div>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                  width={20}
                />
              </button>

              {/* Акты сверки */}
              <button
                onClick={() => navigate("/owner/sessions")}
                className="flex items-center justify-between w-full p-4 hover:bg-red-50/50 dark:hover:bg-zinc-800/80 active:bg-red-50 dark:active:bg-zinc-800 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 group-hover:text-red-400 transition-colors">
                    <Icon icon="solar:document-text-linear" width={20} />
                  </div>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                    Акты сверки
                  </span>
                </div>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                  width={20}
                />
              </button>
            </div>
          </div>
        )}

        {/* Log Out Button */}
        {user && (
          <div className="mt-2 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full py-4 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
            >
              {logoutMutation.isPending ? "Выход..." : "Выйти"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 text-xs font-medium text-red-400/50 dark:text-red-500/50 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Удалить аккаунт
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Удалить аккаунт?"
        message="Это действие необратимо. Все ваши данные, история зарядок и баланс будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={deleteRequested}
      />

      {/* Topup Modal */}
      {showTopupModal && (
        <SimpleTopup onClose={() => setShowTopupModal(false)} />
      )}
    </div>
  );
};
