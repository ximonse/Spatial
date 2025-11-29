/**
 * Context Menu for bulk card operations
 */

import { CARD_COLOR_PALETTE } from '../utils/constants.js';
import { changeSelectedCardsColor, deleteSelectedCards } from './cardOperations.js';

class ContextMenu {
  constructor() {
    this.menu = null;
    this.isOpen = false;
  }

  /**
   * Initialize the context menu
   */
  init() {
    this.menu = document.createElement('div');
    this.menu.id = 'context-menu';
    this.menu.className = 'context-menu hidden';
    document.body.appendChild(this.menu);

    // Hide on outside click or escape key
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target)) {
        this.hide();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });
  }

  /**
   * Show the context menu at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} selectedCards - The currently selected card IDs
   */
  show(x, y, selectedCards) {
    if (!this.menu) this.init();

    const colorPaletteHTML = CARD_COLOR_PALETTE.map(color =>
      `<div class="color-swatch" data-color="${color}" style="background-color: ${color};"></div>`
    ).join('');

    this.menu.innerHTML = `
      <ul>
        <li class="submenu-parent">
          <span>🎨 Change Color</span>
          <div class="submenu color-palette">
            ${colorPaletteHTML}
          </div>
        </li>
        <li>🏷️ Manage Tags</li>
        <li class="separator"></li>
        <li id="delete-cards-btn">🗑️ Delete ${selectedCards.length} cards</li>
      </ul>
    `;

    // Add event listeners
    this.menu.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        changeSelectedCardsColor(color);
        this.hide();
      });
    });

    this.menu.querySelector('#delete-cards-btn').addEventListener('click', () => {
      deleteSelectedCards();
      this.hide();
    });


    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.classList.remove('hidden');
    this.isOpen = true;
  }

  /**
   * Hide the context menu
   */
  hide() {
    if (!this.menu) return;
    this.menu.classList.add('hidden');
    this.isOpen = false;
  }
}

export const contextMenu = new ContextMenu();
