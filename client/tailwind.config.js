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
        primary: "#00eaff",
        secondary: "#00eaff",
        success: "#00eaff",
        urgent: "#00eaff",
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
          "0%, 100%": { opacity: 1, boxShadow: "0 0 14px rgba(0, 234, 255, 0.35)" },
          "50%": { opacity: 0.75, boxShadow: "0 0 28px rgba(0, 234, 255, 0.55)" },
        },
      }
    },
  },
  plugins: [],
}
