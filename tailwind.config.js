/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar:     "#0D1B2A",
        accent:      "#F97316",
        accentDark:  "#EA6B0E",
        accentLight: "#FFF7ED",
        navy:        "#1E3A5F",
        charcoal:    "#334155",
        success:     "#10B981",
        warning:     "#F59E0B",
        danger:      "#EF4444",
        info:        "#3B82F6",
      },
      fontFamily: {
        barlow:    ["'Barlow'", "sans-serif"],
        condensed: ["'Barlow Condensed'", "sans-serif"],
      },
      animation: {
        "orb-drift":    "orbDrift 18s ease-in-out infinite",
        "word-reveal":  "wordReveal 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-up":      "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "float":        "float 6s ease-in-out infinite",
        "count-line":   "countLine 1.4s ease-in-out infinite",
        "shimmer":      "shimmer 1.4s ease-in-out infinite",
        "pulse-glow":   "pulseGlow 2s ease-in-out infinite",
        "spin-slow":    "spin 8s linear infinite",
        "bounce-slow":  "bounce 2s ease-in-out infinite",
        "typing-blink": "typingBlink 1s step-end infinite",
      },
      keyframes: {
        orbDrift: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%":     { transform: "translate(40px,-30px) scale(1.05)" },
          "66%":     { transform: "translate(-20px,20px) scale(0.97)" },
        },
        wordReveal: {
          from: { transform: "translateY(110%)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        fadeUp: {
          from: { transform: "translateY(24px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition:  "400px 0" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(249,115,22,0.3)" },
          "50%":     { boxShadow: "0 0 0 12px rgba(249,115,22,0)" },
        },
        typingBlink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
      },
      backgroundImage: {
        "hero-grid": "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        "grid-60": "60px 60px",
      },
    },
  },
  plugins: [],
}
