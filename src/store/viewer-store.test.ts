import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useViewerStore } from './viewer-store'

// Mock tauri-bindings so tests don't require Tauri runtime
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    openFile: vi.fn(),
  },
}))

import { commands } from '@/lib/tauri-bindings'

const mockSession = {
  session_id: 'test-session-123',
  filename: 'test.cr3',
  width: 6000,
  height: 4000,
  cfa_pattern: { type: 'Bayer' as const, pattern: 'Rggb' as const },
  bit_depth: 14,
  black_level: 512,
  white_level: 16383,
  iso: 400,
}

describe('ViewerStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useViewerStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with idle status', () => {
      expect(useViewerStore.getState().status).toBe('idle')
    })

    it('starts with null session', () => {
      expect(useViewerStore.getState().session).toBeNull()
    })

    it('starts with zoom = 1', () => {
      expect(useViewerStore.getState().zoom).toBe(1)
    })

    it('starts with panX = 0 and panY = 0', () => {
      expect(useViewerStore.getState().panX).toBe(0)
      expect(useViewerStore.getState().panY).toBe(0)
    })

    it('starts with bayer mode', () => {
      expect(useViewerStore.getState().mode).toBe('bayer')
    })

    it('starts with stretch = true', () => {
      expect(useViewerStore.getState().stretch).toBe(true)
    })

    it('starts with null errorMessage', () => {
      expect(useViewerStore.getState().errorMessage).toBeNull()
    })
  })

  describe('setZoom', () => {
    it('updates zoom value', () => {
      useViewerStore.getState().setZoom(2.5)
      expect(useViewerStore.getState().zoom).toBe(2.5)
    })
  })

  describe('setPan', () => {
    it('updates panX and panY', () => {
      useViewerStore.getState().setPan(100, -50)
      expect(useViewerStore.getState().panX).toBe(100)
      expect(useViewerStore.getState().panY).toBe(-50)
    })
  })

  describe('setMode', () => {
    it('updates mode to grayscale', () => {
      useViewerStore.getState().setMode('grayscale')
      expect(useViewerStore.getState().mode).toBe('grayscale')
    })

    it('updates mode back to bayer', () => {
      useViewerStore.getState().setMode('grayscale')
      useViewerStore.getState().setMode('bayer')
      expect(useViewerStore.getState().mode).toBe('bayer')
    })
  })

  describe('toggleStretch', () => {
    it('toggles stretch from true to false', () => {
      expect(useViewerStore.getState().stretch).toBe(true)
      useViewerStore.getState().toggleStretch()
      expect(useViewerStore.getState().stretch).toBe(false)
    })

    it('toggles stretch from false to true', () => {
      useViewerStore.getState().toggleStretch() // true → false
      expect(useViewerStore.getState().stretch).toBe(false)
      useViewerStore.getState().toggleStretch() // false → true
      expect(useViewerStore.getState().stretch).toBe(true)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useViewerStore.getState().setZoom(5)
      useViewerStore.getState().setPan(200, 300)
      useViewerStore.getState().setMode('grayscale')
      useViewerStore.getState().toggleStretch()

      useViewerStore.getState().reset()

      const state = useViewerStore.getState()
      expect(state.status).toBe('idle')
      expect(state.session).toBeNull()
      expect(state.zoom).toBe(1)
      expect(state.panX).toBe(0)
      expect(state.panY).toBe(0)
      expect(state.mode).toBe('bayer')
      expect(state.stretch).toBe(true)
      expect(state.errorMessage).toBeNull()
    })
  })

  describe('openFile', () => {
    it('sets status to loading while opening', async () => {
      // Create a promise we control
      let resolveOpen!: (v: unknown) => void
      const openPromise = new Promise(resolve => { resolveOpen = resolve })
      vi.mocked(commands.openFile).mockReturnValue(openPromise as never)

      const openTask = useViewerStore.getState().openFile('/path/to/file.cr3')

      // Should be loading before resolving
      expect(useViewerStore.getState().status).toBe('loading')

      resolveOpen({ status: 'ok', data: mockSession })
      await openTask

      expect(useViewerStore.getState().status).toBe('ready')
    })

    it('sets session and ready status on success', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'ok',
        data: mockSession,
      })

      await useViewerStore.getState().openFile('/path/to/file.cr3')

      const state = useViewerStore.getState()
      expect(state.status).toBe('ready')
      expect(state.session).toEqual(mockSession)
      expect(state.errorMessage).toBeNull()
    })

    it('sets error status and message on failure', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'UnsupportedFormat', extension: 'bmp' },
      })

      await useViewerStore.getState().openFile('/path/to/file.bmp')

      const state = useViewerStore.getState()
      expect(state.status).toBe('error')
      expect(state.errorMessage).toContain('Unsupported format')
      expect(state.errorMessage).toContain('bmp')
      expect(state.session).toBeNull()
    })

    it('handles CorruptData error type', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'CorruptData', detail: 'bad EXIF block' },
      })

      await useViewerStore.getState().openFile('/path/to/corrupt.cr2')

      expect(useViewerStore.getState().errorMessage).toContain('Corrupt file')
      expect(useViewerStore.getState().errorMessage).toContain('bad EXIF block')
    })

    it('handles FileAccessDenied error type', async () => {
      vi.mocked(commands.openFile).mockResolvedValue({
        status: 'error',
        error: { type: 'FileAccessDenied', path: '/locked/file.nef' },
      })

      await useViewerStore.getState().openFile('/locked/file.nef')

      expect(useViewerStore.getState().errorMessage).toContain('Cannot access')
    })
  })
})
