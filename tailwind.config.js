/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        metro: {
          bgDay: '#F5F2EB',
          bgNight: '#151922',
          waterDay: '#BCD4E6',
          waterNight: '#1E2D3D',
          landDay: '#EBE7DD',
          landNight: '#1A212D',
          pyreneesDay: '#DDD7CA',
          pyreneesNight: '#252F40',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
