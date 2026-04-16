import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStatus } from "../hooks/useAuth";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  allowSkip?: boolean; // Можно ли пропустить авторизацию
  requireAuth?: boolean; // Требуется ли обязательная авторизация
}

export function AuthModal({
  isOpen: controlledIsOpen,
  onClose,
  allowSkip = true,
  requireAuth = false,
}: AuthModalProps = {}) {
  const navigate = useNavigate();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);
  const { isAuthenticated, isInitialized } = useAuthStatus();

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Показываем модалку при первом запуске если пользователь не авторизован и не пропускал
  useEffect(() => {
    // Не показываем модалку до завершения инициализации
    if (!isInitialized) {
      return;
    }

    // Если вернулись со страницы с requireAuth и хотим подавить авто‑показ один раз
    const suppressOnce = sessionStorage.getItem("suppress_auth_modal_once");
    if (suppressOnce) {
      sessionStorage.removeItem("suppress_auth_modal_once");
      setInternalIsOpen(false);
      return;
    }

    const skippedAuth = localStorage.getItem("skipped_auth");
    if (skippedAuth) {
      setHasSkipped(true);
    }

    if (!isAuthenticated && !skippedAuth && !requireAuth) {
      setInternalIsOpen(true);
    } else if (!isAuthenticated && requireAuth) {
      setInternalIsOpen(true);
    }
  }, [isAuthenticated, requireAuth, isInitialized]);

  const handleLogin = () => {
    setInternalIsOpen(false);
    onClose?.();
    navigate("/auth/phone");
  };

  const handleBack = () => {
    // Если модалка контролируется извне (force open), делаем history.back
    if (controlledIsOpen !== undefined && requireAuth) {
      try {
        sessionStorage.setItem("suppress_auth_modal_once", "1");
      } catch {
        // Ignore storage errors
      }
      try {
        window.history.back();
      } catch {
        // Ignore navigation errors
      }
      return;
    }
    setInternalIsOpen(false);
    onClose?.();
  };

  const handleSkip = () => {
    if (allowSkip && !requireAuth) {
      localStorage.setItem("skipped_auth", "true");
      setHasSkipped(true);
      setInternalIsOpen(false);
      onClose?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={allowSkip && !requireAuth ? handleSkip : undefined}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden p-6">
              {/* Close / Back */}
              <button
                aria-label="Закрыть"
                onClick={handleBack}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
              >
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                  <Icon icon="solar:lock-keyhole-linear" width={32} className="text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center mb-2">
                Требуется вход
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 leading-relaxed">
                Войдите или зарегистрируйтесь, чтобы получить доступ к истории зарядок, балансу и другим функциям
              </p>

              {/* Login button */}
              <button
                onClick={handleLogin}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-base transition-colors active:scale-[0.98]"
              >
                Войти / Зарегистрироваться
              </button>

              {/* Skip button */}
              {allowSkip && !requireAuth && !hasSkipped && (
                <button
                  onClick={handleSkip}
                  className="mt-3 w-full py-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-sm font-medium transition-colors"
                >
                  Продолжить без входа
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
