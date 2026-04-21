/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Cabinet Grotesk'", "'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        night: {
          50:  "#f0f4ff",
          900: "#080d1a",
          800: "#0d1525",
          700: "#121d33",
          600: "#1a2644",
        },
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      keyframes: {
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.95)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "dot-bounce": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
      },
      animation: {
        "status-pulse": "status-pulse 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "dot-bounce": "dot-bounce 1.4s infinite ease-in-out both",
      },
    },
  },
  plugins: [],
};
