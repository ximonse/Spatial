/**
 * Konva Stage setup
 * Infinite 2D canvas for spatial card placement
 */

import Konva from 'konva';
import { ZOOM, COLORS } from '../utils/constants.js';
import { state } from './state.js';
import { overlayManager } from '../cards/overlayManager.js';

class StageManager {
  constructor() {
    this.stage = null;
    this.cardLayer = null;
    this.backgroundLayer = null;
    this.container = null;
  }

  /**
   * Initialize Konva stage
   */
  init(containerId) {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }

    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    // Create stage
    this.stage = new Konva.Stage({
      container: containerId,
      width,
      height,
      draggable: true, // Pan canvas by dragging
    });

    // Background layer (optional grid, etc.)
    this.backgroundLayer = new Konva.Layer();
    this.stage.add(this.backgroundLayer);

    // Card layer
    this.cardLayer = new Konva.Layer();
    this.stage.add(this.cardLayer);

    // Drawing layer
    this.drawingLayer = new Konva.Layer();
    this.stage.add(this.drawingLayer);

    // Setup zoom/pan
    this._setupZoomPan();

    // Handle window resize
    this._setupResize();

    // Apply initial theme
    this._applyTheme(state.get('theme'));

    return this.stage;
  }

  /**
   * Setup zoom and pan controls
   */
  _setupZoomPan() {
    const stage = this.stage;

    // Mouse wheel zoom
    stage.on('wheel', (e) => {
      e.evt.preventDefault();

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // Calculate new scale
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(
        ZOOM.MIN,
        Math.min(ZOOM.MAX, oldScale + direction * ZOOM.STEP)
      );

      state.set('zoom', newScale);

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
    });

    // Touch pinch-to-zoom
    let lastDist = 0;
    let lastCenter = null;

    stage.on('touchmove', (e) => {
      e.evt.preventDefault();
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];

      if (touch1 && touch2) {
        // Pinch zoom
        const dist = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (!lastDist) {
          lastDist = dist;
        }

        const scale = (stage.scaleX() * dist) / lastDist;
        const newScale = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, scale));

        stage.scale({ x: newScale, y: newScale });
        state.set('zoom', newScale);

        lastDist = dist;
      }
    });

    stage.on('touchend', () => {
      lastDist = 0;
      lastCenter = null;
    });
  }

  /**
   * Handle window resize
   */
  _setupResize() {
    const resizeObserver = new ResizeObserver(() => {
      if (this.container) {
        this.stage.width(this.container.offsetWidth);
        this.stage.height(this.container.offsetHeight);
        this.stage.batchDraw();
      }
    });

    resizeObserver.observe(this.container);
  }

  /**
   * Apply theme to stage
   */
  _applyTheme(theme) {
    this.stage.container().style.backgroundColor = theme.canvas;
  }

  /**
   * Get stage instance
   */
  getStage() {
    return this.stage;
  }

  /**
   * Get card layer
   */
  getCardLayer() {
    return this.cardLayer;
  }

  /**
   * Get drawing layer
   */
  getDrawingLayer() {
    return this.drawingLayer;
  }

  /**
   * Reset zoom and position
   */
  resetView() {
    this.stage.scale({ x: 1, y: 1 });
    this.stage.position({ x: 0, y: 0 });
    state.set('zoom', 1);
    this.stage.batchDraw();
  }

  /**
   * Center view on specific coordinates
   */
  centerOn(x, y) {
    const scale = this.stage.scaleX();
    const width = this.stage.width();
    const height = this.stage.height();

    this.stage.position({
      x: width / 2 - x * scale,
      y: height / 2 - y * scale,
    });

    this.stage.batchDraw();
  }

  /**
   * Zoom and pan the stage to fit an array of nodes
   * @param {Array<Konva.Node>} nodes - The nodes to fit in the view
   */
  zoomToFit(nodes) {
    if (!nodes || nodes.length === 0) {
      this.resetView();
      return;
    }

    const stage = this.getStage();
    const PADDING = 0.1; // 10% padding

    // Create a temporary group to get the bounding box of all nodes
    const tempGroup = new Konva.Group();
    nodes.forEach(node => tempGroup.add(node));
    const box = tempGroup.getClientRect();
    
    if (box.width === 0 || box.height === 0) {
      this.resetView();
      return;
    }

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    const scaleX = stageWidth / box.width;
    const scaleY = stageHeight / box.height;
    const scale = Math.min(scaleX, scaleY) * (1 - PADDING);

    const newScale = Math.max(ZOOM.MIN, Math.min(ZOOM.MAX, scale));

    const newPos = {
      x: -box.x * newScale + (stageWidth - box.width * newScale) / 2,
      y: -box.y * newScale + (stageHeight - box.height * newScale) / 2,
    };

    stage.to({
      x: newPos.x,
      y: newPos.y,
      scaleX: newScale,
      scaleY: newScale,
      duration: 0.3,
      easing: Konva.Easings.EaseInOut,
      onUpdate: () => {
        overlayManager.updateAllOverlays();
      },
    });

    state.set('zoom', newScale);
  }

  /**
   * Destroy stage
   */
  destroy() {
    if (this.stage) {
      this.stage.destroy();
    }
  }
}

// Export singleton instance
export const stageManager = new StageManager();
