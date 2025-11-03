/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e40af",
          dark: "#1e3a8a",
        },
        secondary: "#06b6d4",
        accent: "#10b981",
        medical: "#dc2626",
        blockchain: "#8b5cf6",
      },
      animation: {
        shimmer: "shimmer 1.2s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.6s ease-out",
        fadeInLeft: "fadeInLeft 0.6s ease-out",
        fadeInRight: "fadeInRight 0.6s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400% 0" },
          "100%": { backgroundPosition: "400% 0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.6)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
