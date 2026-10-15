import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  // Touch devices keep :hover after a tap; only apply hover styles where a pointer can hover.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      // Values live as RGB channels in globals.css so dark mode / high contrast
      // can swap them and opacity modifiers (bg-accent/20) still work.
      colors: Object.fromEntries(
        ["paper", "surface", "ink", "inkmuted", "line", "accent", "accentdark", "accentsoft", "danger", "onaccent"].map(
          (c) => [c, `rgb(var(--c-${c}) / <alpha-value>)`]
        )
      ),
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      // Calendar paging: the new period slides in from the side you moved toward.
      keyframes: {
        "slide-from-right": { from: { opacity: "0", transform: "translateX(24px)" } },
        "slide-from-left": { from: { opacity: "0", transform: "translateX(-24px)" } },
        "fade-in": { from: { opacity: "0" } },
      },
      animation: {
        "slide-from-right": "slide-from-right 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-from-left": "slide-from-left 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fade-in 200ms ease-out",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,43,53,0.06), 0 4px 16px rgba(28,43,53,0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
