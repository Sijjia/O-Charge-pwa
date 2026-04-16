import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Station } from "@/api/types";

interface StationSelectionModalProps {
  stations: Station[];
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StationSelectionModal({
  stations,
  locationName,
  isOpen,
  onClose,
}: StationSelectionModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleStationSelect = (station: Station) => {
    const isStationAvailable =
      station.status === "available" || station.status === "active";
    if (!isStationAvailable) {
      return;
    }
    navigate(`/charging/${station.serial_number}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] z-50 flex items-end"
      onClick={onClose}
      style={{
        paddingBottom: "var(--nav-height)",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="glass-panel w-full max-h-[60vh] rounded-t-[28px] border-t border-white/40 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-black/50 transition-all duration-300 flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-3 shrink-0">
          <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-white tracking-tight">
              {locationName}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-zinc-500 dark:text-zinc-400">
              <span className="text-sm font-medium pr-2">
                {stations.length} станци
                {stations.length === 1 ? "я" : stations.length < 5 ? "и" : "й"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors active:scale-95"
          >
            <Icon icon="solar:close-circle-bold" width={28} />
          </button>
        </div>

        {/* Station List */}
        <div className="overflow-y-auto px-5 pb-6 space-y-3 flex-1 hide-scroll">
          {stations.map((station) => {
            const summary = station.connectors_summary;
            const availableConnectors = summary?.available ?? 0;
            const totalConnectors = station.connectors_count || (summary ? summary.available + summary.occupied + summary.faulted : 0);
            const price = station.price_per_kwh ?? station.tariff?.price_per_kwh ?? 0;
            const isAvailable =
              station.status === "available" || station.status === "active";

            return (
              <button
                key={station.id}
                onClick={() => handleStationSelect(station)}
                disabled={!isAvailable}
                className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${isAvailable
                  ? "bg-white dark:bg-[#1C212B] border-zinc-200 dark:border-white/5 hover:border-red-500/50 shadow-sm"
                  : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 opacity-70 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${isAvailable
                    ? "bg-zinc-50 dark:bg-[#111621] text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800"
                    }`}>
                    <Icon
                      icon={isAvailable ? "solar:plug-circle-bold" : "solar:plug-circle-linear"}
                      width={24}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-semibold ${isAvailable
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                        {station.model || "Станция"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#111621] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium tracking-tight">
                        {station.power_capacity} кВт
                      </span>
                    </div>
                    <div className={`text-sm font-medium ${isAvailable
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-500/80"
                      }`}>
                      {isAvailable ? `${availableConnectors}/${totalConnectors} свободно` : station.status === "charging" ? "Заряжает" : "Офлайн"}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-[#111621] px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  {price} <span className="text-xs font-normal text-zinc-500">сом</span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
