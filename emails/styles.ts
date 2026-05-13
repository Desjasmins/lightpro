/**
 * Email design tokens — mirrored from the website's design system
 * (app/globals.css). Email clients have limited CSS support, so we inline
 * everything as plain hex/RGB values instead of CSS variables.
 */
export const brand = {
  // Lightbase brand palette
  black: "#000000",
  ink: "#0a0a0a",
  ink2: "#1a1a1a",
  ink3: "#2a2a2a",
  ink4: "#3a3a3a",
  fog: "#9a9a9a",
  mist: "#c8c8c6",
  cloud: "#d4d4d2",
  paper: "#f5f5f4",
  bone: "#fafaf8",
  white: "#ffffff",
  // Warm glow accent (LightPro brand orange)
  glow: "#E8A33D",
  glowSoft: "#F2C476",
  glowDeep: "#B98226",
  // Semantic
  success: "#16a34a",
  destructive: "#dc2626",
  amber: "#d97706",
} as const;

export const fonts = {
  sans:
    '"Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, -apple-system, sans-serif',
  mono:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
} as const;

export const radii = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  full: "999px",
} as const;

export const spacing = {
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
} as const;
