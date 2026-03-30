import { useEffect, useState } from 'react'
import { commands } from '@/lib/tauri-bindings'
import type { HistogramData } from '@/lib/tauri-bindings'
import { useViewerStore } from '@/store/viewer-store'

/**
 * Hook that fetches histogram data when the session or channel changes.
 * Returns the histogram data or null if not available.
 */
export function useHistogram(channel?: string | null): HistogramData | null {
  const session = useViewerStore(s => s.session)
  const [data, setData] = useState<HistogramData | null>(null)

  useEffect(() => {
    if (!session) {
      setData(null)
      return
    }

    let cancelled = false

    const fetchHistogram = async () => {
      const result = await commands.getHistogram(channel ?? null)
      if (!cancelled && result.status === 'ok') {
        setData(result.data)
      }
    }

    fetchHistogram()

    return () => {
      cancelled = true
    }
  }, [session, channel])

  return data
}
