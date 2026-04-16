import { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { TransactionHistoryItem } from '../types';

interface TransactionCardProps {
  transaction: TransactionHistoryItem;
}

export const TransactionCard = memo(function TransactionCard({ transaction }: TransactionCardProps) {
  // Memoize formatted date
  const formattedDate = useMemo(() => {
    const date = new Date(transaction.timestamp);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, [transaction.timestamp]);

  // Memoize transaction config (icon, amountColor, paymentMethod)
  const transactionConfig = useMemo((): {
    iconName: string;
    amountColor: string;
    paymentMethodText: string;
  } => {
    let iconName: string;
    let amountColor: string;

    switch (transaction.type) {
      case 'topup':
        iconName = 'solar:alt-arrow-down-linear';
        amountColor = 'text-green-600';
        break;
      case 'charge':
        iconName = 'solar:alt-arrow-up-linear';
        amountColor = 'text-red-600';
        break;
      case 'refund':
        iconName = 'solar:refresh-linear';
        amountColor = 'text-green-600';
        break;
      default:
        iconName = 'solar:alt-arrow-down-linear';
        amountColor = 'text-gray-400';
    }

    let paymentMethodText = '';
    switch (transaction.paymentMethod) {
      case 'qr_namba':
        paymentMethodText = 'Namba One';
        break;
      case 'qr_odengi':
        paymentMethodText = 'Namba One';
        break;
      case 'card_obank':
        paymentMethodText = 'Банковская карта';
        break;
      case 'token':
        paymentMethodText = 'Сохранённая карта';
        break;
    }

    return { iconName, amountColor, paymentMethodText };
  }, [transaction.type, transaction.paymentMethod]);

  // Memoize status badge config
  const statusBadgeConfig = useMemo(() => {
    if (transaction.status === 'success') return null;

    return {
      className: transaction.status === 'pending'
        ? 'bg-yellow-500/15 text-yellow-400'
        : 'bg-red-500/15 text-red-400',
      text: transaction.status === 'pending' ? 'В обработке' : 'Ошибка'
    };
  }, [transaction.status]);

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:shadow-sm shadow-black/20 transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon icon={transactionConfig.iconName} width={24} className={transactionConfig.amountColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-white">{transaction.description}</p>
              <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
              {transaction.paymentMethod && transactionConfig.paymentMethodText && (
                <p className="text-xs text-gray-400 mt-1">{transactionConfig.paymentMethodText}</p>
              )}
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`font-semibold ${transactionConfig.amountColor}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} сом
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Баланс: {transaction.balance_after.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status badge if not success */}
      {statusBadgeConfig && (
        <div className="mt-3">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusBadgeConfig.className}`}>
            {statusBadgeConfig.text}
          </span>
        </div>
      )}
    </div>
  );
});