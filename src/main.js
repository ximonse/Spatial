/**
 * Entry point for Spatial Note
 */

import './styles/main.css';
import { SpatialNoteApp } from './app.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new SpatialNoteApp();
  await app.init();

  // Expose to window for debugging
  window.spatialNote = app;
});
