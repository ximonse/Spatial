import Konva from 'konva';
import { state } from '../core/state.js';
import { db } from '../core/db.js'; // Import db
import { COLORS } from '../utils/constants.js';

let isDrawing = false;
let currentLine;
let lastPointerPosition;
let drawingLayer;
let stage;

const BASE_STROKE_WIDTH = 5; // Base width for the pen stroke

/**
 * Redraws all strokes from the state onto the drawing layer.
 */
function redrawAllStrokes() {
  drawingLayer.destroyChildren(); // Clear existing strokes
  state.getStrokes().forEach(strokeData => {
    const line = new Konva.Line({
      points: strokeData.points,
      stroke: strokeData.color,
      strokeWidth: strokeData.baseWidth, // Assuming baseWidth is stored for initial render
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0.5,
      id: `stroke-${strokeData.id}`, // Assign ID for later reference
    });
    drawingLayer.add(line);
  });
  drawingLayer.batchDraw();
}

/**
 * Sets up drawing functionality on the Konva stage.
 * @param {Konva.Stage} konvaStage - The Konva stage instance.
 * @param {Konva.Layer} konvaDrawingLayer - The Konva layer dedicated for drawing.
 */
export async function setupDrawing(konvaStage, konvaDrawingLayer) {
  stage = konvaStage;
  drawingLayer = konvaDrawingLayer;

  // Load existing strokes from DB and add to state and layer
  const storedStrokes = await db.getAllStrokes();
  storedStrokes.forEach(strokeData => {
    state.addStroke(strokeData); // Add to state first
  });
  redrawAllStrokes(); // Redraw all loaded strokes

  // Subscribe to state changes for strokes (for undo/redo)
  state.subscribe('strokes', () => {
    redrawAllStrokes();
  });

  stage.on('pointerdown', (e) => {
    // Only start drawing if drawing mode is active (to be implemented)
    // For now, let's assume drawing is always active for testing
    // if (!state.get('drawingMode')) return;

    isDrawing = true;
    lastPointerPosition = stage.getPointerPosition();

    currentLine = new Konva.Line({
      points: [lastPointerPosition.x, lastPointerPosition.y],
      stroke: COLORS.DRAWING_STROKE,
      strokeWidth: BASE_STROKE_WIDTH,
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0.5,
    });

    drawingLayer.add(currentLine);
  });

  stage.on('pointermove', (e) => {
    if (!isDrawing) return;

    e.evt.preventDefault(); // Prevent scrolling/panning while drawing

    const pos = stage.getPointerPosition();
    const pressure = e.evt.pressure !== undefined ? e.evt.pressure : 1;

    // Throttle drawing updates for performance, especially for e-ink
    if (!lastPointerPosition || (Math.abs(pos.x - lastPointerPosition.x) > 1 || Math.abs(pos.y - lastPointerPosition.y) > 1)) {
      const newPoints = currentLine.points().concat([pos.x, pos.y]);
      currentLine.points(newPoints);

      // Apply pressure-sensitive stroke width
      currentLine.strokeWidth(BASE_STROKE_WIDTH * pressure);

      drawingLayer.batchDraw();
      lastPointerPosition = pos;
    }
  });

  stage.on('pointerup', async () => {
    if (isDrawing && currentLine) {
      const strokeData = {
        cardId: null, // Will be implemented later
        points: currentLine.points(),
        color: currentLine.stroke(),
        baseWidth: BASE_STROKE_WIDTH,
        pressureAware: true,
        createdAt: Date.now(),
      };

      const savedStroke = await db.addStroke(strokeData);
      state.addStroke(savedStroke);
      state.saveHistory();
    }

    isDrawing = false;
    currentLine = null;
    lastPointerPosition = null;
    drawingLayer.batchDraw(); // Final draw
  });
}
