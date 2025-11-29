/**
 * Constants for Spatial Note app
 * Based on cognitive psychology principles (Baddeley & Hitch, 1974)
 */

// Card dimensions (A7 index cards: 74×105mm ratio = 1:1.42)
export const CARD = {
  WIDTH: 200,
  MIN_HEIGHT: 150,  // Minimum height (landscape A7-inspired)
  MAX_HEIGHT: Infinity,  // Cards with content can grow infinitely
  CORNER_RADIUS: 3,
  PADDING: 12,
};

// Spatial grouping principles (O'Keefe & Nadel, 1978)
export const SPACING = {
  SAME_GROUP: 15,      // 13-20px = same group
  DIFFERENT_GROUP: 250, // 200-300px = different groups
  GRID_HORIZONTAL: 215, // CARD.WIDTH + SAME_GROUP (200 + 15)
  GRID_VERTICAL: 165,   // CARD.MIN_HEIGHT + SAME_GROUP (150 + 15)
};

// Colors
export const COLORS = {
  CARD_BG: '#FFFFFF',
  CARD_BORDER: '#E5E7EB',
  CARD_SELECTED: '#000000',
  CARD_PINNED: '#EAB308',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6B7280',
  CANVAS_BG: '#F9FAFB',
  CARD_COLOR_PALETTE: [
    '#FFFFFF', // Default
    '#FEF3C7', // Light Yellow
    '#DBEAFE', // Light Blue
    '#DCFCE7', // Light Green
    '#FEE2E2', // Light Red
    '#F3E8FF', // Light Purple
  ],
};

// Themes
export const THEMES = {
  LIGHT: {
    name: 'light',
    canvas: '#FFFFFF',
    card: '#FFFFFF',
    border: '#000000',
    text: '#111827',
    textSecondary: '#6B7280',
  },
  DARK: {
    name: 'dark',
    canvas: '#1F2937',
    card: '#374151',
    border: '#4B5563',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
  },
  EINK: {
    name: 'eink',
    canvas: '#FFFFFF',
    card: '#FFFFFF',
    border: '#000000',
    text: '#000000',
    textSecondary: '#4B5563',
  },
  NATURE: {
    name: 'nature',
    canvas: '#8CB369',           // Grön - bakgrund
    card: '#FFFFFF',
    border: '#9CA3AF',           // Grå - vanliga kort-kanter
    borderSelected: '#F4A259',   // Orange - markerade kort-kanter
    borderMenu: '#5B8E7D',       // Teal - meny-kanter
    text: '#2D3748',
    textSecondary: '#6B7280',    // Grå - kommentarer
    heading: '#5B8E7D',          // Teal - markdown rubriker
    emphasis: '#BC4B51',         // Röd - fetmarkerad text
    highlight: '#F4E285',        // Ljusgul - bakgrund/highlight
  },
};

// Zoom limits
export const ZOOM = {
  MIN: 0.1,
  MAX: 3,
  STEP: 0.1,
  DEFAULT: 1,
};

// Image compression settings
export const IMAGE_QUALITY = {
  NORMAL: { maxWidth: 800, quality: 0.8 },
  HIGH: { maxWidth: 1200, quality: 0.9 },
  ORIGINAL: { maxWidth: Infinity, quality: 1 },
};

// Card types
export const CARD_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
};

// Database constants
export const DB_NAME = 'SpatialNoteDB';
export const DB_VERSION = 1;

// Performance
export const PERFORMANCE = {
  MAX_VISIBLE_CARDS: 1000,
  DEBOUNCE_SAVE: 500, // ms
};
