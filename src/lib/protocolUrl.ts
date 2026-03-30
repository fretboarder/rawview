import { convertFileSrc } from "@tauri-apps/api/core"

/**
 * Parameters for constructing a viewport protocol URL.
 * Used by the rawview:// custom protocol to request rendered viewport bitmaps.
 */
export interface ViewportParams {
  sessionId: string
  mode: string
  zoom: number
  x: number
  y: number
  w: number
  h: number
  stretch: boolean
}

/**
 * Build a platform-correct URL for the rawview:// custom protocol.
 *
 * Uses Tauri's `convertFileSrc` to handle platform differences:
 * - macOS/Linux: `rawview://localhost/viewport/...`
 * - Windows: `http://rawview.localhost/viewport/...`
 *
 * IMPORTANT: Query params are appended manually AFTER convertFileSrc because
 * convertFileSrc percent-encodes `?` when it is part of the path argument.
 *
 * @example
 * ```ts
 * const url = buildViewportUrl({
 *   sessionId: "abc123",
 *   mode: "bayer",
 *   zoom: 1.0,
 *   x: 0, y: 0, w: 1920, h: 1080,
 *   stretch: false,
 * })
 * ```
 */
export function buildViewportUrl(params: ViewportParams): string {
  // Build base URL without query params so convertFileSrc doesn't encode '?'
  const baseUrl = convertFileSrc(`/viewport/${params.sessionId}`, "rawview")

  // Append query string manually (not through convertFileSrc)
  const query = new URLSearchParams({
    mode: params.mode,
    zoom: params.zoom.toString(),
    x: params.x.toString(),
    y: params.y.toString(),
    w: params.w.toString(),
    h: params.h.toString(),
    stretch: params.stretch.toString(),
  }).toString()

  return `${baseUrl}?${query}`
}

/**
 * Convenience function to build a viewport URL that fits the full canvas.
 * Sends the canvas dimensions so the backend renders exactly the right size.
 */
export function buildViewportFitUrl(
  sessionId: string,
  width: number,
  height: number,
  mode: string,
  stretch: boolean
): string {
  return buildViewportUrl({
    sessionId,
    mode,
    zoom: 1,
    x: 0,
    y: 0,
    w: width,
    h: height,
    stretch,
  })
}

/**
 * Build a simple test URL for protocol verification.
 * Returns the platform-correct URL for the `/viewport/test` endpoint.
 */
export function buildTestUrl(): string {
  return convertFileSrc("/viewport/test", "rawview")
}
