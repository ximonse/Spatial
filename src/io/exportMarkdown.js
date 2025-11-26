/**
 * Markdown Export
 * Export cards to Markdown document
 */

import { db } from '../core/db.js';

/**
 * Export to Markdown with italic comments
 */
export async function exportToMarkdown() {
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

    // Generate Markdown
    let markdown = `# Spatial Note Export\n\n`;
    markdown += `*Exported on ${new Date().toLocaleString()}*\n`;
    markdown += `*${cards.length} card${cards.length !== 1 ? 's' : ''}*\n\n`;
    markdown += `---\n\n`;

    sortedCards.forEach((card, index) => {
      markdown += `## Card ${index + 1}\n\n`;
      markdown += `${card.content || ''}\n\n`;

      const tags = card.tags || [];
      const comments = card.comments || [];

      if (card.pinned || tags.length > 0 || comments.length > 0) {
        markdown += `*Metadata:* `;
        const metaParts = [];
        if (card.pinned) metaParts.push('📌 Pinned');
        if (tags.length > 0) metaParts.push(tags.map(t => `#${t}`).join(' '));
        if (comments.length > 0) metaParts.push(comments.map(c => `*&${c}*`).join(' '));
        markdown += metaParts.join(' • ') + '\n\n';
      }

      markdown += `---\n\n`;
    });

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-export-${Date.now()}.md`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${cards.length} cards to Markdown`);
    return true;
  } catch (error) {
    console.error('Markdown export failed:', error);
    alert('Markdown export failed: ' + error.message);
    return false;
  }
}
