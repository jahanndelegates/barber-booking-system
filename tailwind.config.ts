import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f5",
          100: "#ffd6e7",
          200: "#ffadd0",
          300: "#ff80b5",
          400: "#f95d9b",
          500: "#ee3d82",
          600: "#d4246a",
          700: "#b01857",
          800: "#8c1244",
          900: "#680d33",
          950: "#3d0620",
        },
        jolly: {
          pink:   "#f5a7c0",  // logo background pink
          dark:   "#1a1a1a",  // near-black for headers
          cream:  "#fff8f5",  // warm off-white background
          accent: "#e84d82",  // hot pink CTA
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
