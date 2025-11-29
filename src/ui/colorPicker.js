/**
 * Simple Modal for picking a color
 */

import { CARD_COLOR_PALETTE } from '../utils/constants.js';
import { changeSelectedCardsColor } from './cardOperations.js';

export function showColorPicker() {
  // Create modal structure
  const modal = document.createElement('div');
  modal.className = 'editor-overlay';

  const colorSwatchesHTML = CARD_COLOR_PALETTE.map(color =>
    `<div class="color-swatch" data-color="${color}" style="background-color: ${color};"></div>`
  ).join('');

  modal.innerHTML = `
    <div class="color-picker-dialog">
      <h3>Select a Color</h3>
      <div class="color-palette">
        ${colorSwatchesHTML}
      </div>
      <button id="close-color-picker" class="btn-secondary" style="margin-top: 20px;">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      changeSelectedCardsColor(color);
      closeModal();
    });
  });

  modal.querySelector('#close-color-picker').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}
