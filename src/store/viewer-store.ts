import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { commands } from '@/lib/tauri-bindings'
import type { SessionInfo } from '@/lib/bindings'

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error'
export type ViewerMode =
  | 'bayer'
  | 'grayscale'
  | 'channel_r'
  | 'channel_g1'
  | 'channel_g2'
  | 'channel_b'

interface ViewerState {
  status: ViewerStatus
  session: SessionInfo | null
  zoom: number
  panX: number
  panY: number
  mode: ViewerMode
  stretch: boolean
  errorMessage: string | null

  openFile: (path: string) => Promise<void>
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  setMode: (m: ViewerMode) => void
  setChannel: (ch: 'r' | 'g1' | 'g2' | 'b') => void
  toggleStretch: () => void
  reset: () => void
}

export const useViewerStore = create<ViewerState>()(
  devtools(
    set => ({
      status: 'idle',
      session: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      mode: 'bayer',
      stretch: false,
      errorMessage: null,

      openFile: async (path: string) => {
        set({ status: 'loading', errorMessage: null }, false, 'openFile/start')
        const result = await commands.openFile(path)
        if (result.status === 'ok') {
          set(
            { status: 'ready', session: result.data, errorMessage: null },
            false,
            'openFile/success'
          )
        } else {
          const err = result.error
          let message: string
          switch (err.type) {
            case 'UnsupportedFormat':
              message = `Unsupported format: .${err.extension}`
              break
            case 'CorruptData':
              message = `Corrupt or unreadable file data: ${err.detail}`
              break
            case 'FileAccessDenied':
              message = `File access denied: ${err.path}`
              break
            case 'DecoderError':
              message = `Decoder error: ${err.source}`
              break
            case 'RenderError':
              message = `Render error: ${err.detail}`
              break
            case 'SessionExpired':
              message = `Session expired: ${err.session_id}`
              break
            default:
              message = `Unknown error`
          }
          set(
            { status: 'error', errorMessage: message },
            false,
            'openFile/error'
          )
        }
      },

      setZoom: (z: number) => {
        set({ zoom: z }, false, 'setZoom')
      },

      setPan: (x: number, y: number) => {
        set({ panX: x, panY: y }, false, 'setPan')
      },

      setMode: (m: ViewerMode) => {
        set({ mode: m }, false, 'setMode')
      },

      setChannel: (ch: 'r' | 'g1' | 'g2' | 'b') => {
        const modeMap: Record<'r' | 'g1' | 'g2' | 'b', ViewerMode> = {
          r: 'channel_r',
          g1: 'channel_g1',
          g2: 'channel_g2',
          b: 'channel_b',
        }
        set({ mode: modeMap[ch] }, false, 'setChannel')
      },

      toggleStretch: () => {
        set(state => ({ stretch: !state.stretch }), false, 'toggleStretch')
      },

      reset: () => {
        set(
          {
            status: 'idle',
            session: null,
            zoom: 1,
            panX: 0,
            panY: 0,
            mode: 'bayer',
            stretch: false,
            errorMessage: null,
          },
          false,
          'reset'
        )
      },
    }),
    { name: 'viewer-store' }
  )
)
