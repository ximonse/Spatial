/**
 * Quick Actions Bar
 * Floating action bar shown when cards are selected on mobile
 */

import { state } from '../core/state.js';
import { deleteSelectedCards } from './cardOperations.js';
import { mobileActionMenu } from './mobileActionMenu.js';

export class QuickActionsBar {
  constructor() {
    this.barEl = null;
    this.countEl = null;
    this.isVisible = false;
  }

  /**
   * Initialize quick actions bar
   */
  init() {
    this.barEl = document.getElementById('quick-actions-bar');
    this.countEl = this.barEl?.querySelector('.quick-action-count');

    if (!this.barEl) {
      console.error('Quick actions bar element not found');
      return;
    }

    this._setupListeners();
    this._subscribeToState();
  }

  /**
   * Setup event listeners
   */
  _setupListeners() {
    // Action buttons
    const buttons = this.barEl.querySelectorAll('.quick-action-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this._handleAction(action);
      });
    });
  }

  /**
   * Subscribe to state changes
   */
  _subscribeToState() {
    // Show/hide based on selection
    state.subscribe('selectedCards', (selectedCards) => {
      const count = selectedCards.size;

      if (count > 0 && this._isMobile()) {
        this.show(count);
      } else {
        this.hide();
      }
    });
  }

  /**
   * Handle action button click
   */
  _handleAction(action) {
    switch (action) {
      case 'arrange':
        // Show arrangement options in mobile menu
        mobileActionMenu.open();
        break;
      case 'delete':
        deleteSelectedCards();
        break;
      case 'more':
        // Show full mobile action menu
        mobileActionMenu.open();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Check if device is mobile
   */
  _isMobile() {
    return window.innerWidth <= 768 ||
           ('ontouchstart' in window && window.innerWidth <= 1024);
  }

  /**
   * Show bar with selection count
   */
  show(count) {
    if (this.countEl) {
      this.countEl.textContent = `${count} selected`;
    }
    this.barEl.classList.add('visible');
    this.isVisible = true;
  }

  /**
   * Hide bar
   */
  hide() {
    this.barEl.classList.remove('visible');
    this.isVisible = false;
  }
}

// Export singleton instance
export const quickActionsBar = new QuickActionsBar();
