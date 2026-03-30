/**
 * coordinateMapper — Converts canvas mouse positions to sensor (row, col) coordinates.
 *
 * Reverses the CSS transform applied to the canvas element:
 * 1. Computes base scale to fit sensor into canvas
 * 2. Applies zoom multiplier
 * 3. Applies pan offsets
 * 4. Inverts the transform to get sensor coordinates
 */

/**
 * Maps a canvas pixel position to a sensor row/col coordinate,
 * accounting for fit-scaling, zoom, and pan.
 *
 * @param canvasX - Mouse X position relative to the canvas element
 * @param canvasY - Mouse Y position relative to the canvas element
 * @param canvasW - Canvas element width in pixels
 * @param canvasH - Canvas element height in pixels
 * @param sensorW - Full sensor width in photosites
 * @param sensorH - Full sensor height in photosites
 * @param zoom - Current zoom level (1 = fit)
 * @param panX - Current horizontal pan offset in pixels
 * @param panY - Current vertical pan offset in pixels
 * @returns { row, col } sensor coordinate, or null if outside sensor bounds
 */
export function mapCanvasToSensor(
  canvasX: number,
  canvasY: number,
  canvasW: number,
  canvasH: number,
  sensorW: number,
  sensorH: number,
  zoom: number,
  panX: number,
  panY: number
): { row: number; col: number } | null {
  if (sensorW <= 0 || sensorH <= 0) return null

  // Compute the scale that fits the sensor into the canvas at zoom=1
  const baseScale = Math.min(canvasW / sensorW, canvasH / sensorH)
  const scale = baseScale * zoom

  // The canvas centers the sensor image, then applies pan offset
  const offsetX = (canvasW - sensorW * scale) / 2 + panX
  const offsetY = (canvasH - sensorH * scale) / 2 + panY

  // Invert the transform to get sensor coordinates
  const col = Math.floor((canvasX - offsetX) / scale)
  const row = Math.floor((canvasY - offsetY) / scale)

  // Clamp to sensor bounds
  if (row < 0 || col < 0 || row >= sensorH || col >= sensorW) return null

  return { row, col }
}
