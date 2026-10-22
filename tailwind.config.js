/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f4',
          100: '#fbe8e8',
          200: '#f7d5d5',
          300: '#f0b4b4',
          400: '#e58585',
          500: '#d75a5a',
          600: '#c23c3c',
          700: '#a32d2d',
          800: '#872828',
          900: '#712525',
        }
      }
    },
  },
  plugins: [],
};
