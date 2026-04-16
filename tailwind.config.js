/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark theme base colors (from OTP design)
        dark: {
          bg: "#0A0E17",
          card: "#111621",
          border: "#1C1C1F",
        },
        // EVPower Brand Colors
        ev: {
          green: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#10B981",
            600: "#059669",
            700: "#047857",
          },
          cyan: {
            50: "#ECFEFF",
            100: "#CFFAFE",
            400: "#22D3EE",
            500: "#06B6D4",
            600: "#0891B2",
          },
          // Status colors
          status: {
            available: "#10B981",
            charging: "#3B82F6",
            occupied: "#F59E0B",
            offline: "#9CA3AF",
            faulted: "#EF4444",
            maintenance: "#8B5CF6",
          },
        },
        // Legacy aliases
        primary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        cyan: {
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        4.5: "18px",
        13: "52px",
        15: "60px",
        18: "72px",
      },
      borderRadius: {
        "ev-sm": "6px",
        "ev-md": "8px",
        "ev-lg": "12px",
        "ev-xl": "16px",
        "ev-2xl": "20px",
      },
      boxShadow: {
        "ev-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "ev-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "rise-up-long": {
          "0%": { transform: "translateY(110vh)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "0.8" },
          "100%": { transform: "translateY(-20vh)", opacity: "0" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.5" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        shine: {
          from: { backgroundPosition: "200% center" },
          to: { backgroundPosition: "-200% center" },
        },
        "charge-glow": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))",
          },
          "50%": {
            filter: "drop-shadow(0 0 25px rgba(220, 38, 38, 0.7))",
          },
        },
        "breathing-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        stroke: {
          "100%": { strokeDashoffset: "0" },
        },
        "success-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.4)" },
          "70%": { boxShadow: "0 0 0 20px rgba(16, 185, 129, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0px)", opacity: "0" },
          "20%": { opacity: "0.8" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
        "help-pulse": {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
          "50%": { opacity: "0.9", boxShadow: "0 0 0 4px rgba(59,130,246,0.15)" },
        },
        "toast-in": {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "toast-out": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-12px)", opacity: "0" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "rise-up-long": "rise-up-long 4s infinite linear",
        ripple: "ripple 3s infinite cubic-bezier(0, 0.2, 0.8, 1)",
        shine: "shine 8s linear infinite",
        "charge-glow": "charge-glow 3s infinite ease-in-out",
        "breathing-glow": "breathing-glow 3s ease-in-out infinite",
        stroke: "stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards",
        "success-pulse": "success-pulse 2s infinite",
        "float-up": "float-up 3s ease-out infinite",
        "help-pulse": "help-pulse 2.5s ease-in-out infinite",
        "toast-in": "toast-in 0.3s ease-out forwards",
        "toast-out": "toast-out 0.3s ease-in forwards",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
