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
        green: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        // App surfaces — light theme
        bg:      "#F2F2F7", // iOS/Android page bg
        surface: "#FFFFFF", // card/list surface
        line:    "#E5E5EA", // divider
        // Text hierarchy
        t1: "#0A0A0A", // primary
        t2: "#3C3C43", // secondary (60% opacity equivalent)
        t3: "#8E8E93", // tertiary / placeholder
        // Semantic
        danger:  "#FF3B30",
        warning: "#FF9500",
        amber:   "#FBBF24",
      },
      fontFamily: {
        sans: ["-apple-system", "system-ui", "Roboto", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom, 16px)",
        "nav":    "56px",   // bottom nav height
        "bar":    "52px",   // top app bar height
      },
      borderRadius: {
        "sm":  "6px",
        "md":  "10px",
        "lg":  "14px",
        "xl":  "18px",
      },
      boxShadow: {
        "low":    "0 1px 3px rgba(0,0,0,.08)",
        "mid":    "0 2px 8px rgba(0,0,0,.10)",
        "sheet":  "0 -2px 16px rgba(0,0,0,.12)",
      },
    },
  },
  plugins: [],
};

export default config;
