/**
 * Search utilities for card matching
 * Supports wildcards and boolean operations (AND, OR, NOT)
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
 * Tokenize search query into words, operators, and parentheses
 * @param {string} query - Search query
 * @returns {Array} - Array of tokens
 */
function tokenize(query) {
  const tokens = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < query.length; i++) {
    const char = query[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === ' ' || char === '(' || char === ')')) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      if (char === '(' || char === ')') {
        tokens.push(char);
      }
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse tokens into expression tree
 * Supports: AND, OR, NOT, &&, ||, -, ()
 * @param {Array} tokens - Array of tokens
 * @returns {Object} - Expression tree
 */
function parseExpression(tokens) {
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume() {
    return tokens[pos++];
  }

  function parseOr() {
    let left = parseAnd();

    while (peek() === 'OR' || peek() === '||') {
      consume();
      const right = parseAnd();
      left = { type: 'OR', left, right };
    }

    return left;
  }

  function parseAnd() {
    let left = parseNot();

    while (peek() === 'AND' || peek() === '&&') {
      consume();
      const right = parseNot();
      left = { type: 'AND', left, right };
    }

    return left;
  }

  function parseNot() {
    if (peek() === 'NOT' || peek()?.startsWith('-')) {
      consume();
      const expr = parsePrimary();
      return { type: 'NOT', expr };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();

    if (token === '(') {
      consume();
      const expr = parseOr();
      if (peek() === ')') consume();
      return expr;
    }

    if (token && token !== ')' && token !== 'AND' && token !== 'OR' && token !== '&&' && token !== '||') {
      consume();
      // Handle -prefix for NOT
      if (token.startsWith('-')) {
        return { type: 'NOT', expr: { type: 'TERM', value: token.substring(1) } };
      }
      return { type: 'TERM', value: token };
    }

    return null;
  }

  return parseOr();
}

/**
 * Evaluate expression tree against searchable text
 * @param {Object} expr - Expression tree
 * @param {string} text - Searchable text
 * @returns {boolean} - True if expression matches
 */
function evaluateExpression(expr, text) {
  if (!expr) return false;

  switch (expr.type) {
    case 'TERM':
      return matchesPattern(text, expr.value);

    case 'AND':
      return evaluateExpression(expr.left, text) && evaluateExpression(expr.right, text);

    case 'OR':
      return evaluateExpression(expr.left, text) || evaluateExpression(expr.right, text);

    case 'NOT':
      return !evaluateExpression(expr.expr, text);

    default:
      return false;
  }
}

/**
 * Search cards and return matching IDs
 * @param {Array} cards - Array of card data objects
 * @param {string} query - Search query (supports wildcards and boolean operators)
 * @returns {Set} - Set of matching card IDs
 *
 * Examples:
 * - "matematik AND svårigheter" - both words must match
 * - "förskoleklass OR grundskola" - either word must match
 * - "elever NOT lärare" or "elever -lärare" - first must match, second must not
 * - "(matematik OR svenska) AND svårigheter" - complex query with grouping
 * - "mat* AND svår*" - wildcards with boolean operators
 */
export function searchCards(cards, query) {
  const matchingIds = new Set();

  if (!query || query.trim() === '') {
    return matchingIds;
  }

  const trimmedQuery = query.trim();

  // Check if query contains boolean operators
  const hasBooleanOps = /\b(AND|OR|NOT)\b|&&|\|\||-/.test(trimmedQuery);

  cards.forEach(card => {
    // Combine all searchable text
    const content = (card.content || '').toLowerCase();
    const tags = (card.tags || []).map(t => t.toLowerCase()).join(' ');
    const comments = (card.comments || '').toLowerCase();
    const searchableText = `${content} ${tags} ${comments}`;

    let matches = false;

    if (hasBooleanOps) {
      // Boolean search
      try {
        const tokens = tokenize(trimmedQuery);
        const expr = parseExpression(tokens);
        matches = evaluateExpression(expr, searchableText);
      } catch (error) {
        console.warn('Boolean search parse error:', error);
        // Fallback to simple pattern match
        matches = matchesPattern(searchableText, trimmedQuery);
      }
    } else {
      // Simple wildcard search (backward compatible)
      matches = matchesPattern(searchableText, trimmedQuery);
    }

    if (matches) {
      matchingIds.add(card.id);
    }
  });

  return matchingIds;
}
