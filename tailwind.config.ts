import type { Config } from "tailwindcss";

// Neo design tokens. Near-black surfaces, warm off-white ink, one ember accent.
// See README → Design for the reasoning.
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page:   "#0a0a0b",
        card:   "#131315",
        raised: "#1c1c1f",
        ink:    "#f4f1ea",
        body:   "#a9a49b",
        muted:  "#7a766e",
        accent: { DEFAULT: "#ff6a2c", soft: "#2a1810" },
        good:   "#4ade80",
        bad:    "#f87171",
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { control: "10px", card: "16px", panel: "20px" },
      boxShadow: {
        soft:  "0 1px 2px rgba(0,0,0,0.4)",
        float: "0 8px 24px rgba(0,0,0,0.45)",
      },
      transitionTimingFunction: { neo: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
export default config;
