import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        100: '25rem', // for 100 spacing (example: 25rem or whatever you want)
        104: '26rem',
        108: '27rem',
        120:'51rem',
        // add more values as needed
      },
      height : {
        100: '25rem', // for 100 spacing (example: 25rem or whatever you want)
        104: '26rem',
        108: '27rem',
        120:'51rem',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
