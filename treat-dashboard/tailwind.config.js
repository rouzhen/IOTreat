/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF4E6",
        latte: "#F3E8D2",
        pawpink: "#F5C0C8",
        choco: "#C49A6C",
        slate: {
          100: "#F1F5F9",
          200: "#E2E8F0",
          500: "#64748B",
          700: "#334155",
        }
      },
      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl: "1rem",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],

      },
    },
  },
  plugins: [],
};
