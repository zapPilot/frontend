/**
 * UI Dimension Constants
 *
 * Centralized UI dimension values for consistent layout and spacing.
 * Includes modal sizes, container dimensions, and responsive breakpoints.
 */

/**
 * Modal dimension constants
 */
export const MODAL_DIMENSIONS = {
  /** Maximum modal height (80% of viewport height) */
  MAX_HEIGHT: "80vh",

  /** Default modal width for mobile */
  MOBILE_WIDTH: "90vw",

  /** Default modal width for desktop */
  DESKTOP_WIDTH: "600px",

  /** Large modal width for complex forms */
  LARGE_WIDTH: "800px",
} as const;

/**
 * Container dimension constants
 */
export const CONTAINER_DIMENSIONS = {
  /** Main content max width */
  MAX_WIDTH: "1280px",

  /** Sidebar width */
  SIDEBAR_WIDTH: 280,

  /** Collapsed sidebar width */
  SIDEBAR_COLLAPSED_WIDTH: 64,

  /** Header height */
  HEADER_HEIGHT: 64,

  /** Footer height */
  FOOTER_HEIGHT: 48,
} as const;

/**
 * Responsive breakpoints (matches Tailwind CSS defaults)
 */
export const BREAKPOINTS = {
  /** Small devices (640px) */
  SM: 640,

  /** Medium devices (768px) */
  MD: 768,

  /** Large devices (1024px) */
  LG: 1024,

  /** Extra large devices (1280px) */
  XL: 1280,

  /** 2X large devices (1536px) */
  "2XL": 1536,
} as const;

/**
 * Spacing constants (in pixels)
 */
export const SPACING = {
  /** Extra small spacing (4px) */
  XS: 4,

  /** Small spacing (8px) */
  SM: 8,

  /** Medium spacing (16px) */
  MD: 16,

  /** Large spacing (24px) */
  LG: 24,

  /** Extra large spacing (32px) */
  XL: 32,

  /** 2X large spacing (48px) */
  "2XL": 48,
} as const;

/**
 * Z-index layering system
 */
export const Z_INDEX = {
  /** Base content layer */
  CONTENT: 0,

  /** Elevated elements (dropdowns, tooltips) */
  DROPDOWN: 10,

  /** Sticky headers and navigation */
  STICKY: 20,

  /** Fixed elements (banners, notifications) */
  FIXED: 30,

  /** Modal overlays */
  MODAL_OVERLAY: 40,

  /** Modal content */
  MODAL: 50,

  /** Toast notifications */
  TOAST: 60,

  /** Tooltip overlays (highest) */
  TOOLTIP: 70,
} as const;
