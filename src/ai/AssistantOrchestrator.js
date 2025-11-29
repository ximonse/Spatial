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
    this.corsProxies = [
      {
        name: 'corsproxy.io',
        buildUrl: (targetUrl) => `https://corsproxy.io/?${targetUrl}`,
      },
      {
        name: 'thingproxy',
        buildUrl: (targetUrl) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
      },
      {
        name: 'isomorphic-git',
        buildUrl: (targetUrl) => `https://cors.isomorphic-git.org/${targetUrl}`,
      },
    ];

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

    const response = await this.fetchWithCorsFallback('https://api.anthropic.com/v1/messages', {
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
   * Fetch helper that retries via public CORS proxies when the direct call fails
   * (e.g. browser blocks cross-origin requests to Anthropic).
   * @param {string} url - Target URL
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<Response>} - Successful response
   */
  async fetchWithCorsFallback(url, options) {
    const requestOptions = {
      ...options,
      mode: options?.mode || 'cors',
    };

    try {
      return await fetch(url, requestOptions);
    } catch (error) {
      console.warn('Direct fetch failed, trying CORS proxies...', error);
    }

    let lastError = null;
    const attemptDetails = [];

    for (const proxy of this.corsProxies) {
      try {
        const proxiedUrl = proxy.buildUrl ? proxy.buildUrl(url) : `${proxy}${url}`;
        const response = await fetch(proxiedUrl, requestOptions);
        if (response.ok) {
          console.warn(`CORS fallback activated via ${proxy.name || proxiedUrl}`);
          return response;
        }

        const errorText = await response.text().catch(() => '');
        const summary = `status ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : ''}`;
        lastError = new Error(summary);
        attemptDetails.push(`${proxy.name || proxiedUrl} (${summary})`);
        console.warn(`Proxy ${proxy.name || proxiedUrl} responded with ${summary}`);
      } catch (proxyError) {
        lastError = proxyError;
        attemptDetails.push(`${proxy.name || 'proxy'} (fel: ${proxyError.message || proxyError})`);
        console.warn(`Proxy ${proxy} failed:`, proxyError);
      }
    }

    const proxyInfo = attemptDetails.length ? ` Försökta proxies: ${attemptDetails.join(' | ')}` : '';
    throw new Error(`Nätverksfel eller CORS-blockad mot ${url}. ${lastError ? lastError.message : 'Ingen proxy fungerade.'}${proxyInfo}`);
  }

  /**
   * Build system prompt based on intent
   * @param {Object} intent - Parsed intent
   * @returns {string} -
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
