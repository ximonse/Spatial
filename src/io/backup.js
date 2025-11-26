/**
 * Backup System (ZIP)
 * Backup and restore all cards + images as ZIP
 */

import JSZip from 'jszip';
import { db } from '../core/db.js';
import { cardFactory } from '../cards/CardFactory.js';

/**
 * Create backup ZIP
 */
export async function createBackup() {
  try {
    const zip = new JSZip();

    // Get all cards
    const cards = await db.getAllCards();

    // Add cards.json
    const cardsData = {
      version: '1.0',
      backupDate: new Date().toISOString(),
      cardCount: cards.length,
      cards,
    };

    zip.file('cards.json', JSON.stringify(cardsData, null, 2));

    // Add images
    const imagesFolder = zip.folder('images');
    for (const card of cards) {
      if (card.type === 'image') {
        const imageData = await db.getImage(card.id);
        if (imageData && imageData.data) {
          // Convert base64 to blob
          const base64 = imageData.data.split(',')[1];
          imagesFolder.file(`${card.id}.png`, base64, { base64: true });
        }
      }
    }

    // Generate ZIP
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-backup-${Date.now()}.zip`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Created backup with ${cards.length} cards`);
    return true;
  } catch (error) {
    console.error('Backup failed:', error);
    alert('Backup failed: ' + error.message);
    return false;
  }
}

/**
 * Restore from backup ZIP
 */
export async function restoreBackup() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(false);
        return;
      }

      try {
        const zip = await JSZip.loadAsync(file);

        // Read cards.json
        const cardsFile = zip.file('cards.json');
        if (!cardsFile) {
          throw new Error('Invalid backup: cards.json not found');
        }

        const cardsText = await cardsFile.async('text');
        const data = JSON.parse(cardsText);

        // Confirm restore
        const confirmed = confirm(
          `Restore backup from ${new Date(data.backupDate).toLocaleString()}?\n\n` +
          `${data.cardCount} cards\n\n` +
          `This will ADD these cards to your existing collection.`
        );

        if (!confirmed) {
          resolve(false);
          return;
        }

        // Restore cards
        for (const cardData of data.cards) {
          await cardFactory.loadCard(cardData);
        }

        // Restore images
        const imagesFolder = zip.folder('images');
        if (imagesFolder) {
          const imageFiles = [];
          imagesFolder.forEach((relativePath, file) => {
            imageFiles.push({ relativePath, file });
          });

          for (const { relativePath, file } of imageFiles) {
            const cardId = parseInt(relativePath.replace('.png', ''));
            const base64 = await file.async('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            await db.saveImage(cardId, dataUrl);
          }
        }

        console.log(`✅ Restored ${data.cards.length} cards from backup`);
        alert(`Successfully restored ${data.cards.length} cards`);
        resolve(true);
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Restore failed: ' + error.message);
        resolve(false);
      }
    };

    input.click();
  });
}
