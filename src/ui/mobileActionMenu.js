/**
 * Mobile Action Menu
 * Bottom sheet menu for mobile devices with quick actions
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
  deleteSelectedCards,
  duplicateSelectedCards,
  copySelectedCards,
  pasteCards,
  togglePinSelectedCards
} from './cardOperations.js';
import { exportToJSON, importFromJSON } from '../io/jsonIO.js';
import { createBackup, restoreBackup } from '../io/backup.js';
import { multiImportFromText } from '../io/multiImport.js';
import { showExportDialog } from '../io/textExport.js';
import { importZoteroNotes } from '../io/zoteroImport.js';

export class MobileActionMenu {
  constructor() {
    this.menuEl = null;
    this.backdropEl = null;
    this.contentEl = null;
    this.closeBtn = null;
    this.isOpen = false;
  }

  /**
   * Initialize mobile action menu
   */
  init() {
    this.menuEl = document.getElementById('mobile-action-menu');
    this.backdropEl = document.getElementById('mobile-action-menu-backdrop');
    this.contentEl = this.menuEl?.querySelector('.mobile-action-menu-content');
    this.closeBtn = this.menuEl?.querySelector('.mobile-action-menu-close');

    if (!this.menuEl || !this.backdropEl || !this.contentEl) {
      console.error('Mobile action menu elements not found');
      return;
    }

    this._setupListeners();
    this._renderMenu();
  }

  /**
   * Setup event listeners
   */
  _setupListeners() {
    // Close button
    this.closeBtn?.addEventListener('click', () => {
      this.close();
    });

    // Backdrop click to close
    this.backdropEl?.addEventListener('click', () => {
      this.close();
    });

    // Prevent menu clicks from closing
    this.menuEl?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Render menu items
   */
  _renderMenu() {
    if (!this.contentEl) return;

    const sections = [
      {
        title: 'Quick Actions',
        actions: [
          { icon: '➕', text: 'New Card', key: 'N', action: () => createNewCard() },
          { icon: '📋', text: 'Select All', key: 'Ctrl+A', action: () => state.selectAll() },
          { icon: '✕', text: 'Clear Selection', key: 'Esc', action: () => state.clearSelection() },
        ]
      },
      {
        title: 'Arrangement',
        actions: [
          { icon: '↕', text: 'Arrange Vertical', key: 'V', action: () => arrangeVertical() },
          { icon: '↔', text: 'Arrange Horizontal', key: 'H', action: () => arrangeHorizontal() },
          { icon: '⊞', text: 'Arrange Grid', key: 'G', action: () => arrangeGrid() },
          { icon: '○', text: 'Arrange Circle', key: 'Q', action: () => arrangeCircle() },
          { icon: '⊟', text: 'Grid Vertical', key: 'G+V', action: () => arrangeGridVertical() },
          { icon: '⊠', text: 'Grid Horizontal', key: 'G+H', action: () => arrangeGridHorizontal() },
          { icon: '▦', text: 'Kanban Layout', key: 'G+T', action: () => arrangeKanban() },
        ]
      },
      {
        title: 'Selection Actions',
        actions: [
          { icon: '📌', text: 'Pin/Unpin', action: () => togglePinSelectedCards() },
          { icon: '📄', text: 'Duplicate', action: () => duplicateSelectedCards() },
          { icon: '📋', text: 'Copy', action: () => copySelectedCards() },
          { icon: '📝', text: 'Paste', action: () => pasteCards() },
          { icon: '🗑', text: 'Delete Selected', key: 'Del', action: () => deleteSelectedCards() },
        ]
      },
      {
        title: 'Import / Export',
        actions: [
          { icon: '💾', text: 'Export to JSON', key: 'S', action: () => exportToJSON() },
          { icon: '📂', text: 'Import from JSON', key: 'L', action: () => importFromJSON() },
          { icon: '📦', text: 'Create Backup (ZIP)', key: 'B', action: () => createBackup() },
          { icon: '♻', text: 'Restore from Backup', key: 'R', action: () => restoreBackup() },
          { icon: '📝', text: 'Multi-Import from Text', key: 'M', action: () => multiImportFromText() },
          { icon: '📄', text: 'Export to Text', key: 'E', action: () => showExportDialog() },
          { icon: '📚', text: 'Import from Zotero', key: 'Z', action: () => importZoteroNotes() },
        ]
      }
    ];

    this.contentEl.innerHTML = sections.map(section => `
      <div class="mobile-action-section">
        <div class="mobile-action-section-title">${section.title}</div>
        ${section.actions.map(action => `
          <button class="mobile-action-item" data-action="${action.text}">
            <span class="mobile-action-item-icon">${action.icon}</span>
            <span class="mobile-action-item-text">${action.text}</span>
            ${action.key ? `<span class="mobile-action-item-badge">${action.key}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `).join('');

    // Add click handlers
    sections.forEach(section => {
      section.actions.forEach(action => {
        const btn = this.contentEl.querySelector(`[data-action="${action.text}"]`);
        btn?.addEventListener('click', () => {
          action.action();
          this.close();
        });
      });
    });
  }

  /**
   * Open menu
   */
  open() {
    this.isOpen = true;
    this.menuEl.classList.add('visible');
    this.backdropEl.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close menu
   */
  close() {
    this.isOpen = false;
    this.menuEl.classList.remove('visible');
    this.backdropEl.classList.remove('visible');
    document.body.style.overflow = '';
  }

  /**
   * Toggle menu
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
export const mobileActionMenu = new MobileActionMenu();
