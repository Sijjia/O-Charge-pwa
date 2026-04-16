import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import {
  rpApi,
  handleApiError,
  type PaymentStatus,
} from "@/services/rpApi";
import { useUnifiedAuthStore as useAuthStore } from "@/features/auth/unifiedAuthStore";
import {
  balanceService,
  type NormalizedTopupQRResponse,
} from "../services/balanceService";
import { logger } from "@/shared/utils/logger";
import { usePageVisibility } from "@/shared/hooks/usePageVisibility";
import { supabase, isPlaceholder } from "@/shared/config/supabase";
import { REFETCH_INTERVAL } from "@/lib/queryClient";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type BalanceData = { balance: number; currency: string };

// Get balance query - берем из API с Realtime обновлениями
export const useBalance = () => {
  const { user } = useAuthStore();
  const isPageVisible = usePageVisibility();
  const queryClient = useQueryClient();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Supabase Realtime подписка на обновления баланса
  useEffect(() => {
    if (!user?.id || isPlaceholder) return;

    logger.info(
      `[useBalance] Setting up Realtime subscription for user ${user.id}`,
    );

    const channel = supabase
      .channel(`balance-${user.id}`)
      .on<{ id: string; balance: number }>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "clients",
          filter: `id=eq.${user.id}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            id: string;
            balance: number;
          }>,
        ) => {
          logger.info(
            "[useBalance] Realtime balance update received:",
            payload.new,
          );

          if (
            payload.new &&
            "balance" in payload.new &&
            payload.new.balance !== undefined
          ) {
            // Формат должен совпадать с queryFn return type
            queryClient.setQueryData<BalanceData>(
              ["balance", user.id],
              { balance: payload.new.balance, currency: "KGS" },
            );
          }
        },
      )
      .subscribe((status) => {
        logger.debug(`[useBalance] Realtime subscription status: ${status}`);
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      logger.info(
        `[useBalance] Removing Realtime subscription for user ${user.id}`,
      );
      supabase.removeChannel(channel);
      setIsRealtimeConnected(false);
    };
  }, [user?.id, queryClient, isPlaceholder]);

  return useQuery<BalanceData>({
    queryKey: ["balance", user?.id],
    queryFn: async (): Promise<BalanceData> => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return await balanceService.getBalance(user.id);
    },
    enabled: !!user?.id,
    // Баланс НЕ персистится в IndexedDB, поэтому всегда рефетчим при mount
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: isPageVisible
      ? isRealtimeConnected
        ? REFETCH_INTERVAL.BALANCE_WITH_REALTIME
        : REFETCH_INTERVAL.BALANCE_NO_REALTIME
      : false,
  });
};

// QR Topup mutation
export const useQRTopup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<
    NormalizedTopupQRResponse,
    Error,
    { amount: number; description?: string }
  >({
    mutationFn: async (data) => {
      if (!user?.id) throw new Error("User not authenticated");
      return await balanceService.generateTopUpQR(data.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
};

// Payment status polling
type UnifiedPaymentStatus = {
  status: "pending" | "success" | "failed";
  amount?: number;
  error?: string;
  createdAt?: string;
  completedAt?: string;
};

export const usePaymentStatus = (invoiceId: string | null, enabled = true) => {
  const isPageVisible = usePageVisibility();

  return useQuery<UnifiedPaymentStatus>({
    queryKey: ["payment-status", invoiceId],
    queryFn: async (): Promise<UnifiedPaymentStatus> => {
      if (!invoiceId) throw new Error("invoiceId required");
      return await balanceService.checkPaymentStatus(invoiceId);
    },
    enabled: enabled && !!invoiceId,
    refetchInterval: (query) => {
      const data = query.state.data as UnifiedPaymentStatus | undefined;
      if (!data) return 5000;
      if (!isPageVisible) return false;
      return data.status === "pending" ? 5000 : false;
    },
    refetchIntervalInBackground: false,
  });
};

// Cancel payment mutation
export const useCancelPayment = () => {
  return useMutation<void, Error, string>({
    mutationFn: async () => {
      logger.warn("Cancel payment not supported by backend API");
    },
  });
};

// Payment monitoring hook (legacy support)
export function usePaymentMonitoring() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [monitoring, setMonitoring] = useState(false);

  const monitorPayment = useCallback(
    (
      invoiceId: string,
      onSuccess?: () => void,
      onError?: (error: string) => void,
    ) => {
      let attempts = 0;
      const maxAttempts = 40;
      setMonitoring(true);

      const checkStatus = async () => {
        try {
          const status = await rpApi.getPaymentStatus(invoiceId);
          setPaymentStatus(status);

          if (status.status === 1) {
            setMonitoring(false);
            onSuccess?.();
            return;
          }

          if (status.status === 2) {
            setMonitoring(false);
            onError?.("Платеж отменен");
            return;
          }

          if (status.qr_expired || status.invoice_expired) {
            setMonitoring(false);
            onError?.("Время оплаты истекло");
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 15000);
          } else {
            setMonitoring(false);
            onError?.("Время ожидания оплаты истекло");
          }
        } catch (error) {
          setMonitoring(false);
          onError?.(handleApiError(error));
        }
      };

      setTimeout(checkStatus, 15000);
    },
    [],
  );

  const stopMonitoring = useCallback(() => {
    setMonitoring(false);
    setPaymentStatus(null);
  }, []);

  return {
    paymentStatus,
    monitoring,
    monitorPayment,
    stopMonitoring,
  };
}
