/**
 * Card arrangement API
 * Thin wrappers orchestrating utils and algorithms
 */

import { getOrPasteCards, applyPositionsToCards, getViewportPosition } from './arrangement-utils.js';
import {
  calculateVerticalLayout,
  calculateHorizontalLayout,
  calculateGridLayout,
  calculateCircleLayout,
  calculateGridVerticalLayout,
  calculateGridHorizontalLayout,
  calculateKanbanLayout,
} from './arrangement-algorithms.js';

/**
 * Arrange cards in vertical column
 */
export async function arrangeVertical() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateVerticalLayout(selectedCards, startPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards vertically`);
}

/**
 * Arrange cards in horizontal row
 */
export async function arrangeHorizontal() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateHorizontalLayout(selectedCards, startPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards horizontally`);
}

/**
 * Arrange cards in grid
 */
export async function arrangeGrid(columns = 0) {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateGridLayout(selectedCards, startPos, columns);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards in ${columns || Math.ceil(Math.sqrt(selectedCards.length))}-column grid`);
}

/**
 * Arrange cards in circle/cluster
 */
export async function arrangeCircle() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  if (selectedCards.length === 1) {
    console.log('⚠️ Need at least 2 cards for circle arrangement');
    return;
  }

  const centerPos = getViewportPosition();
  const positions = calculateCircleLayout(selectedCards, centerPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards in circle`);
}

/**
 * Arrange cards in vertical grid (5 columns, each stacks independently)
 * G+V: Each column stacks its cards vertically, independent of other columns
 */
export async function arrangeGridVertical() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateGridVerticalLayout(selectedCards, startPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards in vertical grid (5 columns)`);
}

/**
 * Arrange cards in horizontal grid (5 columns, rows align at top)
 * G+H: Cards in same row start at same Y, next row starts below tallest card
 */
export async function arrangeGridHorizontal() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateGridHorizontalLayout(selectedCards, startPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards in horizontal grid (5 columns)`);
}

/**
 * Arrange cards in Kanban-style overlapping columns
 */
export async function arrangeKanban() {
  const selectedCards = await getOrPasteCards();
  if (selectedCards.length === 0) return;

  const startPos = getViewportPosition();
  const positions = calculateKanbanLayout(selectedCards, startPos);
  await applyPositionsToCards(positions);

  console.log(`✅ Arranged ${selectedCards.length} cards in Kanban style`);
}
