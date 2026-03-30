/**
 * PhotositeInspector — Floating tooltip showing photosite details.
 *
 * - Hover mode: follows cursor, shows hovered photosite info
 * - Pinned mode: fixed position, shows pinned photosite info with close button
 *
 * Channel badge colors:
 *   R  → red
 *   G1 → green
 *   G2 → teal/green
 *   B  → blue
 */

import { useInspectorStore } from '@/store/inspector-store'
import type { CfaChannel, PhotositeInfo } from '@/lib/tauri-bindings'

interface PhotositeInspectorProps {
  /** Current mouse position (canvas-relative) for tooltip placement */
  cursorX: number
  cursorY: number
}

function channelBadgeClass(channel: CfaChannel): string {
  switch (channel) {
    case 'R':
      return 'bg-red-700 text-red-100'
    case 'G1':
      return 'bg-green-700 text-green-100'
    case 'G2':
      return 'bg-teal-700 text-teal-100'
    case 'B':
      return 'bg-blue-700 text-blue-100'
    default:
      return 'bg-neutral-600 text-neutral-100'
  }
}

function channelLabel(channel: CfaChannel): string {
  return channel
}

interface InspectorCardProps {
  info: PhotositeInfo
  pinned?: boolean
  onClose?: () => void
  style?: React.CSSProperties
}

function InspectorCard({ info, pinned, onClose, style }: InspectorCardProps) {
  return (
    <div
      className="pointer-events-auto absolute z-50 rounded border border-neutral-700 bg-neutral-900/95 p-2 shadow-lg backdrop-blur-sm"
      style={style}
      data-testid="photosite-inspector"
    >
      <div className="flex items-center gap-2">
        {/* Channel badge */}
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono ${channelBadgeClass(info.channel)}`}
          data-testid="channel-badge"
        >
          {channelLabel(info.channel)}
        </span>

        {/* Value */}
        <span className="font-mono text-xs text-neutral-100" data-testid="photosite-value">
          {info.value}
        </span>

        {/* Close button for pinned mode */}
        {pinned && onClose && (
          <button
            type="button"
            className="ms-auto rounded px-1 text-neutral-400 hover:text-neutral-100 focus:outline-none"
            onClick={onClose}
            aria-label="Unpin inspector"
            data-testid="inspector-close"
          >
            ×
          </button>
        )}
      </div>

      {/* Position */}
      <div className="mt-1 font-mono text-xs text-neutral-400" data-testid="photosite-position">
        row&nbsp;<span className="text-neutral-200">{info.row}</span>
        &nbsp;&nbsp;col&nbsp;<span className="text-neutral-200">{info.col}</span>
      </div>
    </div>
  )
}

export function PhotositeInspector({ cursorX, cursorY }: PhotositeInspectorProps) {
  const hovered = useInspectorStore(s => s.hovered)
  const pinned = useInspectorStore(s => s.pinned)

  return (
    <>
      {/* Pinned inspector — fixed offset from where it was pinned */}
      {pinned && (
        <InspectorCard
          info={pinned}
          pinned
          onClose={() => useInspectorStore.getState().clearPinned()}
          style={{
            top: 16,
            insetInlineStart: 16,
          }}
        />
      )}

      {/* Hover tooltip — follows cursor */}
      {hovered && !pinned && (
        <InspectorCard
          info={hovered}
          style={{
            top: cursorY + 16,
            left: cursorX + 16,
          }}
        />
      )}
    </>
  )
}
