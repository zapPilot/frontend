/** Shared terminal-aesthetic constants for the backtesting CLI display. */

export const PHOSPHOR_GLOW = "0 0 8px rgba(52,211,153,0.6)";
export const PHOSPHOR_GLOW_DIM = "0 0 8px rgba(52,211,153,0.4)";
export const phosphorGlowStyle = { textShadow: PHOSPHOR_GLOW } as const;
export const phosphorGlowDimStyle = { textShadow: PHOSPHOR_GLOW_DIM } as const;

export const COLLAPSE_ANIMATION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto" as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
};
