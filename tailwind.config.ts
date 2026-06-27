import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 深色背景
        base: {
          950: "#0a0a0f",
          900: "#111118",
          800: "#1a1a24",
          700: "#252532",
        },
        // 强调色 - 几何撞色
        accent: {
          coral: "#FF6B6B",      // 珊瑚红
          amber: "#FBBF24",       // 琥珀黄
          emerald: "#34D399",     // 翡翠绿
          sky: "#38BDF8",         // 天蓝
          violet: "#A78BFA",      // 紫罗兰
          rose: "#FB7185",        // 玫瑰粉
        },
        // 文字色
        text: {
          primary: "#FAFAFA",
          secondary: "#A1A1AA",
          muted: "#52525B",
        },
        // 边框
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Fira Code",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        // 几何渐变背景
        "geo-gradient": "linear-gradient(135deg, #111118 0%, #1a1a24 50%, #111118 100%)",
        // 撞色渐变
        "coral-gradient": "linear-gradient(135deg, #FF6B6B 0%, #FB7185 100%)",
        "amber-gradient": "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
        "emerald-gradient": "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
        "sky-gradient": "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
        "violet-gradient": "linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)",
      },
      boxShadow: {
        "neo-sm": "0 2px 8px rgba(0, 0, 0, 0.3)",
        "neo-md": "0 4px 16px rgba(0, 0, 0, 0.4)",
        "neo-lg": "0 8px 32px rgba(0, 0, 0, 0.5)",
        "glow-coral": "0 0 20px rgba(255, 107, 107, 0.3)",
        "glow-amber": "0 0 20px rgba(251, 191, 36, 0.3)",
        "glow-emerald": "0 0 20px rgba(52, 211, 153, 0.3)",
        "glow-sky": "0 0 20px rgba(56, 189, 248, 0.3)",
        "glow-violet": "0 0 20px rgba(167, 139, 250, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
