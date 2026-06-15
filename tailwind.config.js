/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        council: {
          bg: "#0f1117",
          surface: "#1a1d27",
          border: "#2a2f3d",
          accent: "#6366f1",
          accentHover: "#818cf8",
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
