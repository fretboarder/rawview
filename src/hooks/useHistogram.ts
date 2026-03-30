import { useEffect, useState } from 'react'
import { commands } from '@/lib/tauri-bindings'
import type { HistogramData } from '@/lib/tauri-bindings'
import { useViewerStore } from '@/store/viewer-store'

/**
 * Per-channel histogram data for the panel.
 */
export interface PerChannelHistograms {
  r: HistogramData
  g1: HistogramData
  g2: HistogramData
  b: HistogramData
  combined: HistogramData
}

/**
 * Hook that fetches all per-channel histograms when the session changes.
 * Makes 5 IPC calls (R, G1, G2, B, combined) in parallel.
 */
export function useHistogram(): PerChannelHistograms | null {
  const session = useViewerStore(s => s.session)
  const [data, setData] = useState<PerChannelHistograms | null>(null)

  useEffect(() => {
    if (!session) {
      setData(null)
      return
    }

    let cancelled = false

    const fetchAll = async () => {
      const [rResult, g1Result, g2Result, bResult, combinedResult] = await Promise.all([
        commands.getHistogram('R' as never),
        commands.getHistogram('G1' as never),
        commands.getHistogram('G2' as never),
        commands.getHistogram('B' as never),
        commands.getHistogram(null),
      ])

      if (cancelled) return

      if (
        rResult.status === 'ok' &&
        g1Result.status === 'ok' &&
        g2Result.status === 'ok' &&
        bResult.status === 'ok' &&
        combinedResult.status === 'ok'
      ) {
        setData({
          r: rResult.data,
          g1: g1Result.data,
          g2: g2Result.data,
          b: bResult.data,
          combined: combinedResult.data,
        })
      }
    }

    fetchAll()

    return () => {
      cancelled = true
    }
  }, [session])

  return data
}
