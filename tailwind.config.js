/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        accent: "#22C55E",
        dark: "#0F172A"
      }
    }
  },
  plugins: [],
}