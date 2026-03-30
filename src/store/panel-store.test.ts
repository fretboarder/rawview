import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelStore } from './panel-store'

describe('PanelStore', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    usePanelStore.setState({
      histogramVisible: false,
      metadataVisible: false,
      channelSelectorVisible: false,
    })
  })

  describe('initial state', () => {
    it('has histogramVisible = false', () => {
      expect(usePanelStore.getState().histogramVisible).toBe(false)
    })

    it('has metadataVisible = false', () => {
      expect(usePanelStore.getState().metadataVisible).toBe(false)
    })

    it('has channelSelectorVisible = false', () => {
      expect(usePanelStore.getState().channelSelectorVisible).toBe(false)
    })
  })

  describe('toggleHistogram', () => {
    it('toggles from false to true', () => {
      usePanelStore.getState().toggleHistogram()
      expect(usePanelStore.getState().histogramVisible).toBe(true)
    })

    it('toggles from true to false', () => {
      usePanelStore.getState().toggleHistogram()
      usePanelStore.getState().toggleHistogram()
      expect(usePanelStore.getState().histogramVisible).toBe(false)
    })

    it('does not affect other panels', () => {
      usePanelStore.getState().toggleHistogram()
      expect(usePanelStore.getState().metadataVisible).toBe(false)
      expect(usePanelStore.getState().channelSelectorVisible).toBe(false)
    })
  })

  describe('toggleMetadata', () => {
    it('toggles from false to true', () => {
      usePanelStore.getState().toggleMetadata()
      expect(usePanelStore.getState().metadataVisible).toBe(true)
    })

    it('toggles from true to false', () => {
      usePanelStore.getState().toggleMetadata()
      usePanelStore.getState().toggleMetadata()
      expect(usePanelStore.getState().metadataVisible).toBe(false)
    })

    it('does not affect other panels', () => {
      usePanelStore.getState().toggleMetadata()
      expect(usePanelStore.getState().histogramVisible).toBe(false)
      expect(usePanelStore.getState().channelSelectorVisible).toBe(false)
    })
  })

  describe('toggleChannelSelector', () => {
    it('toggles from false to true', () => {
      usePanelStore.getState().toggleChannelSelector()
      expect(usePanelStore.getState().channelSelectorVisible).toBe(true)
    })

    it('toggles from true to false', () => {
      usePanelStore.getState().toggleChannelSelector()
      usePanelStore.getState().toggleChannelSelector()
      expect(usePanelStore.getState().channelSelectorVisible).toBe(false)
    })
  })

  describe('setHistogramVisible', () => {
    it('sets to true', () => {
      usePanelStore.getState().setHistogramVisible(true)
      expect(usePanelStore.getState().histogramVisible).toBe(true)
    })

    it('sets to false', () => {
      usePanelStore.getState().setHistogramVisible(true)
      usePanelStore.getState().setHistogramVisible(false)
      expect(usePanelStore.getState().histogramVisible).toBe(false)
    })
  })

  describe('setMetadataVisible', () => {
    it('sets to true', () => {
      usePanelStore.getState().setMetadataVisible(true)
      expect(usePanelStore.getState().metadataVisible).toBe(true)
    })

    it('sets to false', () => {
      usePanelStore.getState().setMetadataVisible(true)
      usePanelStore.getState().setMetadataVisible(false)
      expect(usePanelStore.getState().metadataVisible).toBe(false)
    })
  })

  describe('setChannelSelectorVisible', () => {
    it('sets to true', () => {
      usePanelStore.getState().setChannelSelectorVisible(true)
      expect(usePanelStore.getState().channelSelectorVisible).toBe(true)
    })

    it('sets to false', () => {
      usePanelStore.getState().setChannelSelectorVisible(true)
      usePanelStore.getState().setChannelSelectorVisible(false)
      expect(usePanelStore.getState().channelSelectorVisible).toBe(false)
    })
  })

  describe('independent toggling', () => {
    it('all panels can be visible simultaneously', () => {
      usePanelStore.getState().toggleHistogram()
      usePanelStore.getState().toggleMetadata()
      usePanelStore.getState().toggleChannelSelector()

      expect(usePanelStore.getState().histogramVisible).toBe(true)
      expect(usePanelStore.getState().metadataVisible).toBe(true)
      expect(usePanelStore.getState().channelSelectorVisible).toBe(true)
    })
  })
})
