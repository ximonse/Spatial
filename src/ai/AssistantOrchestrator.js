/**
 * Assistant Orchestrator - Manages AI API calls
 * Handles Claude and Gemini API integration with token-efficient context
 */

import { contextBuilder } from './ContextBuilder.js';
import { settingsPanel } from '../ui/SettingsPanel.js';

class AssistantOrchestrator {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 exchanges
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

    // Call appropriate AI provider
    let response;
    if (selectedProvider === 'claude') {
      response = await this.callClaude(apiKey, userMessage, context, intent);
    } else if (selectedProvider === 'gemini') {
      response = await this.callGemini(apiKey, userMessage, context, intent);
    } else {
      throw new Error(`Okänd AI-provider: ${selectedProvider}`);
    }

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
   * Call Claude API
   * @param {string} apiKey - Claude API key
   * @param {string} userMessage - User message
   * @param {string} context - Card context
   * @param {Object} intent - Parsed intent
   * @returns {Promise<Object>} - { text: string }
   */
  async callClaude(apiKey, userMessage, context, intent) {
    const systemPrompt = this.buildSystemPrompt(intent);

    const messages = [
      ...this.conversationHistory.slice(-6), // Last 3 exchanges
      {
        role: 'user',
        content: `${context}\n\n---\n\nFråga: ${userMessage}`,
      },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.content[0].text,
    };
  }

  /**
   * Call Gemini API
   * @param {string} apiKey - Gemini API key
   * @param {string} userMessage - User message
   * @param {string} context - Card context
   * @param {Object} intent - Parsed intent
   * @returns {Promise<Object>} - { text: string }
   */
  async callGemini(apiKey, userMessage, context, intent) {
    const systemPrompt = this.buildSystemPrompt(intent);

    const prompt = `${systemPrompt}\n\n${context}\n\n---\n\nFråga: ${userMessage}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.candidates[0].content.parts[0].text,
    };
  }

  /**
   * Build system prompt based on intent
   * @param {Object} intent - Parsed intent
   * @returns {string} - System prompt
   */
  buildSystemPrompt(intent) {
    let prompt = `Du är en AI-assistent för Spatial Note, en spatial anteckningsapp.

KORT-FORMAT:
- Varje kort har: [id] content | tags | kommentarer | @(x,y) | datum
- Tags börjar med #
- Position @(x,y) anger var kortet finns på canvas

SPATIAL PRINCIPER:
- Kort är 200×150px (A7-format)
- 15-20px mellanrum = samma grupp/koncept
- 200-300px mellanrum = olika grupper/koncept

DIN UPPGIFT:
- Svara kort och koncist på svenska
- Referera till kort med [id] när relevant
- Vid spatial analys: beakta positioner och gruppering`;

    if (intent.hasArrangement) {
      prompt += `\n- När användaren vill arrangera: föreslå vilket kortkommando de kan använda:
  * V = vertikal kolumn
  * H = horisontell rad
  * G = grid
  * Q = cirkel
  * G+V = grid vertikal (kolumner)
  * G+H = grid horisontell (rader)
  * G+T = Kanban-layout`;
    }

    if (intent.hasSearch) {
      prompt += `\n- Lista kort-ID:n [id] så användaren kan se vilka kort som matchar`;
    }

    return prompt;
  }

  /**
   * Parse card references from AI response
   * Looks for [id] patterns in text
   * @param {string} text - AI response
   * @param {Array} cards - Relevant cards
   * @returns {Array} - Array of card IDs
   */
  parseCardReferences(text, cards) {
    const references = [];
    const idPattern = /\[([a-zA-Z0-9-]+)\]/g;
    let match;

    while ((match = idPattern.exec(text)) !== null) {
      const shortId = match[1];
      // Find full card ID that starts with this short ID
      const card = cards.find(c => c.id.startsWith(shortId));
      if (card && !references.includes(card.id)) {
        references.push(card.id);
      }
    }

    return references;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    console.log('🗑️ Conversation history cleared');
  }

  /**
   * Get conversation history
   * @returns {Array} - Conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }
}

// Export singleton instance
export const assistantOrchestrator = new AssistantOrchestrator();
