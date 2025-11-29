/**
 * Context Builder - Creates token-efficient context from cards
 * Converts JSON card data to compact text format for AI consumption
 */

import { searchCards } from '../search/search.js';

/**
 * Spatial regions for grouping cards
 */
const REGIONS = {
  TOP_LEFT: { name: 'Topp-vänster', x: [0, 500], y: [0, 300] },
  TOP_CENTER: { name: 'Topp-mitten', x: [500, 1000], y: [0, 300] },
  TOP_RIGHT: { name: 'Topp-höger', x: [1000, Infinity], y: [0, 300] },
  MIDDLE_LEFT: { name: 'Mitten-vänster', x: [0, 500], y: [300, 700] },
  MIDDLE_CENTER: { name: 'Mitten', x: [500, 1000], y: [300, 700] },
  MIDDLE_RIGHT: { name: 'Mitten-höger', x: [1000, Infinity], y: [300, 700] },
  BOTTOM_LEFT: { name: 'Botten-vänster', x: [0, 500], y: [700, Infinity] },
  BOTTOM_CENTER: { name: 'Botten-mitten', x: [500, 1000], y: [700, Infinity] },
  BOTTOM_RIGHT: { name: 'Botten-höger', x: [1000, Infinity], y: [700, Infinity] },
};

class ContextBuilder {
  /**
   * Build context based on user query
   * @param {string} query - User's question or command
   * @param {Array} cards - All cards
   * @returns {Object} - { context: string, relevantCards: Array, strategy: string }
   */
  buildContext(query, cards) {
    const intent = this.analyzeIntent(query);
    let relevantCards = cards;
    let strategy = 'full';

    // Filter relevant cards based on intent
    if (intent.hasSearchTerms) {
      const searchQuery = intent.searchTerms.join(' ');
      const matchingIds = searchCards(cards, searchQuery);
      relevantCards = cards.filter(c => matchingIds.has(c.id));
      strategy = 'filtered';
    } else if (intent.hasTagFilter) {
      relevantCards = cards.filter(c =>
        c.tags && c.tags.some(tag =>
          intent.tags.some(t => tag.toLowerCase().includes(t.toLowerCase()))
        )
      );
      strategy = 'tag-filtered';
    } else if (intent.hasSpatialFilter) {
      relevantCards = this.filterBySpatialRegion(cards, intent.spatialRegion);
      strategy = 'spatial-filtered';
    }

    // Build compact context
    const context = this.buildCompactContext(relevantCards, cards.length, strategy);

    console.log(`📦 Context size: ${context.length} characters`);

    return {
      context,
      relevantCards,
      strategy,
      intent,
    };
  }

  /**
   * Analyze user intent from query
   * @param {string} query - User query
   * @returns {Object} - Intent object
   */
  analyzeIntent(query) {
    const lower = query.toLowerCase();

    // Check for search terms (quoted or hashtags)
    const searchTerms = [];
    const hashtagMatches = query.match(/#\w+/g);
    if (hashtagMatches) {
      searchTerms.push(...hashtagMatches);
    }

    // Check for tag filters
    const tags = [];
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(t => t.substring(1)));
    }

    // Check for spatial keywords
    const spatialKeywords = [
      'topp', 'botten', 'mitten', 'vänster', 'höger',
      'top', 'bottom', 'middle', 'left', 'right',
    ];
    const hasSpatialFilter = spatialKeywords.some(kw => lower.includes(kw));
    let spatialRegion = null;
    if (hasSpatialFilter) {
      spatialRegion = this.detectSpatialRegion(lower);
    }

    // Check for arrangement intent
    const hasArrangement = /arrangera|sortera|organisera|gruppera|layout|arrange|organize/i.test(query);

    // Check for search intent
    const hasSearch = /sök|hitta|finn|visa|lista|search|find|show|list/i.test(query);

    // Check for analysis intent
    const hasAnalysis = /analysera|sammanfatta|förklara|vad handlar|analyze|summarize|explain/i.test(query);

    return {
      hasSearchTerms: searchTerms.length > 0,
      searchTerms,
      hasTagFilter: tags.length > 0,
      tags,
      hasSpatialFilter,
      spatialRegion,
      hasArrangement,
      hasSearch,
      hasAnalysis,
    };
  }

  /**
   * Detect spatial region from query
   * @param {string} query - Lowercase query
   * @returns {string|null} - Region name
   */
  detectSpatialRegion(query) {
    if (query.includes('topp') || query.includes('top')) {
      if (query.includes('vänster') || query.includes('left')) return 'TOP_LEFT';
      if (query.includes('höger') || query.includes('right')) return 'TOP_RIGHT';
      return 'TOP_CENTER';
    }
    if (query.includes('botten') || query.includes('bottom')) {
      if (query.includes('vänster') || query.includes('left')) return 'BOTTOM_LEFT';
      if (query.includes('höger') || query.includes('right')) return 'BOTTOM_RIGHT';
      return 'BOTTOM_CENTER';
    }
    if (query.includes('mitten') || query.includes('middle') || query.includes('center')) {
      if (query.includes('vänster') || query.includes('left')) return 'MIDDLE_LEFT';
      if (query.includes('höger') || query.includes('right')) return 'MIDDLE_RIGHT';
      return 'MIDDLE_CENTER';
    }
    return null;
  }

  /**
   * Filter cards by spatial region
   * @param {Array} cards - All cards
   * @param {string} regionName - Region name
   * @returns {Array} - Filtered cards
   */
  filterBySpatialRegion(cards, regionName) {
    if (!regionName || !REGIONS[regionName]) return cards;

    const region = REGIONS[regionName];
    return cards.filter(card => {
      const x = card.x || 0;
      const y = card.y || 0;
      return x >= region.x[0] && x < region.x[1] &&
             y >= region.y[0] && y < region.y[1];
    });
  }

  /**
   * Build compact text context from cards
   * @param {Array} cards - Cards to include
   * @param {number} totalCards - Total number of cards
   * @param {string} strategy - Filter strategy used
   * @returns {string} - Compact context
   */
  buildCompactContext(cards, totalCards, strategy) {
    let context = `=== KORT (${cards.length} av ${totalCards} totalt) ===\n\n`;

    if (strategy !== 'full') {
      context += `(Filtrerade resultat - visa endast relevanta kort)\n\n`;
    }

    // Group by region for better spatial understanding
    const byRegion = this.groupByRegion(cards);

    Object.entries(byRegion).forEach(([regionKey, regionCards]) => {
      if (regionCards.length === 0) return;

      const region = REGIONS[regionKey];
      context += `📍 ${region.name} (${regionCards.length} kort)\n`;

      regionCards.forEach((card, idx) => {
        context += this.formatCard(card, idx);
      });

      context += '\n';
    });

    // Add pinned cards separately
    const pinnedCards = cards.filter(c => c.pinned);
    if (pinnedCards.length > 0) {
      context += `📌 PINNED (${pinnedCards.length} kort)\n`;
      pinnedCards.forEach((card, idx) => {
        context += this.formatCard(card, idx);
      });
      context += '\n';
    }

    return context;
  }

  /**
   * Format single card for context
   * @param {Object} card - Card data
   * @param {number} index - Index in list
   * @returns {string} - Formatted card
   */
  formatCard(card, index) {
    const content = (card.content || 'Tom anteckning').substring(0, 100);
    const tags = (card.tags || []).join(' ');
    const comments = card.comments ? ` | ${String(card.comments).substring(0, 50)}` : '';
    const position = `@(${Math.round(card.x || 0)},${Math.round(card.y || 0)})`;
    const date = card.modified ? ` | ${new Date(card.modified).toLocaleDateString('sv-SE')}` : '';
    const cardId = String(card.id).substring(0, 8);

    return `  [${cardId}] ${content}\n    ${tags}${comments} | ${position}${date}\n`;
  }

  /**
   * Group cards by spatial region
   * @param {Array} cards - All cards
   * @returns {Object} - Cards grouped by region
   */
  groupByRegion(cards) {
    const grouped = {};

    // Initialize all regions
    Object.keys(REGIONS).forEach(key => {
      grouped[key] = [];
    });

    // Group cards
    cards.forEach(card => {
      const region = this.getCardRegion(card);
      if (grouped[region]) {
        grouped[region].push(card);
      }
    });

    return grouped;
  }

  /**
   * Get region for a card
   * @param {Object} card - Card data
   * @returns {string} - Region key
   */
  getCardRegion(card) {
    const x = card.x || 0;
    const y = card.y || 0;

    for (const [key, region] of Object.entries(REGIONS)) {
      if (x >= region.x[0] && x < region.x[1] &&
          y >= region.y[0] && y < region.y[1]) {
        return key;
      }
    }

    return 'MIDDLE_CENTER'; // Default
  }
}

// Export singleton instance
export const contextBuilder = new ContextBuilder();
