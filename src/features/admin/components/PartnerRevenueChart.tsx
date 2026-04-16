import { useState } from "react";
import type { DemoRevenueByDay } from "@/shared/demo/demoData";

interface PartnerRevenueChartProps {
  data: DemoRevenueByDay[];
}

export function PartnerRevenueChart({ data }: PartnerRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use last 14 days for cleaner chart
  const chartData = data.slice(-14);
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue));
  const minRevenue = Math.min(...chartData.map((d) => d.revenue));
  const range = maxRevenue - minRevenue || maxRevenue;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Доход по дням
        </h2>
        <p className="text-sm text-zinc-600 dark:text-gray-400">
          Последние 14 дней
        </p>
      </div>

      <div className="space-y-4">
        {/* Y-axis labels */}
        <div className="flex gap-2">
          <div className="w-12 space-y-0 flex flex-col justify-between text-xs text-zinc-500 dark:text-gray-500 text-right pr-2">
            <span>{Math.round(maxRevenue).toLocaleString("ru-KG")}</span>
            <span>{Math.round((maxRevenue + minRevenue) / 2).toLocaleString("ru-KG")}</span>
            <span>{Math.round(minRevenue).toLocaleString("ru-KG")}</span>
          </div>

          {/* Chart bars */}
          <div className="flex-1">
            <div className="h-48 flex items-end justify-between gap-1.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              {chartData.map((item, index) => {
                const height = ((item.revenue - minRevenue) / range) * 100;
                const normalizedHeight = Math.max(height, 5); // minimum height for visibility
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2 group"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-red-600 to-orange-500 dark:from-red-500 dark:to-orange-400 transition-all duration-200 hover:from-red-700 hover:to-orange-600 dark:hover:from-red-600 dark:hover:to-orange-500 cursor-pointer"
                      style={{ height: `${normalizedHeight}%` }}
                    />

                    {/* Tooltip */}
                    {hoveredIndex === index && (
                      <div className="absolute z-10 bg-zinc-900 dark:bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap bottom-full transform -translate-x-1/2 left-1/2 mb-2">
                        {item.revenue.toLocaleString("ru-KG")} с.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-axis labels (dates) */}
            <div className="flex justify-between gap-1.5 mt-3">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 text-center text-xs text-zinc-500 dark:text-gray-500"
                >
                  {new Date(item.date).getDate()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-gray-400">
          Ось X: дни месяца | Ось Y: доход (сом)
        </p>
      </div>
    </div>
  );
}
