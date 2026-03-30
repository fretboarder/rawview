import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { PhotositeInfo } from '@/lib/tauri-bindings'

interface InspectorState {
  hovered: PhotositeInfo | null
  pinned: PhotositeInfo | null

  setHovered: (info: PhotositeInfo | null) => void
  setPinned: (info: PhotositeInfo) => void
  clearPinned: () => void
}

export const useInspectorStore = create<InspectorState>()(
  devtools(
    (set) => ({
      hovered: null,
      pinned: null,

      setHovered: (info: PhotositeInfo | null) => {
        set({ hovered: info }, false, 'setHovered')
      },

      setPinned: (info: PhotositeInfo) => {
        set({ pinned: info }, false, 'setPinned')
      },

      clearPinned: () => {
        set({ pinned: null }, false, 'clearPinned')
      },
    }),
    { name: 'inspector-store' }
  )
)
