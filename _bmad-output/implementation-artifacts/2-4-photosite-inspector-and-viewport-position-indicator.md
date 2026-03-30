# Story 2.4: Photosite Inspector and Viewport Position Indicator

Status: review

## Story

As a technical photographer or imaging engineer,
I want to hover over any photosite to see its channel identity, exact raw sensor value, and position in a tooltip, and click to pin that information,
so that I can read precise sensor values and diagnose artifacts at specific pixel locations.

## Acceptance Criteria

1. Mouse hover on canvas shows photosite channel (R/G1/G2/B), raw u16 value, and (row, col) position (FR22, FR24)
2. All numerical values in monospace at minimum 12px (NFR19, NFR18)
3. Click pins the inspector; it remains visible while hovering elsewhere (FR23)
4. Viewport position indicator shows current viewport rectangle on the full sensor (FR14)
5. Inspector queries are debounced to ~60fps (16ms) to avoid flooding IPC
6. Inspector always shows unmodified u16 values regardless of stretch setting (NFR8)

## Tasks

- [ ] Task 1: Create Rust `get_photosite_info` command
  - [ ] Create `src-tauri/src/commands/query_commands.rs`
  - [ ] `get_photosite_info(row: u32, col: u32, state: State<SessionManager>) -> Result<PhotositeInfo, RawViewError>`
  - [ ] `PhotositeInfo` struct: `channel: CfaChannel`, `value: u16`, `row: u32`, `col: u32` — derive Serialize + Type
  - [ ] Register in bindings.rs
  - [ ] Add `pub mod query_commands;` to commands/mod.rs

- [ ] Task 2: Create inspectorStore + usePhotositeInfo hook
  - [ ] Create `src/store/inspector-store.ts` — `hovered: PhotositeInfo|null`, `pinned: PhotositeInfo|null`, actions: `setHovered`, `setPinned`, `clearPinned`
  - [ ] Create `src/hooks/usePhotositeInfo.ts` — debounced (16ms) hook that calls `commands.getPhotositeInfo(row, col)` on mouse position change
  - [ ] Create `src/lib/coordinateMapper.ts` — `mapCanvasToSensor(canvasX, canvasY, canvasWidth, canvasHeight, sensorWidth, sensorHeight, zoom, panX, panY) -> {row, col}`

- [ ] Task 3: Create PhotositeInspector component
  - [ ] Create `src/components/viewer/PhotositeInspector.tsx`
  - [ ] Floating tooltip near cursor showing: channel badge (colored), value, position
  - [ ] When pinned: fixed position, click again to unpin
  - [ ] Monospace font for values, min 12px (NFR19, NFR18)
  - [ ] Dark theme styling matching the app

- [ ] Task 4: Create ViewportIndicator component
  - [ ] Create `src/components/viewer/ViewportIndicator.tsx`
  - [ ] Small minimap in corner showing full sensor outline + current viewport rectangle
  - [ ] Updates as zoom/pan changes
  - [ ] Only visible when zoomed in (zoom > 1)

- [ ] Task 5: Integrate into ViewerCanvas + wire mouse events
  - [ ] Add onMouseMove handler to canvas that calls coordinateMapper → usePhotositeInfo
  - [ ] Add onClick handler for pin/unpin
  - [ ] Render PhotositeInspector and ViewportIndicator as overlays on the canvas container
  - [ ] Update tauri-bindings.ts to re-export PhotositeInfo type

- [ ] Task 6: Tests
  - [ ] coordinateMapper unit tests
  - [ ] inspector-store tests
  - [ ] `npm test -- --run` passes
  - [ ] `cargo test --workspace` passes
  - [ ] `cargo clippy --workspace -- -D warnings` passes

## Dev Notes

### PhotositeInfo Type (Rust → TypeScript via specta)
```rust
#[derive(Debug, Clone, Serialize, Type)]
pub struct PhotositeInfo {
    pub channel: CfaChannel,
    pub value: u16,
    pub row: u32,
    pub col: u32,
}
```

### Coordinate Mapping
Canvas pixel → sensor coordinate:
```typescript
function mapCanvasToSensor(
  canvasX: number, canvasY: number,
  canvasW: number, canvasH: number,
  sensorW: number, sensorH: number,
  zoom: number, panX: number, panY: number
): { row: number; col: number } | null {
  // Reverse the CSS transform: remove pan, then remove zoom
  const scale = Math.min(canvasW / sensorW, canvasH / sensorH) * zoom
  const offsetX = (canvasW - sensorW * scale) / 2 + panX
  const offsetY = (canvasH - sensorH * scale) / 2 + panY
  const col = Math.floor((canvasX - offsetX) / scale)
  const row = Math.floor((canvasY - offsetY) / scale)
  if (row < 0 || col < 0 || row >= sensorH || col >= sensorW) return null
  return { row, col }
}
```

### Debounce Pattern (16ms ≈ 60fps)
```typescript
const usePhotositeInfo = (row: number | null, col: number | null) => {
  // Debounce IPC calls to ~60fps
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
```

### Critical Warnings
- **Zustand selector pattern** — no destructuring
- **No useMemo/useCallback** — React Compiler handles it
- Values must be raw u16 integers — never display transformed values
- Monospace font for all numerical displays
