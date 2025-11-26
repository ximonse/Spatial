/**
 * Constants for Spatial Note app
 * Based on cognitive psychology principles (Baddeley & Hitch, 1974)
 */

// Card dimensions (inspired by A7 index cards: 74×105mm)
export const CARD = {
  WIDTH: 200,
  MIN_HEIGHT: 150,  // Minimum height
  MAX_HEIGHT: 800,  // Maximum height before scrolling
  CORNER_RADIUS: 8,
  PADDING: 12,
};

// Spatial grouping principles (O'Keefe & Nadel, 1978)
export const SPACING = {
  SAME_GROUP: 15,      // 13-20px = same group
  DIFFERENT_GROUP: 250, // 200-300px = different groups
  GRID_HORIZONTAL: 215, // CARD.WIDTH + SAME_GROUP
  GRID_VERTICAL: 165,   // CARD.HEIGHT + SAME_GROUP
};

// Colors
export const COLORS = {
  CARD_BG: '#FFFFFF',
  CARD_BORDER: '#E5E7EB',
  CARD_SELECTED: '#3B82F6',
  CARD_PINNED: '#EAB308',
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6B7280',
  CANVAS_BG: '#F9FAFB',
};

// Themes
export const THEMES = {
  LIGHT: {
    name: 'light',
    canvas: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
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
