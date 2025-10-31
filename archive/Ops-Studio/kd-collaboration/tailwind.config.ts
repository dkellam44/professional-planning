import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx,json}"
  ],
  theme: {
    extend: {
      colors: {
        plum: "#812D6B",
        gold: "#D4B483",
        cream: "#FAF8F3",
        sage: "#9BA88C",
        lavender: "#D8A7C4",
        charcoal: "#2B2B2B"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],  // Default for all text
        display: ["Inter", "system-ui", "sans-serif"],  // Updated to Inter (design-plan-v1.1.md)
        body: ["Inter", "system-ui", "sans-serif"],
        quote: ['"Crimson Text"', "serif"]  // Quotes stay serif for warmth
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
