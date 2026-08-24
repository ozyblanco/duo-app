/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F8FAFC',
          dark: '#0B0F17',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#161B22',
          elevated: {
            light: '#F1F5F9',
            dark: '#1C212A',
          },
        },
        border: {
          subtle: {
            light: 'rgba(226, 232, 240, 0.85)',
            dark: 'rgba(255, 255, 255, 0.07)',
          },
        },
        duo: {
          blue: '#3B82F6',
          pink: '#FF6B9D',
          purple: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'subtle-md': '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'premium-glow': '0 0 20px -5px rgba(59, 130, 246, 0.15)',
      },
    },
  },
  plugins: [],
};