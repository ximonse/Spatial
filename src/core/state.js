/**
 * Application state management
 * Reactive state using Proxy for automatic UI updates
 */

import { THEMES, ZOOM } from '../utils/constants.js';

class AppState {
  constructor() {
    this._state = {
      // Cards
      cards: [],
      selectedCards: new Set(),

      // Strokes
      strokes: [],

      // View
      currentView: 'board', // 'board' or 'column'
      theme: THEMES.NATURE,
      zoom: ZOOM.DEFAULT,

      // UI
      commandPaletteOpen: false,
      searchQuery: '',
      searchResults: [],

      // Editing
      editingCardId: null,
      clipboard: [],

      // History (for undo/redo)
      history: [],
      historyIndex: -1,

      // Settings
      showPinned: true,
    };

    // Listeners for state changes
    this._listeners = new Map();
  }

  /**
   * Get state value
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set state value and notify listeners
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;
    this._notify(key, value, oldValue);
  }

  /**
   * Update multiple state values at once
   */
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, []);
    }
    this._listeners.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this._listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of state change
   */
  _notify(key, newValue, oldValue) {
    const callbacks = this._listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(newValue, oldValue));
    }
  }

  // ===== Card operations =====

  addCard(card) {
    this._state.cards.push(card);
    this._notify('cards', this._state.cards);
  }

  updateCard(id, updates) {
    const index = this._state.cards.findIndex(c => c.id === id);
    if (index !== -1) {
      this._state.cards[index] = { ...this._state.cards[index], ...updates };
      this._notify('cards', this._state.cards);
    }
  }

  removeCard(id) {
    this._state.cards = this._state.cards.filter(c => c.id !== id);
    this._state.selectedCards.delete(id);
    this._notify('cards', this._state.cards);
    this._notify('selectedCards', this._state.selectedCards);
  }

  getCard(id) {
    return this._state.cards.find(c => c.id === id);
  }

  // ===== Stroke operations =====

  addStroke(stroke) {
    this._state.strokes.push(stroke);
    this._notify('strokes', this._state.strokes);
  }

  removeStroke(id) {
    this._state.strokes = this._state.strokes.filter(s => s.id !== id);
    this._notify('strokes', this._state.strokes);
  }

  getStrokes() {
    return this._state.strokes;
  }

  // ===== Selection operations =====

  selectCard(id) {
    this._state.selectedCards.add(id);
    this._notify('selectedCards', this._state.selectedCards);
  }

  deselectCard(id) {
    this._state.selectedCards.delete(id);
    this._notify('selectedCards', this._state.selectedCards);
  }

  toggleCardSelection(id) {
    if (this._state.selectedCards.has(id)) {
      this.deselectCard(id);
    } else {
      this.selectCard(id);
    }
  }

  clearSelection() {
    this._state.selectedCards.clear();
    this._notify('selectedCards', this._state.selectedCards);
  }

  selectAll() {
    this._state.cards.forEach(card => {
      this._state.selectedCards.add(card.id);
    });
    this._notify('selectedCards', this._state.selectedCards);
  }

  isSelected(id) {
    return this._state.selectedCards.has(id);
  }

  getSelectedCards() {
    return this._state.cards.filter(card =>
      this._state.selectedCards.has(card.id)
    );
  }

  // ===== History operations (undo/redo) =====

  saveHistory() {
    // Remove any history after current index
    this._state.history = this._state.history.slice(0, this._state.historyIndex + 1);

    // Add current state to history
    const snapshot = {
      cards: JSON.parse(JSON.stringify(this._state.cards)),
      strokes: JSON.parse(JSON.stringify(this._state.strokes)),
    };
    this._state.history.push(snapshot);
    this._state.historyIndex++;

    // Limit history to 50 steps
    if (this._state.history.length > 50) {
      this._state.history.shift();
      this._state.historyIndex--;
    }
  }

  undo() {
    if (this._state.historyIndex > 0) {
      this._state.historyIndex--;
      const snapshot = this._state.history[this._state.historyIndex];
      this._state.cards = JSON.parse(JSON.stringify(snapshot.cards));
      this._state.strokes = JSON.parse(JSON.stringify(snapshot.strokes));
      this._notify('cards', this._state.cards);
      this._notify('strokes', this._state.strokes);
    }
  }

  redo() {
    if (this._state.historyIndex < this._state.history.length - 1) {
      this._state.historyIndex++;
      const snapshot = this._state.history[this._state.historyIndex];
      this._state.cards = JSON.parse(JSON.stringify(snapshot.cards));
      this._state.strokes = JSON.parse(JSON.stringify(snapshot.strokes));
      this._notify('cards', this._state.cards);
      this._notify('strokes', this._state.strokes);
    }
  }
}

// Export singleton instance
export const state = new AppState();
