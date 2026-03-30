/**
 * HistogramPanel — Canvas-based histogram visualization.
 *
 * Draws 256 bins as vertical bars, overlaying 4 channels in color:
 *   R = red, G1 = green, G2 = lighter green (emerald), B = blue
 *
 * Channel toggle buttons above the canvas.
 * X axis shows BL (black level) and WL (white level) labels.
 * Controlled via panelStore.histogramVisible.
 */

import { useEffect, useRef, useState } from 'react'
import { useHistogram } from '@/hooks/useHistogram'
import { usePanelStore } from '@/store/panel-store'
import { useViewerStore } from '@/store/viewer-store'

type ChannelKey = 'r' | 'g1' | 'g2' | 'b'

const CHANNEL_COLORS: Record<ChannelKey, string> = {
  r: 'rgba(220, 38, 38, 0.75)',
  g1: 'rgba(22, 163, 74, 0.75)',
  g2: 'rgba(16, 185, 129, 0.65)',
  b: 'rgba(37, 99, 235, 0.75)',
}

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  r: 'R',
  g1: 'G1',
  g2: 'G2',
  b: 'B',
}

const ALL_CHANNELS: ChannelKey[] = ['r', 'g1', 'g2', 'b']

const CANVAS_WIDTH = 256
const CANVAS_HEIGHT = 120

export function HistogramPanel() {
  const histogramVisible = usePanelStore(s => s.histogramVisible)
  const session = useViewerStore(s => s.session)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [visibleChannels, setVisibleChannels] = useState<Set<ChannelKey>>(
    new Set(ALL_CHANNELS)
  )

  const histogramData = useHistogram()

  const toggleChannel = (ch: ChannelKey) => {
    const next = new Set(visibleChannels)
    if (next.has(ch)) {
      // Don't allow deselecting all
      if (next.size > 1) next.delete(ch)
    } else {
      next.add(ch)
    }
    setVisibleChannels(next)
  }

  // Draw histogram to canvas whenever data or visible channels change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (!histogramData) {
      // Draw empty state hint
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      return
    }

    const channelArrays: Record<ChannelKey, number[]> = {
      r: histogramData.r.bins,
      g1: histogramData.g1.bins,
      g2: histogramData.g2.bins,
      b: histogramData.b.bins,
    }

    // Find max value across all visible channels for normalization
    let maxVal = 1
    for (const ch of ALL_CHANNELS) {
      if (!visibleChannels.has(ch)) continue
      const arr = channelArrays[ch]
      // Skip bin 0 (clipped blacks) and last bin (clipped whites) for better scale
      for (let i = 1; i < 255; i++) {
        const val = arr[i] ?? 0
        if (val > maxVal) maxVal = val
      }
    }

    // Draw each visible channel
    for (const ch of ALL_CHANNELS) {
      if (!visibleChannels.has(ch)) continue
      const arr = channelArrays[ch]
      ctx.fillStyle = CHANNEL_COLORS[ch]

      for (let i = 0; i < 256; i++) {
        const barHeight = Math.round(((arr[i] ?? 0) / maxVal) * CANVAS_HEIGHT)
        const x = i
        const y = CANVAS_HEIGHT - barHeight
        ctx.fillRect(x, y, 1, barHeight)
      }
    }
  }, [histogramData, visibleChannels])

  if (!histogramVisible) return null

  const blackLevel = session?.black_level ?? 0
  const whiteLevel = session?.white_level ?? 16383

  return (
    <div
      className="flex w-72 shrink-0 flex-col gap-2 border-s border-neutral-800 bg-neutral-950 p-3"
      aria-label="Histogram panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-300">Histogram</span>
        <button
          type="button"
          onClick={() => usePanelStore.getState().toggleHistogram()}
          className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          aria-label="Close histogram"
        >
          ×
        </button>
      </div>

      {/* Channel toggles */}
      <div className="flex gap-1">
        {ALL_CHANNELS.map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => toggleChannel(ch)}
            className={`h-6 rounded border px-2 text-xs font-medium transition-colors ${
              visibleChannels.has(ch)
                ? ch === 'r'
                  ? 'border-red-700 bg-red-900/50 text-red-300'
                  : ch === 'g1'
                    ? 'border-green-700 bg-green-900/50 text-green-300'
                    : ch === 'g2'
                      ? 'border-emerald-700 bg-emerald-900/50 text-emerald-300'
                      : 'border-blue-700 bg-blue-900/50 text-blue-300'
                : 'border-neutral-700 bg-transparent text-neutral-600 hover:text-neutral-400'
            }`}
            aria-pressed={visibleChannels.has(ch)}
            aria-label={`Toggle ${CHANNEL_LABELS[ch]} channel`}
          >
            {CHANNEL_LABELS[ch]}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden rounded border border-neutral-800 bg-neutral-900">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full"
          aria-label="Histogram chart"
        />
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between">
        <span className="font-mono text-xs text-neutral-600">
          BL:{blackLevel}
        </span>
        <span className="font-mono text-xs text-neutral-600">
          WL:{whiteLevel}
        </span>
      </div>
    </div>
  )
}
