/**
 * HTML overlay for image card content
 * Renders OCR text overlay on top of image cards
 */

import { marked } from 'marked';
import { CARD } from '../utils/constants.js';
import { stageManager } from '../core/stage.js';
import { state } from '../core/state.js';

export class ImageContentOverlay {
  constructor(
    cardId,
    content,
    initialX,
    initialY,
    initialHeight,
    comments = '',
    backgroundColor = null,
    ocrConfidence = null
  ) {
    this.cardId = cardId;
    this.content = content;
    this.comments = comments;
    this.backgroundColor = backgroundColor;
    this.ocrConfidence = ocrConfidence;
    this.x = initialX;
    this.y = initialY;
    this.height = initialHeight || CARD.MIN_HEIGHT;
    this.element = null;
    this.visible = true;
    this.selected = false;
    this.isSearchMatch = true;
  }

  /**
   * Create DOM element for image card overlay
   */
  create() {
    this.element = document.createElement('div');
    this.element.className = 'card-content-overlay image-card-overlay';
    this.element.dataset.cardId = this.cardId;

    // Render content (OCR text if available)
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
   * Update content (OCR text)
   */
  updateContent(content, comments = '') {
    this.content = content;
    this.comments = comments;
    if (!this.element) return;

    try {
      let html = '';

      // Only show text if content exists
      if (content) {
        html = marked.parse(content || '');
      }

      // Add comments in italic gray if present
      if (comments) {
        html += `<div style="margin-top: 8px; font-style: italic; color: #6B7280; font-size: 0.9em;">${comments}</div>`;
      }

      // Add confidence indicator if available
      if (this.ocrConfidence !== null && content) {
        const confidencePercent = Math.round(this.ocrConfidence * 100);
        const confidenceColor =
          this.ocrConfidence >= 0.8 ? '#10B981' :
          this.ocrConfidence >= 0.5 ? '#F59E0B' :
          '#EF4444';

        html += `<div style="margin-top: 8px; font-size: 0.8em; color: ${confidenceColor};">OCR: ${confidencePercent}%</div>`;
      }

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
    const theme = state.get('theme');

    // Calculate screen position
    const screenX = this.x * scale + stagePos.x;
    const screenY = this.y * scale + stagePos.y;

    // Use custom backgroundColor if provided, otherwise use theme color
    const bgColor = this.backgroundColor || theme.card;

    // For image cards, make background semi-transparent if OCR text exists
    const opacity = this.content ? 0.95 : 0; // Show overlay only if text exists

    this.element.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: ${CARD.WIDTH}px;
      min-height: ${CARD.MIN_HEIGHT}px;
      padding: ${CARD.PADDING}px;
      box-sizing: border-box;
      overflow: hidden;
      pointer-events: none;
      font-size: 14px;
      line-height: 1.5;
      color: ${theme.text};
      background: ${this.content ? bgColor : 'transparent'};
      border: ${1 * scale}px solid ${this.selected ? (theme.borderSelected || theme.border) : theme.border};
      border-radius: ${CARD.CORNER_RADIUS}px;
      opacity: ${this.visible ? (this.isSearchMatch ? opacity : 0.3) : 0};
      transform: translate(${screenX}px, ${screenY}px) scale(${scale});
      transform-origin: top left;
      transition: opacity 0.2s, border-width 0.1s;
    `;
  }

  /**
   * Update OCR confidence
   */
  setOcrConfidence(confidence) {
    this.ocrConfidence = confidence;
    this.updateContent(this.content, this.comments);
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
   * Set selection state
   */
  setSelected(selected) {
    this.selected = selected;
    this.updatePosition();
  }

  /**
   * Set search match state
   */
  setSearchMatch(hasSearch, isMatch) {
    this.isSearchMatch = !hasSearch || isMatch;
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
