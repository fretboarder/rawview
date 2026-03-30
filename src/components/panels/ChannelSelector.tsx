/**
 * ChannelSelector — Panel for selecting individual Bayer channel views.
 *
 * Buttons for R / G1 / G2 / B channels, colored to reflect their wavelength.
 * Active channel is highlighted. Clicking sets viewer mode to the corresponding channel.
 */

import { useViewerStore } from '@/store/viewer-store'
import type { ViewerMode } from '@/store/viewer-store'

const CHANNELS = [
  { ch: 'r' as const, label: 'R', mode: 'channel_r' as ViewerMode, activeClass: 'bg-red-700 text-white border-red-500', inactiveClass: 'text-red-400 border-red-800 hover:bg-red-900/40' },
  { ch: 'g1' as const, label: 'G1', mode: 'channel_g1' as ViewerMode, activeClass: 'bg-green-700 text-white border-green-500', inactiveClass: 'text-green-400 border-green-800 hover:bg-green-900/40' },
  { ch: 'g2' as const, label: 'G2', mode: 'channel_g2' as ViewerMode, activeClass: 'bg-emerald-600 text-white border-emerald-400', inactiveClass: 'text-emerald-400 border-emerald-800 hover:bg-emerald-900/40' },
  { ch: 'b' as const, label: 'B', mode: 'channel_b' as ViewerMode, activeClass: 'bg-blue-700 text-white border-blue-500', inactiveClass: 'text-blue-400 border-blue-800 hover:bg-blue-900/40' },
] as const

export function ChannelSelector() {
  const mode = useViewerStore(s => s.mode)
  const status = useViewerStore(s => s.status)

  const handleChannel = (ch: 'r' | 'g1' | 'g2' | 'b') => {
    useViewerStore.getState().setChannel(ch)
  }

  return (
    <div
      className="flex flex-col gap-1 rounded border border-neutral-700 bg-neutral-900 p-2"
      aria-label="Channel selector"
    >
      <span className="mb-1 text-xs font-medium text-neutral-400">Channels</span>
      <div className="flex flex-col gap-1">
        {CHANNELS.map(({ ch, label, mode: channelMode, activeClass, inactiveClass }) => {
          const isActive = mode === channelMode
          return (
            <button
              key={ch}
              type="button"
              onClick={() => handleChannel(ch)}
              disabled={status !== 'ready'}
              className={`flex h-7 items-center justify-center rounded border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isActive ? activeClass : inactiveClass}`}
              aria-label={`View ${label} channel`}
              aria-pressed={isActive}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
