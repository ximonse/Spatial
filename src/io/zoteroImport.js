/**
 * Zotero HTML import functionality
 */

import { parseZoteroHTML, formatNoteContent, readZoteroFile } from '../import/zoteroParser.js';
import { cardFactory } from '../cards/CardFactory.js';
import { CARD_TYPES, CARD } from '../utils/constants.js';
import { statusNotification } from '../ui/statusNotification.js';

/**
 * Import notes from Zotero HTML export
 * Opens file picker, parses HTML, and creates cards
 */
export async function importZoteroNotes() {
  try {
    // Open file picker and read file
    statusNotification.showTemporary('Välj Zotero HTML-fil...');
    const htmlContent = await readZoteroFile();

    // Parse HTML to extract notes
    const notes = parseZoteroHTML(htmlContent);

    if (notes.length === 0) {
      statusNotification.showTemporary('Inga anteckningar hittades i filen');
      return;
    }

    // Create cards from notes
    let createdCount = 0;
    const startX = 100;
    const startY = 100;
    const spacing = CARD.MIN_HEIGHT + 20;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const content = formatNoteContent(note);

      // Create card with custom background color
      await cardFactory.createCard(CARD_TYPES.TEXT, {
        x: startX,
        y: startY + (i * spacing),
        content: content,
        comments: note.comment,
        backgroundColor: note.backgroundColor,
      });

      createdCount++;
    }

    statusNotification.showTemporary(`Importerade ${createdCount} anteckningar från Zotero`);
  } catch (error) {
    console.error('Zotero import failed:', error);
    statusNotification.showTemporary('Misslyckades att importera Zotero-fil');
  }
}
