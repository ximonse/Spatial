/**
 * Card interaction handlers (extracted from TextCard.js)
 * Handles click, drag, and hover interactions
 */

import { state } from '../core/state.js';

/**
 * Setup card interaction handlers
 */
export function setupCardInteractions(card) {
  const { group, data } = card;

  // Track multi-drag state
  let dragStartPositions = new Map();
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

  // Hover effects
  group.on('mouseenter', () => {
    if (!state.isSelected(data.id)) {
      card.rect.strokeWidth(2);
      group.getLayer()?.batchDraw();
    }
    document.body.style.cursor = 'move';
  });

  group.on('mouseleave', () => {
    if (!state.isSelected(data.id)) {
      card.rect.strokeWidth(1);
      group.getLayer()?.batchDraw();
    }
    document.body.style.cursor = 'default';
  });

  // Drag start - setup multi-drag
  group.on('dragstart', () => {
    if (!state.isSelected(data.id)) {
      state.clearSelection();
      state.selectCard(data.id);
    }

    const selectedCards = state.getSelectedCards();
    isDraggingMultiple = selectedCards.length > 1;

    if (isDraggingMultiple) {
      import('./CardFactory.js').then(({ cardFactory }) => {
        dragStartPositions.clear();
        selectedCards.forEach(cardData => {
          const cardInstance = cardFactory.getCard(cardData.id);
          if (cardInstance && cardInstance !== card) {
            const pos = cardInstance.getPosition();
            dragStartPositions.set(cardData.id, { x: pos.x, y: pos.y });
          }
        });
      });
    }
  });

  // Drag move - move all selected cards together
  group.on('dragmove', () => {
    const pos = card.getPosition();
    card.contentOverlay.setPosition(pos.x, pos.y);

    if (isDraggingMultiple && dragStartPositions.size > 0) {
      const currentPos = card.getPosition();
      const deltaX = currentPos.x - data.x;
      const deltaY = currentPos.y - data.y;

      import('./CardFactory.js').then(({ cardFactory }) => {
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
      });
    }
  });

  // Drag end - save all positions
  group.on('dragend', () => {
    data.x = group.x();
    data.y = group.y();

    if (isDraggingMultiple) {
      import('./CardFactory.js').then(({ cardFactory }) => {
        dragStartPositions.forEach((_, cardId) => {
          const cardInstance = cardFactory.getCard(cardId);
          if (cardInstance) {
            const pos = cardInstance.getPosition();
            cardInstance.data.x = pos.x;
            cardInstance.data.y = pos.y;

            import('../core/db.js').then(({ db }) => {
              db.updateCard(cardId, { x: pos.x, y: pos.y });
            });
          }
        });
      });
    }

    import('../core/db.js').then(({ db }) => {
      db.updateCard(data.id, { x: data.x, y: data.y });
    });

    dragStartPositions.clear();
    isDraggingMultiple = false;
  });
}
