/**
 * Command Palette
 * Quick access to all commands (opened with Space)
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
  createNewCard,
  deleteSelectedCards
} from './cardOperations.js';
import { exportToJSON, importFromJSON } from '../io/jsonIO.js';
import { createBackup, restoreBackup } from '../io/backup.js';
import { multiImportFromText } from '../io/multiImport.js';
import { showExportDialog } from '../io/textExport.js';
import { importZoteroNotes } from '../io/zoteroImport.js';
import { importImage } from '../io/imageImport.js';

export class CommandPalette {
  constructor() {
    this.paletteEl = null;
    this.inputEl = null;
    this.listEl = null;
    this.commands = [];
    this.filteredCommands = [];
    this.selectedIndex = 0;
  }

  /**
   * Initialize command palette
   */
  init() {
    this._setupCommands();
    this._setupListeners();
  }

  /**
   * Define all available commands
   */
  _setupCommands() {
    this.commands = [
      {
        icon: '📝',
        name: 'New Card',
        key: 'N',
        action: () => createNewCard(),
      },
      {
        icon: '↕️',
        name: 'Arrange Vertical',
        key: 'V',
        action: () => arrangeVertical(),
      },
      {
        icon: '↔️',
        name: 'Arrange Horizontal',
        key: 'H',
        action: () => arrangeHorizontal(),
      },
      {
        icon: '▦',
        name: 'Arrange Grid',
        key: 'G',
        action: () => arrangeGrid(),
      },
      {
        icon: '⭕',
        name: 'Arrange Circle',
        key: 'Q',
        action: () => arrangeCircle(),
      },
      {
        icon: '⬇️',
        name: 'Arrange Grid Vertical',
        key: 'G+V',
        action: () => arrangeGridVertical(),
      },
      {
        icon: '➡️',
        name: 'Arrange Grid Horizontal',
        key: 'G+H',
        action: () => arrangeGridHorizontal(),
      },
      {
        icon: '📊',
        name: 'Arrange Kanban',
        key: 'G+T',
        action: () => arrangeKanban(),
      },
      {
        icon: '☑️',
        name: 'Select All',
        key: 'Ctrl+A',
        action: () => state.selectAll(),
      },
      {
        icon: '❌',
        name: 'Clear Selection',
        key: 'Esc',
        action: () => state.clearSelection(),
      },
      {
        icon: '🗑️',
        name: 'Delete Selected',
        key: 'Del',
        action: () => deleteSelectedCards(),
      },
      {
        icon: '💾',
        name: 'Export to JSON',
        key: 'S',
        action: () => exportToJSON(),
      },
      {
        icon: '📥',
        name: 'Import from JSON',
        key: 'L',
        action: () => importFromJSON(),
      },
      {
        icon: '🗜️',
        name: 'Create Backup (ZIP)',
        key: 'B',
        action: () => createBackup(),
      },
      {
        icon: '📦',
        name: 'Restore from Backup',
        key: 'R',
        action: () => restoreBackup(),
      },
      {
        icon: '📋',
        name: 'Multi-Import from Text',
        key: 'M',
        action: () => multiImportFromText(),
      },
      {
        icon: '🖼️',
        name: 'Import Image',
        key: 'I',
        action: () => importImage(),
      },
      {
        icon: '📤',
        name: 'Export to Text',
        key: 'E',
        action: () => showExportDialog(),
      },
      {
        icon: '📚',
        name: 'Import from Zotero',
        key: 'Z',
        action: () => importZoteroNotes(),
      },
    ];

    this.filteredCommands = [...this.commands];
  }

  /**
   * Setup event listeners
   */
  _setupListeners() {
    this.paletteEl = document.getElementById('command-palette');
    this.inputEl = document.getElementById('command-input');
    this.listEl = document.getElementById('command-list');

    // Input search
    this.inputEl?.addEventListener('input', (e) => {
      this._filterCommands(e.target.value);
    });

    // Keyboard navigation
    this.inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.filteredCommands.length - 1
        );
        this._renderCommands();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this._renderCommands();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this._executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    // Click outside to close
    this.paletteEl?.addEventListener('click', (e) => {
      if (e.target === this.paletteEl) {
        this.close();
      }
    });

    // Global Space shortcut
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Filter commands by search query
   */
  _filterCommands(query) {
    const lowerQuery = query.toLowerCase();
    this.filteredCommands = this.commands.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.key.toLowerCase().includes(lowerQuery)
    );
    this.selectedIndex = 0;
    this._renderCommands();
  }

  /**
   * Render command list
   */
  _renderCommands() {
    if (!this.listEl) return;

    this.listEl.innerHTML = this.filteredCommands
      .map((cmd, index) => {
        const selected = index === this.selectedIndex ? ' selected' : '';
        return `
          <div class="command-item${selected}" data-index="${index}">
            <span class="command-icon">${cmd.icon}</span>
            <span class="command-name">${cmd.name}</span>
            <span class="command-key">${cmd.key}</span>
          </div>
        `;
      })
      .join('');

    // Add click handlers
    this.listEl.querySelectorAll('.command-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        this.selectedIndex = index;
        this._executeSelected();
      });
    });
  }

  /**
   * Execute selected command
   */
  _executeSelected() {
    const command = this.filteredCommands[this.selectedIndex];
    if (command) {
      command.action();
      this.close();
    }
  }

  /**
   * Toggle palette visibility
   */
  toggle() {
    if (this.paletteEl.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Open palette
   */
  open() {
    this.paletteEl.classList.remove('hidden');
    this.inputEl.value = '';
    this.filteredCommands = [...this.commands];
    this.selectedIndex = 0;
    this._renderCommands();
    setTimeout(() => {
      this.inputEl.focus();
    }, 100);
  }

  /**
   * Close palette
   */
  close() {
    this.paletteEl.classList.add('hidden');
  }
}

// Export singleton instance
export const commandPalette = new CommandPalette();
