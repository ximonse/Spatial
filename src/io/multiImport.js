/**
 * Multi-Import from Text
 * Create multiple cards from text input with double line breaks as separators
 */

import { cardFactory } from '../cards/CardFactory.js';
import { CARD_TYPES } from '../utils/constants.js';
import { state } from '../core/state.js';

/**
 * Parse text into multiple cards
 * Cards separated by double line breaks (\n\n)
 * Extract #hashtags and &comments
 */
export function parseTextToCards(text) {
  // Split by double line breaks
  const sections = text.split(/\n\n+/).filter(s => s.trim().length > 0);

  const cards = sections.map(section => {
    const lines = section.trim().split('\n');

    // Extract hashtags (#tag)
    const tags = [];
    const tagRegex = /#(\w+)/g;
    let match;
    while ((match = tagRegex.exec(section)) !== null) {
      tags.push(match[1]);
    }

    // Extract comments (&comment)
    const comments = [];
    const commentRegex = /&([^\n&]+)/g;
    while ((match = commentRegex.exec(section)) !== null) {
      comments.push(match[1].trim());
    }

    // Remove hashtags and comments from content for clean text
    let cleanContent = section
      .replace(/#\w+/g, '')
      .replace(/&[^\n&]+/g, '')
      .trim();

    return {
      content: cleanContent,
      tags,
      comments,
    };
  });

  return cards;
}

/**
 * Import multiple cards from text
 */
export async function multiImportFromText() {
  return new Promise((resolve) => {
    // Create modal for text input
    const modal = document.createElement('div');
    modal.className = 'editor-overlay';
    modal.innerHTML = `
      <div class="editor-modal">
        <div class="editor-header">
          <h3>Multi-Import Cards</h3>
          <button class="editor-close">&times;</button>
        </div>
        <div class="editor-body" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <label style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #6B7280;">
              Paste text (cards separated by double line breaks):
            </label>
            <textarea
              id="multi-import-textarea"
              style="flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; resize: none;"
              placeholder="Card 1 content #tag1 #tag2 &comment

Card 2 content #tag3

Card 3 content..."
            ></textarea>
          </div>
          <div style="background: #F9FAFB; padding: 12px; border-radius: 8px; font-size: 13px; color: #6B7280;">
            <strong>Instructions:</strong>
            <ul style="margin: 8px 0 0 20px; padding: 0;">
              <li>Separate cards with double line breaks (empty line)</li>
              <li>Use #hashtag for tags (e.g., #work #important)</li>
              <li>Use &comment for metadata (e.g., &author: John)</li>
            </ul>
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn-secondary" id="btn-cancel-import">Cancel</button>
          <button class="btn-primary" id="btn-import">Import Cards</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = document.getElementById('multi-import-textarea');
    const btnCancel = document.getElementById('btn-cancel-import');
    const btnImport = document.getElementById('btn-import');
    const btnClose = modal.querySelector('.editor-close');

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);

    // Close handlers
    const closeModal = () => {
      document.body.removeChild(modal);
      resolve(false);
    };

    btnCancel.addEventListener('click', closeModal);
    btnClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Import handler
    btnImport.addEventListener('click', async () => {
      const text = textarea.value.trim();

      if (!text) {
        alert('Please enter some text to import');
        return;
      }

      try {
        // Parse text
        const parsedCards = parseTextToCards(text);

        if (parsedCards.length === 0) {
          alert('No cards found. Make sure to separate cards with double line breaks.');
          return;
        }

        // Confirm import
        const confirmed = confirm(
          `Import ${parsedCards.length} card${parsedCards.length > 1 ? 's' : ''}?`
        );

        if (!confirmed) {
          return;
        }

        // Create cards in a grid layout
        const cardsPerRow = 5;
        const startX = 100;
        const startY = 100;
        const spacingX = 215;
        const spacingY = 165;

        for (let i = 0; i < parsedCards.length; i++) {
          const cardData = parsedCards[i];
          const row = Math.floor(i / cardsPerRow);
          const col = i % cardsPerRow;

          await cardFactory.createCard(CARD_TYPES.TEXT, {
            x: startX + col * spacingX,
            y: startY + row * spacingY,
            content: cardData.content,
            tags: cardData.tags,
            comments: cardData.comments,
          });
        }

        console.log(`✅ Imported ${parsedCards.length} cards`);
        alert(`Successfully imported ${parsedCards.length} card${parsedCards.length > 1 ? 's' : ''}`);

        document.body.removeChild(modal);
        resolve(true);
      } catch (error) {
        console.error('Multi-import failed:', error);
        alert('Import failed: ' + error.message);
        resolve(false);
      }
    });

    // Keyboard shortcuts
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  });
}
