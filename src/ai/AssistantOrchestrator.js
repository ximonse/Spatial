/**
 * Assistant Orchestrator - Manages AI API calls
 * Handles Claude and Gemini API integration with token-efficient context
 */

import { contextBuilder } from './ContextBuilder.js';
import { settingsPanel } from '../ui/SettingsPanel.js';

const defaultBuildSystemPrompt = (intent) => {
  const intentHints = [];

  if (intent?.hasSearchTerms) {
    intentHints.push('Prioritera kort som matchar söktermer eller taggar i frågan.');
  }

  if (intent?.hasArrangement) {
    intentHints.push('Ge korta förslag på hur korten kan grupperas eller sorteras.');
  }

  if (intent?.hasAnalysis) {
    intentHints.push('Sammanfatta korten och koppla ihop relaterade idéer.');
  }

  const intentGuidance = intentHints.length ? `\n\nFokus: ${intentHints.join(' ')}` : '';

  return (
    'Du är en spatial anteckningsassistent för whiteboard-appen Spatial Note. ' +
    'Svara på svenska. Håll svaret koncist (3-6 meningar).\n\n' +
    'Instruktioner:\n' +
    '- Använd referenser i formatet [kort-id] när du hänvisar till specifika kort.\n' +
    '- Föreslå max tre relevanta kort och undvik påhittade referenser.\n' +
    '- Om du gör åtgärdsförslag, var tydlig och numrera dem.' +
    intentGuidance
  );
};

class AssistantOrchestrator {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 exchanges

    // Ensure the system prompt builder is always an instance method (even if monkey-patched)
    // so runtime hooks can't strip the function and cause "is not a function" errors.
    this.buildSystemPrompt = this.buildSystemPrompt.bind(this);
  }

  /**
   * Send message to AI assistant
   * @param {string} userMessage - User's question/command
   * @param {Array} cards - All cards
   * @param {string} provider - 'claude' or 'gemini' (optional, uses default if not specified)
   * @returns {Promise<Object>} - { response: string, cardReferences: Array, provider: string }
   */
  async sendMessage(userMessage, cards, provider = null) {
    // Get provider (use specified or default)
    const selectedProvider = provider || settingsPanel.getDefaultProvider();

    // Check API key
    const apiKey = settingsPanel.getApiKey(selectedProvider);
    if (!apiKey) {
      throw new Error(`Ingen API-nyckel för ${selectedProvider}. Öppna inställningar för att lägga till.`);
    }

    // Build context
    const { context, relevantCards, strategy, intent } = contextBuilder.buildContext(userMessage, cards);

    console.log(`🤖 Using ${selectedProvider} | Strategy: ${strategy} | Cards: ${relevantCards.length}`);

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }

    // Always use the serverless API for all providers
    const response = await this.callServerlessAPI(selectedProvider, apiKey, userMessage, context, intent);

    // Add response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response.text,
    });

    // Parse card references from response
    const cardReferences = this.parseCardReferences(response.text, relevantCards);

    return {
      response: response.text,
      cardReferences,
      provider: selectedProvider,
      relevantCards,
    };
  }

  /**
   * Call Vercel serverless API
   * @param {string} provider - 'claude' or 'gemini'
   * @param {string} apiKey - API key from localStorage
   * @param {string} message - User message
   * @param {string} cardContext - Card context
   * @param {Object} intent - Parsed intent
   * @returns {Promise<Object>} - { text: string, provider: string }
   */
  async callServerlessAPI(provider, apiKey, message, cardContext, intent) {
    const systemPrompt = this.buildSystemPrompt(intent);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        provider,
        message,
        context: {
          systemPrompt,
          cardContext,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Build system prompt based on intent
   * @param {Object} intent - Parsed intent
   * @returns {string} - System prompt string
   */
  buildSystemPrompt(intent) {
    const intentHints = [];

    if (intent?.hasSearchTerms) {
      intentHints.push('Prioritera kort som matchar söktermer eller taggar i frågan.');
    }

    if (intent?.hasArrangement) {
      intentHints.push('Ge korta förslag på hur korten kan grupperas eller sorteras.');
    }

    if (intent?.hasAnalysis) {
      intentHints.push('Sammanfatta korten och koppla ihop relaterade idéer.');
    }

    const intentGuidance = intentHints.length ? `\n\nFokus: ${intentHints.join(' ')}` : '';

    return (
      'Du är en spatial anteckningsassistent för whiteboard-appen Spatial Note. ' +
      'Svara på svenska. Håll svaret koncist (3-6 meningar).\n\n' +
      'Instruktioner:\n' +
      '- Använd referenser i formatet [kort-id] när du hänvisar till specifika kort.\n' +
      '- Föreslå max tre relevanta kort och undvik påhittade referenser.\n' +
      '- Om du gör åtgärdsförslag, var tydlig och numrera dem.' +
      intentGuidance
    );
  }

  /**
   * Parse card references from AI response text
   * @param {string} responseText - AI response
   * @param {Array} relevantCards - Cards included in context
   * @returns {Array} - Array of card IDs referenced
   */
  parseCardReferences(responseText, relevantCards = []) {
    const idMap = new Map();
    relevantCards.forEach(card => {
      const shortId = String(card.id).substring(0, 8);
      idMap.set(shortId, card.id);
    });

    const matches = new Set();
    const regex = /\[([a-zA-Z0-9-]{4,})\]/g;
    let match;

    while ((match = regex.exec(responseText)) !== null) {
      const shortId = match[1];
      if (idMap.has(shortId)) {
        matches.add(idMap.get(shortId));
      }
    }

    return Array.from(matches);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

// Export singleton instance
export const assistantOrchestrator = new AssistantOrchestrator();
