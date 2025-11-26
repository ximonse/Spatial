/**
 * Manages all card content overlays
 * Updates positions on zoom/pan
 */

import { stageManager } from '../core/stage.js';
import { cardFactory } from './CardFactory.js';

export class OverlayManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize overlay manager
   */
  init() {
    if (this.initialized) return;

    const stage = stageManager.getStage();

    // Update all overlays on stage transform
    stage.on('dragmove', () => {
      this.updateAllOverlays();
    });

    stage.on('wheel', () => {
      this.updateAllOverlays();
    });

    stage.on('touchmove', () => {
      this.updateAllOverlays();
    });

    this.initialized = true;
  }

  /**
   * Update all card overlays
   */
  updateAllOverlays() {
    const cards = cardFactory.getAllCards();
    cards.forEach(card => {
      if (card.contentOverlay) {
        card.contentOverlay.updatePosition();
      }
    });
  }
}

// Export singleton instance
export const overlayManager = new OverlayManager();
