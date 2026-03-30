import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface PanelState {
  histogramVisible: boolean
  metadataVisible: boolean
  channelSelectorVisible: boolean

  toggleHistogram: () => void
  toggleMetadata: () => void
  toggleChannelSelector: () => void
  setHistogramVisible: (v: boolean) => void
  setMetadataVisible: (v: boolean) => void
  setChannelSelectorVisible: (v: boolean) => void
}

export const usePanelStore = create<PanelState>()(
  devtools(
    (set) => ({
      histogramVisible: false,
      metadataVisible: false,
      channelSelectorVisible: false,

      toggleHistogram: () => {
        set(
          (state) => ({ histogramVisible: !state.histogramVisible }),
          false,
          'toggleHistogram'
        )
      },

      toggleMetadata: () => {
        set(
          (state) => ({ metadataVisible: !state.metadataVisible }),
          false,
          'toggleMetadata'
        )
      },

      toggleChannelSelector: () => {
        set(
          (state) => ({ channelSelectorVisible: !state.channelSelectorVisible }),
          false,
          'toggleChannelSelector'
        )
      },

      setHistogramVisible: (v: boolean) => {
        set({ histogramVisible: v }, false, 'setHistogramVisible')
      },

      setMetadataVisible: (v: boolean) => {
        set({ metadataVisible: v }, false, 'setMetadataVisible')
      },

      setChannelSelectorVisible: (v: boolean) => {
        set({ channelSelectorVisible: v }, false, 'setChannelSelectorVisible')
      },
    }),
    { name: 'panel-store' }
  )
)
