/**
 * Keyboard Shortcuts
 * All keyboard shortcuts and combinations
 */

import { state } from '../core/state.js';
import { commandPalette } from './commandPalette.js';
import { chatPanel } from './ChatPanel.js';
import {
  pasteCards,
  copySelectedCards,
  duplicateSelectedCards,
  togglePinSelectedCards, // This one can be called directly or via command palette
} from './cardOperations.js';

/**
 * Setup keyboard shortcuts
 */
export function setupKeyboardShortcuts(app) {
  let lastKey = null;
  let lastKeyTime = 0;

  // Map single-key commands from command palette for direct access
  const directShortcuts = new Map();
  commandPalette.commands.forEach(cmd => {
    // Only consider single-key shortcuts without modifiers
    // And ensure they are not already handled by specific logic below
    if (cmd.key && cmd.key.length === 1 && !cmd.key.includes('+') &&
        !['escape', 'delete', 'backspace', 'f', '-', 'k', 'a', 'c', 'd', 'p', 's', 'l', 'b', 'r', 'm', 'e', 'i'].includes(cmd.key.toLowerCase())) {
      directShortcuts.set(cmd.key.toLowerCase(), cmd.action);
    }
  });

  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input or textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();
    const now = Date.now();
    let handled = false;
    let searchInput; // Declare searchInput once here

    // Check for G+V, G+H, G+T combinations (within 500ms)
    if (lastKey === 'g' && now - lastKeyTime < 500) {
      if (key === 'v') {
        commandPalette.executeCommandByName('Arrange Grid Vertical');
        handled = true;
      } else if (key === 'h') {
        commandPalette.executeCommandByName('Arrange Grid Horizontal');
        handled = true;
      } else if (key === 't') {
        commandPalette.executeCommandByName('Arrange Kanban');
        handled = true;
      }
      if (handled) {
        e.preventDefault();
        lastKey = null; // Reset lastKey after combination
        return;
      }
    }

    // Remember last key for combinations
    lastKey = key;
    lastKeyTime = now;

    // Handle Ctrl/Meta key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (key) {
        case 'a':
          state.selectAll();
          handled = true;
          break;
        case 'c':
          copySelectedCards();
          handled = true;
          break;
        case 'v':
          pasteCards();
          handled = true;
          break;
        case 'd':
          duplicateSelectedCards();
          handled = true;
          break;
      }
      if (handled) {
        e.preventDefault();
        return;
      }
    }

    // Handle specific shortcuts not covered by directShortcuts or combinations
    switch (key) {
      case 'escape':
        // Blur any active input/textarea
        if (document.activeElement &&
            (document.activeElement.tagName === 'INPUT' ||
             document.activeElement.tagName === 'TEXTAREA')) {
          document.activeElement.blur();
        }
        state.clearSelection();
        state.set('searchQuery', '');
        searchInput = document.getElementById('search-input'); // Assign here
        if (searchInput) {
          searchInput.value = '';
        }
        handled = true;
        break;

      case 'delete':
      case 'backspace':
        if (!e.target.matches('input, textarea')) {
          commandPalette.executeCommandByName('Delete Selected');
          handled = true;
        }
        break;
      
      case '-':
        app.zoomToFit();
        handled = true;
        break;

      case 'f':
        searchInput = document.getElementById('search-input'); // Assign here
        if (searchInput) {
          searchInput.focus();
        }
        handled = true;
        break;

      case 'k': // Toggle View (Board/Column) - specific app logic
        app.toggleView();
        handled = true;
        break;
      
      case 'a': // AI Chat Assistant
        chatPanel.toggle();
        handled = true;
        break;

      case 'p': // Toggle Pin Selected Cards
        togglePinSelectedCards();
        handled = true;
        break;

      case 'n':
        commandPalette.executeCommandByName('New Card');
        handled = true;
        break;
      case 'v':
        commandPalette.executeCommandByName('Arrange Vertical');
        handled = true;
        break;
      case 'h':
        commandPalette.executeCommandByName('Arrange Horizontal');
        handled = true;
        break;
      case 'q':
        commandPalette.executeCommandByName('Arrange Circle');
        handled = true;
        break;
      case 's':
        commandPalette.executeCommandByName('Export to JSON');
        handled = true;
        break;
      case 'l':
        commandPalette.executeCommandByName('Import from JSON');
        handled = true;
        break;
      case 'b':
        commandPalette.executeCommandByName('Create Backup (ZIP)');
        handled = true;
        break;
      case 'r':
        commandPalette.executeCommandByName('Restore from Backup');
        handled = true;
        break;
      case 'm':
        commandPalette.executeCommandByName('Multi-Import from Text');
        handled = true;
        break;
      case 'e':
        commandPalette.executeCommandByName('Export to Text');
        handled = true;
        break;
      case 'i':
        commandPalette.executeCommandByName('Import Image');
        handled = true;
        break;
      case 'z':
        commandPalette.executeCommandByName('Import from Zotero');
        handled = true;
        break;
    }

    // Handle single-key shortcuts from command palette
    if (!handled && directShortcuts.has(key)) {
      directShortcuts.get(key)();
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  });
}
