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
 * Calculate circle layout positions
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} centerPos - Center position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateCircleLayout(cards, centerPos) {
  const positions = {};
  const centerX = centerPos.x;
  const centerY = centerPos.y;

  // Radius based on number of cards
  const radius = Math.max(150, cards.length * 30);

  cards.forEach((cardData, index) => {
    const angle = (index / cards.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle) - CARD.WIDTH / 2;
    const y = centerY + radius * Math.sin(angle) - CARD.MIN_HEIGHT / 2;

    positions[cardData.id] = { x, y };
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
 * Calculate Kanban layout (3 columns with overlapping cards)
 * @param {Array} cards - Card data objects
 * @param {{x: number, y: number}} startPos - Starting position
 * @returns {Object} Map of {cardId: {x, y}}
 */
export function calculateKanbanLayout(cards, startPos) {
  const columns = 3;
  const cardsPerColumn = Math.ceil(cards.length / columns);
  const positions = {};
  const startX = startPos.x;
  const startY = startPos.y;

  const OVERLAP = 30; // Overlap cards in same column

  cards.forEach((cardData, index) => {
    const col = Math.floor(index / cardsPerColumn);
    const rowInCol = index % cardsPerColumn;

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + rowInCol * OVERLAP;

    positions[cardData.id] = { x, y };
  });

  return positions;
}
