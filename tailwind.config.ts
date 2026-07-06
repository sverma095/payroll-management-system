import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16181D",
        paper: "#F7F7F5",
        accent: "var(--accent-color, #2F5D50)",
        accentSoft: "#E7EFEC",
        warn: "#B3541E",
        line: "#E3E1DC",
        // Status scale: neutral (draft/archived), positive (active states),
        // caution (in-flight/attention), critical (exited/rejected) — used
        // by statusTone() in lib/status-tone.ts so every badge in the app
        // draws from the same four buckets instead of one flat accent.
        neutral: { soft: "#EEEDE9", text: "#6B6A63" },
        positive: { soft: "#E7EFEC", text: "#2F5D50" },
        caution: { soft: "#FBEEDF", text: "#B3541E" },
        critical: { soft: "#F6E5E1", text: "#9A3B23" }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 24, 29, 0.04), 0 1px 1px rgba(22, 24, 29, 0.03)",
        lifted: "0 4px 16px rgba(22, 24, 29, 0.08)"
      }
    }
  },
  plugins: []
};
export default config;
