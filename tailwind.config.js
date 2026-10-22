/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '.app-dark'],
  theme: {
    extend: {
      colors: {
        // AgriSense brand: teal/cyan primary, amber accent, deep slate surfaces.
        brand: {
          50: '#effefb', 100: '#c8fff4', 200: '#91feea', 300: '#53f5dc', 400: '#1fe0c8',
          500: '#06c4b0', 600: '#029e91', 700: '#077e75', 800: '#0b645e', 900: '#0e524d', 950: '#003331',
        },
        ink: {
          50: '#f6f8fa', 100: '#eceff3', 200: '#d6dce4', 300: '#b2bdcb', 400: '#8797ac', 500: '#687a92',
          600: '#536379', 700: '#445063', 800: '#2b3442', 900: '#1a212c', 950: '#0d1219',
        },
        amber: {
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['"Mona Sans"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      maxWidth: { content: '1440px' },
    },
  },
  plugins: [require('tailwindcss-primeui')],
};
