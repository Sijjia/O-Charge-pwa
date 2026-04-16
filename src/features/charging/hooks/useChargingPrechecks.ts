import { useMemo } from "react";
import { type ChargingLimits } from "../../charging/components/ChargingLimitsSelector";
import { logger } from "@/shared/utils/logger";

interface UseChargingPrechecksInput {
  balanceSom: number | null | undefined;
  station: {
    isAvailable: boolean;
    lastHeartbeatAt?: string | null;
  } | null;
  selectedConnector: {
    id: string;
    status: "available" | "occupied" | "error";
    powerKw?: number | null;
    type?: string | null;
  } | null;
  limits: ChargingLimits;
}

export function useChargingPrechecks(input: UseChargingPrechecksInput) {
  return useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    const isBalanceOk =
      input.limits.type === "none" ||
      (input.balanceSom ?? 0) >= (input.limits.amount_som ?? 0);

    if (!isBalanceOk) {
      issues.push("Недостаточно средств на балансе");
    }

    if (!input.station?.isAvailable) {
      issues.push("Станция недоступна для зарядки");
    }

    if (!input.selectedConnector) {
      issues.push("Не выбран коннектор");
    } else {
      if (input.selectedConnector.status !== "available") {
        issues.push(
          input.selectedConnector.status === "occupied"
            ? "Выбранный коннектор занят"
            : "Ошибка коннектора",
        );
      }
    }

    // Optional: last heartbeat freshness (if available)
    if (input.station?.lastHeartbeatAt) {
      try {
        const last = new Date(input.station.lastHeartbeatAt).getTime();
        const minutes = (Date.now() - last) / 60000;
        if (minutes > 5) {
          warnings.push("Станция давно не выходила на связь (>5 мин)");
        }
      } catch (e) {
        logger.warn("[useChargingPrechecks] Bad heartbeat date", e);
      }
    }

    const canStart = issues.length === 0;
    return {
      canStart,
      issues,
      warnings,
    };
  }, [input.balanceSom, input.station, input.selectedConnector, input.limits]);
}
