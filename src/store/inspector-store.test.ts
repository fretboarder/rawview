import { describe, it, expect, beforeEach } from 'vitest'
import { useInspectorStore } from './inspector-store'
import type { PhotositeInfo } from '@/lib/tauri-bindings'

const mockInfo: PhotositeInfo = {
  channel: 'R',
  value: 12345,
  row: 100,
  col: 200,
}

const mockInfo2: PhotositeInfo = {
  channel: 'G1',
  value: 8192,
  row: 50,
  col: 75,
}

describe('InspectorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useInspectorStore.getState().setHovered(null)
    useInspectorStore.getState().clearPinned()
  })

  describe('initial state', () => {
    it('starts with hovered = null', () => {
      expect(useInspectorStore.getState().hovered).toBeNull()
    })

    it('starts with pinned = null', () => {
      expect(useInspectorStore.getState().pinned).toBeNull()
    })
  })

  describe('setHovered', () => {
    it('sets hovered to PhotositeInfo', () => {
      useInspectorStore.getState().setHovered(mockInfo)
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo)
    })

    it('sets hovered to null', () => {
      useInspectorStore.getState().setHovered(mockInfo)
      useInspectorStore.getState().setHovered(null)
      expect(useInspectorStore.getState().hovered).toBeNull()
    })

    it('overwrites previous hovered value', () => {
      useInspectorStore.getState().setHovered(mockInfo)
      useInspectorStore.getState().setHovered(mockInfo2)
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo2)
    })

    it('does not affect pinned', () => {
      useInspectorStore.getState().setPinned(mockInfo)
      useInspectorStore.getState().setHovered(mockInfo2)
      expect(useInspectorStore.getState().pinned).toEqual(mockInfo)
    })
  })

  describe('setPinned', () => {
    it('sets pinned to PhotositeInfo', () => {
      useInspectorStore.getState().setPinned(mockInfo)
      expect(useInspectorStore.getState().pinned).toEqual(mockInfo)
    })

    it('overwrites previous pinned value', () => {
      useInspectorStore.getState().setPinned(mockInfo)
      useInspectorStore.getState().setPinned(mockInfo2)
      expect(useInspectorStore.getState().pinned).toEqual(mockInfo2)
    })

    it('does not affect hovered', () => {
      useInspectorStore.getState().setHovered(mockInfo)
      useInspectorStore.getState().setPinned(mockInfo2)
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo)
    })
  })

  describe('clearPinned', () => {
    it('clears pinned to null', () => {
      useInspectorStore.getState().setPinned(mockInfo)
      useInspectorStore.getState().clearPinned()
      expect(useInspectorStore.getState().pinned).toBeNull()
    })

    it('does not affect hovered', () => {
      useInspectorStore.getState().setHovered(mockInfo)
      useInspectorStore.getState().setPinned(mockInfo2)
      useInspectorStore.getState().clearPinned()
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo)
    })

    it('is idempotent when already null', () => {
      expect(useInspectorStore.getState().pinned).toBeNull()
      expect(() => useInspectorStore.getState().clearPinned()).not.toThrow()
      expect(useInspectorStore.getState().pinned).toBeNull()
    })
  })

  describe('pin/unpin workflow', () => {
    it('supports hover → pin → clear lifecycle', () => {
      // Hover over a photosite
      useInspectorStore.getState().setHovered(mockInfo)
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo)

      // Pin it
      useInspectorStore.getState().setPinned(mockInfo)
      expect(useInspectorStore.getState().pinned).toEqual(mockInfo)

      // Hover moves to another photosite
      useInspectorStore.getState().setHovered(mockInfo2)
      expect(useInspectorStore.getState().pinned).toEqual(mockInfo) // Pin unchanged
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo2)

      // Unpin
      useInspectorStore.getState().clearPinned()
      expect(useInspectorStore.getState().pinned).toBeNull()
      expect(useInspectorStore.getState().hovered).toEqual(mockInfo2)
    })
  })
})
