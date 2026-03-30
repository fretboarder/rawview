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
  const queryString = new URLSearchParams({
    mode: params.mode,
    zoom: params.zoom.toString(),
    x: params.x.toString(),
    y: params.y.toString(),
    w: params.w.toString(),
    h: params.h.toString(),
    stretch: params.stretch.toString(),
  }).toString()

  const path = `/viewport/${params.sessionId}?${queryString}`
  return convertFileSrc(path, "rawview")
}

/**
 * Build a simple test URL for protocol verification.
 * Returns the platform-correct URL for the `/viewport/test` endpoint.
 */
export function buildTestUrl(): string {
  return convertFileSrc("/viewport/test", "rawview")
}
