/**
 * Card operations (copy, paste, duplicate, delete, pin)
 * Extracted from app.js to keep files under 300 lines
 */

import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';
import { stageManager } from '../core/stage.js';
import { CARD_TYPES } from '../utils/constants.js';
import { statusNotification } from './statusNotification.js';

/**
 * Copy selected cards to clipboard
 */
export function copySelectedCards() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  state.set('clipboard', selectedCards);
  statusNotification.showTemporary(`📋 Copied ${selectedCards.length} card(s)`);
  console.log(`📋 Copied ${selectedCards.length} card(s)`);
}

/**
 * Paste cards from clipboard
 */
export async function pasteCards() {
  const clipboard = state.get('clipboard');
  if (!clipboard || clipboard.length === 0) {
    console.log('⚠️ Clipboard is empty');
    return;
  }

  const stage = stageManager.getStage();
  const scale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  const stagePos = stage.position();

  // If no pointer position, use center of viewport
  let pasteX, pasteY;
  if (pointer) {
    pasteX = (pointer.x - stagePos.x) / scale;
    pasteY = (pointer.y - stagePos.y) / scale;
  } else {
    // Center of visible viewport in canvas coordinates
    pasteX = -stagePos.x / scale + (stage.width() / scale) / 2;
    pasteY = -stagePos.y / scale + (stage.height() / scale) / 2;
  }

  // Calculate offset from first card
  const firstCard = clipboard[0];
  const offsetX = pasteX - (firstCard.x || 0);
  const offsetY = pasteY - (firstCard.y || 0);

  // Clear selection and paste cards
  state.clearSelection();

  for (const cardData of clipboard) {
    const newCard = await cardFactory.createCard(cardData.type, {
      x: (cardData.x || 0) + offsetX,
      y: (cardData.y || 0) + offsetY,
      content: cardData.content,
      tags: cardData.tags,
      comments: cardData.comments,
      pinned: false, // Don't copy pinned state
    });

    state.selectCard(newCard.data.id);
  }

  statusNotification.showTemporary(`✅ Pasted ${clipboard.length} card(s)`);
  console.log(`✅ Pasted ${clipboard.length} card(s)`);
}

/**
 * Duplicate selected cards
 */
export async function duplicateSelectedCards() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  state.clearSelection();

  const OFFSET = 30;

  for (const cardData of selectedCards) {
    const newCard = await cardFactory.createCard(cardData.type, {
      x: (cardData.x || 0) + OFFSET,
      y: (cardData.y || 0) + OFFSET,
      content: cardData.content,
      tags: cardData.tags,
      comments: cardData.comments,
      pinned: false,
    });

    state.selectCard(newCard.data.id);
  }

  statusNotification.showTemporary(`✅ Duplicated ${selectedCards.length} card(s)`);
  console.log(`✅ Duplicated ${selectedCards.length} card(s)`);
}

/**
 * Toggle pin status of selected cards
 */
export async function togglePinSelectedCards() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  for (const cardData of selectedCards) {
    const newPinnedState = !cardData.pinned;
    await cardFactory.updateCard(cardData.id, { pinned: newPinnedState });
    cardData.pinned = newPinnedState;
  }

  statusNotification.showTemporary(`📌 Toggled pin for ${selectedCards.length} card(s)`);
  console.log(`📌 Toggled pin for ${selectedCards.length} card(s)`);
}

/**
 * Delete selected cards
 */
export async function deleteSelectedCards() {
  const selectedCards = state.getSelectedCards();
  if (selectedCards.length === 0) return;

  const confirmed = confirm(`Delete ${selectedCards.length} card(s)?`);
  if (!confirmed) return;

  const ids = selectedCards.map(c => c.id);
  await cardFactory.deleteCards(ids);

  statusNotification.showTemporary(`🗑️ Deleted ${ids.length} cards`);
  console.log(`🗑️ Deleted ${ids.length} cards`);
}

/**
 * Create new card at center of viewport
 */
export async function createNewCard() {
  const stage = stageManager.getStage();
  const scale = stage.scaleX();

  // Calculate center of viewport in canvas coordinates
  const centerX = (stage.width() / 2 - stage.x()) / scale;
  const centerY = (stage.height() / 2 - stage.y()) / scale;

  const card = await cardFactory.createCard(CARD_TYPES.TEXT, {
    x: centerX - 100, // Center the card
    y: centerY - 75,
    content: 'New note...',
  });

  // Select the new card
  state.clearSelection();
  state.selectCard(card.data.id);

  // Open editor immediately
  state.set('editingCardId', card.data.id);

  console.log('✅ Created new card');
}

/**
 * Change the background color of all selected cards
 * @param {string} color - The new hex color
 */
export async function changeSelectedCardsColor(color) {
  const selectedIds = state.get('selectedCards');
  if (selectedIds.size === 0) return;

  const updatePromises = [];
  for (const id of selectedIds) {
    updatePromises.push(cardFactory.updateCard(id, { backgroundColor: color }));
  }

  await Promise.all(updatePromises);

  statusNotification.showTemporary(`🎨 Changed color for ${selectedIds.size} card(s)`);
  console.log(`🎨 Changed color for ${selectedIds.size} card(s)`);
}
