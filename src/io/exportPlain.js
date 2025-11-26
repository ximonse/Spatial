/**
 * Plain Text Export
 * Export cards to unformatted plain text
 */

import { db } from '../core/db.js';

/**
 * Export to Plain text (unformatted)
 */
export async function exportToPlainText() {
  try {
    const cards = await db.getAllCards();

    if (cards.length === 0) {
      alert('No cards to export');
      return false;
    }

    // Sort by position
    const sortedCards = cards.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 50) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    // Generate plain text
    let text = `SPATIAL NOTE EXPORT\n`;
    text += `Exported on ${new Date().toLocaleString()}\n`;
    text += `${cards.length} card${cards.length !== 1 ? 's' : ''}\n\n`;
    text += `${'='.repeat(60)}\n\n`;

    sortedCards.forEach((card, index) => {
      text += `CARD ${index + 1}\n`;
      text += `${'-'.repeat(60)}\n\n`;
      text += `${card.content || ''}\n\n`;

      const tags = card.tags || [];
      const comments = card.comments || [];

      if (card.pinned || tags.length > 0 || comments.length > 0) {
        const metaParts = [];
        if (card.pinned) metaParts.push('PINNED');
        if (tags.length > 0) metaParts.push('Tags: ' + tags.map(t => `#${t}`).join(' '));
        if (comments.length > 0) metaParts.push('Comments: ' + comments.map(c => `&${c}`).join(' '));
        text += `[${metaParts.join(' | ')}]\n\n`;
      }

      text += `${'='.repeat(60)}\n\n`;
    });

    // Download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-export-${Date.now()}.txt`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${cards.length} cards to plain text`);
    return true;
  } catch (error) {
    console.error('Plain text export failed:', error);
    alert('Plain text export failed: ' + error.message);
    return false;
  }
}
