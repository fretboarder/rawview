/**
 * Toolbar — Minimal toolbar for the viewer.
 *
 * Contains:
 * - File Open button (triggers Tauri file dialog)
 * - Stretch toggle (raw vs stretched brightness mapping)
 * - Zoom indicator
 */

import { open } from '@tauri-apps/plugin-dialog'
import { useViewerStore } from '@/store/viewer-store'

export function Toolbar() {
  const zoom = useViewerStore(s => s.zoom)
  const stretch = useViewerStore(s => s.stretch)
  const status = useViewerStore(s => s.status)

  const handleOpenFile = async () => {
    const path = await open({
      filters: [
        {
          name: 'Raw Images',
          extensions: ['cr2', 'cr3', 'nef', 'arw', 'raf', 'rw2', 'orf', 'pef', 'dng', 'rwl'],
        },
      ],
      multiple: false,
    })
    if (typeof path === 'string') {
      useViewerStore.getState().openFile(path)
    }
  }

  const handleToggleStretch = () => {
    useViewerStore.getState().toggleStretch()
  }

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      {/* File Open button */}
      <button
        type="button"
        onClick={handleOpenFile}
        className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Open file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Open
      </button>

      <div className="h-4 w-px bg-border" aria-hidden="true" />

      {/* Stretch toggle */}
      <button
        type="button"
        onClick={handleToggleStretch}
        disabled={status !== 'ready'}
        className="flex h-7 items-center gap-1.5 rounded px-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={stretch ? 'Disable stretch' : 'Enable stretch'}
        aria-pressed={stretch}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span className={stretch ? 'text-primary' : ''}>Stretch</span>
      </button>

      <div className="h-4 w-px bg-border" aria-hidden="true" />

      {/* Zoom indicator */}
      <span
        className="text-xs tabular-nums text-muted-foreground"
        aria-label={`Zoom: ${zoomPercent}%`}
      >
        {zoomPercent}%
      </span>
    </div>
  )
}
