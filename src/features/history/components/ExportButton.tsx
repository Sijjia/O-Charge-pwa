import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { ExportService } from '../services/exportService';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/hooks/useToast';
import type { ChargingHistoryItem, TransactionHistoryItem } from '../types';

interface ExportButtonProps {
  data: ChargingHistoryItem[] | TransactionHistoryItem[];
  type: 'charging' | 'transaction';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  type,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const toast = useToast();

  const handleExportPDF = async () => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      if (type === 'charging') {
        await ExportService.exportChargingHistoryToPDF(data as ChargingHistoryItem[]);
      } else {
        await ExportService.exportTransactionHistoryToPDF(data as TransactionHistoryItem[]);
      }
    } catch (error) {
      logger.error('[ExportButton] Export to PDF failed', { type, dataCount: data.length, error });
      toast.error('Не удалось экспортировать в PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      if (type === 'charging') {
        await ExportService.exportChargingHistoryToCSV(data as ChargingHistoryItem[]);
      } else {
        await ExportService.exportTransactionHistoryToCSV(data as TransactionHistoryItem[]);
      }
    } catch (error) {
      logger.error('[ExportButton] Export to CSV failed', { type, dataCount: data.length, error });
      toast.error('Не удалось экспортировать в CSV');
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`
          flex items-center gap-2 px-4 py-2
          bg-blue-500/100 text-white rounded-lg
          hover:bg-blue-600 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isExporting ? 'animate-pulse' : ''}
        `}
      >
        <Icon icon="solar:download-minimalistic-linear" width={18} />
        <span>Экспорт</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg shadow-lg shadow-black/40 border border-zinc-800 z-10">
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors rounded-t-lg"
          >
            <Icon icon="solar:document-text-linear" width={18} className="text-red-500" />
            <span>Экспорт в PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors rounded-b-lg border-t border-zinc-800"
          >
            <Icon icon="solar:document-text-linear" width={18} className="text-green-500" />
            <span>Экспорт в CSV</span>
          </button>
        </div>
      )}

      {/* Клик вне меню закрывает его */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};