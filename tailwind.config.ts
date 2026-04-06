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
          deep: "var(--bg-deep)",
          card: "var(--bg-card)",
          hover: "var(--bg-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
          gold: "var(--border-gold)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          glow: "var(--gold-glow)",
        },
        text: {
          primary: "var(--text-primary)",
          mid: "var(--text-mid)",
          dim: "var(--text-dim)",
          faint: "var(--text-faint)",
        },
        coord: {
          blue: "var(--coord-blue)",
        },
        status: {
          success: "var(--success)",
          danger: "var(--danger)",
          warning: "var(--warning)",
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
