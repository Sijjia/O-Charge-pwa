import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "../utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", { error, errorInfo });

    this.setState({
      error,
      errorInfo,
    });

    // Отправить ошибку в Sentry или другой сервис мониторинга
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Пользовательский fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-zinc-500 dark:text-gray-400 mb-6">
              Произошла непредвиденная ошибка. Попробуйте перезагрузить
              приложение или вернуться на главную страницу.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Перезагрузить приложение
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-gray-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Вернуться на главную
              </button>
            </div>

            {/* Показываем детали ошибки в режиме разработки */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-zinc-600 dark:hover:text-gray-300">
                  Детали ошибки (только в режиме разработки)
                </summary>
                <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono overflow-auto max-h-40">
                  <div className="text-red-600 font-bold mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  <div className="text-zinc-600 dark:text-gray-300">{this.state.error.stack}</div>
                  {this.state.errorInfo && (
                    <div className="mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-700">
                      <div className="text-zinc-600 dark:text-gray-300">
                        Component Stack:
                        {this.state.errorInfo.componentStack}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC для оборачивания компонентов в ErrorBoundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
