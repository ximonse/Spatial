/**
 * Zotero HTML export parser
 * Extracts highlights with colors, citations, and comments
 */

/**
 * Parse Zotero HTML export and extract notes
 * @param {string} htmlContent - The HTML content from Zotero export
 * @returns {Array<Object>} Array of note objects with content, citation, comment, and color
 */
export function parseZoteroHTML(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const notes = [];
  const paragraphs = doc.querySelectorAll('.zotero-note p');

  paragraphs.forEach(p => {
    try {
      // Extract highlighted quote and background color
      const highlightSpan = p.querySelector('.highlight span[style*="background-color"]');
      if (!highlightSpan) return;

      const quote = highlightSpan.textContent.trim();
      const backgroundColor = extractBackgroundColor(highlightSpan.style.backgroundColor);

      // Extract citation
      const citationSpan = p.querySelector('.citation a');
      const citation = citationSpan ? citationSpan.textContent.trim() : '';

      // Extract comment (text after pdf link)
      const pdfLink = p.querySelector('a[href*="open-pdf"]');
      let comment = '';
      if (pdfLink && pdfLink.nextSibling) {
        comment = pdfLink.nextSibling.textContent.trim();
      }

      notes.push({
        content: quote,
        citation: citation,
        comment: comment || '',
        backgroundColor: backgroundColor
      });
    } catch (error) {
      console.warn('Failed to parse note:', error, p);
    }
  });

  return notes;
}

/**
 * Extract background color from style attribute
 * Converts various formats to hex with alpha
 * @param {string} colorString - CSS color string (rgb, rgba, hex, etc.)
 * @returns {string} Hex color with alpha (e.g., #ffd40080)
 */
function extractBackgroundColor(colorString) {
  if (!colorString) return '#ffffff';

  // If already hex format, return as-is
  if (colorString.startsWith('#')) {
    return colorString;
  }

  // Parse rgb/rgba format
  const rgbaMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255;

    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }

  // Fallback to white
  return '#ffffff';
}

/**
 * Format note content for Markdown
 * Combines quote with citation in italic
 * @param {Object} note - Note object with content and citation
 * @returns {string} Formatted markdown text
 */
export function formatNoteContent(note) {
  let content = note.content;

  // Add citation in italic if present
  if (note.citation) {
    content += `\n\n*${note.citation}*`;
  }

  return content;
}

/**
 * Read Zotero HTML file from user's file system
 * @returns {Promise<string>} HTML content
 */
export async function readZoteroFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    };

    input.click();
  });
}
