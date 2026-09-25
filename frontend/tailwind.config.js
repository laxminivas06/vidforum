/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        sidebar: '#F7F7F8',
        subtle: '#F9FAFB',
        'badge-neutral': '#F3F4F6',
        'border-default': '#E5E7EB',
        'border-subtle': '#F3F4F6',
        'border-strong': '#D1D5DB',
        'text-primary': '#111111',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        'brand-green': '#3FA34D',
        'brand-primary': '#3FA34D',
        'action-black': '#0A0A0A',
        'action-primary': '#0A0A0A',
        'status-success': '#16A34A',
        'status-warning': '#D97706',
        'status-error': '#DC2626',
        'status-info': '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '10px',
        'xl': '14px',
        '2xl': '16px',
      },
      maxWidth: {
        'content': '1280px',
      },
      width: {
        'sidebar': '230px',
        'sidebar-collapsed': '64px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
