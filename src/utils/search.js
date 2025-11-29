/**
 * Normalizes a search query by converting it to lowercase, trimming whitespace,
 * and replacing multiple spaces with a single space.
 * @param {string} query - The raw search query.
 * @returns {string} The normalized search query.
 */
export function normalizeSearchQuery(query) {
  if (typeof query !== 'string') {
    return '';
  }
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a text matches a term, supporting '*' as a wildcard.
 * @param {string} term - The search term, possibly with wildcards.
 * @param {string} text - The text to search within.
 * @returns {boolean} True if the text matches the term, false otherwise.
 */
export function matchWithWildcard(term, text) {
  if (typeof term !== 'string' || typeof text !== 'string') {
    return false;
  }
  const pattern = term.replace(/\*/g, '.*'); // Replace '*' with '.*' for regex
  const regex = new RegExp(`^${pattern}$`, 'i'); // 'i' for case-insensitive
  return regex.test(text);
}

/**
 * Checks for proximity matches within a text.
 * Supports 'NEAR/x' or 'N/x' syntax, where x is the maximum word distance.
 * Example: "word1 NEAR/5 word2"
 * @param {string} query - The proximity query string.
 * @param {string} text - The text to search within.
 * @returns {boolean} True if the proximity condition is met, false otherwise.
 */
export function checkProximity(query, text) {
  const parts = query.match(/(.+?)\s+(?:near|n)\/(\d+)\s+(.+)/i);
  if (!parts) {
    return false;
  }

  const term1 = normalizeSearchQuery(parts[1]);
  const distance = parseInt(parts[2], 10);
  const term2 = normalizeSearchQuery(parts[3]);

  if (!term1 || !term2 || isNaN(distance)) {
    return false;
  }

  const words = text.split(/\s+/).filter(word => word.length > 0);

  let foundTerm1 = -1;
  let foundTerm2 = -1;

  for (let i = 0; i < words.length; i++) {
    if (matchWithWildcard(term1, words[i])) {
      foundTerm1 = i;
    }
    if (matchWithWildcard(term2, words[i])) {
      foundTerm2 = i;
    }

    if (foundTerm1 !== -1 && foundTerm2 !== -1) {
      if (Math.abs(foundTerm1 - foundTerm2) <= distance) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Evaluate boolean search query
 * Supports: OR, AND, NOT, "exact phrases", *, ( ), NEAR/x, N/x
 */
export function evaluateBooleanQuery(query, searchableText) {
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedText = typeof searchableText === 'string' ? searchableText.toLowerCase() : '';

  if (!normalizedQuery) {
    console.log('[evaluateBooleanQuery] Empty or invalid query provided');
    return false;
  }

  // Handle different boolean operators
  console.log('[evaluateBooleanQuery] Query:', normalizedQuery, 'SearchableText:', normalizedText.substring(0, 50));

  // Handle parentheses (highest precedence)
  if (normalizedQuery.includes('(')) {
    // Find matching parentheses and evaluate recursively
    const parenMatch = normalizedQuery.match(/\(([^()]+)\)/);
    if (parenMatch) {
      const innerQuery = parenMatch[1];
      const innerResult = evaluateBooleanQuery(innerQuery, normalizedText);
      // Replace the parentheses group with result placeholder
      const replaced = normalizedQuery.replace(parenMatch[0], innerResult ? '__TRUE__' : '__FALSE__');
      return evaluateBooleanQuery(replaced, normalizedText);
    }
  }

  // Handle result placeholders from parentheses
  if (normalizedQuery === '__TRUE__') return true;
  if (normalizedQuery === '__FALSE__') return false;

  // Handle proximity search (NEAR/x or N/x)
  if (/\s+(near|n)\/\d+\s+/i.test(normalizedQuery)) {
    return checkProximity(normalizedQuery, normalizedText);
  }

  // Split by OR first (lowest precedence)
  if (normalizedQuery.includes(' or ')) {
    const orParts = normalizedQuery.split(' or ');
    console.log('[evaluateBooleanQuery] OR parts:', orParts);
    return orParts.some(part => evaluateBooleanQuery(part.trim(), normalizedText));
  }

  // Handle NOT operations
  if (normalizedQuery.includes(' not ')) {
    const notIndex = normalizedQuery.indexOf(' not ');
    const beforeNot = normalizedQuery.substring(0, notIndex).trim();
    const afterNot = normalizedQuery.substring(notIndex + 5).trim(); // ' not '.length = 5

    // If there's something before NOT, it must match
    let beforeMatches = true;
    if (beforeNot) {
      beforeMatches = evaluateBooleanQuery(beforeNot, normalizedText);
    }

    // The part after NOT must NOT match
    const afterMatches = evaluateBooleanQuery(afterNot, normalizedText);

    return beforeMatches && !afterMatches;
  }

  // Handle AND operations (default behavior and explicit)
  const andParts = normalizedQuery.includes(' and ')
    ? normalizedQuery.split(' and ')
    : normalizedQuery.split(' ').filter(term => term.length > 0);

  return andParts.every(term => {
    term = term.trim();
    console.log('[evaluateBooleanQuery] Checking term:', term);

    // Skip placeholders
    if (term === '__TRUE__') return true;
    if (term === '__FALSE__') return false;

    // Remove quotes if present for exact phrase matching
    if (term.startsWith('"') && term.endsWith('"')) {
      // Exact phrase search
      const phrase = term.slice(1, -1);
      console.log('[evaluateBooleanQuery] Exact phrase search:', phrase, 'Match:', normalizedText.includes(phrase));
      return normalizedText.includes(phrase);
    } else if (term.startsWith("'") && term.endsWith("'")) {
      // Also support single quotes
      const phrase = term.slice(1, -1);
      console.log('[evaluateBooleanQuery] Single quote phrase search:', phrase, 'Match:', normalizedText.includes(phrase));
      return normalizedText.includes(phrase);
    } else {
      // Regular word search with wildcard support
      const matches = matchWithWildcard(term, normalizedText);
      console.log('[evaluateBooleanQuery] Regular/wildcard search:', term, 'Match:', matches);
      return matches;
    }
  });
}