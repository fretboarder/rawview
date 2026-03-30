/**
 * ViewerCanvas — Main canvas display for raw sensor data.
 *
 * Handles:
 * - Rendering viewport via rawview:// protocol onto a 2D canvas
 * - Scroll wheel zoom (CSS transform for instant feedback, debounced re-render)
 * - Mouse drag pan (CSS transform for instant feedback, re-render on mouseup)
 * - Drag-and-drop file opening via Tauri webview events
 * - Photosite inspection on hover (debounced to 16ms)
 * - Click to pin/unpin photosite inspector
 * - Empty/loading states
 */

import { useEffect, useRef, useState } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { toast } from 'sonner'
import { useViewerStore } from '@/store/viewer-store'
import { useInspectorStore } from '@/store/inspector-store'
import { buildViewportFitUrl } from '@/lib/protocolUrl'
import { mapCanvasToSensor } from '@/lib/coordinateMapper'
import { usePhotositeInfo } from '@/hooks/usePhotositeInfo'
import { CfaOverlay } from '@/components/viewer/CfaOverlay'
import { PhotositeInspector } from './PhotositeInspector'
import { ViewportIndicator } from './ViewportIndicator'

export function ViewerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const status = useViewerStore(s => s.status)
  const session = useViewerStore(s => s.session)
  const zoom = useViewerStore(s => s.zoom)
  const panX = useViewerStore(s => s.panX)
  const panY = useViewerStore(s => s.panY)
  const mode = useViewerStore(s => s.mode)
  const stretch = useViewerStore(s => s.stretch)
  const errorMessage = useViewerStore(s => s.errorMessage)

  // Debounced viewport URL — updated after user stops interacting
  const [viewportUrl, setViewportUrl] = useState<string | null>(null)

  // Track canvas dimensions for URL building
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Drag state tracked in refs to avoid stale closures without useMemo/useCallback
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  // Current sensor position under cursor (null when outside sensor or no session)
  const [sensorPos, setSensorPos] = useState<{ row: number; col: number } | null>(null)

  // Cursor position relative to container for tooltip placement
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

  // Feed sensor position to the photosite info hook (debounced IPC)
  usePhotositeInfo(sensorPos?.row ?? null, sensorPos?.col ?? null)

  // Show error toasts when errorMessage changes
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
    }
  }, [errorMessage])

  // Update window title when session changes
  useEffect(() => {
    if (session) {
      getCurrentWindow().setTitle(`${session.filename} — RawView`)
    }
  }, [session])

  // Measure container with ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setCanvasSize({ width: Math.round(width), height: Math.round(height) })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Debounce viewport URL updates — 300ms after state settles
  useEffect(() => {
    if (!session) {
      setViewportUrl(null)
      return
    }
    const timer = setTimeout(() => {
      const url = buildViewportFitUrl(
        session.session_id,
        canvasSize.width,
        canvasSize.height,
        mode,
        stretch
      )
      setViewportUrl(url)
    }, 300)
    return () => clearTimeout(timer)
  }, [session, zoom, panX, panY, mode, stretch, canvasSize])

  // Load image from viewport URL and draw to canvas
  useEffect(() => {
    if (!viewportUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
    }
    img.onerror = () => {
      // Silently fail — backend may not be ready yet
    }
    img.src = viewportUrl
  }, [viewportUrl])

  // Drag-and-drop via Tauri webview events
  useEffect(() => {
    const webview = getCurrentWebviewWindow()
    const unlistenPromise = webview.onDragDropEvent(event => {
      if (event.payload.type === 'drop') {
        const paths = event.payload.paths
        const firstPath = paths && paths[0]
        if (firstPath) {
          useViewerStore.getState().openFile(firstPath)
        }
      }
    })
    return () => {
      unlistenPromise.then(fn => fn())
    }
  }, [])

  // Scroll wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const currentZoom = useViewerStore.getState().zoom
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const newZoom = Math.min(50, Math.max(0.1, currentZoom * factor))
    useViewerStore.getState().setZoom(newZoom)
  }

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    const state = useViewerStore.getState()
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      useViewerStore.getState().setPan(
        dragStart.current.panX + dx,
        dragStart.current.panY + dy
      )
    }

    // Update cursor position for tooltip placement (relative to container)
    const container = containerRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    // Map canvas position to sensor coordinates
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top

      const currentSession = useViewerStore.getState().session
      if (currentSession) {
        const currentZoom = useViewerStore.getState().zoom
        const currentPanX = useViewerStore.getState().panX
        const currentPanY = useViewerStore.getState().panY
        const pos = mapCanvasToSensor(
          canvasX,
          canvasY,
          canvasSize.width,
          canvasSize.height,
          currentSession.width,
          currentSession.height,
          currentZoom,
          currentPanX,
          currentPanY
        )
        setSensorPos(pos)
      }
    }
  }

  const handleMouseUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    // Re-render after pan ends by triggering a new viewport URL
    const state = useViewerStore.getState()
    if (state.session) {
      const url = buildViewportFitUrl(
        state.session.session_id,
        canvasSize.width,
        canvasSize.height,
        state.mode,
        state.stretch
      )
      setViewportUrl(url)
    }
  }

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp()
    }
    // Clear hover state when cursor leaves canvas
    setSensorPos(null)
    useInspectorStore.getState().setHovered(null)
  }

  // Click to pin/unpin the inspector
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    const inspectorState = useInspectorStore.getState()
    if (inspectorState.pinned) {
      // Already pinned — unpin
      inspectorState.clearPinned()
    } else if (inspectorState.hovered) {
      // Pin current hovered info
      inspectorState.setPinned(inspectorState.hovered)
    }
  }

  // CSS transform for instant visual feedback on zoom/pan
  const transformStyle = {
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
    transformOrigin: 'center center',
  }

  return (
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden bg-neutral-950">
      {/* Empty state */}
      {status === 'idle' && (
        <div className="pointer-events-none flex select-none flex-col items-center gap-3 text-neutral-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-sm font-medium">Drop a raw file here or use File &gt; Open</p>
        </div>
      )}

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="pointer-events-none flex select-none flex-col items-center gap-3 text-neutral-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" aria-label="Loading" />
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="pointer-events-none flex select-none flex-col items-center gap-2 text-red-400">
          <p className="text-sm font-medium">Failed to open file</p>
          {errorMessage && (
            <p className="max-w-sm text-center text-xs text-neutral-500">{errorMessage}</p>
          )}
        </div>
      )}

      {/* Canvas (shown when ready) */}
      {status === 'ready' && (
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={transformStyle}
          className="cursor-crosshair active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          aria-label="Raw image canvas"
        />
      )}

      {/* CFA pattern overlay (shown when ready) */}
      {status === 'ready' && <CfaOverlay />}

      {/* Photosite inspector overlay — tooltip near cursor or pinned in corner */}
      {status === 'ready' && (
        <PhotositeInspector cursorX={cursorPos.x} cursorY={cursorPos.y} />
      )}

      {/* Viewport position indicator — minimap in bottom-right corner */}
      {status === 'ready' && <ViewportIndicator />}
    </div>
  )
}
