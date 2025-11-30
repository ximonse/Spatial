/**
 * Viewport-based card culling for performance
 * Only renders cards visible in viewport + margin
 */

import { stageManager } from '../core/stage.js';
import { cardFactory } from '../cards/CardFactory.js';
import { CARD } from '../utils/constants.js';

export class ViewportCuller {
  constructor() {
    this.culledCards = new Set(); // Card IDs currently culled
    this.margin = 500; // Render margin in pixels
    this.enabled = false;
    this.threshold = 200; // Enable when card count > threshold
  }

  /**
   * Start culling (enable when card count > threshold)
   */
  start() {
    if (this.enabled) return;
    this.enabled = true;

    // Check on pan/zoom
    const stage = stageManager.getStage();
    stage.on('dragend.culler', () => this.cull());
    // stage.on('wheel.culler', () => this.cull()); // Temporarily disable for debugging

    // Initial cull
    this.cull();

    console.log('✅ Viewport culling enabled');
  }

  /**
   * Stop culling
   */
  stop() {
    if (!this.enabled) return;
    this.enabled = false;

    // Remove event listeners
    const stage = stageManager.getStage();
    stage.off('dragend.culler');
    stage.off('wheel.culler');

    // Restore all culled cards
    this.culledCards.forEach(cardId => {
      this._restoreCard(cardId);
    });
    this.culledCards.clear();

    console.log('Viewport culling disabled');
  }

  /**
   * Cull cards outside viewport
   */
  cull() {
    if (!this.enabled) return;

    const viewport = this._getViewportBounds();
    const cards = cardFactory.getAllCards();

    let culledCount = 0;
    let restoredCount = 0;

    cards.forEach(card => {
      const cardBounds = this._getCardBounds(card);
      const isVisible = this._boundsIntersect(viewport, cardBounds);

      if (isVisible && this.culledCards.has(card.data.id)) {
        // Card entered viewport - restore
        this._restoreCard(card.data.id);
        this.culledCards.delete(card.data.id);
        restoredCount++;
      } else if (!isVisible && !this.culledCards.has(card.data.id)) {
        // Card left viewport - cull
        this._cullCard(card);
        this.culledCards.add(card.data.id);
        culledCount++;
      }
    });

    if (culledCount > 0 || restoredCount > 0) {
      console.log(
        `Culling: ${this.culledCards.size}/${cards.length} hidden (culled: ${culledCount}, restored: ${restoredCount})`
      );
    }
  }

  /**
   * Check if culling should be enabled based on card count
   */
  checkThreshold() {
    const cards = cardFactory.getAllCards();
    if (cards.length > this.threshold && !this.enabled) {
      this.start();
    } else if (cards.length <= this.threshold && this.enabled) {
      this.stop();
    }
  }

  /**
   * Get current viewport bounds in world coordinates
   */
  _getViewportBounds() {
    const stage = stageManager.getStage();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Convert screen bounds to world bounds
    const left = -stagePos.x / scale - this.margin;
    const top = -stagePos.y / scale - this.margin;
    const right = (stage.width() - stagePos.x) / scale + this.margin;
    const bottom = (stage.height() - stagePos.y) / scale + this.margin;

    return { left, top, right, bottom };
  }

  /**
   * Get card bounds in world coordinates
   */
  _getCardBounds(card) {
    const x = card.data.x;
    const y = card.data.y;
    const width = CARD.WIDTH;
    const height = card.data.height || CARD.MIN_HEIGHT;

    return {
      left: x,
      top: y,
      right: x + width,
      bottom: y + height,
    };
  }

  /**
   * Check if two bounds intersect
   */
  _boundsIntersect(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  /**
   * Cull card (hide Konva shapes and overlay)
   */
  _cullCard(card) {
    // Hide Konva group
    card.group.visible(false);

    // Hide HTML overlay
    if (card.contentOverlay) {
      card.contentOverlay.setVisible(false);
    }

    // NOTE: Don't destroy - just hide
    // This is much faster than recreate on restore
  }

  /**
   * Restore culled card
   */
  _restoreCard(cardId) {
    const card = cardFactory.getCard(cardId);
    if (!card) return;

    // Show Konva group
    card.group.visible(true);

    // Show HTML overlay
    if (card.contentOverlay) {
      card.contentOverlay.setVisible(true);
    }
  }
}

// Export singleton instance
export const viewportCuller = new ViewportCuller();
