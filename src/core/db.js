/**
 * IndexedDB setup with Dexie.js
 * Stores cards locally in browser
 */

import Dexie from 'dexie';
import { DB_NAME, DB_VERSION } from '../utils/constants.js';

class SpatialDB extends Dexie {
  constructor() {
    super(DB_NAME);

    this.version(DB_VERSION).stores({
      cards: '++id, type, x, y, createdAt, updatedAt, tags, pinned',
      settings: 'key',
      images: 'id, cardId',
    });

    this.cards = this.table('cards');
    this.settings = this.table('settings');
    this.images = this.table('images');
  }

  /**
   * Add a new card
   */
  async addCard(cardData) {
    const timestamp = Date.now();
    const card = {
      ...cardData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const id = await this.cards.add(card);
    return { id, ...card };
  }

  /**
   * Update card
   */
  async updateCard(id, updates) {
    await this.cards.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Delete card
   */
  async deleteCard(id) {
    await this.cards.delete(id);
    // Also delete associated image if exists
    await this.images.where('cardId').equals(id).delete();
  }

  /**
   * Get all cards
   */
  async getAllCards() {
    return await this.cards.toArray();
  }

  /**
   * Get card by ID
   */
  async getCard(id) {
    return await this.cards.get(id);
  }

  /**
   * Save image for a card
   * @param {number} cardId - Card ID
   * @param {Object} imageData - Image data object
   * @param {string} imageData.data - Original image (base64 data URL)
   * @param {string} [imageData.processedData] - Processed image (base64 data URL)
   * @param {number} [imageData.width] - Image width
   * @param {number} [imageData.height] - Image height
   * @param {string} [imageData.format] - Image format (png, jpg, etc.)
   * @param {number} [imageData.fileSize] - File size in bytes
   */
  async saveImage(cardId, imageData) {
    const payload = typeof imageData === 'string'
      ? { data: imageData }
      : imageData || {};

    await this.images.put({
      id: cardId,
      cardId,
      data: payload.data,
      processedData: payload.processedData || null,
      width: payload.width || 0,
      height: payload.height || 0,
      format: payload.format || 'png',
      fileSize: payload.fileSize || 0,
    });
  }

  /**
   * Get image for a card
   */
  async getImage(cardId) {
    return await this.images.get(cardId);
  }

  /**
   * Get setting
   */
  async getSetting(key, defaultValue = null) {
    const setting = await this.settings.get(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    await this.settings.put({ key, value });
  }

  /**
   * Clear all data
   */
  async clearAll() {
    await this.cards.clear();
    await this.images.clear();
  }
}

// Export singleton instance
export const db = new SpatialDB();
