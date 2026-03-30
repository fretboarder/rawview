import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useViewerStore } from '../viewer-store'

// Mock tauri-bindings so tests don't require Tauri runtime
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    openFile: vi.fn(),
  },
}))

import { commands } from '@/lib/tauri-bindings'

describe('ViewerStore — Error Handling', () => {
  beforeEach(() => {
    useViewerStore.getState().reset()
    vi.clearAllMocks()
  })

  // ─── All 6 RawViewError variants ────────────────────────────────────────────

  describe('UnsupportedFormat error', () => {
    it('sets errorMessage to "Unsupported format: <extension>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'UnsupportedFormat', extension: 'tiff' },
      })

      await useViewerStore.getState().openFile('/photos/shot.tiff')

      expect(useViewerStore.getState().errorMessage).toBe('Unsupported format: tiff')
    })

    it('transitions status from loading → error', async () => {
      let resolveOpen!: (v: unknown) => void
      const pending = new Promise(resolve => { resolveOpen = resolve })
      vi.mocked(commands.openFile).mockReturnValue(pending as never)

      const task = useViewerStore.getState().openFile('/photos/shot.tiff')
      expect(useViewerStore.getState().status).toBe('loading')

      resolveOpen({ status: 'error', error: { type: 'UnsupportedFormat', extension: 'tiff' } })
      await task

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  describe('CorruptData error', () => {
    it('sets errorMessage to "Corrupt file: <detail>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'truncated IFD block' },
      })

      await useViewerStore.getState().openFile('/photos/broken.cr3')

      expect(useViewerStore.getState().errorMessage).toBe('Corrupt file: truncated IFD block')
    })

    it('sets status to error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'bad header' },
      })

      await useViewerStore.getState().openFile('/photos/broken.cr3')

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  describe('FileAccessDenied error', () => {
    it('sets errorMessage to "Cannot access: <path>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'FileAccessDenied', path: '/protected/secret.nef' },
      })

      await useViewerStore.getState().openFile('/protected/secret.nef')

      expect(useViewerStore.getState().errorMessage).toBe('Cannot access: /protected/secret.nef')
    })

    it('sets status to error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'FileAccessDenied', path: '/protected/secret.nef' },
      })

      await useViewerStore.getState().openFile('/protected/secret.nef')

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  describe('DecoderError error', () => {
    it('sets errorMessage to "Decoder error: <source>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'DecoderError', source: 'LibRaw: BADCROP' },
      })

      await useViewerStore.getState().openFile('/photos/problematic.arw')

      expect(useViewerStore.getState().errorMessage).toBe('Decoder error: LibRaw: BADCROP')
    })

    it('sets status to error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'DecoderError', source: 'out of memory' },
      })

      await useViewerStore.getState().openFile('/photos/problematic.arw')

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  describe('RenderError error', () => {
    it('sets errorMessage to "Render error: <detail>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'RenderError', detail: 'GPU texture upload failed' },
      })

      await useViewerStore.getState().openFile('/photos/large.cr2')

      expect(useViewerStore.getState().errorMessage).toBe('Render error: GPU texture upload failed')
    })

    it('sets status to error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'RenderError', detail: 'viewport lost' },
      })

      await useViewerStore.getState().openFile('/photos/large.cr2')

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  describe('SessionExpired error', () => {
    it('sets errorMessage to "Session expired: <session_id>"', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'SessionExpired', session_id: 'abc-123' },
      })

      await useViewerStore.getState().openFile('/photos/image.dng')

      expect(useViewerStore.getState().errorMessage).toBe('Session expired: abc-123')
    })

    it('sets status to error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'SessionExpired', session_id: 'abc-123' },
      })

      await useViewerStore.getState().openFile('/photos/image.dng')

      expect(useViewerStore.getState().status).toBe('error')
    })
  })

  // ─── Status transitions ──────────────────────────────────────────────────────

  describe('status transitions', () => {
    it('clears errorMessage when openFile starts (loading)', async () => {
      // Pre-seed an error state
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'bad file' },
      })
      await useViewerStore.getState().openFile('/bad.cr3')
      expect(useViewerStore.getState().status).toBe('error')

      // Start a new load — errorMessage should clear immediately
      let resolveOpen!: (v: unknown) => void
      const pending = new Promise(resolve => { resolveOpen = resolve })
      vi.mocked(commands.openFile).mockReturnValue(pending as never)

      const task = useViewerStore.getState().openFile('/good.cr3')
      expect(useViewerStore.getState().status).toBe('loading')
      expect(useViewerStore.getState().errorMessage).toBeNull()

      resolveOpen({ status: 'ok', data: null })
      await task
    })

    it('keeps session null when an error occurs', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'UnsupportedFormat', extension: 'bmp' },
      })

      await useViewerStore.getState().openFile('/photo.bmp')

      expect(useViewerStore.getState().session).toBeNull()
    })
  })

  // ─── Recovery: success after error ──────────────────────────────────────────

  describe('recovery after error', () => {
    const mockSession = {
      session_id: 'recovered-session',
      filename: 'recovered.cr3',
      width: 3000,
      height: 2000,
      cfa_pattern: { type: 'Bayer' as const, pattern: 'Rggb' as const },
      bit_depth: 14,
      black_level: 512,
      white_level: 16383,
      iso: 100,
    }

    it('clears error state on subsequent successful openFile', async () => {
      // First call → error
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'bad header' },
      })
      await useViewerStore.getState().openFile('/bad.cr3')
      expect(useViewerStore.getState().status).toBe('error')
      expect(useViewerStore.getState().errorMessage).not.toBeNull()

      // Second call → success
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'ok',
        data: mockSession,
      })
      await useViewerStore.getState().openFile('/good.cr3')

      const state = useViewerStore.getState()
      expect(state.status).toBe('ready')
      expect(state.errorMessage).toBeNull()
      expect(state.session).toEqual(mockSession)
    })

    it('transitions from error → loading → ready on retry', async () => {
      const statuses: string[] = []

      // First: force error
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'FileAccessDenied', path: '/locked.nef' },
      })
      await useViewerStore.getState().openFile('/locked.nef')
      statuses.push(useViewerStore.getState().status)

      // Second: control promise to capture intermediate status
      let resolveOpen!: (v: unknown) => void
      const pending = new Promise(resolve => { resolveOpen = resolve })
      vi.mocked(commands.openFile).mockReturnValue(pending as never)

      const task = useViewerStore.getState().openFile('/unlocked.nef')
      statuses.push(useViewerStore.getState().status)

      resolveOpen({ status: 'ok', data: mockSession })
      await task
      statuses.push(useViewerStore.getState().status)

      expect(statuses).toEqual(['error', 'loading', 'ready'])
    })
  })

  // ─── reset() clears error state ─────────────────────────────────────────────

  describe('reset()', () => {
    it('clears errorMessage set by a failed openFile', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'bad data' },
      })
      await useViewerStore.getState().openFile('/bad.cr3')
      expect(useViewerStore.getState().errorMessage).not.toBeNull()

      useViewerStore.getState().reset()

      expect(useViewerStore.getState().errorMessage).toBeNull()
    })

    it('resets status from error back to idle', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'RenderError', detail: 'viewport lost' },
      })
      await useViewerStore.getState().openFile('/image.cr3')
      expect(useViewerStore.getState().status).toBe('error')

      useViewerStore.getState().reset()

      expect(useViewerStore.getState().status).toBe('idle')
    })

    it('resets session to null after error', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'DecoderError', source: 'crash' },
      })
      await useViewerStore.getState().openFile('/image.cr3')

      useViewerStore.getState().reset()

      expect(useViewerStore.getState().session).toBeNull()
    })
  })
})
