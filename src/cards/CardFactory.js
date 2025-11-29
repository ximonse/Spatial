/**
 * Card Factory
 * Creates card instances based on type
 */

import { TextCard } from './TextCard.js';
import { ImageCard } from './ImageCard.js';
import { CARD_TYPES } from '../utils/constants.js';
import { state } from '../core/state.js';
import { stageManager } from '../core/stage.js';
import { db } from '../core/db.js';

export class CardFactory {
  constructor() {
    // Map of card ID to card instance
    this.cards = new Map();
  }

  /**
   * Create a new card
   */
  async createCard(type, options = {}) {
    const cardData = {
      type,
      x: options.x ?? 100,
      y: options.y ?? 100,
      content: options.content ?? '',
      comments: options.comments ?? '',
      backgroundColor: options.backgroundColor ?? null,
      tags: options.tags ?? [],
      pinned: options.pinned ?? false,
      metadata: options.metadata ?? {},
    };

    // Save to database
    const savedCard = await db.addCard(cardData);

    // Create card instance
    const card = this._instantiateCard(savedCard);

    // Add to stage (await for async ImageCard.create())
    const group = await card.create();
    stageManager.getCardLayer().add(group);
    stageManager.getCardLayer().batchDraw();

    // Store instance
    this.cards.set(savedCard.id, card);

    // Add to state
    state.addCard(savedCard);

    return card;
  }

  /**
   * Load card from database
   */
  async loadCard(cardData) {
    const card = this._instantiateCard(cardData);
    const group = await card.create();

    stageManager.getCardLayer().add(group);

    this.cards.set(cardData.id, card);
    state.addCard(cardData);

    return card;
  }

  /**
   * Create card instance based on type
   */
  _instantiateCard(cardData) {
    switch (cardData.type) {
      case CARD_TYPES.TEXT:
        return new TextCard(cardData);
      case CARD_TYPES.IMAGE:
        return new ImageCard(cardData);
      default:
        throw new Error(`Unknown card type: ${cardData.type}`);
    }
  }

  /**
   * Get card instance by ID
   */
  getCard(id) {
    return this.cards.get(id);
  }

  /**
   * Update card
   */
  async updateCard(id, updates) {
    const card = this.cards.get(id);
    if (!card) return;

    // Update database
    await db.updateCard(id, updates);

    // Update card instance
    if (updates.content !== undefined || updates.comments !== undefined) {
      card.updateContent(
        updates.content ?? card.data.content,
        updates.comments !== undefined ? updates.comments : null
      );
    }

    if (updates.x !== undefined || updates.y !== undefined) {
      card.setPosition(updates.x ?? card.data.x, updates.y ?? card.data.y);
    }

    if (updates.backgroundColor !== undefined) {
      card.updateBackgroundColor(updates.backgroundColor);
    }

    // Update state
    state.updateCard(id, updates);

    stageManager.getCardLayer().batchDraw();
  }

  /**
   * Delete card
   */
  async deleteCard(id) {
    const card = this.cards.get(id);
    if (!card) return;

    // Remove from database
    await db.deleteCard(id);

    // Destroy Konva group
    card.destroy();

    // Remove from map
    this.cards.delete(id);

    // Remove from state
    state.removeCard(id);

    stageManager.getCardLayer().batchDraw();
  }

  /**
   * Delete multiple cards
   */
  async deleteCards(ids) {
    for (const id of ids) {
      await this.deleteCard(id);
    }
  }

  /**
   * Load all cards from database
   */
  async loadAllCards() {
    const cards = await db.getAllCards();

    // Load all cards in parallel for better performance
    await Promise.all(cards.map(cardData => this.loadCard(cardData)));

    stageManager.getCardLayer().batchDraw();

    return cards.length;
  }

  /**
   * Clear all cards
   */
  clearAll() {
    this.cards.forEach(card => card.destroy());
    this.cards.clear();
    state.set('cards', []);
    stageManager.getCardLayer().batchDraw();
  }

  /**
   * Get all card instances
   */
  getAllCards() {
    return Array.from(this.cards.values());
  }
}

// Export singleton instance
export const cardFactory = new CardFactory();
