/**
 * HTML overlay for card content
 * Renders Markdown on top of Konva canvas
 */

import { marked } from 'marked';
import { CARD } from '../utils/constants.js';
import { stageManager } from '../core/stage.js';

export class CardContentOverlay {
  constructor(cardId, content, initialX, initialY, initialHeight) {
    this.cardId = cardId;
    this.content = content;
    this.x = initialX;
    this.y = initialY;
    this.height = initialHeight || CARD.MIN_HEIGHT;
    this.element = null;
    this.visible = true;
  }

  /**
   * Create DOM element for card content
   */
  create() {
    this.element = document.createElement('div');
    this.element.className = 'card-content-overlay';
    this.element.dataset.cardId = this.cardId;

    // Render Markdown to HTML
    this.updateContent(this.content);

    // Add to overlay container
    let container = document.getElementById('card-overlay-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'card-overlay-container';
      container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      `;
      document.getElementById('canvas-container').appendChild(container);
    }

    container.appendChild(this.element);

    // Update position
    this.updatePosition();

    return this.element;
  }

  /**
   * Update content
   */
  updateContent(content) {
    this.content = content;
    if (!this.element) return;

    try {
      const html = marked.parse(content || '');
      this.element.innerHTML = html;
    } catch (error) {
      console.error('Markdown parse error:', error);
      this.element.textContent = content;
    }
  }

  /**
   * Update position based on Konva stage transform
   */
  updatePosition() {
    if (!this.element) return;

    const stage = stageManager.getStage();
    const scale = stage.scaleX();
    const stagePos = stage.position();

    // Calculate screen position
    const screenX = this.x * scale + stagePos.x;
    const screenY = this.y * scale + stagePos.y;

    this.element.style.cssText = `
      position: absolute;
      left: ${screenX}px;
      top: ${screenY}px;
      width: ${CARD.WIDTH * scale}px;
      height: ${this.height * scale}px;
      padding: ${CARD.PADDING * scale}px;
      box-sizing: border-box;
      overflow: hidden;
      pointer-events: none;
      font-size: ${14 * scale}px;
      line-height: 1.5;
      color: #111827;
      opacity: ${this.visible ? 1 : 0};
      transition: opacity 0.15s;
    `;
  }

  /**
   * Update card position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  }

  /**
   * Update card height
   */
  setHeight(height) {
    this.height = height;
    this.updatePosition();
  }

  /**
   * Show/hide overlay
   */
  setVisible(visible) {
    this.visible = visible;
    this.updatePosition();
  }

  /**
   * Destroy overlay
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
