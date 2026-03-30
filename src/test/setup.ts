import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver for tests (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage for tests
const localStorageMock = (() => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock Tauri APIs for tests
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string, protocol: string) => `${protocol}://localhost${path}`),
  invoke: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {
    // Mock unlisten function
  }),
  emit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/menu', () => ({
  Menu: { new: vi.fn().mockResolvedValue({ setAsAppMenu: vi.fn() }) },
  MenuItem: { new: vi.fn().mockResolvedValue({}) },
  Submenu: { new: vi.fn().mockResolvedValue({}) },
  PredefinedMenuItem: { new: vi.fn().mockResolvedValue({}) },
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn().mockReturnValue({
    isFullscreen: vi.fn().mockResolvedValue(false),
    isMaximized: vi.fn().mockResolvedValue(false),
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    unmaximize: vi.fn().mockResolvedValue(undefined),
    toggleMaximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined),
    onFocusChanged: vi
      .fn()
      .mockResolvedValue(vi.fn().mockReturnValue(undefined)),
    onResized: vi.fn().mockReturnValue(Promise.resolve(vi.fn())),
  }),
}))

vi.mock('@tauri-apps/api/webviewWindow', () => ({
  getCurrentWebviewWindow: vi.fn().mockReturnValue({
    onDragDropEvent: vi.fn().mockResolvedValue(vi.fn()),
  }),
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
}))

// Mock typed Tauri bindings (tauri-specta generated)
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    saveEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    loadEmergencyData: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    cleanupOldRecoveryFiles: vi
      .fn()
      .mockResolvedValue({ status: 'ok', data: 0 }),
    openFile: vi.fn().mockResolvedValue({ status: 'ok', data: null }),
    getPhotositeInfo: vi.fn().mockResolvedValue({
      status: 'ok',
      data: { channel: 'R', value: 1024, row: 0, col: 0 },
    }),
    getHistogram: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        r: Array(256).fill(0),
        g1: Array(256).fill(0),
        g2: Array(256).fill(0),
        b: Array(256).fill(0),
        total_pixels: 0,
      },
    }),
    getFileMetadata: vi.fn().mockResolvedValue({
      status: 'ok',
      data: {
        make: null,
        model: null,
        lens: null,
        iso: null,
        shutter_speed: null,
        aperture: null,
        focal_length: null,
        date_time: null,
      },
    }),
  },
  unwrapResult: vi.fn((result: { status: string; data?: unknown }) => {
    if (result.status === 'ok') return result.data
    throw result
  }),
}))
