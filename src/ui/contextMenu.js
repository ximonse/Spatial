/**
 * Context Menu for bulk card operations
 */

import { CARD_COLOR_PALETTE } from '../utils/constants.js';
import { changeSelectedCardsColor, deleteSelectedCards } from './cardOperations.js';
import { tagEditor } from './tagEditor.js';
import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js'; // Import cardFactory

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
   * @param {Array} selectedIds - The currently selected card IDs
   */
  show(x, y, selectedIds) {
    if (!this.menu) this.init();

    const colorPaletteHTML = CARD_COLOR_PALETTE.map(color =>
      `<div class="color-swatch" data-color="${color}" style="background-color: ${color};"></div>`
    ).join('');

    // Check if all selected cards are ImageCards
    const allSelectedAreImageCards = selectedIds.every(id => {
      const card = cardFactory.getCard(id);
      return card && card.data.type === 'image';
    });

    let geminiOptionHTML = '';
    if (allSelectedAreImageCards) {
      geminiOptionHTML = `<li id="process-with-gemini-btn">✨ Process with Gemini AI</li>`;
    }

    this.menu.innerHTML = `
      <ul>
        <li class="submenu-parent">
          <span>🎨 Change Color</span>
          <div class="submenu color-palette">
            ${colorPaletteHTML}
          </div>
        </li>
        <li id="manage-tags-btn">🏷️ Manage Tags</li>
        ${geminiOptionHTML}
        <li class="separator"></li>
        <li id="delete-cards-btn">🗑️ Delete ${selectedIds.length} cards</li>
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

    this.menu.querySelector('#manage-tags-btn').addEventListener('click', () => {
      const selectedCards = state.getSelectedCards();
      tagEditor.show(selectedCards);
      this.hide();
    });

    if (allSelectedAreImageCards) {
      this.menu.querySelector('#process-with-gemini-btn').addEventListener('click', async () => {
        for (const id of selectedIds) {
          const imageCardInstance = cardFactory.getCard(id);
          if (imageCardInstance && typeof imageCardInstance.processWithGemini === 'function') {
            await imageCardInstance.processWithGemini();
          }
        }
        this.hide();
      });
    }

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
