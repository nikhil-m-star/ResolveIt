/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        primary: "#10b981",
        secondary: "#10b981",
        success: "#10b981",
        urgent: "#10b981",
      },
      fontFamily: {
        sans: ['"Nunito Sans"', '"Product Sans"', '"Google Sans"', "sans-serif"],
        heading: ['"Nunito Sans"', '"Product Sans"', '"Google Sans"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      animation: {
        "accent-pulse": "accentPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        accentPulse: {
          "0%, 100%": { opacity: 1, boxShadow: "0 0 14px rgba(16, 185, 129, 0.35)" },
          "50%": { opacity: 0.75, boxShadow: "0 0 28px rgba(16, 185, 129, 0.55)" },
        },
      }
    },
  },
  plugins: [],
}
