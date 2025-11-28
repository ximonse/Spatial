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
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/',
    ];
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
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        lastError = error.error?.message || response.statusText;
        attemptErrors.push(`${version}/${model}: ${lastError}`);

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
    try {
      return await fetch(url, options);
    } catch (error) {
      console.warn('Direct fetch failed, trying CORS proxies...', error);
    }

    let lastError = null;

    for (const proxy of this.corsProxies) {
      try {
        const proxiedUrl = `${proxy}${url}`;
        const response = await fetch(proxiedUrl, options);
        if (response.ok) {
          console.warn(`CORS fallback activated via ${proxy}`);
          return response;
        }

        const errorText = await response.text();
        console.warn(`Proxy ${proxy} responded with status ${response.status}: ${errorText}`);
      } catch (proxyError) {
        lastError = proxyError;
        console.warn(`Proxy ${proxy} failed:`, proxyError);
      }
    }

    throw new Error(`Nätverksfel eller CORS-blockad mot ${url}. ${lastError ? lastError.message : 'Ingen proxy fungerade.'}`);
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

    while ((match = idPattern.exec(text