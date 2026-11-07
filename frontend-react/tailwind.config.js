/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Enforced large scale: no text anywhere below 15-16px equivalent
        '2xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 15.75px
        'xs':  ['0.875rem', { lineHeight: '1.25rem' }],   // 15.75px
        'sm':  ['0.95rem', { lineHeight: '1.4rem' }],     // 17.1px
        'base': ['1rem', { lineHeight: '1.55rem' }],       // 18px standard
        'lg':  ['1.15rem', { lineHeight: '1.65rem' }],    // 20.7px
        'xl':  ['1.3rem', { lineHeight: '1.8rem' }],      // 23.4px
        '2xl': ['1.6rem', { lineHeight: '2.1rem' }],      // 28.8px
        '3xl': ['2rem', { lineHeight: '2.4rem' }],        // 36px
        '4xl': ['2.5rem', { lineHeight: '2.85rem' }],     // 45px
        '5xl': ['3.25rem', { lineHeight: '1' }],          // 58.5px
      },
      colors: {
        black: '#000000',
        bank: {
          canvas: '#000000',
          panel: '#090A0D',
          elevated: '#111217',
          subtle: '#181920',
          border: '#1E2028',
          borderHover: '#2E323D',
          accent: '#006FCF',        // Amex signature royal blue
          accentLight: '#2563EB',
          accentSoft: 'rgba(0, 111, 207, 0.12)',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          neutral: '#9CA3AF'
        }
      }
    },
  },
  plugins: [],
}
