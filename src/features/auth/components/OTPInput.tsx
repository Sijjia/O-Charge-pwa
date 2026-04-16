/**
 * OTPInput - Компонент для ввода 6-значного OTP кода
 * Автофокус, автопереход между полями, валидация
 */
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  KeyboardEvent,
  ClipboardEvent,
} from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  variant?: "light" | "dark";
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true,
  variant = "light",
}: OTPInputProps) {
  const isDark = variant === "dark";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Разбиваем value на отдельные символы
  // Используем Array.from вместо padEnd(""), т.к. padEnd с пустой строкой не работает
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Callback при изменении
  const handleChange = useCallback(
    (index: number, digit: string) => {
      // Только цифры
      if (digit && !/^\d$/.test(digit)) return;

      const newDigits = [...digits];
      newDigits[index] = digit;
      const newValue = newDigits.join("");

      onChange(newValue);

      // Переход к следующему полю
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }

      // Вызов onComplete при заполнении всех полей
      if (newValue.length === length && !newValue.includes("")) {
        onComplete?.(newValue);
      }
    },
    [digits, length, onChange, onComplete],
  );

  // Обработка клавиш
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[index]) {
          // Удаляем текущую цифру
          handleChange(index, "");
        } else if (index > 0) {
          // Переход к предыдущему полю
          inputRefs.current[index - 1]?.focus();
          setActiveIndex(index - 1);
          handleChange(index - 1, "");
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        setActiveIndex(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        setActiveIndex(index + 1);
      }
    },
    [digits, handleChange, length],
  );

  // Обработка вставки
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);

      if (pastedData) {
        onChange(pastedData);
        const nextIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
        setActiveIndex(nextIndex);

        if (pastedData.length === length) {
          onComplete?.(pastedData);
        }
      }
    },
    [length, onChange, onComplete],
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className={isDark ? "grid grid-cols-6 gap-2 sm:gap-3 w-full" : "flex justify-center gap-2 sm:gap-3 w-full"}>
        {digits.map((digit, index) => (
          <input
            // eslint-disable-next-line react/no-array-index-key -- fixed-length OTP input
            key={`otp-${index}`}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            placeholder="·"
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveIndex(index)}
            className={
              isDark
                ? `
              w-full aspect-square
              text-center text-xl font-mono text-white
              border rounded-lg
              transition-all
              focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50
              caret-red-500 shadow-none placeholder-white/10
              ${disabled ? "bg-zinc-800 cursor-not-allowed" : "bg-dark-card border-dark-border"}
              ${error ? "border-red-500 ring-1 ring-red-500/30" : ""}
            `
                : `
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-2xl sm:text-3xl font-bold
              text-zinc-900 dark:text-white
              border-2 rounded-xl
              shadow-sm shadow-black/20
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
              placeholder:text-zinc-400 dark:placeholder:text-gray-300
              ${disabled ? "bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed" : "bg-white dark:bg-zinc-900"}
              ${error ? "border-red-500 ring-1 ring-red-200" : activeIndex === index ? "border-green-500 shadow-md" : "border-zinc-300 dark:border-zinc-700"}
            `
            }
            aria-label={`Цифра ${index + 1} из ${length}`}
          />
        ))}
      </div>

      {error && (
        <p className={`mt-3 text-sm font-medium ${isDark ? "text-red-500" : "text-red-600"}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default OTPInput;
