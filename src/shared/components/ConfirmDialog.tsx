import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

/**
 * Модальное окно подтверждения действия
 *
 * @param isOpen - Состояние видимости
 * @param onClose - Callback для закрытия (отмена)
 * @param onConfirm - Callback для подтверждения
 * @param title - Заголовок (по умолчанию "Подтверждение")
 * @param message - Текст сообщения
 * @param confirmText - Текст кнопки подтверждения
 * @param cancelText - Текст кнопки отмены
 * @param variant - Стиль (danger/warning/info)
 * @param isLoading - Состояние загрузки
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтверждение",
  message,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  variant = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  // Блокируем прокрутку body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, isLoading]);

  const variantStyles = {
    danger: {
      iconBg: "bg-red-500/15",
      iconColor: "text-red-600",
      confirmBg: "bg-red-500/100 hover:bg-red-600",
    },
    warning: {
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-600",
      confirmBg: "bg-orange-500/100 hover:bg-orange-600",
    },
    info: {
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-600",
      confirmBg: "bg-blue-500/100 hover:bg-blue-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={isLoading ? undefined : onClose}
          >
            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0.3,
              }}
              className="bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center`}
                  >
                    <Icon icon="solar:danger-triangle-linear" width={24} className={styles.iconColor} />
                  </div>
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
                {!isLoading && (
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-400 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Закрыть"
                  >
                    <Icon icon="solar:close-linear" width={24} />
                  </button>
                )}
              </div>

              {/* Message */}
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">{message}</p>
              </div>

              {/* Action buttons */}
              <div className="border-t border-zinc-800 px-6 py-4 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-zinc-800 text-gray-300 py-3 rounded-xl font-semibold
                           hover:bg-zinc-700 transition-all active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 ${styles.confirmBg} text-white py-3 rounded-xl font-semibold
                           transition-all active:scale-95
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Выполняется...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
