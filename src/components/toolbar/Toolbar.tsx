/**
 * Toolbar — Viewer toolbar with file open, mode selectors, stretch toggle, and panel toggles.
 *
 * Contains:
 * - File Open button (triggers Tauri file dialog)
 * - Mode selector: Bayer | Gray | R | G1 | G2 | B (with keyboard shortcuts)
 * - Stretch toggle (raw vs stretched brightness mapping)
 * - Histogram toggle (H)
 * - Metadata toggle (I)
 * - Zoom indicator
 */

import { open } from '@tauri-apps/plugin-dialog'
import { useViewerStore } from '@/store/viewer-store'
import type { ViewerMode } from '@/store/viewer-store'
import { usePanelStore } from '@/store/panel-store'

interface ModeButtonProps {
  label: string
  shortcut: string
  mode: ViewerMode
  currentMode: ViewerMode
  disabled: boolean
  color?: string
}

function ModeButton({ label, shortcut, mode, currentMode, disabled, color }: ModeButtonProps) {
  const isActive = currentMode === mode

  const handleClick = () => {
    useViewerStore.getState().setMode(mode)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex h-7 items-center gap-1 rounded border px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive
          ? color ?? 'border-primary bg-primary/20 text-primary'
          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
      }`}
      aria-label={`${label} mode (${shortcut})`}
      aria-pressed={isActive}
      title={`${label} mode — press ${shortcut}`}
    >
      {label}
      <span className="text-[9px] opacity-50">{shortcut}</span>
    </button>
  )
}

export function Toolbar() {
  const zoom = useViewerStore(s => s.zoom)
  const stretch = useViewerStore(s => s.stretch)
  const status = useViewerStore(s => s.status)
  const mode = useViewerStore(s => s.mode)
  const histogramVisible = usePanelStore(s => s.histogramVisible)
  const metadataVisible = usePanelStore(s => s.metadataVisible)

  const isReady = status === 'ready'

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

  const handleToggleHistogram = () => {
    usePanelStore.getState().toggleHistogram()
  }

  const handleToggleMetadata = () => {
    usePanelStore.getState().toggleMetadata()
  }

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-background px-3">
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

      {/* Mode selectors */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Visualization mode">
        <ModeButton label="Bayer" shortcut="B" mode="bayer" currentMode={mode} disabled={!isReady} />
        <ModeButton label="Gray" shortcut="G" mode="grayscale" currentMode={mode} disabled={!isReady} />

        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

        {/* Channel buttons with channel-specific colors */}
        <ModeButton
          label="R"
          shortcut="1"
          mode="channel_r"
          currentMode={mode}
          disabled={!isReady}
          color="border-red-600 bg-red-900/30 text-red-400"
        />
        <ModeButton
          label="G1"
          shortcut="2"
          mode="channel_g1"
          currentMode={mode}
          disabled={!isReady}
          color="border-green-600 bg-green-900/30 text-green-400"
        />
        <ModeButton
          label="G2"
          shortcut="3"
          mode="channel_g2"
          currentMode={mode}
          disabled={!isReady}
          color="border-emerald-600 bg-emerald-900/30 text-emerald-400"
        />
        <ModeButton
          label="B"
          shortcut="4"
          mode="channel_b"
          currentMode={mode}
          disabled={!isReady}
          color="border-blue-600 bg-blue-900/30 text-blue-400"
        />
      </div>

      <div className="h-4 w-px bg-border" aria-hidden="true" />

      {/* Stretch toggle */}
      <button
        type="button"
        onClick={handleToggleStretch}
        disabled={!isReady}
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

      {/* Histogram toggle (H) */}
      <button
        type="button"
        onClick={handleToggleHistogram}
        disabled={!isReady}
        className={`flex h-7 items-center gap-1 rounded border px-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          histogramVisible
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
        }`}
        aria-label="Toggle histogram (H)"
        aria-pressed={histogramVisible}
        title="Toggle histogram — press H"
      >
        Hist
        <span className="text-[9px] opacity-50">H</span>
      </button>

      {/* Metadata toggle (I) */}
      <button
        type="button"
        onClick={handleToggleMetadata}
        disabled={!isReady}
        className={`flex h-7 items-center gap-1 rounded border px-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          metadataVisible
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
        }`}
        aria-label="Toggle metadata (I)"
        aria-pressed={metadataVisible}
        title="Toggle metadata — press I"
      >
        Info
        <span className="text-[9px] opacity-50">I</span>
      </button>

      <div className="ms-auto h-4 w-px bg-border" aria-hidden="true" />

      {/* Zoom indicator */}
      <span
        className="text-xs tabular-nums text-muted-foreground font-mono"
        aria-label={`Zoom: ${zoomPercent}%`}
      >
        {zoomPercent}%
      </span>
    </div>
  )
}
