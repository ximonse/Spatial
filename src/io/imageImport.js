/**
 * Image upload and import
 * Handles file selection, processing, and ImageCard creation
 */

import { cardFactory } from '../cards/CardFactory.js';
import { CARD_TYPES, SPACING } from '../utils/constants.js';
import { ImageProcessor } from '../processing/ImageProcessor.js';
import { db } from '../core/db.js';
import { state } from '../core/state.js';
import { backupImageCards } from '../core/imageBackup.js';

let statusCallback = null;

// Simple status notification function
function showStatus(message, type = 'info') {
  if (statusCallback) {
    statusCallback(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Allow external status handler to be set
export function setStatusCallback(callback) {
  statusCallback = callback;
}

/**
 * Prompt user to select import mode
 * @returns {Promise<string|null>} Selected mode or null if cancelled
 */
async function promptImportMode() {
  return new Promise(resolve => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'import-mode-overlay';
    overlay.innerHTML = `
      <div class="import-mode-dialog">
        <h3>Välj bildläge</h3>
        <div class="import-mode-options">
          <button class="import-mode-btn" data-mode="note">
            <strong>📝 Anteckningar</strong>
            <span>Svartvit, 400px bred</span>
            <span class="mode-detail">Minsta filstorlek, perfekt för handskrivna lappar</span>
          </button>
          <button class="import-mode-btn" data-mode="medium">
            <strong>🖼️ Medium</strong>
            <span>Färg, 600px bred</span>
            <span class="mode-detail">Balanserad kvalitet och storlek</span>
          </button>
          <button class="import-mode-btn" data-mode="photo">
            <strong>📷 Foto</strong>
            <span>Färg, 1200px bred</span>
            <span class="mode-detail">Hög kvalitet för foton</span>
          </button>
        </div>
        <button class="import-mode-cancel">Avbryt</button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Handle button clicks
    overlay.querySelectorAll('.import-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        document.body.removeChild(overlay);
        resolve(mode);
      });
    });

    overlay.querySelector('.import-mode-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(null);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(null);
      }
    });
  });
}

/**
 * Import images as ImageCards
 * Opens file picker and processes selected images
 * @param {string} mode - Processing mode: 'note', 'medium', 'photo'
 */
export async function importImage(mode = null) {
  return new Promise(async resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async e => {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        resolve(false);
        return;
      }

      // Ask user for import mode if not specified
      let selectedMode = mode;
      if (!selectedMode) {
        const modeChoice = await promptImportMode();
        if (!modeChoice) {
          resolve(false);
          return;
        }
        selectedMode = modeChoice;
      }

      try {
        showStatus(`Processing ${files.length} image(s)...`, 'info');

        let successCount = 0;
        const startX = 100;
        const startY = 100;
        const spacingX = SPACING.GRID_HORIZONTAL;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validate file type
          if (!file.type.startsWith('image/')) {
            console.warn(`Skipping non-image file: ${file.name}`);
            continue;
          }

          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            showStatus(`Image too large: ${file.name} (max 10MB)`, 'error');
            continue;
          }

          // Process image
          showStatus(`Processing ${file.name}...`, 'info');

          try {
            const { original, processed, width, height } =
              await ImageProcessor.processImage(file, selectedMode);

            // First create card data to get ID
            const cardData = {
              type: CARD_TYPES.IMAGE,
              x: startX + i * spacingX,
              y: startY,
              content: '',
              comments: '', // No automatic filename - only manual or Zotero comments
            };

            // Save to database first
            const savedCard = await db.addCard(cardData);

            // Save image to IndexedDB BEFORE creating card instance
            await db.saveImage(savedCard.id, {
              id: savedCard.id,
              cardId: savedCard.id,
              data: original,
              processedData: processed,
              width,
              height,
              format: file.type.split('/')[1],
              fileSize: file.size,
            });

            // Now load the card (which will find the image)
            await cardFactory.loadCard(savedCard);

            successCount++;
          } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            showStatus(`Failed to process ${file.name}`, 'error');
          }
        }

        showStatus(
          `Successfully imported ${successCount} image(s)`,
          'success'
        );

        // Store a lightweight backup so images persist even if IndexedDB is cleared
        backupImageCards();
        resolve(true);
      } catch (error) {
        console.error('Image import failed:', error);
        showStatus('Image import failed: ' + error.message, 'error');
        resolve(false);
      }
    };

    input.click();
  });
}
