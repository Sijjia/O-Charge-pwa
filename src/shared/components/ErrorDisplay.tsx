/**
 * Error Display Component
 * Shows user-friendly error messages with optional retry button
 */

import { Icon } from '@iconify/react';
import { ErrorType } from '@/shared/utils/errorHandling';

interface ErrorDisplayProps {
  message: string;
  suggestion?: string;
  type?: ErrorType;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorDisplay({
  message,
  suggestion,
  type = 'UNKNOWN',
  onRetry,
  retryLabel = 'Попробовать снова',
  className = '',
}: ErrorDisplayProps) {
  const getColorClasses = () => {
    switch (type) {
      case 'NETWORK':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          text: 'text-orange-900',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'AUTHENTICATION':
        return {
          bg: 'bg-[#f0047f]/10',
          border: 'border-[#f0047f]/20',
          text: 'text-[#5c0030]',
          icon: 'text-[#f0047f]',
          button: 'bg-[#f0047f] hover:bg-[#c00366]',
        };
      case 'VALIDATION':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'BUSINESS':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return {
          bg: 'bg-zinc-900/50',
          border: 'border-zinc-800',
          text: 'text-white',
          icon: 'text-gray-400',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon icon="solar:danger-circle-linear" width={20} className={`flex-shrink-0 mt-0.5 ${colors.icon}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${colors.text} mb-1`}>{message}</h3>
          {suggestion && (
            <p className={`text-sm ${colors.text} opacity-80`}>{suggestion}</p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className={`flex items-center gap-2 mt-3 px-4 py-2 ${colors.button} text-white rounded-lg font-medium transition-colors`}
            >
              <Icon icon="solar:refresh-linear" width={16} />
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Error Message (smaller, for form fields)
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 mt-1 text-[#f0047f] text-sm">
      <Icon icon="solar:danger-circle-linear" width={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Full Page Error (for critical errors)
 */
export function FullPageError({
  message,
  suggestion,
  onRetry,
  onGoBack,
}: {
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-zinc-900 rounded-2xl shadow-lg shadow-black/40 p-8 text-center">
          <div className="w-16 h-16 bg-[#f0047f]/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:danger-circle-linear" width={32} className="text-[#f0047f]" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{message}</h2>
          {suggestion && (
            <p className="text-gray-400 mb-6">{suggestion}</p>
          )}
          <div className="flex gap-3">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="flex-1 px-6 py-3 bg-zinc-800 text-gray-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
              >
                Назад
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#f0047f] text-white rounded-lg font-medium hover:bg-[#c00366] transition-colors"
              >
                <Icon icon="solar:refresh-linear" width={20} />
                Попробовать снова
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
