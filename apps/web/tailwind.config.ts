import type { Config } from "tailwindcss";

const config: Config = {
  // Assuming you want this config to apply within the web app
  // If using the new v4 @import 'tailwindcss', content might not be needed here
  // but including for clarity or if using older setup aspects.
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Include components from the UI package
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enable dark mode if needed (usually 'class' for Next.js)
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7c3aed",
          foreground: "#e0e7ff",
        },
        // Ensure primary aligns if using shadcn conventions
        primary: {
          DEFAULT: "#7c3aed", // Using brand color as primary
          foreground: "#e0e7ff", // Text on primary
        },
        // Add secondary if needed (Solana green)
        secondary: {
          DEFAULT: "#14f195", // Solana Green
          foreground: "#000000", // Text on secondary (adjust if needed)
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
      },
      animation: {
        orb: "orb 12s ease-in-out infinite",
      },
      keyframes: {
        orb: {
          "0%,100%": { transform: "translate(-50%, -50%) scale(1)" },
          "50%": { transform: "translate(-45%, -48%) scale(1.15)" },
        },
      },
      boxShadow: {
        // Custom shadow based on design spec (shadow-violet-500/10)
        "soft-violet":
          "0 10px 15px -3px rgba(124, 58, 237, 0.08), 0 4px 6px -4px rgba(124, 58, 237, 0.08)",
      },
      borderRadius: {
        // Add rounded-2xl if not default
        "2xl": "1rem",
      },
    },
  },
  plugins: [
    // Add plugins if needed, e.g., require('@tailwindcss/typography')
    require("tailwindcss-animate"), // Common for shadcn
  ],
};
export default config;
