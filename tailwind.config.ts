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
        agri: {
          orange: {
            50: "#FFF7ED",
            100: "#FFEDD5",
            200: "#FED7AA",
            300: "#FDBA74",
            400: "#FB923C",
            500: "#EA580C", // Brand Primary
            600: "#C2410C", // Hover
            700: "#9A3412",
            800: "#7C2D12",
            900: "#431407",
          },
          black: {
            DEFAULT: "#000000",
            deep: "#0A0A0A",
            surface: "#141414",
            card: "#1C1C1C",
            muted: "#262626",
          },
          white: {
            DEFAULT: "#FFFFFF",
            off: "#FAFAFA",
            subtle: "#F5F5F5",
            border: "#E5E5E5",
          }
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
