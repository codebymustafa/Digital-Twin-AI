/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberBg: '#050308',
        cyberNeon: '#ff5a00',
        cyberBlue: '#00e5ff',
        cyberDark: '#120b18',
        cyberText: '#e5e5e5',
        cyberPink: '#a200ff',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
