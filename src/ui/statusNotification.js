/**
 * Status notification - bottom-left info display
 * Shows selection count, save status, and other activities
 */

import { state } from '../core/state.js';

class StatusNotification {
  constructor() {
    this.element = null;
    this.currentMessage = '';
    this.messageTimeout = null;
  }

  /**
   * Initialize status notification
   */
  init() {
    this.element = document.getElementById('status-notification');

    // Subscribe to selection changes
    state.subscribe('selectedCards', () => {
      this._updateSelectionStatus();
    });

    // Subscribe to cards changes (for total count)
    state.subscribe('cards', () => {
      this._updateSelectionStatus();
    });

    // Initial update
    this._updateSelectionStatus();
  }

  /**
   * Update selection status display
   */
  _updateSelectionStatus() {
    const selectedCards = state.get('selectedCards');
    const allCards = state.get('cards');

    const selectedCount = selectedCards.size;
    const totalCount = allCards.length;

    if (selectedCount > 0) {
      this._showPermanent(`${selectedCount} / ${totalCount} cards`);
    } else {
      this._showPermanent(`${totalCount} cards`);
    }
  }

  /**
   * Show a permanent message (until changed)
   */
  _showPermanent(message) {
    this.currentMessage = message;
    this._render();
  }

  /**
   * Show a temporary message (auto-hide after delay)
   */
  showTemporary(message, duration = 2000) {
    // Clear any existing timeout
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }

    // Show the temporary message
    this.element.textContent = message;
    this.element.classList.add('visible');

    // Restore previous message after delay
    this.messageTimeout = setTimeout(() => {
      this._render();
    }, duration);
  }

  /**
   * Render current message
   */
  _render() {
    if (this.element) {
      this.element.textContent = this.currentMessage;

      // Show/hide based on whether there's a message
      if (this.currentMessage) {
        this.element.classList.add('visible');
      } else {
        this.element.classList.remove('visible');
      }
    }
  }
}

// Export singleton instance
export const statusNotification = new StatusNotification();
