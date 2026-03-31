import { useEffect, useRef, useState } from 'react'
import { useViewerStore } from '@/store/viewer-store'

const PLACEHOLDER = '—'
const SEP = <span className="text-neutral-600 mx-1.5">|</span>

/**
 * Compute effective zoom percentage for fit-to-window mode.
 * Mirrors the backend logic in viewport.rs: min(canvasW/sensorW, canvasH/sensorH).
 */
function useEffectiveZoom(sensorW: number, sensorH: number): string {
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    // Observe the viewer container (parent of the canvas)
    const container = document.querySelector(
      '[aria-label="Raw image canvas"]'
    )?.parentElement
    if (!container) return

    observerRef.current = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ w: Math.round(width), h: Math.round(height) })
      }
    })
    observerRef.current.observe(container)
    return () => observerRef.current?.disconnect()
  }, [sensorW, sensorH])

  if (
    containerSize.w === 0 ||
    containerSize.h === 0 ||
    sensorW === 0 ||
    sensorH === 0
  ) {
    return PLACEHOLDER
  }

  const scale = Math.min(containerSize.w / sensorW, containerSize.h / sensorH)
  const pct = scale * 100
  return pct >= 10 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`
}

export function QuickStatsBar() {
  const session = useViewerStore(s => s.session)
  const mode = useViewerStore(s => s.mode)
  const zoomLabel = useEffectiveZoom(session?.width ?? 0, session?.height ?? 0)

  if (!session) {
    return (
      <div
        className="flex h-7 shrink-0 items-center border-t border-neutral-800 bg-neutral-950 px-3"
        aria-label="Quick stats bar"
      >
        <span className="font-mono text-xs text-neutral-500">
          {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} |{' '}
          {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER}
        </span>
      </div>
    )
  }

  const cfaLabel =
    session.cfa_pattern.type === 'Bayer'
      ? session.cfa_pattern.pattern.toUpperCase()
      : 'X-Trans'

  const modeLabel =
    mode === 'bayer'
      ? 'Bayer'
      : mode === 'grayscale'
        ? 'Gray'
        : mode === 'channel_r'
          ? 'Ch:R'
          : mode === 'channel_g1'
            ? 'Ch:G1'
            : mode === 'channel_g2'
              ? 'Ch:G2'
              : mode === 'channel_b'
                ? 'Ch:B'
                : mode

  return (
    <div
      className="flex h-7 shrink-0 items-center border-t border-neutral-800 bg-neutral-950 px-3 gap-0"
      aria-label="Quick stats bar"
    >
      <span className="font-mono text-xs text-neutral-300">
        <span className="text-neutral-400">{session.filename}</span>
        {SEP}
        <span>
          {session.width}×{session.height}
        </span>
        {SEP}
        <span>{cfaLabel}</span>
        {SEP}
        <span>{session.bit_depth}-bit</span>
        {SEP}
        <span>{zoomLabel}</span>
        {SEP}
        <span>{modeLabel}</span>
        {SEP}
        <span>BL:{session.black_level}</span>
        {SEP}
        <span>WL:{session.white_level}</span>
        {SEP}
        <span>ISO {session.iso}</span>
      </span>
    </div>
  )
}
