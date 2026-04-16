import { rpApi, type TopupQRResponse } from "@/services/rpApi";
import { fetchJson } from "@/api/unifiedClient";
import { isDemoModeActive } from "@/shared/demo/useDemoMode";
import { logger } from "@/shared/utils/logger";
import { z } from "zod";

// Normalized response type for client usage
export interface NormalizedTopupQRResponse extends TopupQRResponse {
  qrCode: string;
  paymentId: string;
  expiresAt: string;
  payment_url?: string;
  link_app?: string;
  app_link?: string;
}

// Zod schema for /api/v1/profile balance extraction
const profileBalanceSchema = z.object({
  success: z.boolean(),
  balance: z.number().optional().nullable(),
}).passthrough();

export const balanceService = {
  /**
   * Получить баланс пользователя.
   * Прямой вызов /api/v1/profile — без посредников.
   */
  async getBalance(_userId: string): Promise<{ balance: number; currency: string }> {
    // Демо-режим
    if (isDemoModeActive()) {
      try {
        const raw = localStorage.getItem("auth-storage");
        if (raw) {
          const parsed = JSON.parse(raw);
          const balance = parsed?.state?.user?.balance ?? 5000;
          return { balance, currency: "KGS" };
        }
      } catch (e) { logger.warn("[balanceService] Failed to read demo balance:", e); }
      return { balance: 5000, currency: "KGS" };
    }

    try {
      // Прямой запрос к /api/v1/profile — cookie auth подставляется автоматически
      const profile = await fetchJson(
        "/api/v1/profile",
        { method: "GET" },
        profileBalanceSchema,
      );

      if (profile.success && typeof profile.balance === "number") {
        logger.debug(`[balanceService] Balance from API: ${profile.balance}`);
        return { balance: profile.balance, currency: "KGS" };
      }

      logger.warn("[balanceService] Profile returned no balance", profile);
      return { balance: 0, currency: "KGS" };
    } catch (error) {
      logger.error("[balanceService] Error fetching balance:", error);
      return { balance: 0, currency: "KGS" };
    }
  },

  async generateTopUpQR(amount: number): Promise<NormalizedTopupQRResponse> {
    if (isDemoModeActive()) {
      const demoInvoiceId = `demo-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return {
        success: true,
        invoice_id: demoInvoiceId,
        order_id: demoInvoiceId,
        amount,
        qr_code: "",
        qr_code_url: "",
        qr_expires_at: expiresAt,
        invoice_expires_at: expiresAt,
        app_link: "",
        qrCode: "",
        paymentId: demoInvoiceId,
        expiresAt,
      };
    }

    const res = await rpApi.topupWithQR(amount);
    const apiRes = res as unknown as Record<string, unknown>;
    return {
      ...res,
      qrCode:
        res.qr_code_url ||
        (apiRes["qr_url"] as string) ||
        res.qr_code ||
        (apiRes["qr"] as string) ||
        "",
      paymentId: res.invoice_id || res.order_id || "",
      expiresAt:
        res.qr_expires_at ||
        res.invoice_expires_at ||
        new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      payment_url:
        (apiRes["payment_url"] as string) ||
        (apiRes["link_app"] as string) ||
        res.app_link ||
        "",
      link_app:
        (apiRes["link_app"] as string) ||
        (apiRes["payment_url"] as string) ||
        res.app_link ||
        "",
    };
  },

  async checkPaymentStatus(invoiceId: string): Promise<{
    status: "pending" | "success" | "failed";
    amount?: number;
    error?: string;
    createdAt?: string;
    completedAt?: string;
  }> {
    if (isDemoModeActive() || invoiceId.startsWith("demo-")) {
      return { status: "success", amount: 0, completedAt: new Date().toISOString() };
    }

    const res = await rpApi.getPaymentStatus(invoiceId);
    if (res.status_text === "approved" || res.can_start_charging) {
      return {
        status: "success",
        amount: res.paid_amount || res.amount || 0,
        completedAt: new Date().toISOString(),
      };
    }
    if (res.status_text === "canceled" || res.status_text === "refunded") {
      return { status: "failed", error: res.error || "Payment canceled" };
    }
    return {
      status: "pending",
      amount: res.amount || 0,
      createdAt: new Date().toISOString(),
    };
  },
};
