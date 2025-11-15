/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts}", "./src/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1f7a8c",
          dark: "#0d3b66"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms")],
};
