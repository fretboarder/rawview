import { useViewerStore } from '@/store/viewer-store'

const PLACEHOLDER = '—'

export function QuickStatsBar() {
  const session = useViewerStore(s => s.session)

  if (!session) {
    return (
      <div
        className="flex h-7 shrink-0 items-center border-t border-neutral-800 bg-neutral-950 px-3"
        aria-label="Quick stats bar"
      >
        <span className="font-mono text-xs text-neutral-500">
          {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER} | {PLACEHOLDER}
        </span>
      </div>
    )
  }

  const cfaLabel =
    session.cfa_pattern.type === 'Bayer'
      ? session.cfa_pattern.pattern.toUpperCase()
      : 'X-Trans'

  return (
    <div
      className="flex h-7 shrink-0 items-center border-t border-neutral-800 bg-neutral-950 px-3 gap-0"
      aria-label="Quick stats bar"
    >
      <span className="font-mono text-xs text-neutral-300">
        <span className="text-neutral-400">{session.filename}</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>{session.width}×{session.height}</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>{cfaLabel}</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>{session.bit_depth}-bit</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>BL:{session.black_level}</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>WL:{session.white_level}</span>
        <span className="text-neutral-600 mx-1.5">|</span>
        <span>ISO {session.iso}</span>
      </span>
    </div>
  )
}
