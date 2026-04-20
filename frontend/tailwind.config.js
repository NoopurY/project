/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06111c",
        steel: "#132537",
        neon: "#37d0d9",
        ember: "#f97316",
        smoke: "#8ea7bb",
      },
      boxShadow: {
        panel: "0 20px 45px rgba(4, 10, 18, 0.45)",
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        pulseLine: "pulseLine 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
