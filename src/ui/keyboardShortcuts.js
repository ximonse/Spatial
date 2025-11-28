/**
 * Keyboard Shortcuts
 * All keyboard shortcuts and combinations
 */

import { state } from '../core/state.js';
import {
  arrangeVertical,
  arrangeHorizontal,
  arrangeGrid,
  arrangeCircle,
  arrangeGridVertical,
  arrangeGridHorizontal,
  arrangeKanban
} from '../arrangement/layouts.js';
import {
  copySelectedCards,
  pasteCards,
  duplicateSelectedCards,
  togglePinSelectedCards,
  deleteSelectedCards,
  createNewCard
} from './cardOperations.js';
import { exportToJSON, importFromJSON } from '../io/jsonIO.js';
import { createBackup, restoreBackup } from '../io/backup.js';
import { multiImportFromText } from '../io/multiImport.js';
import { showExportDialog } from '../io/textExport.js';
import { importImage } from '../io/imageImport.js';

/**
 * Setup keyboard shortcuts
 */
export function setupKeyboardShortcuts(app) {
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
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          pasteCards();
        } else {
          arrangeVertical();
        }
        break;

      case 'h':
        arrangeHorizontal();
        break;

      case 'q':
        arrangeCircle();
        break;

      case 'escape':
        // Blur any active input/textarea
        if (document.activeElement &&
            (document.activeElement.tagName === 'INPUT' ||
             document.activeElement.tagName === 'TEXTAREA')) {
          document.activeElement.blur();
        }

        // Clear selection and search
        state.clearSelection();
        state.set('searchQuery', '');
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = '';
        }
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

      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          duplicateSelectedCards();
        }
        break;

      case 'p':
        togglePinSelectedCards();
        break;

      case 's':
        if (!e.ctrlKey && !e.metaKey) {
          exportToJSON();
        }
        break;

      case 'l':
        if (!e.ctrlKey && !e.metaKey) {
          importFromJSON();
        }
        break;

      case 'b':
        if (!e.ctrlKey && !e.metaKey) {
          createBackup();
        }
        break;

      case 'r':
        if (!e.ctrlKey && !e.metaKey) {
          restoreBackup();
        }
        break;

      case 'm':
        if (!e.ctrlKey && !e.metaKey) {
          multiImportFromText();
        }
        break;

      case 'e':
        if (!e.ctrlKey && !e.metaKey) {
          showExportDialog();
        }
        break;

      case 'i':
        if (!e.ctrlKey && !e.metaKey) {
          importImage();
        }
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
