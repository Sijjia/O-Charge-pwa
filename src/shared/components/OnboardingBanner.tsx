import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const STORAGE_KEY = "onboarding_map_seen";

export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // ignore
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
      <div className="max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg shadow-black/40 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon icon="solar:lightbulb-linear" width={20} className="text-yellow-500" />
          </div>
          <div className="text-sm text-gray-100">
            <p className="font-semibold mb-1">Подсказки по карте</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Нажмите на станцию, чтобы открыть детали и начать зарядку</li>
              <li>
                Используйте кнопку “Открыть в карте”, чтобы проложить маршрут
              </li>
              <li>В оффлайне отображаются кэшированные локации</li>
            </ul>
            <div className="mt-2 text-right">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(STORAGE_KEY, "1");
                  } catch {
                    // noop
                  }
                  setVisible(false);
                }}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900/50"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
