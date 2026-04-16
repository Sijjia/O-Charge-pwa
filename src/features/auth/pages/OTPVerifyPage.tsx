import { useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { OTPInput } from "../components/OTPInput";
import { usePhoneAuth } from "../hooks/usePhoneAuth";
import { formatPhoneDisplay } from "../services/otpService";

type OTPChannel = "sms" | "whatsapp";

export function OTPVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as { phone?: string })?.phone;
  const [channel, setChannel] = useState<OTPChannel>("sms");

  const {
    otpCode,
    isLoading,
    error,
    countdown,
    setOtpCode,
    handleVerifyOTP,
    handleResendOTP,
    checkStatus,
    setPhone,
  } = usePhoneAuth();

  // Redirect if no phone in state
  useEffect(() => {
    if (!phone) {
      navigate("/auth/phone", { replace: true });
    } else {
      setPhone(phone);
      checkStatus();
    }
  }, [phone, navigate, setPhone, checkStatus]);

  const handleComplete = useCallback(
    (code: string) => {
      handleVerifyOTP(code);
    },
    [handleVerifyOTP],
  );

  const handleSubmit = () => {
    if (otpCode.length === 6 && !isLoading) {
      handleVerifyOTP(otpCode);
    }
  };

  if (!phone) return null;

  return (
    <div className="bg-zinc-50 dark:bg-[#0A0E17] text-zinc-900 dark:text-white h-screen flex flex-col relative overflow-hidden selection:bg-red-500/30">
      {/* Nav */}
      <nav className="p-6 w-full z-10 flex justify-between items-center">
        <button
          onClick={() => navigate("/auth/phone")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white"
          aria-label="Назад"
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </button>
      </nav>

      <main className="flex-1 flex flex-col px-6 pb-8 max-w-md mx-auto w-full z-10">
        {/* Header */}
        <div className="mt-8 mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
            Введите код
          </h1>
          <p className="text-sm text-zinc-500 dark:text-white/40 font-light">
            Отправлено на{" "}
            <span className="text-zinc-900 dark:text-white/80 font-normal">
              {formatPhoneDisplay(phone)}
            </span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-8">
          <OTPInput
            value={otpCode}
            onChange={setOtpCode}
            onComplete={handleComplete}
            disabled={isLoading}
            error={error || undefined}
            variant="dark"
            autoFocus
          />
        </div>

        {/* SMS/WhatsApp Toggle */}
        <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg flex mb-8 border border-zinc-200 dark:border-zinc-800 w-full">
          <button
            type="button"
            onClick={() => setChannel("sms")}
            className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${
              channel === "sms"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700 ring-1 ring-black/5 dark:ring-black/50"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            SMS
          </button>
          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            className={`flex-1 py-2.5 rounded-md text-xs font-medium transition-all ${
              channel === "whatsapp"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700 ring-1 ring-black/5 dark:ring-black/50"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            WhatsApp
          </button>
        </div>

        {/* Timer */}
        <div className="text-center mb-auto">
          <button
            onClick={handleResendOTP}
            disabled={countdown > 0 || isLoading}
            className={`text-xs font-medium transition-colors select-none ${
              countdown > 0 || isLoading
                ? "text-cyan-600/60 dark:text-cyan-400/60 cursor-default"
                : "text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 cursor-pointer"
            }`}
          >
            {countdown > 0
              ? `Отправить повторно через ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`
              : "Отправить код повторно"}
          </button>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={otpCode.length !== 6 || isLoading}
            className={`group w-full py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-medium ${
              otpCode.length !== 6 || isLoading
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)] dark:shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] dark:hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Проверка...
              </span>
            ) : (
              <>
                <span>Подтвердить</span>
                <Icon
                  icon="solar:arrow-right-linear"
                  className="group-hover:translate-x-0.5 transition-transform"
                  width={20}
                />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 dark:bg-red-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-normal" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-normal" />
    </div>
  );
}

export default OTPVerifyPage;
