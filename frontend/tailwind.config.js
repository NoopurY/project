/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050509",
        steel: "#161126",
        neon: "#a855f7",
        ember: "#6d28d9",
        smoke: "#b6a8cf",
      },
      boxShadow: {
        panel: "0 20px 45px rgba(10, 6, 20, 0.5)",
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
