/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        tmobile: {
          DEFAULT: "#E20074",
          dark: "#AD005A",
          light: "#F8B6D9",
        },
      },
    },
  },
  plugins: [],
};
