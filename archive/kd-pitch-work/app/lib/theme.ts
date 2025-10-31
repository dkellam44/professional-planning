/**
 * KD Pitch Deck Theme Utilities
 * Color palette and design tokens
 */

export const colors = {
  plum: '#812D6B',
  gold: '#D4B483',
  cream: '#FAF8F3',
  sage: '#9BA88C',
  lavender: '#D8A7C4',
  charcoal: '#333333',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: '"Playfair Display", serif',
  body: '"Inter", sans-serif',
  quote: '"Crimson Text", serif',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

/**
 * Helper to generate CSS variable references
 */
export const cssVar = (colorName: keyof typeof colors) => `var(--${colorName})`;

/**
 * Convert color palette to CSS variables for Tailwind
 */
export const getCSSVariables = () => {
  return Object.entries(colors).reduce((acc, [key, value]) => {
    acc[`--${key}`] = value;
    return acc;
  }, {} as Record<string, string>);
};
