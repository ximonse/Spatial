/**
 * Lightweight fallback backup for image cards.
 * Stores image cards in localStorage so they survive browser refreshes
 * even if IndexedDB is cleared between sessions (which some browsers
 * or privacy settings can do).
 */

import { CARD_TYPES } from '../utils/constants.js';
import { db } from './db.js';

const STORAGE_KEY = 'spatial_image_cards_backup_v1';

/**
 * Save all image cards (including their images) to localStorage.
 */
export async function backupImageCards() {
  try {
    const imageCards = await db.cards.where('type').equals(CARD_TYPES.IMAGE).toArray();
    const payload = [];

    for (const card of imageCards) {
      const imageData = await db.getImage(card.id);
      if (!imageData?.data) continue;

      payload.push({
        card,
        imageData,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to backup image cards to localStorage:', error);
  }
}

/**
 * Restore image cards from the localStorage backup if IndexedDB is empty.
 * @param {CardFactory} cardFactory - Factory used to render cards
 * @returns {Promise<number>} Number of restored cards
 */
export async function restoreImageCards(cardFactory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;

    const payload = JSON.parse(raw);
    let restored = 0;

    for (const { card, imageData } of payload) {
      const existing = await db.getCard(card.id);
      if (existing) continue;

      // Recreate DB records
      await db.addCard(card);
      await db.saveImage(card.id, imageData);

      // Render card on canvas
      await cardFactory.loadCard(card);
      restored++;
    }

    return restored;
  } catch (error) {
    console.error('Failed to restore image cards from localStorage:', error);
    return 0;
  }
}
