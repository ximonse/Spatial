/**
 * Client-side image processing for readability enhancement
 * Uses HTML5 Canvas API for handwriting enhancement
 */

export class ImageProcessor {
  /**
   * Process uploaded image for readability
   * @param {File} file - Image file
   * @param {string} mode - Processing mode: 'note', 'medium', 'photo'
   * @returns {Promise<{original: string, processed: string, width: number, height: number}>}
   */
  static async processImage(file, mode = 'medium') {
    const original = await this._fileToDataUrl(file);

    // Load image
    const img = await this._loadImage(original);

    // Determine target width based on mode
    const targetWidth = mode === 'note' ? 400 : mode === 'medium' ? 600 : 1200;

    // Resize if needed
    const { canvas, ctx } = this._resizeImage(img, targetWidth);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Apply processing based on mode
    if (mode === 'note') {
      // Light contrast boost for better text readability
      this._lightContrastBoost(imageData);
    }
    // Medium and photo modes: no processing, keep as-is

    // Put processed data back
    ctx.putImageData(imageData, 0, 0);

    // Use JPEG for all modes (smaller file size)
    const format = 'image/jpeg';
    const quality = mode === 'note' ? 0.75 : mode === 'photo' ? 0.92 : 0.85;
    const processed = canvas.toDataURL(format, quality);

    return {
      original,
      processed,
      width: canvas.width,
      height: canvas.height,
    };
  }

  /**
   * Resize image to target width while maintaining aspect ratio
   */
  static _resizeImage(img, targetWidth) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate new dimensions
    const scale = Math.min(1, targetWidth / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    // Draw resized image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return { canvas, ctx };
  }

  /**
   * Enhance contrast using histogram equalization
   * Approximation of CLAHE (Contrast Limited Adaptive Histogram Equalization)
   */
  static _enhanceContrast(imageData) {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);

    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = this._toGrayscale(data[i], data[i + 1], data[i + 2]);
      histogram[gray]++;
    }

    // Build cumulative distribution function (CDF)
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }

    // Normalize CDF
    const cdfMin = cdf.find(val => val > 0) || 0;
    const cdfMax = cdf[255];
    const cdfRange = cdfMax - cdfMin;

    if (cdfRange === 0) return; // Avoid division by zero

    // Apply equalization
    for (let i = 0; i < data.length; i += 4) {
      const gray = this._toGrayscale(data[i], data[i + 1], data[i + 2]);
      const equalized = Math.round(((cdf[gray] - cdfMin) / cdfRange) * 255);
      data[i] = data[i + 1] = data[i + 2] = equalized;
    }
  }

  /**
   * Binarize image (make handwriting dark, background white)
   * Using Otsu's method for automatic threshold calculation
   */
  static _binarize(imageData) {
    const data = imageData.data;
    const threshold = this._calculateOtsuThreshold(imageData);

    for (let i = 0; i < data.length; i += 4) {
      const gray = this._toGrayscale(data[i], data[i + 1], data[i + 2]);
      const binary = gray > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = binary;
    }
  }

  /**
   * Calculate optimal threshold using Otsu's method
   * Maximizes between-class variance
   */
  static _calculateOtsuThreshold(imageData) {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);

    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = this._toGrayscale(data[i], data[i + 1], data[i + 2]);
      histogram[gray]++;
    }

    // Calculate total number of pixels
    let total = 0;
    for (let i = 0; i < 256; i++) {
      total += histogram[i];
    }

    // Calculate total sum of grayscale values
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    // Find threshold with maximum between-class variance
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += i * histogram[i];

      const mB = sumB / wB; // Mean background
      const mF = (sum - sumB) / wF; // Mean foreground

      // Calculate between-class variance
      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }

    return threshold;
  }

  /**
   * Reduce noise using median filter (3x3 kernel)
   */
  static _reduceNoise(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const copy = new Uint8ClampedArray(data);

    // Apply median filter (skip borders for simplicity)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get 3x3 neighborhood
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            neighbors.push(copy[nIdx]);
          }
        }

        // Calculate median
        neighbors.sort((a, b) => a - b);
        const median = neighbors[4]; // Middle value

        data[idx] = data[idx + 1] = data[idx + 2] = median;
      }
    }
  }

  /**
   * Convert RGB to grayscale using weighted average
   * Standard conversion: 0.299R + 0.587G + 0.114B
   */
  static _toGrayscale(r, g, b) {
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  /**
   * Light contrast boost for better text readability
   * Increases contrast by 30% around middle gray
   */
  static _lightContrastBoost(imageData) {
    const data = imageData.data;
    const factor = 1.3; // Contrast increase factor

    for (let i = 0; i < data.length; i += 4) {
      // For each RGB channel
      for (let j = 0; j < 3; j++) {
        // Get distance from middle gray (128)
        const value = data[i + j];
        const diff = value - 128;

        // Increase the difference by factor
        const newValue = 128 + diff * factor;

        // Clamp to valid range
        data[i + j] = Math.max(0, Math.min(255, newValue));
      }
    }
  }

  /**
   * Convert File to Data URL
   */
  static _fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load image from source
   */
  static _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}
