/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: "#9CAF88",
        sand: "#E6D5B8",
        forest: "#2D4F1E",
        cream: "#F5F5F0",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
