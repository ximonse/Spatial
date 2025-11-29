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

    // Call appropriate API (direct on localhost, serverless on production)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let response;

    if (isLocalhost) {
      // Localhost: direct API calls
      if (selectedProvider === 'claude') {
        response = await this.callClaude(apiKey, userMessage, context, intent);
      } else if (selectedProvider === 'gemini') {
        response = await this.callGemini(apiKey, userMessage, context, intent);
      } else {
        throw new Error(`Okänd AI-provider: ${selectedProvider}`);
      }
    } else {
      // Production: use serverless API
      response = await this.callServerlessAPI(selectedProvider, apiKey, userMessage, context, intent);
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

    // Use serverless function instead of direct API call to avoid CORS
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? '/api/anthropic'  // Local development
      : '/api/anthropic'; // Production (Vercel)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) {
      let errorMessage = response.statusText;

      try {
        const errorJson = await response.json();
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = (await response.text().catch(() => null)) || errorMessage;
      }

      throw new Error(`Claude API error: ${errorMessage}`);
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

    // Try a small matrix of versions/models to avoid merge-conflict style regressions when
    // upstream API availability shifts (e.g. "model not found" for the latest flash SKU).
    const candidateEndpoints = [
      { version: 'v1', models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
      { version: 'v1beta', models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
    ];

    let lastError = null;
    const tried = [];
    const attemptErrors = [];

    for (const { version, models } of candidateEndpoints) {
      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
        tried.push(`${version}/${model}`);

        let response;
        try {
          response = await fetch(url, {
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
          });
        } catch (fetchError) {
          lastError = fetchError.message || String(fetchError);
          attemptErrors.push(`${version}/${model}: ${lastError}`);
          continue;
        }

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0];
          const textPart = candidate?.content?.parts?.find(part => part.text)?.text;

          if (textPart) {
            return { text: textPart };
          }

          const finishReason = candidate?.finishReason;
          const blockReason = data.promptFeedback?.blockReason;
          const safetyReasons = data.promptFeedback?.safetyRatings
            ?.map(rating => rating.category)
            ?.join(', ');

          const reasonParts = [blockReason, finishReason, safetyReasons && `säkerhet: ${safetyReasons}`]
            .filter(Boolean)
            .join(' | ');

          lastError = `svar saknar text (${reasonParts || 'okänt skäl'})`;
          attemptErrors.push(`${version}/${model}: ${lastError}`);
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        const error = contentType.includes('application/json')
          ? await response.json().catch(() => ({ error: { message: response.statusText } }))
          : { error: { message: await response.text().catch(() => response.statusText) } };

        lastError = error.error?.message || response.statusText;
        attemptErrors.push(`${version}/${model}: ${lastError} (status: ${response.status})`);

        const message = lastError.toLowerCase();
        const isMissingModel =
          response.status === 404 ||
          message.includes('not found') ||
          message.includes('not supported for generatecontent');

        // If the model isn't found or supported, try the next candidate; otherwise surface the error immediately
        if (!isMissingModel) {
          throw new Error(`Gemini API error (${version}/${model}): ${lastError}`);
        }
      }
    }

    throw new Error(
      `Gemini API error: ${lastError || 'Okänd modell'} (försökte modeller: ${tried.join(', ')})${
        attemptErrors.length ? ` | fel: ${attemptErrors.join(' | ')}` : ''
      }`
    );
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
