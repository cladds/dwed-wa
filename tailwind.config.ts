import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#050302",
          card: "#040201",
          hover: "#080602",
        },
        border: {
          DEFAULT: "#1a1408",
          gold: "#c4923a44",
        },
        gold: {
          DEFAULT: "#c4923a",
          glow: "#c4923a33",
        },
        text: {
          primary: "#b08040",
          mid: "#8a6040",
          dim: "#4a3820",
          faint: "#3a2810",
        },
        coord: {
          blue: "#7dd3e8",
        },
        status: {
          success: "#4a9b6a",
          danger: "#9b4a4a",
        },
      },
      fontFamily: {
        heading: ['"Cinzel Decorative"', "serif"],
        system: ['"Courier Prime"', "monospace"],
        body: ['"EB Garamond"', "serif"],
        ui: ['"Cinzel"', "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
