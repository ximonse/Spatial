/**
 * JSON Import/Export
 * Export and import all cards as JSON
 */

import { db } from '../core/db.js';
import { cardFactory } from '../cards/CardFactory.js';
import { state } from '../core/state.js';

/**
 * Export all cards to JSON file
 */
export async function exportToJSON() {
  try {
    const cards = await db.getAllCards();

    // Get all images
    const images = {};
    for (const card of cards) {
      if (card.type === 'image') {
        const imageData = await db.getImage(card.id);
        if (imageData) {
          images[card.id] = imageData.data;
        }
      }
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      cardCount: cards.length,
      cards,
      images,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-notes-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${cards.length} cards to JSON`);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed: ' + error.message);
    return false;
  }
}

/**
 * Import cards from JSON file
 */
export async function importFromJSON() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(false);
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate data
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error('Invalid JSON format: missing cards array');
        }

        // Confirm import
        const confirmed = confirm(
          `Import ${data.cardCount || data.cards.length} cards?\n\n` +
          `This will add cards to your existing collection.`
        );

        if (!confirmed) {
          resolve(false);
          return;
        }



        // Import cards and persist them before rendering so updates stick
        for (const cardData of data.cards) {
          // Save directly to IndexedDB to retain original IDs
          await db.cards.put({ ...cardData, id: cardData.id });
          await cardFactory.loadCard(cardData);
        }

        // Import images
        if (data.images) {
          for (const [cardId, imageData] of Object.entries(data.images)) {
            await db.saveImage(parseInt(cardId), imageData);
          }
        }

        console.log(`✅ Imported ${data.cards.length} cards`);
        alert(`Successfully imported ${data.cards.length} cards`);
        resolve(true);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed: ' + error.message);
        resolve(false);
      }
    };

    input.click();
  });
}
