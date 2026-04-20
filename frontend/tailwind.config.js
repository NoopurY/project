/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        navy: "#111827",
        panel: "#0f1724",
        panelDeep: "#09111c",
        neon: "#3b82f6",
        violetGlow: "#8b5cf6",
        cyanGlow: "#22d3ee",
        smoke: "#9ca3af",
        text: "#e5e7eb",
        muted: "#9ca3af",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(3, 7, 18, 0.58)",
        glow: "0 0 0 1px rgba(59, 130, 246, 0.12), 0 18px 45px rgba(3, 7, 18, 0.48)",
      },
      keyframes: {
        pulseLine: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.9" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.95" },
        },
      },
      animation: {
        pulseLine: "pulseLine 1.8s ease-in-out infinite",
        drift: "drift 7s ease-in-out infinite",
        glowPulse: "glowPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
