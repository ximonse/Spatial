/**
 * Text Card rendering with Konva
 * A7-style index card with text content
 */

import Konva from 'konva';
import { CARD, COLORS } from '../utils/constants.js';
import { state } from '../core/state.js';
import { CardContentOverlay } from './CardContentOverlay.js';
import { setupCardInteractions } from './cardInteractions.js';

export class TextCard {
  constructor(cardData) {
    this.data = cardData;
    this.group = null;
    this.rect = null;
    this.contentOverlay = null;
    this.selectionBorder = null;
    this.currentHeight = cardData.height || CARD.MIN_HEIGHT;
    this.resizeObserver = null;
    this.heightUpdateTimeout = null;
  }

  /**
   * Create Konva group for this card
   */
  create() {
    const theme = state.get('theme');

    // Main group
    this.group = new Konva.Group({
      x: this.data.x,
      y: this.data.y,
      draggable: true,
      id: `card-${this.data.id}`,
    });

    // Background rectangle (dynamic height)
    this.rect = new Konva.Rect({
      width: CARD.WIDTH,
      height: this.currentHeight,
      fill: theme.card,
      stroke: theme.border,
      strokeWidth: 2,
      cornerRadius: CARD.CORNER_RADIUS,
    });

    this.group.add(this.rect);

    // Create HTML content overlay for Markdown rendering
    this.contentOverlay = new CardContentOverlay(
      this.data.id,
      this.data.content || '',
      this.data.x,
      this.data.y,
      this.currentHeight,
      this.data.comments || ''
    );
    this.contentOverlay.create();

    // Setup ResizeObserver for automatic height updates
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this._updateHeight();
      });
      this.resizeObserver.observe(this.contentOverlay.element);
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        this._updateHeight();
      }, 100);
    }

    // Selection border (hidden by default, dynamic height)
    this.selectionBorder = new Konva.Rect({
      width: CARD.WIDTH,
      height: this.currentHeight,
      stroke: COLORS.CARD_SELECTED,
      strokeWidth: 4,
      cornerRadius: CARD.CORNER_RADIUS,
      visible: false,
    });

    this.group.add(this.selectionBorder);

    // Pin indicator (if pinned)
    if (this.data.pinned) {
      this._addPinIndicator();
    }

    // Setup interactions
    setupCardInteractions(this);

    return this.group;
  }

  /**
   * Add pin indicator
   */
  _addPinIndicator() {
    const pin = new Konva.Circle({
      x: CARD.WIDTH - 15,
      y: 15,
      radius: 5,
      fill: COLORS.CARD_PINNED,
    });

    this.group.add(pin);
  }

  /**
   * Update selection visual
   */
  setSelected(isSelected) {
    this.selectionBorder.visible(isSelected);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * Update card content
   */
  updateContent(content, comments = null) {
    this.data.content = content;
    if (comments !== null) {
      this.data.comments = comments;
    }
    this.contentOverlay.updateContent(content, this.data.comments || '');

    // ResizeObserver will automatically trigger _updateHeight()
    // No need for setTimeout anymore
  }

  /**
   * Update card height based on content
   */
  _updateHeight() {
    if (!this.contentOverlay.element) return;

    // Measure content height (scrollHeight already includes padding)
    const contentHeight = this.contentOverlay.element.scrollHeight;
    const newHeight = Math.max(
      CARD.MIN_HEIGHT,
      Math.min(CARD.MAX_HEIGHT, contentHeight)
    );

    // Only update if height changed
    if (Math.abs(newHeight - this.currentHeight) > 5) {
      this.currentHeight = newHeight;
      this.data.height = newHeight;

      // Update Konva shapes
      this.rect.height(newHeight);
      this.selectionBorder.height(newHeight);

      // Update overlay
      this.contentOverlay.setHeight(newHeight);

      this.group.getLayer()?.batchDraw();

      // Debounce database save to avoid excessive writes
      clearTimeout(this.heightUpdateTimeout);
      this.heightUpdateTimeout = setTimeout(async () => {
        try {
          const { db } = await import('../core/db.js');
          await db.updateCard(this.data.id, { height: newHeight });
        } catch (error) {
          console.error('Failed to save card height:', error);
        }
      }, 500);
    }
  }

  /**
   * Update position
   */
  setPosition(x, y) {
    this.data.x = x;
    this.data.y = y;
    this.group.position({ x, y });
    this.contentOverlay.setPosition(x, y);
  }

  /**
   * Get current position
   */
  getPosition() {
    return {
      x: this.group.x(),
      y: this.group.y(),
    };
  }

  /**
   * Destroy card
   */
  destroy() {
    // Cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Cleanup timeout
    if (this.heightUpdateTimeout) {
      clearTimeout(this.heightUpdateTimeout);
      this.heightUpdateTimeout = null;
    }

    this.group.destroy();
    this.contentOverlay.destroy();
  }

  /**
   * Get Konva group
   */
  getGroup() {
    return this.group;
  }
}
