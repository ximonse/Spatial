import { state } from '../core/state.js';
import { cardFactory } from '../cards/CardFactory.js';
import { evaluateBooleanQuery, normalizeSearchQuery } from '../utils/search.js'; // Import normalizeSearchQuery explicitly

/**
 * Retrieves all cards from the application state.
 * @returns {Array<Object>} An array of all card data objects.
 */
function getAllCards() {
  return state.get('cards');
}

/**
 * Builds a searchable text string from a card object.
 * This should include all relevant text content, tags, etc.
 * @param {Object} card - The card data object.
 * @returns {string} The concatenated searchable text.
 */
function buildCardSearchText(card) {
  let searchableText = '';
  if (card.data) {
    if (card.data.content) {
      searchableText += card.data.content + ' ';
    }
    if (card.data.title) {
      searchableText += card.data.title + ' ';
    }
    if (card.data.tags && Array.isArray(card.data.tags)) {
      searchableText += card.data.tags.join(' ') + ' ';
    }
    // Add other searchable properties as needed
  }
  return searchableText.trim();
}

/**
 * Search and highlight cards
 * @param {string} query - Search query
 * @param {Konva.Layer} layer - The Konva layer containing the card groups (no longer directly used for visual effects here)
 * @returns {Set<string>} A set of IDs of matching cards.
 */
export async function searchCards(query, layer) { // layer is no longer directly used for visual effects here
  console.log('[searchCards] Called with query:', query);

  // layer is not directly used for visual effects here, but might be needed for other purposes
  // if (!layer) {
  //   console.error('[searchCards] Layer not initialized');
  //   return new Set();
  // }

  const allCards = getAllCards(); // Use our local getAllCards

  console.log('[searchCards] Total cards in DB:', allCards.length);

  const normalizedQuery = normalizeSearchQuery(query); // Use normalizeSearchQuery from utils

  if (!normalizedQuery) {
    // Clear search - return empty set
    console.log('[searchCards] Clearing search, returning empty set');
    return new Set();
  }

  const matchingCards = new Set();

  // Find matching cards using boolean logic
  allCards.forEach(card => {
    const searchableText = buildCardSearchText(card);

    console.log('[searchCards] Checking card:', card.id);

    // Use boolean query evaluation
    if (evaluateBooleanQuery(normalizedQuery, searchableText)) {
      console.log('[searchCards] ✓ Match found:', card.id);
      matchingCards.add(card.id);
    }
  });

  console.log('[searchCards] Matching card IDs:', Array.from(matchingCards));
  console.log(`[searchCards] ✓ Search complete: found ${matchingCards.size} matches for "${query}"`);

  return matchingCards; // Return matching IDs for state.searchResults
}
