import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#0A0A0F",
          secondary: "#12121A",
          tertiary: "#1E1E2E",
        },
        accent: {
          primary: "#7C3AED",
          secondary: "#A78BFA",
          primaryHover: "#6D28D9",
          primaryGlow: "rgba(124,58,237,0.3)",
        },
        content: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          disabled: "#475569",
        },
        status: {
          success: "#22C55E",
          error: "#EF4444",
          warning: "#F59E0B",
          successBg: "rgba(34,197,94,0.1)",
          errorBg: "rgba(239,68,68,0.1)",
          warningBg: "rgba(245,158,11,0.1)",
        },
        category: {
          doencas: "#7C3AED",
          transtornos: "#3B82F6",
          curiosidades: "#22C55E",
          free: "#64748B",
          novo: "#F97316",
        },
        border: {
          subtle: "rgba(248,250,252,0.08)",
          DEFAULT: "rgba(248,250,252,0.12)",
          active: "#7C3AED",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["48px", { lineHeight: "56px" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      spacing: {
        "spacing-xs": "4px",
        "spacing-sm": "8px",
        "spacing-md": "16px",
        "spacing-lg": "24px",
        "spacing-xl": "32px",
        "spacing-2xl": "48px",
        "spacing-3xl": "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        cardHover: "0 8px 32px rgba(0,0,0,0.6)",
        glow: "0 0 20px rgba(124,58,237,0.3)",
        glowStrong: "0 0 40px rgba(124,58,237,0.5)",
        innerGlow: "inset 0 0 20px rgba(124,58,237,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-purple": "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
        "gradient-story": "linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)",
        "gradient-card": "linear-gradient(180deg, transparent 0%, rgba(10,10,15,0.8) 60%, rgba(10,10,15,0.98) 100%)",
        "noise": "url('/noise.png')",
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        pulse: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        spin: "spin 1s linear infinite",
        "story-ring": "storyRing 2s ease-in-out infinite",
        "count-up": "countUp 0.5s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
        "scale-in": "scaleIn 0.2s ease-out forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "badge-pop": "badgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        storyRing: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        badgePop: {
          "0%": { transform: "scale(0) rotate(-10deg)", opacity: "0" },
          "60%": { transform: "scale(1.1) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        countUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
