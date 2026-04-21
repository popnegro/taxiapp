/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#f5c518",
          dark: "#d4a600",
          light: "#fef3c7",
        },
      },
    },
  },
  plugins: [],
};
