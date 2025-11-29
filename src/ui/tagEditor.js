/**
 * Tag Editor Modal for bulk tag operations
 */

import { addTagToSelectedCards, removeTagFromSelectedCards } from './cardOperations.js';
import { state } from '../core/state.js';

class TagEditor {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.selectedCards = [];
  }

  init() {
    // The modal is created on-demand in the show() method
  }

  /**
   * Show the tag editor modal for the selected cards
   * @param {Array} selectedCards - The currently selected card objects
   */
  show(selectedCards) {
    this.selectedCards = selectedCards;
    if (this.selectedCards.length === 0) return;

    // Create modal structure
    this.modal = document.createElement('div');
    this.modal.className = 'tag-editor-overlay';
    document.body.appendChild(this.modal);
    this.isOpen = true;

    this._render();
  }

  hide() {
    if (!this.modal) return;
    this.modal.remove();
    this.modal = null;
    this.isOpen = false;
  }

  _getUniqueTags() {
    const tagSet = new Set();
    // We need to get the latest card data from the state
    const currentCards = state.getSelectedCards();
    currentCards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }

  _render() {
    const uniqueTags = this._getUniqueTags();
    const tagsHTML = uniqueTags.map(tag => `
      <div class="tag-item">
        <span>${tag}</span>
        <button class="remove-tag-btn" data-tag="${tag}">&times;</button>
      </div>
    `).join('');

    this.modal.innerHTML = `
      <div class="tag-editor-dialog">
        <h3>Manage Tags for ${this.selectedCards.length} Cards</h3>
        <div class="tag-list">
          ${tagsHTML || '<p class="no-tags">No common tags found.</p>'}
        </div>
        <div class="add-tag-section">
          <input type="text" id="new-tag-input" placeholder="Add a new tag..." />
          <button id="add-tag-btn" class="btn-primary">Add Tag</button>
        </div>
        <button id="close-tag-editor" class="btn-secondary">Close</button>
      </div>
    `;
    this._attachEventListeners();
  }

  _attachEventListeners() {
    const addTagBtn = this.modal.querySelector('#add-tag-btn');
    const newTagInput = this.modal.querySelector('#new-tag-input');

    // Add tag
    addTagBtn.addEventListener('click', async () => {
      const newTag = newTagInput.value.trim();
      if (newTag) {
        await addTagToSelectedCards(newTag);
        newTagInput.value = '';
        this._render(); // Re-render to show the new tag
      }
    });

    newTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addTagBtn.click();
      }
    });

    // Remove tags
    this.modal.querySelectorAll('.remove-tag-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tagToRemove = e.currentTarget.dataset.tag;
        await removeTagFromSelectedCards(tagToRemove);
        this._render(); // Re-render to remove the tag
      });
    });

    // Close button
    this.modal.querySelector('#close-tag-editor').addEventListener('click', () => this.hide());
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }
}

export const tagEditor = new TagEditor();
