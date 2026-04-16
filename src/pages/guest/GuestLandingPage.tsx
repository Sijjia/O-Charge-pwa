import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { fetchJson, TransportError } from "@/api/unifiedClient";
import { logger } from "@/shared/utils/logger";
import { HelpTip } from "@/shared/components/HelpTip";

const GuestStationSchema = z.object({
  location_name: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  connector_type: z.string().optional(),
  power_kw: z.number().optional(),
  available: z.boolean().optional(),
}).passthrough();

interface StationInfo {
  name: string;
  address: string;
  connectorType: string;
  powerKw: number;
  available: boolean;
}

function mapStationResponse(data: z.infer<typeof GuestStationSchema>, stationCode: string): StationInfo {
  return {
    name: data.location_name || data.name || `Станция ${stationCode}`,
    address: data.address || "",
    connectorType: data.connector_type || "CCS2",
    powerKw: data.power_kw || 150,
    available: data.available !== false,
  };
}

function fallbackStation(stationCode: string): StationInfo {
  return {
    name: `Станция ${stationCode}`,
    address: "",
    connectorType: "CCS2",
    powerKw: 150,
    available: true,
  };
}

export function GuestLandingPage() {
  const navigate = useNavigate();
  const { stationCode } = useParams();
  const [station, setStation] = useState<StationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!stationCode) return;

    const fetchStation = async () => {
      try {
        const data = await fetchJson(
          `/api/v1/guest/station/${stationCode}`,
          { method: "GET" },
          GuestStationSchema,
        );
        setStation(mapStationResponse(data, stationCode));
      } catch (err) {
        if (err instanceof TransportError) {
          logger.error("[GuestLanding] API error:", err.message);
        } else {
          logger.error("[GuestLanding] Failed to fetch station:", err);
        }
        setStation(fallbackStation(stationCode));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStation();
  }, [stationCode]);

  const handleStart = () => {
    sessionStorage.setItem("guestStationCode", stationCode || "");
    navigate("/guest/phone");
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">Загрузка станции...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-zinc-100 h-screen w-full flex flex-col relative overflow-hidden select-none transition-colors duration-300">
      {/* Pulsing Ambient Background */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/5 dark:bg-red-600/20 blur-[90px] rounded-full pointer-events-none z-0 animate-pulse" />
      <div
        className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-800/5 dark:bg-red-800/20 blur-[100px] rounded-full pointer-events-none z-0 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-center z-20 shrink-0 relative">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
          Быстрая зарядка без регистрации
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-24 z-10 w-full max-w-md mx-auto relative">
        {/* Charger Visual */}
        <div className="relative w-full h-[320px] mx-auto mb-8 flex items-center justify-center">
          {/* Red Central Glow */}
          <div className="absolute w-28 h-28 bg-red-600 rounded-full z-0 mix-blend-screen opacity-30 blur-[35px] animate-pulse" />

          {/* Static Structure Rings */}
          <div className="absolute w-72 h-72 border border-zinc-300/40 dark:border-zinc-700/40 rounded-full z-0" />
          <div className="absolute w-48 h-48 border border-zinc-200/40 dark:border-zinc-600/40 rounded-full bg-white/80 dark:bg-[#0A0E17]/80 backdrop-blur-md z-10 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.6)]" />

          {/* Main Red Icon */}
          <div className="relative z-20 flex items-center justify-center w-28 h-28 rounded-full">
            <div className="absolute inset-0 bg-red-500/40 blur-xl rounded-full" />
            <Icon
              icon="solar:bolt-circle-linear"
              width={100}
              className="text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,1)]"
            />
          </div>

          {/* Floating Label */}
          <div className="absolute bottom-[10%] z-30 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-full backdrop-blur-md shadow-xl dark:shadow-xl flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${station?.available
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-zinc-500"
                } animate-pulse`}
            />
            <span
              className={`text-xs font-medium ${station?.available ? "text-emerald-400" : "text-zinc-500"
                }`}
            >
              {station?.available ? "Станция доступна" : "Станция недоступна"}
            </span>
          </div>
        </div>

        {/* Station Info */}
        <div className="text-center mb-8 relative z-20">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight font-display mb-2">
            {station?.name}
          </h1>
          {station?.address && (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 flex items-center justify-center gap-1.5">
              <Icon icon="solar:map-point-linear" className="text-zinc-400 dark:text-zinc-500" width={16} />
              {station.address}
            </p>
          )}
        </div>

        {/* Connector Specs Card */}
        <div className="rounded-2xl p-1 mb-6 relative z-20 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between p-4 bg-zinc-50/80 dark:bg-[#111621]/80 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                <Icon icon="solar:plug-circle-linear" width={28} />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-zinc-900 dark:text-white">
                    {station?.connectorType}
                  </span>
                  {station?.connectorType && (
                    <HelpTip
                      text={(() => {
                        const t = station.connectorType.toLowerCase();
                        if (t.includes("ccs")) return "CCS2 — европейский стандарт DC-зарядки. Подходит для большинства EV европейских марок.";
                        if (t.includes("gbt") || t.includes("gb/t")) return "GB/T — китайский стандарт. Используется на BYD, Geely, Chery и других китайских EV.";
                        if (t.includes("type 2") || t.includes("type2")) return "Type 2 — европейский стандарт AC-зарядки. Медленнее DC, но очень распространён.";
                        if (t.includes("chd") || t.includes("chademo")) return "CHAdeMO — японский DC-стандарт. Используется на Nissan Leaf, Mitsubishi и др.";
                        return "Стандарт зарядного коннектора.";
                      })()}
                    />
                  )}
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {(() => {
                    const t = (station?.connectorType || "").toLowerCase();
                    if (t.includes("ccs")) return "Европейский DC";
                    if (t.includes("gbt") || t.includes("gb/t")) return "Китайский DC";
                    if (t.includes("type 2") || t.includes("type2")) return "Европейский AC";
                    if (t.includes("chd") || t.includes("chademo")) return "Японский DC";
                    return "Стандартный";
                  })()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-display">
                {station?.powerKw}{" "}
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-500">кВт</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Supercharge
              </span>
            </div>
          </div>

          {/* 3-Step Process */}
          <div className="mb-6 relative z-20">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 ml-1 text-center font-display">Как это работает</h3>
            <div className="flex bg-white/60 dark:bg-zinc-900/40 rounded-2xl p-4 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-sm shadow-sm justify-between">
              <div className="flex flex-col items-center gap-2 flex-1 relative">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center font-bold text-sm z-10 shadow-inner">1</div>
                <span className="text-[11px] font-medium text-zinc-500 text-center leading-tight">Номер<br />телефона</span>
                <div className="absolute top-4 left-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-700/50 -z-0"></div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1 relative">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center font-bold text-sm z-10 shadow-inner">2</div>
                <span className="text-[11px] font-medium text-zinc-500 text-center leading-tight">Оплата<br />картой</span>
                <div className="absolute top-4 left-1/2 w-full h-px bg-zinc-200 dark:bg-zinc-700/50 -z-0"></div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 flex items-center justify-center font-bold text-sm z-10 shadow-inner">3</div>
                <span className="text-[11px] font-medium text-zinc-500 text-center leading-tight">Быстрая<br />зарядка</span>
              </div>
            </div>
          </div>

          {/* Benefits Banner */}
          <div
            className="bg-gradient-to-r from-red-600/10 to-red-600/5 border border-red-600/20 rounded-2xl p-4 flex items-center gap-3 relative z-20 mb-6 cursor-pointer hover:bg-red-600/10 transition-colors shadow-sm"
            onClick={() => navigate("/auth")}
          >
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <Icon icon="solar:star-fall-bold-duotone" className="text-red-500 text-xl drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Используйте аккаунт</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Получайте бонусы, сохраняйте историю и любимые станции</p>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="text-red-500 text-xl" />
          </div>
        </div>

        {/* Sticky Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-5 pt-8 bg-gradient-to-t from-zinc-50 via-zinc-50 dark:from-[#0A0E17] dark:via-[#0A0E17] to-transparent z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-md relative flex flex-col gap-3 pointer-events-auto">
            <button
              onClick={handleStart}
              disabled={!station?.available}
              className={`relative w-full py-4 rounded-xl font-bold text-base transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-red-900/20 hover:shadow-red-900/40 border border-transparent ${station?.available
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border-zinc-300 dark:border-zinc-700"
                }`}
            >
              <Icon icon="solar:lightning-linear" width={20} />
              <span>Продолжить как гость</span>
              {station?.available && <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />}
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm"
            >
              <Icon icon="solar:login-2-linear" width={20} />
              <span>Войти или создать аккаунт</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestLandingPage;
