/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000', // pure black
        primary: '#00FFFF',    // primary cyan
        secondary: '#00B4CC',  // deep teal
        success: '#00E5FF',    
        urgent: '#00FFFF',     
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'monospace'],
      },
      animation: {
        'cyan-pulse': 'cyanPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        cyanPulse: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)' },
          '50%': { opacity: .7, boxShadow: '0 0 35px rgba(0, 255, 255, 0.6)' },
        },
      }
    },
  },
  plugins: [],
}

