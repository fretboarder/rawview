/**
 * MetadataPanel — Slide-out panel showing EXIF metadata.
 *
 * Displays: Camera (make/model), Lens, ISO, Shutter speed, Aperture,
 * Focal length, and Date. Monospace values for alignment.
 * Controlled via panelStore.metadataVisible and the `I` keyboard shortcut.
 */

import { useFileMetadata } from '@/hooks/useFileMetadata'
import { usePanelStore } from '@/store/panel-store'

const PLACEHOLDER = '—'

interface MetaRowProps {
  label: string
  value: string | number | null | undefined
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
      <span className="font-mono text-xs text-neutral-200 text-end">
        {value != null && value !== '' ? String(value) : PLACEHOLDER}
      </span>
    </div>
  )
}

export function MetadataPanel() {
  const metadataVisible = usePanelStore(s => s.metadataVisible)
  const exif = useFileMetadata()

  if (!metadataVisible) return null

  const cameraModel =
    exif?.make && exif?.model
      ? `${exif.make} ${exif.model}`
      : exif?.model ?? exif?.make ?? null

  return (
    <div
      className="flex w-64 shrink-0 flex-col gap-1 border-s border-neutral-800 bg-neutral-950 p-3"
      aria-label="Metadata panel"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-300">Metadata</span>
        <button
          type="button"
          onClick={() => usePanelStore.getState().toggleMetadata()}
          className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
          aria-label="Close metadata"
        >
          ×
        </button>
      </div>

      {/* EXIF rows */}
      <div className="flex flex-col gap-2">
        <MetaRow label="Camera" value={cameraModel} />
        <MetaRow label="Lens" value={exif?.lens} />
        <div className="my-0.5 border-t border-neutral-800" />
        <MetaRow label="ISO" value={exif?.iso != null ? `ISO ${exif.iso}` : null} />
        <MetaRow label="Shutter" value={exif?.shutter_speed} />
        <MetaRow label="Aperture" value={exif?.aperture} />
        <MetaRow label="Focal Length" value={exif?.focal_length} />
        <div className="my-0.5 border-t border-neutral-800" />
        <MetaRow label="Date" value={exif?.date_time} />
      </div>
    </div>
  )
}
