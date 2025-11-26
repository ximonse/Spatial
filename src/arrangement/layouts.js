/**
 * Card arrangement algorithms
 * Based on spatial grouping principles (15px same group, 250px different groups)
 */

import { CARD, SPACING } from '../utils/constants.js';
import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';

/**
 * Arrange cards in vertical column
 */
export function arrangeVertical() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  // Get first card's position as starting point
  const firstCard = selectedCards[0];
  let currentY = firstCard.y;
  const startX = firstCard.x;

  selectedCards.forEach((cardData, index) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    card.setPosition(startX, currentY);
    cardData.x = startX;
    cardData.y = currentY;

    currentY += CARD.HEIGHT + SPACING.SAME_GROUP;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards vertically`);
}

/**
 * Arrange cards in horizontal row
 */
export function arrangeHorizontal() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  const firstCard = selectedCards[0];
  let currentX = firstCard.x;
  const startY = firstCard.y;

  selectedCards.forEach((cardData) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    card.setPosition(currentX, startY);
    cardData.x = currentX;
    cardData.y = startY;

    currentX += CARD.WIDTH + SPACING.SAME_GROUP;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards horizontally`);
}

/**
 * Arrange cards in grid
 */
export function arrangeGrid(columns = 0) {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  // Auto-calculate columns if not specified
  if (columns === 0) {
    columns = Math.ceil(Math.sqrt(selectedCards.length));
  }

  const firstCard = selectedCards[0];
  const startX = firstCard.x;
  const startY = firstCard.y;

  selectedCards.forEach((cardData, index) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + row * SPACING.GRID_VERTICAL;

    card.setPosition(x, y);
    cardData.x = x;
    cardData.y = y;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards in ${columns}-column grid`);
}

/**
 * Arrange cards in circle/cluster
 */
export function arrangeCircle() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  if (selectedCards.length === 1) {
    console.log('⚠️ Need at least 2 cards for circle arrangement');
    return;
  }

  // Calculate center point from first card
  const firstCard = selectedCards[0];
  const centerX = firstCard.x + CARD.WIDTH / 2;
  const centerY = firstCard.y + CARD.HEIGHT / 2;

  // Radius based on number of cards
  const radius = Math.max(150, selectedCards.length * 30);

  selectedCards.forEach((cardData, index) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    const angle = (index / selectedCards.length) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle) - CARD.WIDTH / 2;
    const y = centerY + radius * Math.sin(angle) - CARD.HEIGHT / 2;

    card.setPosition(x, y);
    cardData.x = x;
    cardData.y = y;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards in circle`);
}

/**
 * Arrange cards in vertical grid (multiple columns)
 */
export function arrangeGridVertical() {
  arrangeGrid(3); // Default to 3 columns
}

/**
 * Arrange cards in horizontal grid (multiple rows)
 */
export function arrangeGridHorizontal() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  const rows = 3; // Default to 3 rows
  const columns = Math.ceil(selectedCards.length / rows);

  const firstCard = selectedCards[0];
  const startX = firstCard.x;
  const startY = firstCard.y;

  selectedCards.forEach((cardData, index) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    const row = index % rows;
    const col = Math.floor(index / rows);

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + row * SPACING.GRID_VERTICAL;

    card.setPosition(x, y);
    cardData.x = x;
    cardData.y = y;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards in horizontal grid`);
}

/**
 * Arrange cards in Kanban-style overlapping columns
 */
export function arrangeKanban() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  const columns = 3;
  const cardsPerColumn = Math.ceil(selectedCards.length / columns);

  const firstCard = selectedCards[0];
  const startX = firstCard.x;
  const startY = firstCard.y;

  const OVERLAP = 30; // Overlap cards in same column

  selectedCards.forEach((cardData, index) => {
    const card = cardFactory.getCard(cardData.id);
    if (!card) return;

    const col = Math.floor(index / cardsPerColumn);
    const rowInCol = index % cardsPerColumn;

    const x = startX + col * SPACING.GRID_HORIZONTAL;
    const y = startY + rowInCol * OVERLAP;

    card.setPosition(x, y);
    cardData.x = x;
    cardData.y = y;
  });

  console.log(`✅ Arranged ${selectedCards.length} cards in Kanban style`);
}
