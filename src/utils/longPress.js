/**
 * Long press detection utility
 * Detects long press/tap gestures for mobile and desktop
 */

/**
 * Add long press handler to a Konva node
 * @param {Konva.Node} node - The Konva node to attach the handler to
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {number} duration - Duration in ms to trigger long press (default: 500)
 */
export function addLongPressHandler(node, onLongPress, duration = 500) {
  let longPressTimer = null;
  let touchStarted = false;
  let startPos = null;
  const moveThreshold = 10; // pixels

  const start = (e) => {
    touchStarted = true;
    startPos = node.getStage().getPointerPosition();

    longPressTimer = setTimeout(() => {
      if (touchStarted) {
        onLongPress(e);
        touchStarted = false;
      }
    }, duration);
  };

  const move = () => {
    if (!touchStarted || !startPos) return;

    const currentPos = node.getStage().getPointerPosition();
    const dx = Math.abs(currentPos.x - startPos.x);
    const dy = Math.abs(currentPos.y - startPos.y);

    // Cancel if moved too much
    if (dx > moveThreshold || dy > moveThreshold) {
      cancel();
    }
  };

  const cancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    touchStarted = false;
    startPos = null;
  };

  // Touch events
  node.on('touchstart', start);
  node.on('touchmove', move);
  node.on('touchend', cancel);
  node.on('touchcancel', cancel);

  // Mouse events (for testing on desktop)
  node.on('mousedown', start);
  node.on('mousemove', move);
  node.on('mouseup', cancel);
  node.on('mouseleave', cancel);

  // Return cleanup function
  return () => {
    cancel();
    node.off('touchstart', start);
    node.off('touchmove', move);
    node.off('touchend', cancel);
    node.off('touchcancel', cancel);
    node.off('mousedown', start);
    node.off('mousemove', move);
    node.off('mouseup', cancel);
    node.off('mouseleave', cancel);
  };
}

/**
 * Add long press handler to a DOM element
 * @param {HTMLElement} element - The DOM element
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {number} duration - Duration in ms to trigger long press (default: 500)
 */
export function addLongPressHandlerDOM(element, onLongPress, duration = 500) {
  let longPressTimer = null;
  let touchStarted = false;
  let startPos = null;
  const moveThreshold = 10; // pixels

  const start = (e) => {
    touchStarted = true;
    startPos = {
      x: e.touches ? e.touches[0].clientX : e.clientX,
      y: e.touches ? e.touches[0].clientY : e.clientY
    };

    longPressTimer = setTimeout(() => {
      if (touchStarted) {
        onLongPress(e);
        touchStarted = false;
      }
    }, duration);
  };

  const move = (e) => {
    if (!touchStarted || !startPos) return;

    const currentPos = {
      x: e.touches ? e.touches[0].clientX : e.clientX,
      y: e.touches ? e.touches[0].clientY : e.clientY
    };
    const dx = Math.abs(currentPos.x - startPos.x);
    const dy = Math.abs(currentPos.y - startPos.y);

    // Cancel if moved too much
    if (dx > moveThreshold || dy > moveThreshold) {
      cancel();
    }
  };

  const cancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    touchStarted = false;
    startPos = null;
  };

  // Touch events
  element.addEventListener('touchstart', start, { passive: true });
  element.addEventListener('touchmove', move, { passive: true });
  element.addEventListener('touchend', cancel);
  element.addEventListener('touchcancel', cancel);

  // Mouse events (for testing on desktop)
  element.addEventListener('mousedown', start);
  element.addEventListener('mousemove', move);
  element.addEventListener('mouseup', cancel);
  element.addEventListener('mouseleave', cancel);

  // Return cleanup function
  return () => {
    cancel();
    element.removeEventListener('touchstart', start);
    element.removeEventListener('touchmove', move);
    element.removeEventListener('touchend', cancel);
    element.removeEventListener('touchcancel', cancel);
    element.removeEventListener('mousedown', start);
    element.removeEventListener('mousemove', move);
    element.removeEventListener('mouseup', cancel);
    element.removeEventListener('mouseleave', cancel);
  };
}
