/**
 * Context menu for cards
 * Shows card actions (OCR, edit, copy, duplicate, pin, delete)
 */

import { state } from '../core/state.js';
import { runOcrOnSelection } from './imageOcr.js';
import {
  copySelectedCards,
  duplicateSelectedCards,
  togglePinSelectedCards,
  deleteSelectedCards
} from './cardOperations.js';

class CardContextMenu {
  constructor() {
    this.menuEl = null;
    this._createMenu();
    this._bindGlobalHandlers();
  }

  _createMenu() {
    this.menuEl = document.createElement('div');
    this.menuEl.id = 'card-context-menu';
    this.menuEl.className = 'card-context-menu hidden';
    document.body.appendChild(this.menuEl);
  }

  _bindGlobalHandlers() {
    document.addEventListener('click', (e) => {
      if (!this.menuEl.classList.contains('hidden') && !this.menuEl.contains(e.target)) {
        this.hide();
      }
    });

    document.addEventListener('contextmenu', (e) => {
      // Close menu if right-click elsewhere without blocking native browser on non-canvas areas
      if (!this.menuEl.contains(e.target)) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  /**
   * Show context menu at a position
   * @param {number} x
   * @param {number} y
   */
  show(x, y) {
    this._renderItems();
    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
    this.menuEl.classList.remove('hidden');
  }

  hide() {
    this.menuEl.classList.add('hidden');
  }

  _hasImageSelected() {
    return state.getSelectedCards().some(c => c.type === 'image');
  }

  _renderItems() {
    const items = [];
    const hasSelection = state.getSelectedCards().length > 0;

    if (this._hasImageSelected()) {
      items.push({ label: '🧠 OCR selected images', action: async () => { await runOcrOnSelection(); this.hide(); } });
    }

    if (hasSelection) {
      items.push(
        { label: '✏️ Edit first selected', action: () => { const first = state.getSelectedCards()[0]; if (first) state.set('editingCardId', first.id); this.hide(); } },
        { label: '📋 Copy selected', action: () => { copySelectedCards(); this.hide(); } },
        { label: '➕ Duplicate selected', action: async () => { await duplicateSelectedCards(); this.hide(); } },
        { label: '📌 Pin/unpin selected', action: async () => { await togglePinSelectedCards(); this.hide(); } },
        { label: '🗑️ Delete selected', action: async () => { await deleteSelectedCards(); this.hide(); } },
      );
    }

    if (items.length === 0) {
      items.push({ label: 'No actions available', action: () => this.hide(), disabled: true });
    }

    this.menuEl.innerHTML = items.map((item, idx) => `
      <button class="context-item" data-idx="${idx}" ${item.disabled ? 'disabled' : ''}>
        ${item.label}
      </button>
    `).join('');

    this.menuEl.querySelectorAll('.context-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.idx);
        const item = items[index];
        if (!item.disabled) {
          item.action();
        }
      });
    });
  }
}

export const cardContextMenu = new CardContextMenu();
