/**
 * Chat Panel - AI Assistant UI
 * Right-side panel with minimize/maximize, conversation history
 */

import { assistantOrchestrator } from '../ai/AssistantOrchestrator.js';
import { state } from '../core/state.js';
import { settingsPanel } from './SettingsPanel.js';

class ChatPanel {
  constructor() {
    this.panel = null;
    this.isOpen = false;
    this.isMinimized = false;
    this.messages = [];
    this.createPanel();
    this.loadHistory();
  }

  /**
   * Create chat panel UI
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'chat-panel';
    this.panel.className = 'chat-panel hidden';
    this.panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-title">
          <span class="chat-icon">🤖</span>
          <span class="chat-title-text">AI Assistent</span>
          <span id="active-provider-indicator" class="active-provider-indicator"></span>
        </div>
        <div class="chat-controls">
          <button class="chat-btn chat-settings" title="Inställningar">⚙️</button>
          <button class="chat-btn chat-minimize" title="Minimera">−</button>
          <button class="chat-btn chat-close" title="Stäng">×</button>
        </div>
      </div>

      <div class="chat-body">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-welcome">
            <p>👋 Hej! Jag är din AI-assistent.</p>
            <p>Jag kan hjälpa dig med:</p>
            <ul>
              <li>🔍 Söka och hitta kort</li>
              <li>📊 Analysera innehåll</li>
              <li>📐 Föreslå arrangemang</li>
            </ul>
            <p class="chat-help-text">Skriv en fråga eller kommando nedan!</p>
          </div>
        </div>
      </div>

      <div class="chat-input-container">
        <textarea
          id="chat-input"
          class="chat-input"
          placeholder="Fråga något om dina kort..."
          rows="2"
        ></textarea>
        <button id="chat-send" class="chat-send" title="Skicka (Enter)">
          <span class="send-icon">➤</span>
        </button>
      </div>

      <div class="chat-footer">
        <span class="chat-status" id="chat-status"></span>
        <button class="chat-clear-history" id="chat-clear">🗑️ Rensa historik</button>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const clearBtn = document.getElementById('chat-clear');

    // Send message
    sendBtn.addEventListener('click', () => this.sendMessage());

    // Enter to send, Shift+Enter for new line
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Clear history
    clearBtn.addEventListener('click', () => this.clearHistory());

    // Close button
    this.panel.querySelector('.chat-close').addEventListener('click', () => {
      this.close();
    });

    // Minimize button
    this.panel.querySelector('.chat-minimize').addEventListener('click', () => {
      this.toggleMinimize();
    });

    // Settings button
    this.panel.querySelector('.chat-settings').addEventListener('click', () => {
      settingsPanel.open();
    });
  }

  /**
   * Send user message to AI
   */
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Check API keys
    if (!settingsPanel.hasApiKeys()) {
      this.addSystemMessage('⚠️ Inga API-nycklar konfigurerade. Klicka på ⚙️ för att lägga till.');
      settingsPanel.open();
      return;
    }

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Add user message to UI
    this.addMessage('user', message);

    // Show typing indicator
    this.setStatus('🤔 Tänker...');

    try {
      // Get all cards from state
      const cards = state.get('cards');

      // Send to AI
      const result = await assistantOrchestrator.sendMessage(message, cards);

      // Add AI response to UI
      this.addMessage('assistant', result.response, result.cardReferences);

      // Auto-select referenced cards
      if (result.cardReferences && result.cardReferences.length > 0) {
        this.selectReferencedCards(result.cardReferences);
      }

      this.setStatus(`✓ ${result.provider}`);
    } catch (error) {
      console.error('AI Error:', error);
      this.addSystemMessage(`❌ Fel: ${error.message}`);
      this.setStatus('');
    }
  }

  /**
   * Add message to chat
   * @param {string} role - 'user', 'assistant', or 'system'
   * @param {string} content - Message content
   * @param {Array} cardRefs - Card IDs referenced (optional)
   */
  addMessage(role, content, cardRefs = []) {
    const messagesContainer = document.getElementById('chat-messages');

    // Remove welcome message if present
    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) {
      welcome.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message chat-message-${role}`;

    const timestamp = new Date().toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let avatar = role === 'user' ? '👤' : '🤖';
    if (role === 'system') avatar = 'ℹ️';

    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-avatar">${avatar}</span>
        <span class="message-time">${timestamp}</span>
      </div>
      <div class="message-content">${this.formatContent(content)}</div>
      ${cardRefs.length > 0 ? `<div class="message-card-refs">📎 ${cardRefs.length} kort refererade</div>` : ''}
    `;

    messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    const chatBody = this.panel.querySelector('.chat-body');
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 0);

    // Save message
    this.messages.push({ role, content, cardRefs, timestamp: Date.now() });
    this.saveHistory();
  }

  /**
   * Add system message (errors, notifications)
   * @param {string} content - Message content
   */
  addSystemMessage(content) {
    this.addMessage('system', content);
  }

  /**
   * Format message content (convert markdown-like syntax)
   * @param {string} content - Raw content
   * @returns {string} - HTML formatted content
   */
  formatContent(content) {
    // Convert [id] references to badges
    let formatted = content.replace(/\[([a-zA-Z0-9-]+)\]/g, '<span class="card-ref-badge">[$1]</span>');

    // Convert **bold**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }

  /**
   * Select cards referenced in AI response
   * @param {Array} cardIds - Card IDs to select
   */
  selectReferencedCards(cardIds) {
    state.clearSelection();
    cardIds.forEach(id => {
      state.selectCard(id);
    });

    console.log(`✅ Selected ${cardIds.length} referenced cards`);
  }

  /**
   * Set status text
   * @param {string} text - Status text
   */
  setStatus(text) {
    const statusEl = document.getElementById('chat-status');
    statusEl.textContent = text;

    // Clear after 3 seconds if not empty
    if (text) {
      setTimeout(() => {
        if (statusEl.textContent === text) {
          statusEl.textContent = '';
          this._updateProviderIndicator(settingsPanel.getDefaultProvider()); // Reset to default if status clears
        }
      }, 3000);
    }

    // Update provider indicator
    const providerMatch = text.match(/✓\s(claude|gemini|openai)/i);
    if (providerMatch) {
      this._updateProviderIndicator(providerMatch[1]);
    } else if (!text) {
      this._updateProviderIndicator(settingsPanel.getDefaultProvider()); // Show default if status is empty
    }
  }

  /**
   * Update the active provider indicator in the UI
   * @param {string} providerName - The name of the active provider ('claude', 'gemini', 'openai')
   */
  _updateProviderIndicator(providerName) {
    const indicator = document.getElementById('active-provider-indicator');
    if (indicator) {
      const displayNames = {
        'claude': 'Claude',
        'gemini': 'Gemini',
        'openai': 'ChatGPT',
      };
      indicator.textContent = displayNames[providerName] || '';
      indicator.className = `active-provider-indicator provider-${providerName}`;
    }
  }

  /**
   * Clear chat history
   */
  clearHistory() {
    const confirmed = confirm('Rensa hela chathistoriken?');
    if (!confirmed) return;

    this.messages = [];
    assistantOrchestrator.clearHistory();
    this.saveHistory();

    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
      <div class="chat-welcome">
        <p>🗑️ Historik rensad.</p>
        <p>Ställ en ny fråga för att börja om!</p>
      </div>
    `;

    console.log('🗑️ Chat history cleared');
  }

  /**
   * Save chat history to localStorage
   */
  saveHistory() {
    try {
      // Only save last 20 messages
      const toSave = this.messages.slice(-20);
      localStorage.setItem('chat_history', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }

  /**
   * Load chat history from localStorage
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        this.messages = JSON.parse(saved);
        // Restore messages to UI
        this.messages.forEach(msg => {
          this.addMessage(msg.role, msg.content, msg.cardRefs || []);
        });
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    }
  }

  /**
   * Toggle minimize/maximize
   */
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.panel.classList.toggle('minimized', this.isMinimized);

    const btn = this.panel.querySelector('.chat-minimize');
    btn.textContent = this.isMinimized ? '+' : '−';
    btn.title = this.isMinimized ? 'Maximera' : 'Minimera';
  }

  /**
   * Open chat panel
   */
  open() {
    this.panel.classList.remove('hidden');
    this.isOpen = true;
    this._updateProviderIndicator(settingsPanel.getDefaultProvider());

    // Focus input
    setTimeout(() => {
      document.getElementById('chat-input').focus();
    }, 100);
  }

  /**
   * Close chat panel
   */
  close() {
    this.panel.classList.add('hidden');
    this.isOpen = false;
    this.isMinimized = false;
    this.panel.classList.remove('minimized');
  }

  /**
   * Toggle chat panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Export singleton instance
export const chatPanel = new ChatPanel();
