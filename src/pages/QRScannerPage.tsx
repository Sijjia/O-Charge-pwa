import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/shared/utils/logger";

/**
 * Parse QR code text to extract station ID.
 * Supported formats:
 *  1. ocharge://station/{id}/connector/{n}
 *  2. https://o.asystem.kg/charging/{id}?connector={n}
 *  3. Plain station ID like "SIM-TEST" or "RP-BK-001"
 */
function parseQRCode(text: string): { stationId: string; connectorId: string } | null {
  // Deep link format
  const deepLink = text.match(/(?:redpetroleum|ocharge):\/\/station\/([^/]+)(?:\/connector\/(\d+))?/);
  if (deepLink) {
    return { stationId: deepLink[1]!, connectorId: deepLink[2] ?? "1" };
  }

  // URL format
  const urlMatch = text.match(/\/charging\/([^?&#]+)/);
  if (urlMatch) {
    const connMatch = text.match(/connector=(\d+)/);
    return { stationId: urlMatch[1]!, connectorId: connMatch?.[1] ?? "1" };
  }

  // Plain station ID (alphanumeric, hyphens, underscores)
  if (/^[A-Za-z0-9_-]{2,50}$/.test(text.trim())) {
    return { stationId: text.trim(), connectorId: "1" };
  }

  return null;
}

export const QRScannerPage = () => {
  const navigate = useNavigate();
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        // Html5QrcodeState: 1=NOT_STARTED, 2=SCANNING, 3=PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      logger.debug("[QRScanner] stop error (safe to ignore)", err);
    }
  }, []);

  const handleScanResult = useCallback(
    (stationId: string) => {
      if (scanSuccess) return;
      setScanSuccess(true);
      if (navigator.vibrate) navigator.vibrate([50]);
      stopScanner();
      setTimeout(() => {
        navigate(`/charging/${stationId}`);
      }, 1200);
    },
    [scanSuccess, navigate, stopScanner],
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled || !mountedRef.current) return;

        const container = document.getElementById("qr-reader");
        if (!container) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (cancelled) return;
            logger.info("[QRScanner] decoded:", decodedText);
            const parsed = parseQRCode(decodedText);
            if (parsed) {
              handleScanResult(parsed.stationId);
            } else {
              setScanError("QR-код не распознан. Используйте код со станции O!Charge.");
            }
          },
          () => {
            // silence NotFoundException spam
          },
        );

        if (!cancelled && mountedRef.current) {
          setCameraReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        logger.error("[QRScanner] start failed", err);
        const msg =
          err instanceof Error && err.message.includes("Permission")
            ? "Доступ к камере запрещён. Разрешите камеру в настройках браузера."
            : "Не удалось запустить камеру";
        setScanError(msg);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      stopScanner();
    };
  }, [handleScanResult, stopScanner]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    const parsed = parseQRCode(code);
    if (parsed) {
      navigate(`/charging/${parsed.stationId}`);
    } else {
      navigate(`/charging/${code}`);
    }
  };

  return (
    <div className="bg-neutral-900 text-white h-screen w-screen overflow-hidden flex flex-col antialiased">
      {/* Header */}
      <header className="bg-neutral-900 px-4 pt-4 pb-4 z-30 flex items-center justify-between shadow-lg shadow-black/20">
        <button
          onClick={() => {
            stopScanner();
            navigate(-1);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-95"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>

        <h1 className="text-base font-semibold tracking-tight">
          Сканирование QR
        </h1>

        <div className="w-10" />
      </header>

      {/* Camera Viewport */}
      <main className="flex-1 relative overflow-hidden bg-black w-full">
        {/* Real camera feed via html5-qrcode */}
        <div
          id="qr-reader"
          className="absolute inset-0 [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full [&_img]:!hidden [&>div]:!border-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Scanner overlay on top of camera */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 pointer-events-none">
          {/* Loading state */}
          {!cameraReady && !scanError && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-red-500" />
              <p className="text-neutral-400 text-sm">Запуск камеры...</p>
            </div>
          )}

          {/* Error state */}
          {scanError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl px-6 py-4 max-w-xs text-center">
              <Icon
                icon="solar:danger-triangle-linear"
                width={32}
                className="text-red-400 mx-auto mb-2"
              />
              <p className="text-sm text-red-300">{scanError}</p>
            </div>
          )}

          {/* Scanner box overlay (when camera is live) */}
          {cameraReady && !scanSuccess && (
            <>
              {/* Scanner frame */}
              <div className="relative w-64 h-64 rounded-2xl">
                {/* Corner markers */}
                <div className="absolute w-8 h-8 top-0 left-0 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
                <div className="absolute w-8 h-8 top-0 right-0 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
                <div className="absolute w-8 h-8 bottom-0 left-0 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
                <div className="absolute w-8 h-8 bottom-0 right-0 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />

                {/* Scanning laser animation */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  style={{
                    animation:
                      "qr-scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                  }}
                />
              </div>

              {/* Instruction */}
              <div className="mt-6 text-center">
                <p className="text-white font-medium text-base">
                  Наведите на QR-код
                </p>
                <p className="text-neutral-400 text-sm mt-1">
                  Код находится на корпусе зарядной станции
                </p>
              </div>
            </>
          )}

          {/* Success state */}
          {scanSuccess && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-green-500/20 rounded-full p-5 animate-qr-success-pulse">
                <Icon
                  icon="solar:check-circle-bold"
                  width={56}
                  className="text-green-500"
                />
              </div>
              <p className="text-white font-medium text-lg">
                Станция найдена!
              </p>
              <p className="text-neutral-400 text-sm">
                Переход на страницу зарядки...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 px-6 py-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {showManualInput ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Введите код станции"
                className="flex-1 h-14 bg-neutral-800 border border-white/5 rounded-xl px-4 text-white placeholder-neutral-500 text-sm focus:ring-1 focus:ring-red-600/50 focus:border-red-600/50 outline-none"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="h-14 px-5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl text-white font-medium transition-all active:scale-[0.98]"
              >
                <Icon icon="solar:arrow-right-linear" width={20} />
              </button>
            </div>
            <button
              onClick={() => setShowManualInput(false)}
              className="w-full text-center text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowManualInput(true)}
            className="w-full h-14 bg-neutral-800 hover:bg-neutral-700 rounded-xl flex items-center justify-center gap-2.5 text-white font-medium transition-all active:scale-[0.98] group border border-white/5"
          >
            <span>Ввести код вручную</span>
            <Icon
              icon="solar:keyboard-linear"
              width={20}
              className="text-neutral-400 group-hover:text-white transition-colors"
            />
          </button>
        )}
      </footer>

      {/* CSS for scanning animation */}
      <style>{`
        @keyframes qr-scan {
          0%, 100% { top: 8px; }
          50% { top: calc(100% - 10px); }
        }
        /* Hide html5-qrcode internal UI elements */
        #qr-reader__scan_region > img,
        #qr-reader__dashboard,
        #qr-reader__dashboard_section,
        #qr-reader__dashboard_section_csr,
        #qr-reader__dashboard_section_swaplink,
        #qr-reader__header_message,
        #qr-reader__status_span {
          display: none !important;
        }
        #qr-reader > div:first-child {
          border: none !important;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
        }
        /* Hide the built-in qr scanning region overlay */
        #qr-shaded-region {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
