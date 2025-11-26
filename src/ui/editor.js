/**
 * Inline card editor
 * Opens a modal dialog for editing card content
 */

import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';
import { marked } from 'marked';

export class CardEditor {
  constructor() {
    this.editorEl = null;
    this.textareaEl = null;
    this.previewEl = null;
    this.currentCardId = null;
  }

  /**
   * Initialize editor
   */
  init() {
    this._createEditorDOM();
    this._setupListeners();
  }

  /**
   * Create editor DOM elements
   */
  _createEditorDOM() {
    // Create editor overlay
    this.editorEl = document.createElement('div');
    this.editorEl.id = 'card-editor';
    this.editorEl.className = 'editor-overlay hidden';
    this.editorEl.innerHTML = `
      <div class="editor-modal">
        <div class="editor-header">
          <h3>Edit Card</h3>
          <button id="editor-close" class="editor-close">×</button>
        </div>
        <div class="editor-body">
          <textarea id="editor-textarea" placeholder="Write your note here... (Markdown supported)"></textarea>
          <div class="editor-preview">
            <h4>Preview</h4>
            <div id="editor-preview-content"></div>
          </div>
        </div>
        <div class="editor-footer">
          <button id="editor-cancel" class="btn-secondary">Cancel (Esc)</button>
          <button id="editor-save" class="btn-primary">Save (Ctrl+Enter)</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.editorEl);

    // Get references
    this.textareaEl = document.getElementById('editor-textarea');
    this.previewEl = document.getElementById('editor-preview-content');
  }

  /**
   * Setup event listeners
   */
  _setupListeners() {
    // Subscribe to editing state changes
    state.subscribe('editingCardId', (cardId) => {
      if (cardId) {
        this.open(cardId);
      }
    });

    // Close button
    document.getElementById('editor-close')?.addEventListener('click', () => {
      this.close();
    });

    // Cancel button
    document.getElementById('editor-cancel')?.addEventListener('click', () => {
      this.close();
    });

    // Save button
    document.getElementById('editor-save')?.addEventListener('click', () => {
      this.save();
    });

    // Click outside to close
    this.editorEl?.addEventListener('click', (e) => {
      if (e.target === this.editorEl) {
        this.close();
      }
    });

    // Textarea input - update preview
    this.textareaEl?.addEventListener('input', () => {
      this._updatePreview();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.editorEl.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.save();
        }
      }
    });
  }

  /**
   * Open editor for a card
   */
  open(cardId) {
    this.currentCardId = cardId;
    const cardData = state.getCard(cardId);

    if (!cardData) {
      console.error('Card not found:', cardId);
      return;
    }

    // Set textarea content
    this.textareaEl.value = cardData.content || '';

    // Update preview
    this._updatePreview();

    // Show editor
    this.editorEl.classList.remove('hidden');

    // Focus textarea
    setTimeout(() => {
      this.textareaEl.focus();
      this.textareaEl.setSelectionRange(
        this.textareaEl.value.length,
        this.textareaEl.value.length
      );
    }, 100);
  }

  /**
   * Close editor
   */
  close() {
    this.editorEl.classList.add('hidden');
    this.currentCardId = null;
    this.textareaEl.value = '';
    state.set('editingCardId', null);
  }

  /**
   * Save card content
   */
  async save() {
    if (!this.currentCardId) return;

    const content = this.textareaEl.value;

    // Update card
    await cardFactory.updateCard(this.currentCardId, { content });

    console.log('✅ Card saved');

    this.close();
  }

  /**
   * Update markdown preview
   */
  _updatePreview() {
    const content = this.textareaEl.value;

    if (!content) {
      this.previewEl.innerHTML = '<p class="preview-empty">Nothing to preview...</p>';
      return;
    }

    try {
      const html = marked.parse(content);
      this.previewEl.innerHTML = html;
    } catch (error) {
      console.error('Markdown parse error:', error);
      this.previewEl.innerHTML = '<p class="preview-error">Preview error</p>';
    }
  }
}

// Export singleton instance
export const cardEditor = new CardEditor();
