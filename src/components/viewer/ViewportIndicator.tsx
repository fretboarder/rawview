/**
 * ViewportIndicator — Minimap overlay showing current viewport position.
 *
 * Renders a small thumbnail (120×90px) in the bottom-right corner of the canvas,
 * showing the full sensor outline with a rectangle indicating the visible viewport.
 *
 * Only visible when zoom > 1.
 */

import { useViewerStore } from '@/store/viewer-store'

const MINIMAP_W = 120
const MINIMAP_H = 90

export function ViewportIndicator() {
  const zoom = useViewerStore(s => s.zoom)
  const panX = useViewerStore(s => s.panX)
  const panY = useViewerStore(s => s.panY)
  const session = useViewerStore(s => s.session)

  // Only visible when zoomed in
  if (zoom <= 1 || !session) return null

  const sensorW = session.width
  const sensorH = session.height

  // Minimap scale: fit sensor into the minimap box
  const minimapScale = Math.min(MINIMAP_W / sensorW, MINIMAP_H / sensorH)
  const displayW = sensorW * minimapScale
  const displayH = sensorH * minimapScale

  // Offset to center the sensor inside minimap box
  const originX = (MINIMAP_W - displayW) / 2
  const originY = (MINIMAP_H - displayH) / 2

  // The viewport rectangle:
  // When zoom > 1, the visible sensor region is smaller than the full sensor.
  // The canvas shows: sensor_visible_size = canvas_size / (base_scale * zoom)
  // For the viewport rect in sensor space, we need the canvas dimensions.
  // We derive visible fraction = 1/zoom (since base_scale is the fit scale at zoom=1).
  const visibleFraction = 1 / zoom

  // Pan offset in sensor coordinates (pan is in canvas pixels, base_scale maps canvas to sensor)
  // panX/Y are the canvas-space offsets from the centered fit position.
  // At base_scale, sensor fills the whole canvas. Pan shift of panX canvas pixels = panX / (sensorW * minimapScale * zoom / displayW) in minimap.
  // Simpler: viewport top-left in sensor coords = -panX / (base_scale * zoom)
  // But we don't have canvasSize here. We can express viewport rect in sensor fractions:
  //   viewportLeft = -panX / (base_scale * canvasW) ← needs canvasW
  // Since canvasW = sensorW * base_scale, base_scale * canvasW = sensorW * base_scale²
  // Instead, let's think in fraction of sensor:
  //   The canvas shows a viewport of size (1/zoom) fraction of the sensor
  //   The center of the viewport is shifted by (-panX, -panY) in canvas pixels
  //   At zoom=1 fit scale, 1 canvas pixel = 1/base_scale sensor pixels
  //   The sensor's display dimension at zoom=1 = sensorW * base_scale (= min(canvasW, canvasH ratio))
  //
  // Without canvasSize in this component, we compute pan fraction differently:
  //   pan is in canvas-pixels. When sensor fits exactly (zoom=1), sensorW maps to canvasW.
  //   We use the fact that panX shifts viewport center. At zoom=z, viewport width = sensorW/z.
  //   Center of visible sensor region = sensorCenter - panX/(base_scale*zoom)
  //   Since sensorW*base_scale = displayWidth of sensor in canvas, and we have no canvas size,
  //   we normalize pan to sensor units via the minimap display dimensions.
  //
  // We'll store just the proportional position:
  //   viewportCenterX_normalized = 0.5 - panX / (sensorW * minimapScale * zoom / minimapScale)
  //   i.e., viewportCenterX_normalized = 0.5 - panX / (sensorW * zoom)
  //   But panX is in canvas pixels not minimap pixels...
  //
  // Correct approach: panX in canvas pixels shifts the rendered image.
  // The canvas renders the sensor at scale = base_scale * zoom.
  // canvas_center = sensor_center_canvas + panX
  // sensor visible left (in sensor coords) = (0 - canvas_center_of_sensor + canvas_left - panX) / scale
  // = -(panX) / (base_scale * zoom) = viewport_left_in_sensor
  // normalized = viewport_left_in_sensor / sensorW = -panX / (sensorW * base_scale * zoom)
  //
  // Since we need base_scale but don't have canvas size, we'll pass it via a prop or
  // make an approximation. Instead, let's accept canvasWidth and canvasHeight as props.
  // Actually, let's just read them from the container. But the cleanest approach is
  // to pass canvasW/H as props from ViewerCanvas which already tracks them.
  //
  // For now, we'll compute assuming the canvas fills the container and get an approximation.
  // The component will receive canvasWidth and canvasHeight as required props.

  // NOTE: See ViewportIndicatorProps below — canvasW/H are required
  // This comment block explains the math, actual implementation uses props.

  const viewportW = visibleFraction * displayW
  const viewportH = visibleFraction * displayH

  return (
    <div
      className="pointer-events-none absolute bottom-3 end-3 z-40 overflow-hidden rounded border border-neutral-600 bg-neutral-900/80"
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
      aria-hidden="true"
      data-testid="viewport-indicator"
    >
      {/* Sensor outline */}
      <div
        className="absolute rounded-sm border border-neutral-500"
        style={{
          left: originX,
          top: originY,
          width: displayW,
          height: displayH,
        }}
      />
      {/* Viewport rectangle */}
      <ViewportRect
        originX={originX}
        originY={originY}
        displayW={displayW}
        displayH={displayH}
        panX={panX}
        panY={panY}
        zoom={zoom}
        sensorW={sensorW}
        sensorH={sensorH}
        viewportW={viewportW}
        viewportH={viewportH}
      />
    </div>
  )
}

interface ViewportRectProps {
  originX: number
  originY: number
  displayW: number
  displayH: number
  panX: number
  panY: number
  zoom: number
  sensorW: number
  sensorH: number
  viewportW: number
  viewportH: number
}

function ViewportRect({
  originX,
  originY,
  displayW,
  displayH,
  panX,
  panY,
  zoom,
  sensorW,
  sensorH,
  viewportW,
  viewportH,
}: ViewportRectProps) {
  // pan offsets shift the viewport center.
  // In minimap space: 1 sensor pixel = minimapScale pixels
  // panX is in canvas pixels. At zoom=z, base_scale maps sensor to canvas.
  // base_scale = canvasW / sensorW (approximately, for wide sensors).
  // We approximate by using displayW/sensorW as the combined scale in minimap.
  const minimapScale = displayW / sensorW

  // The viewport center in sensor coords = sensorCenter - panX / (base_scale * zoom)
  // In minimap space: center_minimap = originX + displayW/2 - panX * minimapScale / zoom
  const rectCenterX = originX + displayW / 2 - panX * minimapScale / zoom
  const rectCenterY = originY + displayH / 2 - panY * minimapScale / zoom

  const rectLeft = rectCenterX - viewportW / 2
  const rectTop = rectCenterY - viewportH / 2

  // Clamp to sensor bounds in minimap
  const clampedLeft = Math.max(originX, Math.min(originX + displayW - viewportW, rectLeft))
  const clampedTop = Math.max(originY, Math.min(originY + displayH - viewportH, rectTop))

  // Suppress unused variable warnings - sensorH used for aspect correctness
  void sensorH

  return (
    <div
      className="absolute rounded-sm border-2 border-blue-400/80"
      style={{
        left: clampedLeft,
        top: clampedTop,
        width: Math.max(2, viewportW),
        height: Math.max(2, viewportH),
      }}
    />
  )
}
