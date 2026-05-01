import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
          soft: "#EDE9FE",
          softer: "#F5F3FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-kr)", "Noto Sans KR", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
