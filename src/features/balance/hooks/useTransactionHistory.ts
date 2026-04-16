import { useQuery } from "@tanstack/react-query";
import { rpApi } from "@/services/rpApi";
import { useUnifiedAuthStore as useAuthStore } from "@/features/auth/unifiedAuthStore";

/**
 * Transaction data from backend API /api/v1/history/transactions
 */
export interface PaymentTransaction {
  id: string;
  requested_amount: number;
  status: string | null;
  payment_method: string | null;
  created_at: string | null;
  completed_at: string | null;
  invoice_id?: string | null;
  balance_before: number | null;
  balance_after: number | null;
  amount: number;
  transaction_type: string;
}

export const useTransactionHistory = (limit = 20) => {
  const { user } = useAuthStore();

  return useQuery<PaymentTransaction[]>({
    queryKey: ["transaction-history", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return await rpApi.getTransactionHistory(limit);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 секунд
    refetchInterval: 1000 * 60, // Обновлять каждую минуту
  });
};
