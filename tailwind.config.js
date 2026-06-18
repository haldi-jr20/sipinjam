/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-tint": "#4d44e3",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#0f0069",
        "tertiary-fixed": "#eaddff",
        "on-primary-fixed-variant": "#3323cc",
        "surface": "#f8f9ff",
        "outline-variant": "#c7c4d8",
        "surface-container-highest": "#d3e4fe",
        "secondary-fixed-dim": "#68dba9",
        "on-secondary-container": "#00714e",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#e4d4ff",
        "secondary-fixed": "#85f8c4",
        "primary-container": "#4f46e5",
        "primary-fixed-dim": "#c3c0ff",
        "on-surface": "#0b1c30",
        "error": "#ba1a1a",
        "surface-container": "#e5eeff",
        "on-primary-container": "#dad7ff",
        "background": "#f8f9ff",
        "tertiary": "#5c00ca",
        "primary": "#3525cd",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",
        "on-secondary-fixed-variant": "#005137",
        "on-surface-variant": "#464555",
        "primary-fixed": "#e2dfff",
        "outline": "#777587",
        "on-tertiary-fixed-variant": "#5a00c6",
        "inverse-on-surface": "#eaf1ff",
        "tertiary-container": "#7531e6",
        "on-primary": "#ffffff",
        "surface-bright": "#f8f9ff",
        "secondary": "#006c4a",
        "error-container": "#ffdad6",
        "surface-dim": "#cbdbf5",
        "on-secondary-fixed": "#002114",
        "secondary-container": "#82f5c1",
        "on-error": "#ffffff",
        "tertiary-fixed-dim": "#d2bbff",
        "inverse-surface": "#213145",
        "on-background": "#0b1c30",
        "surface-variant": "#d3e4fe",
        "on-tertiary-fixed": "#25005a",
        "on-error-container": "#93000a",
        "on-tertiary": "#ffffff",
        "inverse-primary": "#c3c0ff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "stack-xs": "4px",
        "stack-sm": "8px",
        "stack-lg": "24px",
        "margin-desktop": "40px",
        "container-max": "1440px",
        "margin-mobile": "16px",
        "stack-md": "16px",
        "gutter": "24px"
      },
      fontFamily: {
        "display-lg": ["var(--font-plus-jakarta)", "sans-serif"],
        "code-hud": ["var(--font-inter)", "monospace"],
        "label-md": ["var(--font-inter)", "sans-serif"],
        "headline-lg": ["var(--font-plus-jakarta)", "sans-serif"],
        "body-md": ["var(--font-inter)", "sans-serif"],
        "body-lg": ["var(--font-inter)", "sans-serif"],
        "headline-md": ["var(--font-plus-jakarta)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-plus-jakarta)", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "code-hud": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "700" }],
        "label-md": ["14px", { lineHeight: "1", letterSpacing: "0.01em", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "1.2", fontWeight: "700" }]
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
}
