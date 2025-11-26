/**
 * HTML Export
 * Export cards to styled HTML document
 */

import { db } from '../core/db.js';
import { marked } from 'marked';

/**
 * Export to HTML with color styling
 */
export async function exportToHTML() {
  try {
    const cards = await db.getAllCards();

    if (cards.length === 0) {
      alert('No cards to export');
      return false;
    }

    // Sort by position (top to bottom, left to right)
    const sortedCards = cards.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 50) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spatial Note Export</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #F9FAFB;
      color: #111827;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #E5E7EB;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .meta {
      margin-top: 10px;
      font-size: 14px;
      color: #6B7280;
    }
    .card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .card.pinned {
      border-left: 4px solid #F59E0B;
      background: #FFFBEB;
    }
    .card-meta {
      display: flex;
      gap: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #F3F4F6;
      font-size: 12px;
      color: #6B7280;
    }
    .card-tag {
      background: #DBEAFE;
      color: #1E40AF;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .card-comment {
      font-style: italic;
      color: #9CA3AF;
    }
    code {
      background: #E5E7EB;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #1F2937;
      color: #F9FAFB;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Spatial Note Export</h1>
    <div class="meta">
      Exported on ${new Date().toLocaleString()}<br>
      ${cards.length} card${cards.length !== 1 ? 's' : ''}
    </div>
  </div>
  ${sortedCards.map(card => {
    const contentHtml = marked.parse(card.content || '');
    const tags = card.tags || [];
    const comments = card.comments || [];

    return `
  <div class="card${card.pinned ? ' pinned' : ''}">
    ${contentHtml}
    ${tags.length > 0 || comments.length > 0 || card.pinned ? `
    <div class="card-meta">
      ${card.pinned ? '<span class="card-tag">📌 Pinned</span>' : ''}
      ${tags.map(tag => `<span class="card-tag">#${tag}</span>`).join('')}
      ${comments.map(comment => `<span class="card-comment">&${comment}</span>`).join('')}
    </div>
    ` : ''}
  </div>`;
  }).join('\n')}
</body>
</html>`;

    // Download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spatial-export-${Date.now()}.html`;
    a.click();

    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${cards.length} cards to HTML`);
    return true;
  } catch (error) {
    console.error('HTML export failed:', error);
    alert('HTML export failed: ' + error.message);
    return false;
  }
}
