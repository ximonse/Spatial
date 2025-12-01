/**
 * Image OCR helpers (Gemini / OpenAI Vision)
 */

import { state } from '../core/state.js';
import { CARD_TYPES } from '../utils/constants.js';
import { settingsPanel } from './SettingsPanel.js';
import { statusNotification } from './statusNotification.js';
import { readImageWithGemini } from '../ai/geminiImageProcessor.js';
import { readImageWithOpenAI } from '../ai/openaiImageProcessor.js';

async function processWithProvider(cardId) {
  const provider = settingsPanel.getImageProcessorProvider();

  if (provider === 'openai') {
    await readImageWithOpenAI(cardId);
  } else {
    // Default to Gemini; it will fall back to OpenAI if quota is exceeded and a key exists
    await readImageWithGemini(cardId);
  }
}

/**
 * Run OCR on a specific card ID (image cards only)
 */
export async function runOcrForCard(cardId) {
  const card = state.getCard(cardId);
  if (!card || card.type !== CARD_TYPES.IMAGE) {
    statusNotification.showTemporary('OCR works only on image cards', 2500);
    return;
  }

  await processWithProvider(cardId);
}

/**
 * Run OCR on all selected image cards
 */
export async function runOcrOnSelection() {
  const selectedImages = state.getSelectedCards().filter(c => c.type === CARD_TYPES.IMAGE);
  if (selectedImages.length === 0) {
    statusNotification.showTemporary('Select one or more image cards for OCR', 2500);
    return;
  }

  for (const cardData of selectedImages) {
    await processWithProvider(cardData.id);
  }

  statusNotification.showTemporary(`OCR done for ${selectedImages.length} image card(s)`, 2500);
}
