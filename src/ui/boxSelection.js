/**
 * Box Selection (Marquee Selection)
 * Drag to select multiple cards
 */

import Konva from 'konva';
import { state } from '../core/state.js';
import { stageManager } from '../core/stage.js';

class BoxSelection {
  constructor() {
    this.isSelecting = false;
    this.selectionBox = null;
    this.startPoint = null;
    this.selectionLayer = null;
    this.ctrlWasHeld = false; // Track if Ctrl was held at start
  }

  /**
   * Initialize box selection on stage
   */
  init() {
    const stage = stageManager.getStage();

    // Create a layer for selection box (above card layer)
    this.selectionLayer = new Konva.Layer();
    stage.add(this.selectionLayer);

    // Create selection box (initially invisible)
    this.selectionBox = new Konva.Rect({
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3B82F6',
      strokeWidth: 2,
      visible: false,
      listening: false,
    });

    this.selectionLayer.add(this.selectionBox);

    // Setup event listeners
    this._setupListeners();
  }

  /**
   * Setup mouse event listeners
   */
  _setupListeners() {
    const stage = stageManager.getStage();

    // Mouse down on stage (not on a card)
    stage.on('mousedown', (e) => {
      // Only start if clicking on stage itself (not on a card)
      if (e.target !== stage) return;

      // Only activate box selection if Ctrl is held
      if (!e.evt.ctrlKey) return;

      // Remember that Ctrl was held when selection started
      this.ctrlWasHeld = true;

      // Disable stage dragging during box selection
      stage.draggable(false);

      this.isSelecting = true;

      // Get pointer position in canvas coordinates
      const pos = stage.getPointerPosition();
      const scale = stage.scaleX();
      const stagePos = stage.position();

      this.startPoint = {
        x: (pos.x - stagePos.x) / scale,
        y: (pos.y - stagePos.y) / scale,
      };

      // Initialize selection box
      this.selectionBox.setAttrs({
        x: this.startPoint.x,
        y: this.startPoint.y,
        width: 0,
        height: 0,
        visible: true,
      });

      this.selectionLayer.batchDraw();
    });

    // Mouse move - update selection box
    stage.on('mousemove', (e) => {
      if (!this.isSelecting) return;

      const pos = stage.getPointerPosition();
      const scale = stage.scaleX();
      const stagePos = stage.position();

      const currentPoint = {
        x: (pos.x - stagePos.x) / scale,
        y: (pos.y - stagePos.y) / scale,
      };

      // Calculate box dimensions
      const width = currentPoint.x - this.startPoint.x;
      const height = currentPoint.y - this.startPoint.y;

      // Update selection box (handle negative width/height)
      this.selectionBox.setAttrs({
        x: width >= 0 ? this.startPoint.x : currentPoint.x,
        y: height >= 0 ? this.startPoint.y : currentPoint.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });

      this.selectionLayer.batchDraw();
    });

    // Mouse up - finalize selection
    stage.on('mouseup', (e) => {
      if (!this.isSelecting) return;

      this.isSelecting = false;

      // Re-enable stage dragging
      stage.draggable(true);

      // Get all cards that intersect with selection box
      const selectedCards = this._getIntersectingCards();

      // Since we only start selection with Ctrl held, always add to existing selection
      // (Don't clear selection - this allows multiple Ctrl+drags to accumulate)
      selectedCards.forEach(cardData => {
        state.selectCard(cardData.id);
      });

      // Hide selection box
      this.selectionBox.visible(false);
      this.selectionLayer.batchDraw();

      // Reset flag
      this.ctrlWasHeld = false;
    });

    // Mouse leave - cancel selection if dragging outside stage
    stage.on('mouseleave', () => {
      if (this.isSelecting) {
        this.isSelecting = false;
        stage.draggable(true);
        this.selectionBox.visible(false);
        this.selectionLayer.batchDraw();
      }
    });
  }

  /**
   * Get all cards that intersect with selection box
   */
  _getIntersectingCards() {
    // Get box coordinates in canvas space (not screen space)
    const boxRect = {
      x: this.selectionBox.x(),
      y: this.selectionBox.y(),
      width: this.selectionBox.width(),
      height: this.selectionBox.height(),
    };

    const allCards = state.get('cards');

    return allCards.filter(cardData => {
      // Get card dimensions in canvas space
      const cardRect = {
        x: cardData.x,
        y: cardData.y,
        width: 200, // CARD.WIDTH
        height: cardData.height || 150, // Use card's actual height
      };

      // Check intersection
      return this._rectIntersect(boxRect, cardRect);
    });
  }

  /**
   * Check if two rectangles intersect
   */
  _rectIntersect(r1, r2) {
    return !(
      r1.x > r2.x + r2.width ||
      r1.x + r1.width < r2.x ||
      r1.y > r2.y + r2.height ||
      r1.y + r1.height < r2.y
    );
  }

  /**
   * Destroy box selection
   */
  destroy() {
    if (this.selectionLayer) {
      this.selectionLayer.destroy();
    }
  }
}

// Export singleton instance
export const boxSelection = new BoxSelection();
