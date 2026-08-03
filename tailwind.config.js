/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2BA8A2',
          light: '#3CC4BD',
          dark: '#1E8C86',
          bg: '#E8F6F5',
        },
        accent: {
          DEFAULT: '#FFD23F',
          light: '#FFE47A',
          dark: '#E6B800',
        },
        coral: {
          DEFAULT: '#EF6C4A',
          light: '#FF8A6A',
          dark: '#D45233',
        },
        cream: '#FFF8E7',
        sky: {
          DEFAULT: '#5DADE2',
        },
        surface: {
          base: '#EFF8F7',
          card: '#FFFFFF',
        },
        success: '#27AE60',
        error: '#E74C3C',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0,0,0,0.08)',
        'md': '0 4px 16px rgba(0,0,0,0.12)',
        'lg': '0 8px 32px rgba(0,0,0,0.16)',
        'card': '0 4px 20px rgba(43,168,162,0.1)',
        'coral-glow': '0 4px 20px rgba(239,108,74,0.35)',
        'teal-glow': '0 4px 20px rgba(43,168,162,0.3)',
        'accent-glow': '0 4px 20px rgba(255,210,63,0.4)',
        'sky-glow': '0 4px 16px rgba(93,173,226,0.3)',
        'focus': '0 0 0 4px rgba(43,168,162,0.15)',
      },
      borderRadius: {
        'round': '9999px',
      }
    },
  },
  plugins: [],
}