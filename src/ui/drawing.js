import Konva from 'konva';
import { state } from '../core/state.js';
import { COLORS } from '../utils/constants.js';

let isDrawing = false;
let currentLine;
let lastPointerPosition;
let drawingLayer;
let stage;

const BASE_STROKE_WIDTH = 5; // Base width for the pen stroke

/**
 * Sets up drawing functionality on the Konva stage.
 * @param {Konva.Stage} konvaStage - The Konva stage instance.
 * @param {Konva.Layer} konvaDrawingLayer - The Konva layer dedicated for drawing.
 */
export function setupDrawing(konvaStage, konvaDrawingLayer) {
  stage = konvaStage;
  drawingLayer = konvaDrawingLayer;

  stage.on('pointerdown', (e) => {
    // Only start drawing if drawing mode is active (to be implemented)
    // For now, let's assume drawing is always active for testing
    // if (!state.get('drawingMode')) return;

    isDrawing = true;
    lastPointerPosition = stage.getPointerPosition();

    currentLine = new Konva.Line({
      points: [lastPointerPosition.x, lastPointerPosition.y],
      stroke: COLORS.DRAWING_STROKE, // Define this color in constants.js
      strokeWidth: BASE_STROKE_WIDTH,
      lineCap: 'round',
      lineJoin: 'round',
      tension: 0.5, // Smooths the line
    });

    drawingLayer.add(currentLine);
  });

  stage.on('pointermove', (e) => {
    if (!isDrawing) return;

    e.evt.preventDefault(); // Prevent scrolling/panning while drawing

    const pos = stage.getPointerPosition();
    const pressure = e.evt.pressure !== undefined ? e.evt.pressure : 1; // Get pressure, default to 1

    // Throttle drawing updates for performance, especially for e-ink
    // Using requestAnimationFrame for smoother drawing
    if (!lastPointerPosition || (Math.abs(pos.x - lastPointerPosition.x) > 1 || Math.abs(pos.y - lastPointerPosition.y) > 1)) {
      const newPoints = currentLine.points().concat([pos.x, pos.y]);
      currentLine.points(newPoints);

      // Apply pressure-sensitive stroke width
      currentLine.strokeWidth(BASE_STROKE_WIDTH * pressure);

      drawingLayer.batchDraw();
      lastPointerPosition = pos;
    }
  });

  stage.on('pointerup', () => {
    isDrawing = false;
    currentLine = null;
    lastPointerPosition = null;
    drawingLayer.batchDraw(); // Final draw
  });
}
