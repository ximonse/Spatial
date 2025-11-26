/**
 * Column View - List view for cards
 * Alternative to board view, shows cards in a scrollable list
 */

import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';
import { marked } from 'marked';
import { CARD } from '../utils/constants.js';

export class ColumnView {
  constructor() {
    this.containerEl = null;
    this.listEl = null;
    this.visible = false;
  }

  /**
   * Initialize column view
   */
  init() {
    this._createDOM();
    this._setupListeners();
  }

  /**
   * Create DOM elements
   */
  _createDOM() {
    // Create container
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'column-view';
    this.containerEl.className = 'column-view hidden';

    // Create header
    const header = document.createElement('div');
    header.className = 'column-view-header';
    header.innerHTML = `
      <h2>All Cards</h2>
      <div class="column-view-sort">
        <label>Sort by:</label>
        <select id="column-sort">
          <option value="updated">Last Modified</option>
          <option value="created">Date Created</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>
    `;

    // Create list container
    this.listEl = document.createElement('div');
    this.listEl.className = 'column-view-list';

    this.containerEl.appendChild(header);
    this.containerEl.appendChild(this.listEl);

    // Add to canvas container
    document.getElementById('canvas-container').appendChild(this.containerEl);
  }

  /**
   * Setup event listeners
   */
  _setupListeners() {
    // Subscribe to cards changes
    state.subscribe('cards', () => {
      if (this.visible) {
        this.render();
      }
    });

    // Subscribe to view changes
    state.subscribe('currentView', (view) => {
      this.setVisible(view === 'column');
    });

    // Sort change
    const sortSelect = document.getElementById('column-sort');
    sortSelect?.addEventListener('change', () => {
      this.render();
    });
  }

  /**
   * Show/hide column view
   */
  setVisible(visible) {
    this.visible = visible;
    if (visible) {
      this.containerEl.classList.remove('hidden');
      this.render();
      // Hide canvas overlay
      const overlayContainer = document.getElementById('card-overlay-container');
      if (overlayContainer) {
        overlayContainer.style.display = 'none';
      }
    } else {
      this.containerEl.classList.add('hidden');
      // Show canvas overlay
      const overlayContainer = document.getElementById('card-overlay-container');
      if (overlayContainer) {
        overlayContainer.style.display = 'block';
      }
    }
  }

  /**
   * Render cards in list
   */
  render() {
    const cards = state.get('cards');
    const sortBy = document.getElementById('column-sort')?.value || 'updated';

    // Sort cards
    const sortedCards = this._sortCards([...cards], sortBy);

    // Clear list
    this.listEl.innerHTML = '';

    if (sortedCards.length === 0) {
      this.listEl.innerHTML = '<div class="column-view-empty">No cards yet. Press N to create one.</div>';
      return;
    }

    // Render each card
    sortedCards.forEach(cardData => {
      const cardEl = this._createCardElement(cardData);
      this.listEl.appendChild(cardEl);
    });
  }

  /**
   * Sort cards
   */
  _sortCards(cards, sortBy) {
    switch (sortBy) {
      case 'updated':
        return cards.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      case 'created':
        return cards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'alpha':
        return cards.sort((a, b) => {
          const aText = (a.content || '').toLowerCase();
          const bText = (b.content || '').toLowerCase();
          return aText.localeCompare(bText);
        });
      default:
        return cards;
    }
  }

  /**
   * Create card element for list
   */
  _createCardElement(cardData) {
    const cardEl = document.createElement('div');
    cardEl.className = 'column-view-card';
    cardEl.dataset.cardId = cardData.id;

    // Check if selected
    if (state.isSelected(cardData.id)) {
      cardEl.classList.add('selected');
    }

    // Parse markdown
    let contentHtml = '';
    try {
      contentHtml = marked.parse(cardData.content || '');
    } catch (error) {
      contentHtml = cardData.content || '';
    }

    // Format dates
    const updatedDate = cardData.updatedAt
      ? new Date(cardData.updatedAt).toLocaleString()
      : 'Never';

    cardEl.innerHTML = `
      <div class="column-card-content">
        ${contentHtml}
      </div>
      <div class="column-card-meta">
        <span class="column-card-date">Modified: ${updatedDate}</span>
        ${cardData.pinned ? '<span class="column-card-pinned">📌 Pinned</span>' : ''}
      </div>
    `;

    // Click to select
    cardEl.addEventListener('click', (e) => {
      if (e.shiftKey || e.ctrlKey) {
        state.toggleCardSelection(cardData.id);
      } else {
        state.clearSelection();
        state.selectCard(cardData.id);
      }
      this.render(); // Re-render to show selection
    });

    // Double-click to edit
    cardEl.addEventListener('dblclick', () => {
      state.set('editingCardId', cardData.id);
    });

    return cardEl;
  }
}

// Export singleton instance
export const columnView = new ColumnView();
