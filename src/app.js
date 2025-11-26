/**
 * Main application initialization
 */

import { stageManager } from './core/stage.js';
import { cardFactory } from './cards/CardFactory.js';
import { state } from './core/state.js';
import { CARD_TYPES } from './utils/constants.js';
import { cardEditor } from './ui/editor.js';
import { commandPalette } from './ui/commandPalette.js';
import { overlayManager } from './cards/overlayManager.js';
import { columnView } from './ui/columnView.js';
import {
  arrangeVertical,
  arrangeHorizontal,
  arrangeGrid,
  arrangeCircle,
  arrangeGridVertical,
  arrangeGridHorizontal,
  arrangeKanban
} from './arrangement/layouts.js';
import {
  copySelectedCards,
  pasteCards,
  duplicateSelectedCards,
  togglePinSelectedCards,
  deleteSelectedCards,
  createNewCard
} from './ui/cardOperations.js';
import { setupKeyboardShortcuts } from './ui/keyboardShortcuts.js';

export class SpatialNoteApp {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🚀 Initializing Spatial Note...');

    // Initialize Konva stage
    stageManager.init('canvas-container');
    console.log('✅ Konva stage initialized');

    // Load cards from database
    const cardCount = await cardFactory.loadAllCards();
    console.log(`✅ Loaded ${cardCount} cards from database`);

    // Initialize card editor
    cardEditor.init();
    console.log('✅ Card editor initialized');

    // Initialize command palette
    commandPalette.init();
    console.log('✅ Command palette initialized');

    // Initialize overlay manager
    overlayManager.init();
    console.log('✅ Overlay manager initialized');

    // Initialize column view
    columnView.init();
    console.log('✅ Column view initialized');

    // Restore saved view
    const savedView = await db.getSetting('currentView', 'board');
    state.set('currentView', savedView);

    // Setup UI interactions
    this._setupUI();

    // Subscribe to state changes
    this._setupStateListeners();

    // If no cards exist, create a welcome card
    if (cardCount === 0) {
      await this._createWelcomeCard();
    }

    this.initialized = true;
    console.log('✅ Spatial Note ready!');
  }

  /**
   * Setup UI event listeners
   */
  _setupUI() {
    // New card button
    const btnNewCard = document.getElementById('btn-new-card');
    btnNewCard?.addEventListener('click', () => {
      createNewCard();
    });

    // Toggle view button
    const btnToggleView = document.getElementById('btn-toggle-view');
    const updateViewButton = () => {
      const currentView = state.get('currentView');
      btnToggleView.textContent = currentView === 'board' ? 'Board View' : 'Column View';
    };

    btnToggleView?.addEventListener('click', () => {
      this.toggleView();
    });

    updateViewButton();
    state.subscribe('currentView', updateViewButton);

    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', (e) => {
      state.set('searchQuery', e.target.value);
    });

    // Keyboard shortcuts
    this._setupKeyboardShortcuts();
  }

  /**
   * Setup keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    setupKeyboardShortcuts(this);
  }

  /**
   * Setup state change listeners
   */
  _setupStateListeners() {
    // Update selection visuals when selection changes
    state.subscribe('selectedCards', (selectedCards) => {
      const allCards = cardFactory.getAllCards();
      allCards.forEach(card => {
        const isSelected = selectedCards.has(card.data.id);
        card.setSelected(isSelected);
      });
    });

    // Update zoom indicator
    state.subscribe('zoom', (zoom) => {
      const indicator = document.getElementById('zoom-indicator');
      if (indicator) {
        indicator.textContent = `${Math.round(zoom * 100)}%`;
      }
    });
  }


  /**
   * Toggle between board and column view
   */
  async toggleView() {
    const currentView = state.get('currentView');
    const newView = currentView === 'board' ? 'column' : 'board';
    state.set('currentView', newView);

    // Save to database
    import('./core/db.js').then(({ db }) => {
      db.saveSetting('currentView', newView);
    });

    console.log(`📋 Switched to ${newView} view`);
  }

  /**
   * Create welcome card
   */
  async _createWelcomeCard() {
    const welcomeText = `Welcome to Spatial Note!

This is your infinite canvas for spatial thinking.

Press N to create a new card
Drag cards to organize them
Double-click to edit

Based on Zettelkasten & cognitive psychology`;

    await cardFactory.createCard(CARD_TYPES.TEXT, {
      x: 100,
      y: 100,
      content: welcomeText,
    });
  }
}
