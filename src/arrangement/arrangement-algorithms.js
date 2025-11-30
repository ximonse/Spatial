/**
 * Pure layout calculation functions
 * No side effects - just mathematics
 */

import { CARD, SPACING } from '../utils/constants.js';

/**
 * Calculate vertical layout positions
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateVerticalLayout(cards, startPos) {
  const positions = {};
  let currentY = startPos.y;
  const startX = startPos.x;

  cards.forEach((cardData) => {
    positions[cardData.id] = {
      x: startX,
      y: currentY,
    };

    const cardHeight = cardData.height || CARD.MIN_HEIGHT;
    currentY += cardHeight + SPACING.SAME_GROUP;
  });

  return positions;
}

/**
 * Calculate horizontal layout positions
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateHorizontalLayout(cards, startPos) {
  const positions = {};
  let currentX = startPos.x;
  const startY = startPos.y;

  cards.forEach((cardData) => {
    positions[cardData.id] = {
      x: currentX,
      y: startY,
    };

    currentX += CARD.WIDTH + SPACING.SAME_GROUP;
  });

  return positions;
}

/**
 * Calculate grid layout positions
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @param {number} columns - Number of columns (0 = auto-calculate)
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateGridLayout(cards, startPos, columns = 0) {
  // Auto-calculate columns if not specified
  if (columns === 0) {
    columns = Math.ceil(Math.sqrt(cards.length));
  }

  const positions = {};
  const startX = startPos.x;
  const startY = startPos.y;

  cards.forEach((cardData, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + row * SPACING.GRID_VERTICAL;

    positions[cardData.id] = { x, y };
  });

  return positions;
}

/**
 * Calculate stack layout positions (overlapping pile)
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} centerPos - Center position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateCircleLayout(cards, centerPos) {
  const positions = {};
  const baseX = centerPos.x - CARD.WIDTH / 2;
  const baseY = centerPos.y - CARD.MIN_HEIGHT / 2;

  const offsetStep = 6; // slight shift so edges are visible
  const jitter = 12;    // small random jitter for organic stack

  cards.forEach((cardData, index) => {
    const jitterX = (Math.random() - 0.5) * jitter;
    const jitterY = (Math.random() - 0.5) * jitter;
    positions[cardData.id] = {
      x: baseX + offsetStep * index + jitterX,
      y: baseY + offsetStep * index + jitterY,
    };
  });

  return positions;
}

/**
 * Calculate vertical grid layout (5 columns, each column stacks independently)
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateGridVerticalLayout(cards, startPos) {
  const COLUMNS = 5;
  const positions = {};
  const startX = startPos.x;
  const startY = startPos.y;

  // Track Y position for each column independently
  const columnYPositions = new Array(COLUMNS).fill(startY);

  cards.forEach((cardData, index) => {
    const col = index % COLUMNS;

    // Position at current column Y
    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = columnYPositions[col];

    positions[cardData.id] = { x, y };

    // Update this column's Y position for next card
    const cardHeight = cardData.height || CARD.MIN_HEIGHT;
    columnYPositions[col] += cardHeight + SPACING.SAME_GROUP;
  });

  return positions;
}

/**
 * Calculate horizontal grid layout (5 columns, rows align at top)
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateGridHorizontalLayout(cards, startPos) {
  const COLUMNS = 5;
  const positions = {};
  const startX = startPos.x;
  let currentRowY = startPos.y;

  // Group cards into rows
  for (let i = 0; i < cards.length; i += COLUMNS) {
    const rowCards = cards.slice(i, i + COLUMNS);
    let maxHeightInRow = CARD.MIN_HEIGHT;

    // Position all cards in this row
    rowCards.forEach((cardData, colIndex) => {
      const x = startX + colIndex * SPACING.GRID_HORIZONTAL;
      const y = currentRowY;

      positions[cardData.id] = { x, y };

      // Track tallest card in this row
      const cardHeight = cardData.height || CARD.MIN_HEIGHT;
      maxHeightInRow = Math.max(maxHeightInRow, cardHeight);
    });

    // Move to next row position (below tallest card)
    currentRowY += maxHeightInRow + SPACING.SAME_GROUP;
  }

  return positions;
}

/**
 * Calculate overlapping row layout (dense grid rows)
 * Each new row starts only 50px lower, so cards overlap vertically.
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateKanbanLayout(cards, startPos) {
  const columns = 5;
  const rowSpacing = 50; // only 50px visible before overlap
  const positions = {};
  const startX = startPos.x;
  const startY = startPos.y;

  cards.forEach((cardData, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + row * rowSpacing;

    positions[cardData.id] = { x, y };
  });

  return positions;
}
