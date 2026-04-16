/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1020",
        primary: "#fb923c",
        secondary: "#2dd4bf",
        success: "#34d399",
        urgent: "#f87171",
      },
      fontFamily: {
        sans: ['"Manrope"', "sans-serif"],
        heading: ['"Sora"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      animation: {
        "accent-pulse": "accentPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        accentPulse: {
          "0%, 100%": { opacity: 1, boxShadow: "0 0 14px rgba(251, 146, 60, 0.28)" },
          "50%": { opacity: 0.75, boxShadow: "0 0 28px rgba(45, 212, 191, 0.4)" },
        },
      }
    },
  },
  plugins: [],
}
