# Story 2.3: Canvas Display, Zoom, Pan, and File Open UI

Status: done

## Story

As a user opening a raw file for the first time,
I want to drag-and-drop or use File > Open to open a raw file and see the Bayer mosaic on a Canvas that I can zoom and pan,
so that I experience the revelation moment of seeing my sensor's raw data.

## Acceptance Criteria

1. Dragging a raw file onto the window decodes it and displays the Bayer mosaic within 3 seconds (FR1, NFR1)
2. File > Open menu/toolbar triggers the Tauri file dialog with raw format filters (FR2)
3. Scroll wheel zooms in/out with CSS transform for instant feedback, debounced Rust re-render (FR11, NFR3)
4. Click-drag pans the viewport with CSS transform for instant feedback, debounced re-render (FR12, NFR3)
5. File name displayed in window title bar as `{filename} — RawView` (FR7)
6. Multiple instances can run simultaneously without affecting each other (FR4)
7. Empty state shows a centered drop target prompt
8. Loading state shown during decode (~1-3 seconds for large files)
9. Error toast shown for unsupported/corrupt files (FR6)
10. Display stretch toggle (toolbar button) switches between raw and stretched brightness mapping

## Tasks / Subtasks

- [ ] Task 1: Create viewerStore (Zustand) — session state, zoom, pan, mode (AC: #3, #4, #10)
  - [ ] Create `src/store/viewer-store.ts`
  - [ ] State: `status` ('idle'|'loading'|'ready'|'error'), `session` (SessionInfo|null), `zoom` (number), `panX/panY` (number), `mode` ('bayer'|'grayscale'), `stretch` (bool), `errorMessage` (string|null)
  - [ ] Actions: `openFile(path)` → calls `commands.openFile`, sets session on success, error on failure; `setZoom(z)`, `setPan(x,y)`, `setMode(m)`, `toggleStretch()`, `reset()`
  - [ ] Use selector pattern per architecture rules (no destructuring)

- [ ] Task 2: Fix protocolUrl.ts for query string encoding (AC: #1)
  - [ ] `convertFileSrc` percent-encodes the `?` and query params when embedded in the path
  - [ ] Fix: construct base URL with `convertFileSrc("/viewport/{sessionId}", "rawview")` then append `?mode=...&zoom=...` manually
  - [ ] Update `buildViewportUrl` to use this approach
  - [ ] Add `buildViewportFitUrl(sessionId, width, height, mode, stretch)` convenience function

- [ ] Task 3: Create ViewerCanvas component (AC: #1, #3, #4, #7, #8)
  - [ ] Create `src/components/viewer/ViewerCanvas.tsx`
  - [ ] Canvas 2D element fills the available space
  - [ ] `useEffect` watching viewer store (session, zoom, pan, mode, stretch) → build viewport URL → load as Image → drawImage on canvas
  - [ ] Scroll wheel handler: update store zoom, apply CSS transform immediately, debounce (300ms) the protocol URL update for fresh render
  - [ ] Mouse drag handler: update store pan, apply CSS transform immediately, request re-render on mouseup
  - [ ] Empty state: centered "Drop a raw file here" prompt with file icon
  - [ ] Loading state: spinner overlay during decode
  - [ ] Canvas ref stable across re-renders

- [ ] Task 4: Create file open handlers — drag-and-drop + File > Open (AC: #1, #2, #9)
  - [ ] Drag-and-drop: `onDrop` handler on the main window content area, calls `viewerStore.openFile(path)`
  - [ ] File > Open: toolbar button that opens `tauri-plugin-dialog` file picker with raw format filters (.cr2, .cr3, .nef, .arw, .raf, .rw2, .orf, .pef, .dng, .rwl)
  - [ ] Error handling: on openFile failure, show shadcn/ui toast with categorized error message
  - [ ] Window title update: `getCurrentWindow().setTitle(`${filename} — RawView`)`

- [ ] Task 5: Wire into MainWindowContent + Toolbar (AC: #5, #7, #10)
  - [ ] Replace ProtocolTest component with ViewerCanvas in MainWindowContent
  - [ ] Add minimal Toolbar with: File > Open button, display stretch toggle, zoom indicator
  - [ ] Toolbar reads from viewerStore via selectors

- [ ] Task 6: Update tests and quality checks (AC: all)
  - [ ] Update App.test.tsx (no longer renders ProtocolTest)
  - [ ] Add viewer-store.test.ts for store actions
  - [ ] `npm test -- --run` passes
  - [ ] `npx tsc --noEmit` passes
  - [ ] `cargo clippy --workspace -- -D warnings` passes

## Dev Notes

### ViewerCanvas Render Loop

```tsx
const ViewerCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const session = useViewerStore(s => s.session)
  const zoom = useViewerStore(s => s.zoom)
  const panX = useViewerStore(s => s.panX)
  const panY = useViewerStore(s => s.panY)
  const mode = useViewerStore(s => s.mode)
  const stretch = useViewerStore(s => s.stretch)
  
  // Debounced viewport URL
  const [viewportUrl, setViewportUrl] = useState<string | null>(null)
  
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(() => {
      const url = buildViewportFitUrl(session.session_id, canvasWidth, canvasHeight, mode, stretch)
      setViewportUrl(url)
    }, 100) // debounce
    return () => clearTimeout(timer)
  }, [session, zoom, panX, panY, mode, stretch])
  
  // Load image and draw
  useEffect(() => {
    if (!viewportUrl || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.drawImage(img, 0, 0)
      }
    }
    img.src = viewportUrl
  }, [viewportUrl])
  
  return <canvas ref={canvasRef} ... />
}
```

### Protocol URL Fix

The `convertFileSrc` function encodes `?` as `%3F` when it's part of the path. The fix:

```typescript
export function buildViewportUrl(params: ViewportParams): string {
  // Build base URL without query params
  const baseUrl = convertFileSrc(`/viewport/${params.sessionId}`, "rawview")
  
  // Append query string manually (not through convertFileSrc)
  const query = new URLSearchParams({
    mode: params.mode,
    zoom: params.zoom.toString(),
    x: params.x.toString(),
    y: params.y.toString(),
    w: params.w.toString(),
    h: params.h.toString(),
    stretch: params.stretch.toString(),
  }).toString()
  
  return `${baseUrl}?${query}`
}
```

### Zoom Model

- `zoom = 1.0` → "fit to viewport" (initial state)
- Scroll up → zoom *= 1.1 (zoom in)
- Scroll down → zoom /= 1.1 (zoom out)
- Min zoom: 0.1 (10% of fit), Max zoom: 50 (50× magnification)
- CSS transform applied immediately for smoothness
- Protocol URL re-requested after debounce settles

### Drag-and-Drop

```tsx
// Tauri provides file drop events
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

useEffect(() => {
  const unlisten = getCurrentWebviewWindow().onDragDropEvent(event => {
    if (event.payload.type === 'drop') {
      const path = event.payload.paths[0]
      if (path) viewerStore.getState().openFile(path)
    }
  })
  return () => { unlisten.then(fn => fn()) }
}, [])
```

### File Dialog

```typescript
import { open } from '@tauri-apps/plugin-dialog'

const openFileDialog = async () => {
  const path = await open({
    filters: [{
      name: 'Raw Images',
      extensions: ['cr2', 'cr3', 'nef', 'arw', 'raf', 'rw2', 'orf', 'pef', 'dng', 'rwl', 'dng']
    }]
  })
  if (typeof path === 'string') {
    viewerStore.getState().openFile(path)
  }
}
```

### Window Title

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window'
getCurrentWindow().setTitle(`${session.filename} — RawView`)
```

### Toast for Errors

```tsx
import { toast } from 'sonner' // shadcn/ui uses sonner for toasts

// In openFile action:
if (result.status === 'error') {
  const err = result.error
  switch (err.type) {
    case 'UnsupportedFormat':
      toast.error(`Unsupported format: ${err.extension}`)
      break
    case 'CorruptData':
      toast.error(`Corrupt file: ${err.detail}`)
      break
    case 'FileAccessDenied':
      toast.error(`Cannot access: ${err.path}`)
      break
    default:
      toast.error(`Error: ${err.type}`)
  }
}
```

### Existing Types Available (from bindings.ts)

```typescript
// Auto-generated by tauri-specta:
commands.openFile(path: string) → Result<SessionInfo, RawViewError>

type SessionInfo = {
  session_id: string
  filename: string
  width: number
  height: number
  cfa_pattern: CfaPattern
  bit_depth: number
  black_level: number
  white_level: number
  iso: number
}

type RawViewError = 
  | { type: "UnsupportedFormat"; extension: string }
  | { type: "CorruptData"; detail: string }
  | { type: "FileAccessDenied"; path: string }
  | { type: "DecoderError"; source: string }
  | { type: "RenderError"; detail: string }
  | { type: "SessionExpired"; session_id: string }
```

### Re-exports to Add to tauri-bindings.ts

```typescript
export type { SessionInfo, CfaPattern, BayerPattern, RawViewError } from './bindings'
```

### Project Structure After This Story

```
src/
├── store/
│   └── viewer-store.ts          # Session, zoom, pan, mode, stretch
├── components/
│   ├── viewer/
│   │   ├── ViewerCanvas.tsx     # Canvas display + zoom/pan + drag-drop
│   │   └── ProtocolTest.tsx     # Can be removed or kept for dev
│   ├── toolbar/
│   │   └── Toolbar.tsx          # Minimal: File Open + stretch toggle + zoom
│   └── layout/
│       └── MainWindowContent.tsx # Updated to use ViewerCanvas + Toolbar
├── hooks/
│   └── useViewportUrl.ts        # Debounced viewport URL builder (optional — can inline)
└── lib/
    ├── protocolUrl.ts           # Fixed URL construction
    └── tauri-bindings.ts        # Re-export SessionInfo, RawViewError, etc.
```

### Critical Warnings
- **DO NOT use Zustand destructuring** — use selector pattern per AGENTS.md rules (`useViewerStore(s => s.zoom)` not `const { zoom } = useViewerStore()`)
- **DO NOT use `useMemo`/`useCallback`** — React Compiler handles memoization (per AGENTS.md)
- **DO NOT forget to fix `protocolUrl.ts`** — current implementation will break with query params
- **DO NOT import from `@/lib/bindings` directly** — always use `@/lib/tauri-bindings`
- **DO check if `sonner` (toast library) is installed** — if not, use shadcn/ui's built-in toast or install it

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Canvas Display]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: AGENTS.md — Performance Pattern, State Management Onion]
- [Source: src/lib/bindings.ts — auto-generated types]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Review Findings

**Date**: 2026-03-31
**Reviewer**: AI Code Review (3-layer parallel)

#### Patched
- **S23-1 (HIGH)**: `stretch` initial value `false` (line 37) but `reset()` sets `true` (line 117) — inconsistent defaults. Fixed: `reset()` now sets `stretch: false` to match initial state [src/store/viewer-store.ts:117]

#### Deferred
- **S23-2 (LOW)**: `e.preventDefault()` on React synthetic WheelEvent is a no-op when React uses passive listeners — canvas doesn't scroll so low impact [src/components/viewer/ViewerCanvas.tsx:144]
- **S23-3 (LOW)**: Stale unlisten race in drag-drop cleanup — `.then(fn => fn())` pattern has a small window; standard Tauri pattern [src/components/viewer/ViewerCanvas.tsx:137-139]
- **S23-4 (LOW)**: Multi-file drop only opens first file silently — no user feedback about skipped files
- **S23-5 (LOW)**: Canvas default 800×600 before ResizeObserver fires — brief flash of wrong size

#### Dismissed
- Scroll zoom and drag pan work correctly with the ref-based pattern (no stale closure issue)
