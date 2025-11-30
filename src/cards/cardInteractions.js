/**
 * Card interaction handlers (extracted from TextCard.js)
 * Handles click, drag, and hover interactions
 */

import { state } from '../core/state.js';
import { cardFactory } from './CardFactory.js';
import { db } from '../core/db.js';

/**
 * Setup card interaction handlers
 */
export function setupCardInteractions(card) {
  const { group, data } = card;

  // Track multi-drag state
  let dragStartPositions = new Map();
  let dragOrigin = null;
  let isDraggingMultiple = false;

  // Click to select
  group.on('click tap', (e) => {
    if (e.evt.shiftKey || e.evt.ctrlKey) {
      state.toggleCardSelection(data.id);
    } else {
      state.clearSelection();
      state.selectCard(data.id);
    }
  });

  // Double-click to edit
  group.on('dblclick dbltap', () => {
    state.set('editingCardId', data.id);
  });

  // Hover effects (cursor only, border stays consistent)
  group.on('mouseenter', () => {
    document.body.style.cursor = 'move';
  });

  group.on('mouseleave', () => {
    document.body.style.cursor = 'default';
  });

  // Drag start - setup multi-drag
  group.on('dragstart', () => {
    if (!state.isSelected(data.id)) {
      state.clearSelection();
      state.selectCard(data.id);
    }

    const startPos = card.getPosition();
    dragOrigin = { x: startPos.x, y: startPos.y };

    const selectedCards = state.getSelectedCards();
    isDraggingMultiple = selectedCards.length > 1;

    if (isDraggingMultiple) {
      dragStartPositions.clear();
      selectedCards.forEach(cardData => {
        const cardInstance = cardFactory.getCard(cardData.id);
        if (cardInstance && cardInstance !== card) {
          const pos = cardInstance.getPosition();
          dragStartPositions.set(cardData.id, { x: pos.x, y: pos.y });
        }
      });
    }
  });

  // Drag move - move all selected cards together
  group.on('dragmove', () => {
    const pos = card.getPosition();
    if (card.contentOverlay) {
      card.contentOverlay.setPosition(pos.x, pos.y);
    }

    if (isDraggingMultiple && dragStartPositions.size > 0) {
      const currentPos = card.getPosition();
      const deltaX = currentPos.x - (dragOrigin ? dragOrigin.x : data.x);
      const deltaY = currentPos.y - (dragOrigin ? dragOrigin.y : data.y);

      dragStartPositions.forEach((startPos, cardId) => {
        const cardInstance = cardFactory.getCard(cardId);
        if (cardInstance) {
          cardInstance.setPosition(
            startPos.x + deltaX,
            startPos.y + deltaY
          );
        }
      });
      group.getLayer()?.batchDraw();
    }
  });

  // Drag end - save all positions
  group.on('dragend', async () => {
    data.x = group.x();
    data.y = group.y();

    const updates = [{ id: data.id, x: data.x, y: data.y }];

    if (isDraggingMultiple) {
      dragStartPositions.forEach((_, cardId) => {
        const cardInstance = cardFactory.getCard(cardId);
        if (cardInstance) {
          const pos = cardInstance.getPosition();
          cardInstance.data.x = pos.x;
          cardInstance.data.y = pos.y;
          updates.push({ id: cardId, x: pos.x, y: pos.y });
        }
      });
    }

    // Batch save to database - wait for completion
    try {
      await Promise.all(updates.map(u => db.updateCard(u.id, { x: u.x, y: u.y })));
    } catch (error) {
      console.error('Failed to save card positions:', error);
    }

    dragStartPositions.clear();
    isDraggingMultiple = false;
    dragOrigin = null;
  });
}
