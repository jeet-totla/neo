import type { Config } from "tailwindcss";

// Neo design tokens. Warm paper neutrals, one ember accent.
// See README → Design for the reasoning.
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page:   "#f7f4ee",
        card:   "#fdfbf7",
        raised: "#efe9df",
        ink:    "#1f1b16",
        body:   "#5e554a",
        muted:  "#7b7266",
        accent: { DEFAULT: "#c2410c", soft: "#fbeee6" },
        good:   "#16a34a",
        bad:    "#dc2626",
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { control: "10px", card: "16px", panel: "20px" },
      boxShadow: {
        soft:  "0 1px 2px rgba(31,27,22,0.05)",
        float: "0 8px 24px rgba(31,27,22,0.06)",
      },
      transitionTimingFunction: { neo: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
export default config;
