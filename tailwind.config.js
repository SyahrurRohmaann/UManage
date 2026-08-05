/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Keep established token names while using Uwangg's finance palette.
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
          bg: 'var(--color-primary-bg)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          dark: 'var(--color-accent-dark)',
        },
        coral: {
          DEFAULT: 'var(--color-coral)',
          light: 'var(--color-coral-light)',
          dark: 'var(--color-coral-dark)',
        },
        cream: 'var(--color-cream)',
        sky: {
          DEFAULT: 'var(--color-sky)',
        },
        surface: {
          base: 'var(--color-surface-base)',
          card: 'var(--color-surface-card)',
        },
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        'success-light': '#86EFAC',
        'danger-light': '#FCA5A5',
        warning: '#EA580C',
        'warning-light': '#FDBA74',
        info: '#2563EB',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          200: 'var(--color-gray-200)',
        },
        status: {
          active: { bg: '#DBEAFE', text: '#1D4ED8' },
          paid: { bg: '#DCFCE7', text: '#16A34A' },
          overdue: { bg: '#FEF3C7', text: '#D97706' },
        },
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.10)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'coral-glow': 'none',
        'teal-glow': 'none',
        'accent-glow': 'none',
        'sky-glow': 'none',
        'green-glow': 'none',
        'red-glow': 'none',
        focus: '0 0 0 3px rgb(226 232 240 / 0.8)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        round: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
}
