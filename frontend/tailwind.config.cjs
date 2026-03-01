/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'AgriNiti-bg': '#F6F3EC',
        'AgriNiti-surface': '#FFFFFF',
        'AgriNiti-primary': '#2F7A3E',
        'AgriNiti-primary-hover': '#3E9150',
        'AgriNiti-accent-blue': '#2D8CFF',
        'AgriNiti-accent-gold': '#F4B942',
        'AgriNiti-neutral': '#A1887F',
        'AgriNiti-border': '#E5E7EB',
        'AgriNiti-text': '#1F2933',
        'AgriNiti-text-muted': '#6B7280',
        'AgriNiti-success': '#4CAF50',
        'AgriNiti-warning': '#F59E0B',
        'AgriNiti-error': '#EF4444'
      },
      boxShadow: {
        'soft-card': '0 18px 45px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        'xl-card': '1.5rem'
      }
    }
  },
  plugins: []
};
