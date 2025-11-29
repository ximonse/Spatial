/**
 * Context Menu for bulk card operations
 */

class ContextMenu {
  constructor() {
    this.menu = null;
    this.isOpen = false;
  }

  /**
   * Initialize the context menu
   */
  init() {
    this.menu = document.createElement('div');
    this.menu.id = 'context-menu';
    this.menu.className = 'context-menu hidden';
    document.body.appendChild(this.menu);

    // Hide on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target)) {
        this.hide();
      }
    });
  }

  /**
   * Show the context menu at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} selectedCards - The currently selected cards
   */
  show(x, y, selectedCards) {
    if (!this.menu) this.init();

    // TODO: Populate menu with dynamic options based on selectedCards
    this.menu.innerHTML = `
      <ul>
        <li>Change Color</li>
        <li>Manage Tags</li>
        <li class="separator"></li>
        <li>Delete ${selectedCards.length} cards</li>
      </ul>
    `;

    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.classList.remove('hidden');
    this.isOpen = true;
  }

  /**
   * Hide the context menu
   */
  hide() {
    if (!this.menu) return;
    this.menu.classList.add('hidden');
    this.isOpen = false;
  }
}

export const contextMenu = new ContextMenu();
