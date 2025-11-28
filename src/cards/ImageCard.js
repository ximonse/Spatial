/**
 * Image Card rendering with Konva
 * Displays image with optional OCR text overlay
 */

import Konva from 'konva';
import { CARD, COLORS } from '../utils/constants.js';
import { state } from '../core/state.js';
import { ImageContentOverlay } from './ImageContentOverlay.js';
import { setupCardInteractions } from './cardInteractions.js';
import { db } from '../core/db.js';

export class ImageCard {
  constructor(cardData) {
    this.data = cardData;
    this.group = null;
    this.rect = null;
    this.konvaImage = null;
    this.contentOverlay = null; // For OCR text
    this.commentsText = null; // For comments below image
    this.currentHeight = cardData.height || CARD.MIN_HEIGHT;
    this.imageObj = null;
    this.isSelected = false;
    this.isSearchMatch = true;
  }

  /**
   * Create Konva group for this card
   */
  async create() {
    const theme = state.get('theme');

    // Main group
    this.group = new Konva.Group({
      x: this.data.x,
      y: this.data.y,
      draggable: true,
      id: `card-${this.data.id}`,
    });

    // Background rectangle
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

    // Load and display image
    await this._loadImage();

    // Create OCR text overlay (if content exists)
    if (this.data.content) {
      this.contentOverlay = new ImageContentOverlay(
        this.data.id,
        this.data.content,
        this.data.x,
        this.data.y,
        this.currentHeight,
        this.data.comments || '',
        this.data.backgroundColor || null,
        this.data.ocrConfidence || null
      );
      this.contentOverlay.create();
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
   * Load image from IndexedDB and display on canvas
   */
  async _loadImage() {
    const imageRecord = await db.getImage(this.data.id);
    if (!imageRecord) {
      console.error(`No image found for card ${this.data.id}`);
      return;
    }

    // Use processed image if available, otherwise original
    const imageDataUrl = imageRecord.processedData || imageRecord.data;

    // Create HTML Image object
    this.imageObj = new Image();
    this.imageObj.src = imageDataUrl;

    return new Promise((resolve, reject) => {
      this.imageObj.onload = () => {
        // Calculate dimensions to fit in CARD.WIDTH (no padding)
        const aspectRatio = this.imageObj.height / this.imageObj.width;
        const displayWidth = CARD.WIDTH;
        const displayHeight = displayWidth * aspectRatio;

        // Create Konva.Image (no padding - fills entire card)
        // Only top corners rounded: [topLeft, topRight, bottomRight, bottomLeft]
        this.konvaImage = new Konva.Image({
          image: this.imageObj,
          x: 0,
          y: 0,
          width: displayWidth,
          height: displayHeight,
          cornerRadius: [CARD.CORNER_RADIUS, CARD.CORNER_RADIUS, 0, 0],
        });

        this.group.add(this.konvaImage);

        // Calculate total height
        let totalHeight = displayHeight;

        // If there are comments, add them below the image
        if (this.data.comments && this.data.comments.trim()) {
          const commentsText = new Konva.Text({
            x: CARD.PADDING,
            y: displayHeight + CARD.PADDING / 2,
            width: CARD.WIDTH - CARD.PADDING * 2,
            text: this.data.comments,
            fontSize: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
            fill: '#6B7280',
            lineHeight: 1.4,
            wrap: 'word',
          });

          this.group.add(commentsText);
          this.commentsText = commentsText;

          // Add height for comments
          totalHeight = displayHeight + CARD.PADDING / 2 + commentsText.height() + CARD.PADDING;
        }

        this._updateHeight(totalHeight);

        resolve();
      };

      this.imageObj.onerror = (error) => {
        console.error('Failed to load image:', error);
        reject(error);
      };
    });
  }

  /**
   * Update card height
   */
  _updateHeight(newHeight) {
    const safeHeight = Math.max(
      CARD.MIN_HEIGHT,
      Math.min(CARD.MAX_HEIGHT, newHeight)
    );

    // Only update if height changed significantly
    if (Math.abs(safeHeight - this.currentHeight) > 5) {
      this.currentHeight = safeHeight;
      this.data.height = safeHeight;
      this.rect.height(safeHeight);

      if (this.contentOverlay) {
        this.contentOverlay.setHeight(safeHeight);
      }

      this.group.getLayer()?.batchDraw();

      // Save to DB
      db.updateCard(this.data.id, { height: safeHeight });
    }
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

    // Update overlay if exists
    if (this.contentOverlay) {
      this.contentOverlay.setSelected(isSelected);
    }
  }

  /**
   * Update search match visual
   */
  setSearchMatch(hasSearch, isMatch) {
    this.isSearchMatch = !hasSearch || isMatch;
    if (this.contentOverlay) {
      this.contentOverlay.setSearchMatch(hasSearch, isMatch);
    }
  }

  /**
   * Update card content (OCR text)
   */
  updateContent(content, comments = null) {
    this.data.content = content;
    if (comments !== null) {
      this.data.comments = comments;

      // Update comments text below image
      if (this.commentsText) {
        this.commentsText.text(comments);

        // Recalculate height
        const displayHeight = this.konvaImage ? this.konvaImage.height() : this.currentHeight;
        const totalHeight = displayHeight + CARD.PADDING / 2 + this.commentsText.height() + CARD.PADDING;
        this._updateHeight(totalHeight);
      }
    }

    // Create overlay if it doesn't exist and content was added
    if (content && !this.contentOverlay) {
      this.contentOverlay = new ImageContentOverlay(
        this.data.id,
        content,
        this.data.x,
        this.data.y,
        this.currentHeight,
        this.data.comments || '',
        this.data.backgroundColor || null,
        this.data.ocrConfidence || null
      );
      this.contentOverlay.create();
    } else if (this.contentOverlay) {
      this.contentOverlay.updateContent(content, this.data.comments || '');
    }
  }

  /**
   * Update position
   */
  setPosition(x, y) {
    this.data.x = x;
    this.data.y = y;
    this.group.position({ x, y });
    if (this.contentOverlay) {
      this.contentOverlay.setPosition(x, y);
    }
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
    this.group.destroy();
    if (this.contentOverlay) {
      this.contentOverlay.destroy();
    }
    this.imageObj = null;
  }

  /**
   * Get Konva group
   */
  getGroup() {
    return this.group;
  }
}
