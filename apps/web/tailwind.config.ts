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
        // Deep Tech Obsidian / Midnight Space Navy (Opposite 1)
        obsidian: {
          950: "#040711",
          900: "#070B16",
          850: "#0B1222",
          800: "#0F1A30",
          700: "#1A2B4C",
          600: "#283E6B",
        },
        // Crisp Titanium Frost / High-Contrast Light Slate (Opposite 2)
        frost: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          900: "#0F172A",
        },
        // 1 Off-Match Color of Different Line: Electric Sunburst Tangerine / Amber Ember
        ember: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
          neon: "#FF5500",
        },
        // Supporting status accents
        teal: {
          950: "#02201D",
          900: "#042F2E",
          800: "#0A4643",
          700: "#0F766E",
          600: "#0D9488",
          500: "#14B8A6",
          400: "#2DD4BF",
          300: "#5EEAD4",
        },
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(249, 115, 22, 0.3)",
        "glow-teal": "0 0 25px -5px rgba(20, 184, 166, 0.3)",
        "glow-obsidian": "0 0 35px -5px rgba(11, 18, 34, 0.7)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
