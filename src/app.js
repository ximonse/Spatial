/**
 * Main application initialization
 */

import { stageManager } from './core/stage.js';
import { cardFactory } from './cards/CardFactory.js';
import { state } from './core/state.js';
import { db } from './core/db.js';
import { CARD_TYPES } from './utils/constants.js';
import { cardEditor } from './ui/editor.js';
import { commandPalette } from './ui/commandPalette.js';
import { overlayManager } from './cards/overlayManager.js';
import { columnView } from './ui/columnView.js';
import { statusNotification } from './ui/statusNotification.js';
import { searchCards } from './utils/search.js';
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

    // Initialize status notification
    statusNotification.init();
    console.log('✅ Status notification initialized');

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
    const toolbarSort = document.getElementById('toolbar-sort');

    const updateViewButton = () => {
      const currentView = state.get('currentView');
      btnToggleView.textContent = currentView === 'board' ? 'Board View' : 'Column View';

      // Show/hide sort dropdown based on view
      if (currentView === 'column') {
        toolbarSort?.classList.remove('hidden');
      } else {
        toolbarSort?.classList.add('hidden');
      }
    };

    btnToggleView?.addEventListener('click', () => {
      this.toggleView();
    });

    updateViewButton();
    state.subscribe('currentView', updateViewButton);

    // Toolbar collapse/expand
    const toolbarToggle = document.getElementById('toolbar-toggle');
    const toolbarShow = document.getElementById('toolbar-show');
    const toolbar = document.getElementById('toolbar');

    // Hide toolbar (button inside toolbar)
    toolbarToggle?.addEventListener('click', () => {
      toolbar.classList.remove('toolbar-expanded');
      toolbar.classList.add('toolbar-collapsed');
      toolbarShow?.classList.remove('hidden');
    });

    // Show toolbar (small button at top when collapsed)
    toolbarShow?.addEventListener('click', () => {
      toolbar.classList.add('toolbar-expanded');
      toolbar.classList.remove('toolbar-collapsed');
      toolbarShow?.classList.add('hidden');
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput?.addEventListener('input', (e) => {
      const query = e.target.value;
      state.set('searchQuery', query);

      // Highlight matching cards as you type
      if (query.trim()) {
        this._highlightSearchMatches(query);
      } else {
        // Clear selection if search is empty
        state.clearSelection();
      }
    });

    // Enter key confirms search selection
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchInput.blur(); // Leave search field
      }
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
   * Highlight cards matching search query
   */
  _highlightSearchMatches(query) {
    const cards = state.get('cards');
    const matchingIds = searchCards(cards, query);

    // Clear current selection
    state.clearSelection();

    // Select all matching cards
    matchingIds.forEach(id => {
      state.selectCard(id);
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
