import { cardFactory } from '../cards/CardFactory.js';
import { CARD_TYPES } from '../utils/constants.js';
import { state } from '../core/state.js';
import { assistantOrchestrator } from '../ai/AssistantOrchestrator.js';
import { statusNotification } from '../ui/statusNotification.js';

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
          <h3>Import & Split Text</h3>
          <button class="editor-close">&times;</button>
        </div>
        <div class="editor-body" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <label style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #6B7280;">
              Paste text to be split into cards:
            </label>
            <textarea
              id="multi-import-textarea"
              style="flex: 1; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; resize: none;"
              placeholder="Paste a long text, meeting notes, or an article here..."
            ></textarea>
          </div>
          <div style="background: #F9FAFB; padding: 12px; border-radius: 8px; font-size: 13px; color: #6B7280;">
            <strong>Instructions:</strong>
            <p style="margin-top: 8px;">Select a processing method below. 'Manual' requires you to separate cards with double line breaks. AI options will attempt to split the text automatically.</p>
          </div>
          <div>
            <label for="ai-provider-select" style="font-size: 12px; font-weight: 500; margin-bottom: 6px; color: #374151; display: block;">Processing Method:</label>
            <select id="ai-provider-select" style="width: 100%; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px; background: white;">
              <option value="manual">Manual (Split by empty line)</option>
              <option value="claude">AI Split (Claude)</option>
              <option value="gemini">AI Split (Gemini)</option>
              <option value="openai">AI Split (ChatGPT)</option>
            </select>
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn-secondary" id="btn-cancel-import">Cancel</button>
          <button class="btn-primary" id="btn-process-text">Process Text</button>
        </div>
        <div id="multi-import-loader" class="hidden" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; border-radius: 12px;">
          <p style="font-size: 16px; font-weight: 600;">🤖 AI is processing your text...</p>
          <p style="font-size: 13px; color: #6B7280;">This may take a moment.</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = document.getElementById('multi-import-textarea');
    const btnCancel = document.getElementById('btn-cancel-import');
    const btnProcess = document.getElementById('btn-process-text');
    const btnClose = modal.querySelector('.editor-close');
    const providerSelect = document.getElementById('ai-provider-select');
    const loader = document.getElementById('multi-import-loader');

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

    // Process Text handler
    btnProcess.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text) {
        statusNotification.showTemporary('Please enter some text to import', 3000);
        return;
      }

      let parsedCards = [];
      const provider = providerSelect.value;

      try {
        if (provider === 'manual') {
          parsedCards = parseTextToCards(text);
        } else {
          loader.classList.remove('hidden');
          try {
            parsedCards = await assistantOrchestrator.splitTextIntoCards(text, provider);
          } finally {
            loader.classList.add('hidden');
          }
        }

        if (!parsedCards || parsedCards.length === 0) {
          statusNotification.showTemporary('No cards could be parsed from the text.', 3000);
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
            tags: cardData.tags || [],
            comments: cardData.comments || [],
          });
        }

        statusNotification.showTemporary(`✅ Imported ${parsedCards.length} cards`, 3000);
        
        closeModal();
        resolve(true);

      } catch (error) {
        console.error('Multi-import failed:', error);
        statusNotification.showTemporary(`Import failed: ${error.message}`, 5000);
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
