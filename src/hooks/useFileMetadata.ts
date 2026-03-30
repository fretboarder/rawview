import { useEffect, useState } from 'react'
import { commands } from '@/lib/tauri-bindings'
import type { ExifData } from '@/lib/tauri-bindings'
import { useViewerStore } from '@/store/viewer-store'

/**
 * Hook that fetches EXIF metadata when the session changes.
 * Returns the ExifData or null if not available.
 */
export function useFileMetadata(): ExifData | null {
  const session = useViewerStore(s => s.session)
  const [data, setData] = useState<ExifData | null>(null)

  useEffect(() => {
    if (!session) {
      setData(null)
      return
    }

    let cancelled = false

    const fetchMetadata = async () => {
      const result = await commands.getFileMetadata()
      if (!cancelled && result.status === 'ok') {
        setData(result.data)
      }
    }

    fetchMetadata()

    return () => {
      cancelled = true
    }
  }, [session])

  return data
}
