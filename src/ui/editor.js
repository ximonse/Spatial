/**
 * Inline card editor
 * Opens a modal dialog for editing card content
 */

import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js'; // Import cardFactory
import { marked } from 'marked';
import { settingsPanel } from './SettingsPanel.js';

export class CardEditor {
  constructor() {
    this.editorEl = null;
    this.textareaEl = null;
    this.previewEl = null;
    this.tagsEl = null;
    this.commentsEl = null;
    this.currentCardId = null;
    this.geminiOcrBtn = null; // Reference to the Gemini OCR button
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
          <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
            <textarea id="editor-textarea" placeholder="Write your note here... (Markdown supported)" style="flex: 1;"></textarea>
            <input
              id="editor-tags"
              type="text"
              placeholder="Tags (comma separated, e.g: viktigt, projekt, idé)"
              style="padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px;"
            />
            <input
              id="editor-comments"
              type="text"
              placeholder="Comment (e.g: författare: Simon, deadline: 2024-12-31)"
              style="padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px;"
            />
            <button id="gemini-ocr-btn" class="btn-secondary hidden" style="margin-top: 10px;">✨ OCR with Gemini AI</button>
          </div>
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
    this.tagsEl = document.getElementById('editor-tags');
    this.commentsEl = document.getElementById('editor-comments');
    this.geminiOcrBtn = document.getElementById('gemini-ocr-btn');
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

    // AI OCR button
    this.geminiOcrBtn?.addEventListener('click', async () => {
      if (this.currentCardId) {
        const cardInstance = cardFactory.getCard(this.currentCardId);
        if (cardInstance && typeof cardInstance.processImageWithAI === 'function') {
          await cardInstance.processImageWithAI();
          // After processing, update the editor with new content/tags
          const updatedCardData = state.getCard(this.currentCardId);
          this.textareaEl.value = updatedCardData.content || '';
          this.tagsEl.value = (updatedCardData.tags || []).join(', ');
          this.commentsEl.value = updatedCardData.comments || '';
          this._updatePreview();
        }
      }
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
    const cardInstance = cardFactory.getCard(cardId); // Get card instance

    if (!cardData) {
      console.error('Card not found:', cardId);
      return;
    }

    // Set textarea content
    this.textareaEl.value = cardData.content || '';

    // Set tags (join array with commas)
    this.tagsEl.value = (cardData.tags || []).join(', ');

    // Set comments (join array with commas or use single string)
    if (Array.isArray(cardData.comments)) {
      this.commentsEl.value = cardData.comments.join(', ');
    } else {
      this.commentsEl.value = cardData.comments || '';
    }

    // Show/hide AI OCR button based on card type
    if (cardInstance && cardInstance.data.type === 'image') {
      const provider = settingsPanel.getImageProcessorProvider();
      const providerLabel = provider === 'openai' ? 'ChatGPT' : 'Gemini';
      this.geminiOcrBtn.textContent = `✨ OCR with ${providerLabel} AI`;
      this.geminiOcrBtn.classList.remove('hidden');
    } else {
      this.geminiOcrBtn.classList.add('hidden');
    }

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

    // Parse tags (comma separated, trim whitespace)
    const tagsText = this.tagsEl.value.trim();
    const tags = tagsText
      ? tagsText.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // Parse comments (store as single string)
    const comments = this.commentsEl.value.trim();

    // Update card
    await cardFactory.updateCard(this.currentCardId, {
      content,
      tags,
      comments
    });

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
