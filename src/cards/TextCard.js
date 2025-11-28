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
    this.currentHeight = cardData.height || CARD.MIN_HEIGHT;
    this.resizeObserver = null;
    this.heightUpdateTimeout = null;
    this.isSelected = false;
    this.isSearchMatch = true; // Default to visible (no search active)
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
    // Use custom backgroundColor if provided, otherwise use theme color
    const fillColor = this.data.backgroundColor || theme.card;

    this.rect = new Konva.Rect({
      width: CARD.WIDTH,
      height: this.currentHeight,
      fill: fillColor,
      cornerRadius: CARD.CORNER_RADIUS,
      stroke: '#9CA3AF',
      strokeWidth: 1,
    });

    this.group.add(this.rect);

    // Create HTML content overlay for Markdown rendering
    this.contentOverlay = new CardContentOverlay(
      this.data.id,
      this.data.content || '',
      this.data.x,
      this.data.y,
      this.currentHeight,
      this.data.comments || '',
      this.data.backgroundColor || null
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
    this.isSelected = isSelected;

    // Update Konva rect border color
    const theme = state.get('theme');
    const strokeColor = isSelected ? (theme.borderSelected || theme.border) : theme.border;
    if (this.rect) {
      this.rect.stroke(strokeColor);
      this.rect.getLayer()?.batchDraw();
    }

    // Update overlay
    this.contentOverlay.setSelected(isSelected);
  }

  /**
   * Update search match visual
   */
  setSearchMatch(hasSearch, isMatch) {
    this.isSearchMatch = !hasSearch || isMatch;
    this.contentOverlay.setSearchMatch(hasSearch, isMatch);
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

    // Get current scale
    const stage = this.group.getStage();
    const scale = stage ? stage.scaleX() : 1;

    // Measure natural content height by reading scrollHeight and dividing by scale
    // scrollHeight includes the scaled padding and content
    const scaledScrollHeight = this.contentOverlay.element.scrollHeight;
    const naturalHeight = scaledScrollHeight / scale;

    // Sanity check: if height is absurdly large, reset to MIN_HEIGHT
    const safeHeight = (naturalHeight > 2000 || isNaN(naturalHeight))
      ? CARD.MIN_HEIGHT
      : naturalHeight;

    const newHeight = Math.max(
      CARD.MIN_HEIGHT,
      Math.min(CARD.MAX_HEIGHT, safeHeight)
    );

    // Only update if height changed significantly
    if (Math.abs(newHeight - this.currentHeight) > 5) {
      this.currentHeight = newHeight;
      this.data.height = newHeight;

      // Update Konva shapes
      this.rect.height(newHeight);

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
