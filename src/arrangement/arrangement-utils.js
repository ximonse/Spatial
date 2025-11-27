/**
 * Utility functions for card arrangements
 * Shared logic extracted from layouts.js
 */

import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';
import { stageManager } from '../core/stage.js';
import { db } from '../core/db.js';

/**
 * Get selected cards, or paste from clipboard if selection is empty
 * @returns {Promise<Array>} Selected cards
 */
export async function getOrPasteCards() {
  let cards = state.getSelectedCards();

  // If no selection but clipboard has cards, paste first
  if (cards.length === 0) {
    const clipboard = state.get('clipboard');
    if (clipboard && clipboard.length > 0) {
      const { pasteCards } = await import('../ui/cardOperations.js');
      await pasteCards();
      cards = state.getSelectedCards();
    }
  }

  return cards;
}

/**
 * Apply positions to cards and save to database
 * @param {Object} positionMap - Map of {cardId: {x, y}}
 */
export async function applyPositionsToCards(positionMap) {
  const updates = [];

  for (const [cardId, pos] of Object.entries(positionMap)) {
    // Convert cardId to number (Object.entries returns string keys)
    const numericId = Number(cardId);

    const card = cardFactory.getCard(numericId);
    if (!card) continue;

    // Find card data in state
    const cardData = state.get('cards').find(c => c.id === numericId);
    if (!cardData) continue;

    // Update card position
    card.setPosition(pos.x, pos.y);
    cardData.x = pos.x;
    cardData.y = pos.y;

    updates.push({ id: numericId, x: pos.x, y: pos.y });
  }

  // Batch save to database
  if (updates.length > 0) {
    await Promise.all(
      updates.map(u => db.updateCard(u.id, { x: u.x, y: u.y }))
    );
  }
}

/**
 * Get viewport position (mouse pointer or center of viewport)
 * @returns {{x: number, y: number}} Position in canvas coordinates
 */
export function getViewportPosition() {
  const stage = stageManager.getStage();
  const scale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  const stagePos = stage.position();

  let startX, startY;

  if (pointer) {
    // Use mouse pointer position in canvas coordinates
    startX = (pointer.x - stagePos.x) / scale;
    startY = (pointer.y - stagePos.y) / scale;
  } else {
    // Use center of viewport in canvas coordinates
    startX = -stagePos.x / scale + (stage.width() / scale) / 2;
    startY = -stagePos.y / scale + (stage.height() / scale) / 2;
  }

  return { x: startX, y: startY };
}
