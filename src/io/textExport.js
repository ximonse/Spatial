/**
 * Text Export Dialog
 * Shows format selection dialog and delegates to specific exporters
 */

import { exportToHTML } from './exportHTML.js';
import { exportToMarkdown } from './exportMarkdown.js';
import { exportToPlainText } from './exportPlain.js';

/**
 * Show export format selection dialog
 */
export async function showExportDialog() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'editor-overlay';
    modal.innerHTML = `
      <div class="editor-modal" style="max-width: 500px;">
        <div class="editor-header">
          <h3>Export Cards</h3>
          <button class="editor-close">&times;</button>
        </div>
        <div class="editor-body" style="display: flex; flex-direction: column; gap: 12px; padding: 30px;">
          <button class="export-option-btn" data-format="html" style="padding: 16px; border: 2px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.15s; font-size: 14px;">
            <strong style="display: block; margin-bottom: 4px; font-size: 16px;">📄 HTML</strong>
            <span style="color: #6B7280;">Styled document with colors and formatting</span>
          </button>
          <button class="export-option-btn" data-format="markdown" style="padding: 16px; border: 2px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.15s; font-size: 14px;">
            <strong style="display: block; margin-bottom: 4px; font-size: 16px;">📝 Markdown</strong>
            <span style="color: #6B7280;">Plain text with markdown formatting</span>
          </button>
          <button class="export-option-btn" data-format="plain" style="padding: 16px; border: 2px solid #E5E7EB; background: white; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.15s; font-size: 14px;">
            <strong style="display: block; margin-bottom: 4px; font-size: 16px;">📃 Plain Text</strong>
            <span style="color: #6B7280;">Unformatted text for maximum compatibility</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const btnClose = modal.querySelector('.editor-close');
    const exportBtns = modal.querySelectorAll('.export-option-btn');

    // Hover effect
    exportBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = '#3B82F6';
        btn.style.background = '#F9FAFB';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.borderColor = '#E5E7EB';
        btn.style.background = 'white';
      });
    });

    // Close handler
    const closeModal = () => {
      document.body.removeChild(modal);
      resolve(false);
    };

    btnClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Export handlers
    exportBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const format = btn.dataset.format;
        document.body.removeChild(modal);

        let success = false;
        switch (format) {
          case 'html':
            success = await exportToHTML();
            break;
          case 'markdown':
            success = await exportToMarkdown();
            break;
          case 'plain':
            success = await exportToPlainText();
            break;
        }

        resolve(success);
      });
    });

    // ESC to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  });
}
