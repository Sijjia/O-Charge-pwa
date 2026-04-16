import { useState } from "react";
import { Icon } from "@iconify/react";

const stations = [
  {
    id: 1,
    name: 'АЗС "Джал"',
    address: "ул. Ахунбаева, 214",
    status: "available" as const,
    statusText: "2 свободно",
    tags: ["CCS2 120kW", "GB/T"],
    active: true,
  },
  {
    id: 2,
    name: 'АЗС "Азия Молл"',
    address: "пр. Чуй, 155",
    status: "warning" as const,
    statusText: "1 свободно",
    tags: ["CCS2", "Type 2"],
    active: false,
  },
  {
    id: 3,
    name: 'ТЦ "Дордой Плаза"',
    address: "ул. Ибраимова, 115",
    status: "busy" as const,
    statusText: "Занято",
    tags: ["GB/T Fast"],
    active: false,
  },
  {
    id: 4,
    name: 'АЗС "Фрунзе"',
    address: "ул. Льва Толстого, 32",
    status: "available" as const,
    statusText: "3 свободно",
    tags: ["CCS2", "CHAdeMO"],
    active: false,
  },
];

const statusStyles = {
  available: {
    badge: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-500 animate-pulse",
    text: "text-emerald-600 dark:text-emerald-500",
  },
  warning: {
    badge: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-500",
  },
  busy: {
    badge: "bg-red-500/10 border-red-500/20",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-500",
  },
};

const pinColors = {
  emerald: {
    ring: "bg-emerald-500",
    outer: "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500",
    shadow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    inner: "bg-emerald-600 dark:bg-emerald-500",
  },
  yellow: {
    ring: "bg-yellow-500",
    outer: "bg-yellow-100 dark:bg-yellow-500/20 border-yellow-500",
    shadow: "",
    inner: "bg-yellow-600 dark:bg-yellow-500",
  },
  red: {
    ring: "bg-red-500",
    outer: "bg-red-100 dark:bg-red-500/20 border-red-500",
    shadow: "",
    inner: "bg-red-600 dark:bg-red-500",
  },
};

const mapPins = [
  {
    id: 1,
    top: "35%",
    left: "25%",
    color: "emerald" as const,
    active: true,
    name: 'АЗС "Джал"',
    statusText: "2 свободно",
  },
  { id: 2, top: "45%", left: "60%", color: "yellow" as const, active: false },
  { id: 3, top: "60%", left: "40%", color: "red" as const, active: false },
  { id: 4, top: "20%", left: "70%", color: "emerald" as const, active: false },
];

const connectorTypes = ["CCS2", "GB/T", "Type 2", "CHAdeMO"] as const;

export function PublicMapPage() {
  const [checkedConnectors, setCheckedConnectors] = useState<Record<string, boolean>>({
    CCS2: true,
    "GB/T": true,
    "Type 2": false,
    CHAdeMO: false,
  });
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedStation, setSelectedStation] = useState<number>(1);

  const toggleConnector = (name: string) => {
    setCheckedConnectors((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      <style>{`
        :root { --map-bg: #FAFAFA; --map-grid: #E4E4E7; }
        .dark { --map-bg: #0A0E17; --map-grid: #27272A; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #D4D4D8; border-radius: 4px; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #3f3f46; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #A1A1AA; }
        .dark .custom-scroll::-webkit-scrollbar-thumb:hover { background: #52525b; }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-ripple { animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; }
      `}</style>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-full lg:w-[420px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-20 h-[50vh] lg:h-auto shadow-2xl lg:shadow-none transition-colors duration-300">
          {/* Search & Filters Header */}
          <div className="p-4 lg:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-5 shrink-0 transition-colors duration-300">
            {/* Search */}
            <div className="relative group">
              <Icon
                icon="solar:magnifer-linear"
                width={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors"
              />
              <input
                type="text"
                placeholder="Поиск станции..."
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-300 dark:focus:border-white/20 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-white/20 transition-all"
              />
            </div>

            {/* Connector Filters */}
            <div className="grid grid-cols-2 gap-3">
              {connectorTypes.map((name) => (
                <label
                  key={name}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleConnector(name)}
                >
                  <input type="checkbox" checked={checkedConnectors[name]} readOnly className="hidden" />
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checkedConnectors[name]
                        ? "bg-red-600 border-red-600"
                        : "border-zinc-300 dark:border-zinc-700 bg-transparent group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
                      }`}
                  >
                    <Icon
                      icon="solar:check-read-linear"
                      width={10}
                      className={`text-white transition-all ${checkedConnectors[name] ? "opacity-100 scale-100" : "opacity-0 scale-0"
                        }`}
                    />
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300 font-normal">{name}</span>
                </label>
              ))}
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-normal">Только доступные</span>
              <button
                type="button"
                onClick={() => setOnlyAvailable((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 ${onlyAvailable ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-800"
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white border-2 transition-all duration-300 ${onlyAvailable ? "translate-x-5 border-red-600" : "translate-x-0.5 border-zinc-200 dark:border-zinc-900"
                    }`}
                />
              </button>
            </div>
          </div>

          {/* Stations List */}
          <div className="flex-1 overflow-y-auto custom-scroll p-4 lg:p-6 space-y-3">
            <div className="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-wider mb-2 pl-1">
              Станции рядом
            </div>

            {stations.map((station, idx) => {
              const style = statusStyles[station.status];
              const isSelected = selectedStation === station.id;

              return (
                <div
                  key={station.id}
                  onClick={() => setSelectedStation(station.id)}
                  className={`rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden group shadow-sm dark:shadow-none ${isSelected
                      ? "bg-white dark:bg-zinc-900 border border-red-500/30 hover:bg-red-50/50 dark:hover:bg-zinc-900/80"
                      : "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-white/10"
                    }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3
                        className={`text-base font-medium mb-0.5 ${isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-900 dark:text-zinc-200"
                          }`}
                      >
                        {station.name}
                      </h3>
                      <p
                        className={`text-xs ${isSelected ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-500"
                          }`}
                      >
                        {station.address}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${style.badge}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span className={`text-xs font-medium ${style.text}`}>{station.statusText}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {station.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border ${isSelected
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800"
                          }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Map Area */}
        <div
          className="flex-1 relative overflow-hidden h-[50vh] lg:h-auto"
          style={{
            backgroundColor: "var(--map-bg)",
            backgroundImage:
              "linear-gradient(var(--map-grid) 1px, transparent 1px), linear-gradient(90deg, var(--map-grid) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            transition: "background-color 0.3s ease",
          }}
        >
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button className="btn btn-secondary w-10 h-10 !p-0 shadow-lg">
              <Icon icon="solar:add-linear" width={20} />
            </button>
            <button className="btn btn-secondary w-10 h-10 !p-0 shadow-lg">
              <Icon icon="solar:minus-linear" width={20} />
            </button>
            <button className="btn btn-secondary w-10 h-10 !p-0 shadow-lg mt-2">
              <Icon icon="solar:gps-linear" width={20} />
            </button>
          </div>

          {/* Simulated Road Paths */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-30 dark:opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-100 200 L400 200 L600 400 L1200 400"
              className="stroke-zinc-400 dark:stroke-zinc-700"
              strokeWidth={4}
              fill="none"
            />
            <path
              d="M300 -100 L300 800"
              className="stroke-zinc-400 dark:stroke-zinc-700"
              strokeWidth={4}
              fill="none"
            />
            <path
              d="M800 -100 L800 800"
              className="stroke-zinc-400 dark:stroke-zinc-700"
              strokeWidth={4}
              fill="none"
            />
            <path
              d="M0 500 L1000 500"
              className="stroke-zinc-400 dark:stroke-zinc-700"
              strokeWidth={2}
              fill="none"
            />
          </svg>

          {/* Map Pins */}
          {mapPins.map((pin) => {
            const colors = pinColors[pin.color];
            const isActive = pin.active;

            return (
              <div
                key={pin.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group ${isActive ? "z-20" : "hover:z-20"}`}
                style={{ top: pin.top, left: pin.left }}
                onClick={() => setSelectedStation(pin.id)}
              >
                <div className={`relative flex ${isActive ? "flex-col" : ""} items-center justify-center`}>
                  {/* Tooltip (active pin only) */}
                  {isActive && pin.name && (
                    <div className="absolute bottom-full mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg whitespace-nowrap shadow-xl z-20">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white">{pin.name}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500">{pin.statusText}</p>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-900 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45 -mt-1" />
                    </div>
                  )}

                  {/* Pulsating Rings */}
                  <div className={`absolute w-full h-full ${colors.ring} rounded-full animate-ripple opacity-75`} />
                  {(isActive || pin.color === "emerald") && (
                    <div
                      className={`absolute w-full h-full ${colors.ring} rounded-full animate-ripple opacity-75`}
                      style={{ animationDelay: isActive ? "1s" : "1.2s" }}
                    />
                  )}

                  {/* Pin Icon */}
                  <div
                    className={`relative rounded-full ${colors.outer} flex items-center justify-center border hover:scale-105 transition-transform ${isActive ? `w-12 h-12 ${colors.shadow}` : "w-8 h-8 hover:scale-110"
                      }`}
                  >
                    <div className={`rounded-full ${colors.inner} ${isActive ? "w-3 h-3" : "w-2 h-2"}`} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Attribution */}
          <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-white/60 dark:bg-black/40 backdrop-blur rounded text-[10px] text-zinc-500 dark:text-white/30 pointer-events-none">
            &copy; 2GIS Data
          </div>
        </div>
      </main>
    </>
  );
}
