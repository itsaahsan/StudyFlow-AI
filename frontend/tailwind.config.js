/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 50: '#f6f7f9', 100: '#eceef2', 900: '#0b0d12' },
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#5457e5', 700: '#4649c8' }
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.05), 0 8px 24px -12px rgba(16,24,40,.18)',
        pop: '0 12px 40px -12px rgba(16,24,40,.25)'
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' }
    }
  },
  plugins: []
}
