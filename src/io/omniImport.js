/**
 * Omni Import
 * Handles zip backups, JSON, and images in one picker
 */

import { restoreBackupFromFile } from './backup.js';
import { importFromJSONFile } from './jsonIO.js';
import { ImageProcessor } from '../processing/ImageProcessor.js';
import { cardFactory } from '../cards/CardFactory.js';
import { db } from '../core/db.js';
import { CARD_TYPES, SPACING } from '../utils/constants.js';
import { statusNotification } from '../ui/statusNotification.js';

const IMAGE_START_X = 100;
const IMAGE_START_Y = 100;
const IMAGE_SPACING_X = SPACING.GRID_HORIZONTAL || 250;

async function importImages(files) {
  if (!files.length) return;

  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('image/')) continue;

    // Skip huge files >10MB
    if (file.size > 10 * 1024 * 1024) {
      statusNotification.showTemporary(`Image too large: ${file.name} (max 10MB)`, 'error');
      continue;
    }

    try {
      const { original, processed, width, height } = await ImageProcessor.processImage(file, 'medium');

      // First create card data to get ID
      const cardData = {
        type: CARD_TYPES.IMAGE,
        x: IMAGE_START_X + i * IMAGE_SPACING_X,
        y: IMAGE_START_Y,
        content: '',
        comments: '',
      };

      const savedCard = await db.addCard(cardData);

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

      await cardFactory.loadCard(savedCard);
      successCount++;
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      statusNotification.showTemporary(`Failed to process ${file.name}`, 'error');
    }
  }

  statusNotification.showTemporary(`Imported ${successCount} image(s)`, 'success');
}

export async function omniImport() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json,image/*';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) {
        resolve(false);
        return;
      }

      const zips = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
      const jsons = files.filter(f => f.name.toLowerCase().endsWith('.json'));
      const images = files.filter(f => f.type.startsWith('image/'));

      try {
        // Process ZIP backups
        for (const zipFile of zips) {
          await restoreBackupFromFile(zipFile);
        }

        // Process JSON imports
        for (const jsonFile of jsons) {
          await importFromJSONFile(jsonFile);
        }

        // Process images
        if (images.length > 0) {
          await importImages(images);
        }

        resolve(true);
      } catch (error) {
        console.error('Omni import failed:', error);
        statusNotification.showTemporary('Omni import failed: ' + error.message, 'error');
        resolve(false);
      }
    };

    input.click();
  });
}
