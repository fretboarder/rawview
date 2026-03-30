import { useEffect } from 'react'
import { commands } from '@/lib/tauri-bindings'
import { useInspectorStore } from '@/store/inspector-store'

/**
 * Hook that fetches photosite info for a given sensor position,
 * debounced to ~60fps (16ms) to avoid flooding IPC.
 *
 * Updates inspectorStore.hovered with the result.
 */
export function usePhotositeInfo(row: number | null, col: number | null): void {
  useEffect(() => {
    if (row === null || col === null) return

    const timer = setTimeout(async () => {
      const result = await commands.getPhotositeInfo(row, col)
      if (result.status === 'ok') {
        useInspectorStore.getState().setHovered(result.data)
      }
    }, 16)

    return () => clearTimeout(timer)
  }, [row, col])
}
