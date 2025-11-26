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
    btnToggleView?.addEventListener('click', () => {
      const currentView = state.get('currentView');
      const newView = currentView === 'board' ? 'column' : 'board';
      state.set('currentView', newView);
      btnToggleView.textContent = newView === 'board' ? 'Board View' : 'Column View';
    });

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
    let lastKey = null;
    let lastKeyTime = 0;

    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check for G+V, G+H, G+T combinations (within 500ms)
      if (lastKey === 'g' && now - lastKeyTime < 500) {
        if (key === 'v') {
          arrangeGridVertical();
          lastKey = null;
          return;
        } else if (key === 'h') {
          arrangeGridHorizontal();
          lastKey = null;
          return;
        } else if (key === 't') {
          arrangeKanban();
          lastKey = null;
          return;
        }
      }

      // Remember last key for combinations
      lastKey = key;
      lastKeyTime = now;

      switch (key) {
        case 'n':
          createNewCard();
          break;

        case 'v':
          arrangeVertical();
          break;

        case 'h':
          arrangeHorizontal();
          break;

        case 'g':
          arrangeGrid();
          break;

        case 'q':
          arrangeCircle();
          break;

        case 'escape':
          state.clearSelection();
          state.set('searchQuery', '');
          document.getElementById('search-input').value = '';
          break;

        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            state.selectAll();
          }
          break;

        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            copySelectedCards();
          }
          break;

        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            pasteCards();
          }
          break;

        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            duplicateSelectedCards();
          }
          break;

        case 'p':
          togglePinSelectedCards();
          break;

        case 'delete':
        case 'backspace':
          if (!e.target.matches('input, textarea')) {
            e.preventDefault();
            deleteSelectedCards();
          }
          break;
      }
    });
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
