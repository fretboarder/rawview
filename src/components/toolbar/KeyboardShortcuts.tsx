/**
 * KeyboardShortcuts — Central keyboard handler for the viewer.
 *
 * Shortcuts (only active when no text input is focused):
 *   B       → bayer mode
 *   G       → grayscale mode
 *   1       → channel_r
 *   2       → channel_g1
 *   3       → channel_g2
 *   4       → channel_b
 *   H       → toggle histogram panel
 *   I       → toggle metadata panel
 *   ?       → show help (logs to console for now)
 *
 * Renders nothing — side-effect only.
 */

import { useEffect } from 'react'
import { useViewerStore } from '@/store/viewer-store'
import { usePanelStore } from '@/store/panel-store'

function isTextInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return el.getAttribute('contenteditable') === 'true'
}

export function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when typing in a text field
      if (isTextInputFocused()) return
      // Skip if any modifier key is held (except shift for ?)
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key) {
        case 'b':
        case 'B':
          useViewerStore.getState().setMode('bayer')
          break
        case 'g':
        case 'G':
          useViewerStore.getState().setMode('grayscale')
          break
        case '1':
          useViewerStore.getState().setChannel('r')
          break
        case '2':
          useViewerStore.getState().setChannel('g1')
          break
        case '3':
          useViewerStore.getState().setChannel('g2')
          break
        case '4':
          useViewerStore.getState().setChannel('b')
          break
        case 'h':
        case 'H':
          usePanelStore.getState().toggleHistogram()
          break
        case 'i':
        case 'I':
          usePanelStore.getState().toggleMetadata()
          break
        case '?':
          // Help shortcut — could open a help modal in future
          console.info(
            'RawView keyboard shortcuts:\n' +
            '  B     — Bayer mode\n' +
            '  G     — Grayscale mode\n' +
            '  1     — Red channel\n' +
            '  2     — G1 channel\n' +
            '  3     — G2 channel\n' +
            '  4     — Blue channel\n' +
            '  H     — Toggle histogram\n' +
            '  I     — Toggle metadata\n' +
            '  ?     — Show this help'
          )
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
