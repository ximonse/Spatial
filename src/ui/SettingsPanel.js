/**
 * Settings Panel for API Keys and Configuration
 * Manages Claude and Gemini API keys in localStorage
 */

import { THEMES } from '../utils/constants.js';

class SettingsPanel {
  constructor() {
    this.panel = null;
    this.isOpen = false;
    this.createPanel();
  }

  /**
   * Create settings panel UI
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'settings-panel';
    this.panel.className = 'settings-panel hidden';
    this.panel.innerHTML = `
      <div class="settings-content">
        <div class="settings-header">
          <h2>⚙️ Inställningar</h2>
          <button class="settings-close" title="Stäng">&times;</button>
        </div>

        <div class="settings-body">
          <section class="settings-section">
            <h3>🤖 AI API-nycklar</h3>
            <p class="settings-help">
              API-nycklar sparas lokalt i din webbläsare och skickas aldrig till någon server.
            </p>

            <div class="settings-field">
              <label for="claude-api-key">
                Claude API-nyckel
                <a href="https://console.anthropic.com/settings/keys" target="_blank" title="Hämta nyckel">🔗</a>
              </label>
              <div class="api-key-input">
                <input
                  type="password"
                  id="claude-api-key"
                  placeholder="sk-ant-..."
                  autocomplete="off"
                />
                <button class="toggle-visibility" data-target="claude-api-key" title="Visa/dölj">👁️</button>
              </div>
            </div>

            <div class="settings-field">
              <label for="gemini-api-key">
                Google Gemini API-nyckel
                <a href="https://makersuite.google.com/app/apikey" target="_blank" title="Hämta nyckel">🔗</a>
              </label>
              <div class="api-key-input">
                <input
                  type="password"
                  id="gemini-api-key"
                  placeholder="AIza..."
                  autocomplete="off"
                />
                <button class="toggle-visibility" data-target="gemini-api-key" title="Visa/dölj">👁️</button>
              </div>
            </div>

            <div class="settings-field">
              <label for="openai-api-key">
                OpenAI API-nyckel
                <a href="https://platform.openai.com/api-keys" target="_blank" title="Hämta nyckel">🔗</a>
              </label>
              <div class="api-key-input">
                <input
                  type="password"
                  id="openai-api-key"
                  placeholder="sk-..."
                  autocomplete="off"
                />
                <button class="toggle-visibility" data-target="openai-api-key" title="Visa/dölj">👁️</button>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h3>🤖 Standard AI-provider (Chat)</h3>
            <select id="default-ai-provider">
              <option value="claude">Claude (bättre reasoning)</option>
              <option value="gemini">Gemini (snabbare, billigare)</option>
              <option value="openai">ChatGPT (gpt-4o)</option>
            </select>
          </section>

          <section class="settings-section">
            <h3>🖼️ Bildanalys AI-provider (OCR)</h3>
            <select id="image-processor-provider">
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI Vision</option>
            </select>
          </section>
        </div>

        <div class="settings-footer">
          <button class="btn-primary" id="save-settings">💾 Spara</button>
          <button class="btn-secondary" id="clear-settings">🗑️ Rensa nycklar</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.attachEventListeners();
    this.loadSettings();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.panel.querySelector('.settings-close').addEventListener('click', () => {
      this.close();
    });

    // Save button
    this.panel.querySelector('#save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Clear button
    this.panel.querySelector('#clear-settings').addEventListener('click', () => {
      this.clearSettings();
    });

    // Toggle visibility buttons
    this.panel.querySelectorAll('.toggle-visibility').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        const input = document.getElementById(targetId);
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close on outside click
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.close();
      }
    });
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    const claudeKey = localStorage.getItem('claude_api_key') || '';
    const geminiKey = localStorage.getItem('gemini_api_key') || '';
    const openaiKey = localStorage.getItem('openai_api_key') || '';
    const defaultProvider = localStorage.getItem('default_ai_provider') || 'claude';
    const imageProcessorProvider = localStorage.getItem('image_processor_provider') || 'gemini'; // Default to Gemini

    document.getElementById('claude-api-key').value = claudeKey;
    document.getElementById('gemini-api-key').value = geminiKey;
    document.getElementById('openai-api-key').value = openaiKey;
    document.getElementById('default-ai-provider').value = defaultProvider;
    document.getElementById('image-processor-provider').value = imageProcessorProvider;
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    const claudeKey = document.getElementById('claude-api-key').value.trim();
    const geminiKey = document.getElementById('gemini-api-key').value.trim();
    const openaiKey = document.getElementById('openai-api-key').value.trim();
    const defaultProvider = document.getElementById('default-ai-provider').value;
    const imageProcessorProvider = document.getElementById('image-processor-provider').value;

    localStorage.setItem('claude_api_key', claudeKey);
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('default_ai_provider', defaultProvider);
    localStorage.setItem('image_processor_provider', imageProcessorProvider);

    this.showNotification('✅ Inställningar sparade!');
    console.log('✅ Settings saved');
  }

  /**
   * Clear all settings
   */
  clearSettings() {
    const confirmed = confirm('Är du säker på att du vill rensa alla API-nycklar?');
    if (!confirmed) return;

    localStorage.removeItem('claude_api_key');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('openai_api_key');
    localStorage.removeItem('default_ai_provider');
    localStorage.removeItem('image_processor_provider');

    document.getElementById('claude-api-key').value = '';
    document.getElementById('gemini-api-key').value = '';
    document.getElementById('openai-api-key').value = '';
    document.getElementById('default-ai-provider').value = 'claude';
    document.getElementById('image-processor-provider').value = 'gemini';

    this.showNotification('🗑️ Inställningar rensade!');
    console.log('🗑️ Settings cleared');
  }

  /**
   * Show temporary notification
   */
  showNotification(message) {
    // Use existing status notification if available
    if (window.statusNotification) {
      window.statusNotification.showTemporary(message);
    } else {
      alert(message);
    }
  }

  /**
   * Open settings panel
   */
  open() {
    this.panel.classList.remove('hidden');
    this.isOpen = true;
    this.loadSettings(); // Reload in case changed elsewhere
  }

  /**
   * Close settings panel
   */
  close() {
    this.panel.classList.add('hidden');
    this.isOpen = false;
  }

  /**
   * Toggle settings panel
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Get API key for provider
   * @param {string} provider - 'claude', 'gemini' or 'openai'
   * @returns {string|null} - API key or null
   */
  getApiKey(provider) {
    const key = localStorage.getItem(`${provider}_api_key`);
    return key && key.trim() !== '' ? key : null;
  }

  /**
   * Get default AI provider for chat
   * @returns {string} - 'claude', 'gemini' or 'openai'
   */
  getDefaultProvider() {
    return localStorage.getItem('default_ai_provider') || 'claude';
  }

  /**
   * Get AI provider for image processing
   * @returns {string} - 'gemini' or 'openai'
   */
  getImageProcessorProvider() {
    return localStorage.getItem('image_processor_provider') || 'gemini';
  }

  /**
   * Check if any API keys are configured
   * @returns {boolean}
   */
  hasApiKeys() {
    return this.getApiKey('claude') !== null || this.getApiKey('gemini') !== null || this.getApiKey('openai') !== null;
  }
}

// Export singleton instance
export const settingsPanel = new SettingsPanel();
