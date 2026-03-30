import { render, fireEvent } from '@/test/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { useViewerStore } from '@/store/viewer-store'
import { usePanelStore } from '@/store/panel-store'

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    useViewerStore.getState().reset()
    usePanelStore.setState({
      histogramVisible: false,
      metadataVisible: false,
      channelSelectorVisible: false,
    })
  })

  it('renders null (no DOM output)', () => {
    const { container } = render(<KeyboardShortcuts />)
    expect(container.firstChild).toBeNull()
  })

  it('B key sets mode to bayer', () => {
    render(<KeyboardShortcuts />)
    useViewerStore.getState().setMode('grayscale')
    fireEvent.keyDown(document, { key: 'B' })
    expect(useViewerStore.getState().mode).toBe('bayer')
  })

  it('b key (lowercase) sets mode to bayer', () => {
    render(<KeyboardShortcuts />)
    useViewerStore.getState().setMode('grayscale')
    fireEvent.keyDown(document, { key: 'b' })
    expect(useViewerStore.getState().mode).toBe('bayer')
  })

  it('G key sets mode to grayscale', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: 'G' })
    expect(useViewerStore.getState().mode).toBe('grayscale')
  })

  it('g key (lowercase) sets mode to grayscale', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: 'g' })
    expect(useViewerStore.getState().mode).toBe('grayscale')
  })

  it('1 key sets mode to channel_r', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: '1' })
    expect(useViewerStore.getState().mode).toBe('channel_r')
  })

  it('2 key sets mode to channel_g1', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: '2' })
    expect(useViewerStore.getState().mode).toBe('channel_g1')
  })

  it('3 key sets mode to channel_g2', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: '3' })
    expect(useViewerStore.getState().mode).toBe('channel_g2')
  })

  it('4 key sets mode to channel_b', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: '4' })
    expect(useViewerStore.getState().mode).toBe('channel_b')
  })

  it('H key toggles histogram panel', () => {
    render(<KeyboardShortcuts />)
    expect(usePanelStore.getState().histogramVisible).toBe(false)
    fireEvent.keyDown(document, { key: 'H' })
    expect(usePanelStore.getState().histogramVisible).toBe(true)
    fireEvent.keyDown(document, { key: 'H' })
    expect(usePanelStore.getState().histogramVisible).toBe(false)
  })

  it('h key (lowercase) toggles histogram panel', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: 'h' })
    expect(usePanelStore.getState().histogramVisible).toBe(true)
  })

  it('I key toggles metadata panel', () => {
    render(<KeyboardShortcuts />)
    expect(usePanelStore.getState().metadataVisible).toBe(false)
    fireEvent.keyDown(document, { key: 'I' })
    expect(usePanelStore.getState().metadataVisible).toBe(true)
    fireEvent.keyDown(document, { key: 'I' })
    expect(usePanelStore.getState().metadataVisible).toBe(false)
  })

  it('i key (lowercase) toggles metadata panel', () => {
    render(<KeyboardShortcuts />)
    fireEvent.keyDown(document, { key: 'i' })
    expect(usePanelStore.getState().metadataVisible).toBe(true)
  })

  it('ignores shortcuts when Ctrl is held', () => {
    render(<KeyboardShortcuts />)
    useViewerStore.getState().setMode('bayer')
    fireEvent.keyDown(document, { key: 'G', ctrlKey: true })
    expect(useViewerStore.getState().mode).toBe('bayer')
  })

  it('ignores shortcuts when Meta is held', () => {
    render(<KeyboardShortcuts />)
    useViewerStore.getState().setMode('bayer')
    fireEvent.keyDown(document, { key: 'G', metaKey: true })
    expect(useViewerStore.getState().mode).toBe('bayer')
  })

  it('removes event listener on unmount', () => {
    const { unmount } = render(<KeyboardShortcuts />)
    unmount()
    useViewerStore.getState().setMode('bayer')
    fireEvent.keyDown(document, { key: 'G' })
    // After unmount, mode should not change (listener removed)
    expect(useViewerStore.getState().mode).toBe('bayer')
  })
})
