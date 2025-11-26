/**
 * Search utilities for card matching
 * Supports wildcards and basic boolean operations
 */

/**
 * Convert wildcard pattern to regex
 * * matches any characters
 * ? matches single character
 */
function wildcardToRegex(pattern) {
  // Escape special regex characters except * and ?
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(escaped, 'i');
}

/**
 * Check if text matches a search pattern
 * Supports wildcards: * and ?
 */
function matchesPattern(text, pattern) {
  if (!pattern) return true;

  const regex = wildcardToRegex(pattern);
  return regex.test(text);
}

/**
 * Search cards and return matching IDs
 * @param {Array} cards - Array of card data objects
 * @param {string} query - Search query (supports wildcards)
 * @returns {Set} - Set of matching card IDs
 */
export function searchCards(cards, query) {
  const matchingIds = new Set();

  if (!query || query.trim() === '') {
    return matchingIds;
  }

  const trimmedQuery = query.trim();

  cards.forEach(card => {
    // Search in content
    const content = (card.content || '').toLowerCase();

    // Search in tags
    const tags = (card.tags || []).map(t => t.toLowerCase()).join(' ');

    // Search in comments
    const comments = (card.comments || '').toLowerCase();

    // Combine all searchable text
    const searchableText = `${content} ${tags} ${comments}`;

    // Check if pattern matches
    if (matchesPattern(searchableText, trimmedQuery)) {
      matchingIds.add(card.id);
    }
  });

  return matchingIds;
}
