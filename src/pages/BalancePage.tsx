import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { BalanceCard } from '../features/balance/components/BalanceCard';
import { AutoTopupSettings } from '../features/balance/components/AutoTopupSettings';

export const BalancePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050507]">
      <header className="bg-white dark:bg-zinc-900 shadow-sm shadow-black/5 dark:shadow-black/20 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" width={24} />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-zinc-900 dark:text-white">Баланс</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          <BalanceCard onTopupClick={() => navigate('/balance/topup')} />

          <AutoTopupSettings />

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm dark:shadow border border-zinc-200 dark:border-zinc-800 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">История транзакций</h2>
            <p className="text-zinc-500 dark:text-gray-500">Загрузка истории...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BalancePage;