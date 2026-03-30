import { useViewerStore } from '@/store/viewer-store'
import type { BayerPattern } from '@/lib/bindings'

/** Map each Bayer pattern variant to its 2×2 channel layout */
const BAYER_LAYOUTS: Record<BayerPattern, [string, string, string, string]> = {
  Rggb: ['R', 'G', 'G', 'B'],
  Bggr: ['B', 'G', 'G', 'R'],
  Grbg: ['G', 'R', 'B', 'G'],
  Gbrg: ['G', 'B', 'R', 'G'],
}

/** Color for each channel letter */
const CHANNEL_COLORS: Record<string, string> = {
  R: 'bg-red-600 text-white',
  G: 'bg-green-700 text-white',
  B: 'bg-blue-600 text-white',
}

/** X-Trans channel index → letter (0=R, 1=G, 2=B encoded as numbers in grid) */
const XTRANS_CHANNEL_LABELS = ['R', 'G', 'B']

export function CfaOverlay() {
  const session = useViewerStore(s => s.session)

  if (!session) return null

  const { cfa_pattern } = session

  if (cfa_pattern.type === 'Bayer') {
    const cells = BAYER_LAYOUTS[cfa_pattern.pattern]

    return (
      <div
        className="absolute top-3 right-3 z-10 rounded bg-black/60 p-1.5"
        aria-label={`CFA pattern: ${cfa_pattern.pattern.toUpperCase()}`}
      >
        <div className="grid grid-cols-2 gap-px" style={{ width: 52 }}>
          {cells.map((ch, i) => (
            <div
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-sm font-mono text-xs font-bold ${CHANNEL_COLORS[ch] ?? 'bg-neutral-600 text-white'}`}
              aria-label={ch}
            >
              {ch}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // X-Trans: 6×6 grid
  const grid = cfa_pattern.grid

  return (
    <div
      className="absolute top-3 right-3 z-10 rounded bg-black/60 p-1.5"
      aria-label="CFA pattern: X-Trans"
    >
      <div className="grid grid-cols-6 gap-px" style={{ width: 72 }}>
        {grid.map((row, rowIdx) =>
          row.map((val, colIdx) => {
            const ch = XTRANS_CHANNEL_LABELS[val] ?? 'G'
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`flex h-2.5 w-2.5 items-center justify-center rounded-sm font-mono text-[6px] font-bold ${CHANNEL_COLORS[ch] ?? 'bg-neutral-600 text-white'}`}
                aria-label={ch}
              >
                {ch}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
