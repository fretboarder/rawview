# Story 2.2: Viewport Renderer and Custom URI Protocol Integration

Status: review

## Story

As a developer building the display pipeline,
I want a Rust-side ViewportRenderer that renders viewport-sized RGBA bitmaps from the BayerDataStore and serves them as PNG via the custom URI protocol,
so that the frontend can display the Bayer mosaic without transferring raw sensor data across the IPC boundary.

## Acceptance Criteria

1. `rawview://viewport/{session_id}?mode=bayer&zoom={z}&x={x}&y={y}&w={w}&h={h}&stretch={bool}` returns a PNG of the requested viewport region
2. Bayer mosaic mode: R photosites render red, G1/G2 render green, B renders blue, brightness proportional to raw value (FR9, FR13)
3. Linear 16→8-bit mapping from black_level to white_level when `stretch=false` (NFR11)
4. Auto-stretch mapping from actual min to max when `stretch=true`
5. No gamma, tone mapping, or color space conversion applied (NFR11)
6. Rendering parallelized with rayon — target <33ms for 1080p viewport from 45MP source (NFR1)
7. PNG encoding via `image` crate — target <10ms (already available)
8. `catch_unwind` on protocol handler for rayon panic safety (NFR13)
9. Stale session IDs return 404
10. Existing test PNG route (`/viewport/test`) continues to work
11. Zoom parameter: `fit` = fit entire sensor in viewport; numeric = pixels-per-photosite scale factor
12. Viewport rect (x, y, w, h) defines the output pixel dimensions and source region

## Tasks / Subtasks

- [ ] Task 1: Create render module — scaling.rs (AC: #3, #4, #5)
  - [ ] Create `src-tauri/src/render/mod.rs`, `scaling.rs`
  - [ ] `map_value_raw(value: u16, black_level: u16, white_level: u16) -> u8` — linear map BL→WL to 0→255
  - [ ] `map_value_stretch(value: u16, min_val: u16, max_val: u16) -> u8` — linear map min→max to 0→255
  - [ ] Unit tests for edge cases (value < BL → 0, value > WL → 255, midpoint accuracy)

- [ ] Task 2: Create render/modes.rs — Bayer mosaic rendering (AC: #2)
  - [ ] `render_bayer_pixel(channel: CfaChannel, brightness: u8) -> [u8; 4]` — returns RGBA
  - [ ] R channel → (brightness, 0, 0, 255), G1/G2 → (0, brightness, 0, 255), B → (0, 0, brightness, 255)
  - [ ] Unit tests for all 4 channels

- [ ] Task 3: Create render/viewport.rs — ViewportRenderer (AC: #1, #6, #11, #12)
  - [ ] `ViewportParams` struct: session_id, mode, zoom, x, y, w, h, stretch
  - [ ] `parse_viewport_params(query: &str) -> Result<ViewportParams, _>` — parse URL query string
  - [ ] `render(store: &BayerDataStore, params: &ViewportParams) -> Vec<u8>` → RGBA pixel buffer
  - [ ] For `zoom=fit`: calculate scale to fit entire sensor in w×h viewport, nearest-neighbor downsample
  - [ ] For numeric zoom: extract the region at the given scale from (x, y) origin
  - [ ] Use rayon `par_chunks_mut` for row-parallel rendering
  - [ ] Compute actual min/max from BayerDataStore if stretch=true (cache-friendly single pass)

- [ ] Task 4: Create render/encoder.rs (AC: #7)
  - [ ] `encode_png(rgba: &[u8], width: u32, height: u32) -> Result<Vec<u8>, RawViewError>`
  - [ ] Use `image::ImageBuffer::from_raw()` + `write_to()` with PNG format
  - [ ] Unit test: encode known pixels, verify PNG signature

- [ ] Task 5: Integrate renderer into protocol handler (AC: #1, #8, #9, #10)
  - [ ] Update `viewport_protocol.rs` to accept `AppHandle` (via `UriSchemeContext`)
  - [ ] Parse viewport params from URL query string
  - [ ] Access `SessionManager` via `ctx.app_handle().state::<SessionManager>()`
  - [ ] Call `session_manager.with_store()` → `render()` → `encode_png()` → PNG response
  - [ ] Wrap entire handler body in `std::panic::catch_unwind` for rayon safety
  - [ ] Keep `/viewport/test` route working as fallback
  - [ ] Unknown/stale session IDs → 404
  - [ ] Add `rayon` dependency to `src-tauri/Cargo.toml`

- [ ] Task 6: Tests and quality checks
  - [ ] Render tests: create a small BayerDataStore, render viewport, verify output dimensions and pixel colors
  - [ ] Scaling tests: edge cases for value mapping
  - [ ] `cargo clippy --workspace -- -D warnings` passes
  - [ ] `cargo test --workspace` passes
  - [ ] `npm test -- --run` passes

## Dev Notes

### Viewport Rendering Pipeline

```
Protocol request URL
  → parse_viewport_params(query_string)
  → session_manager.with_store(|store| {
      let rgba = render(store, &params);
      encode_png(&rgba, params.w, params.h)
    })
  → PNG response
```

### Bayer Mosaic Color Mapping

Each photosite maps to one RGBA pixel:
- **R**: `(brightness, 0, 0, 255)` — red channel only
- **G1/G2**: `(0, brightness, 0, 255)` — green channel only
- **B**: `(0, 0, brightness, 255)` — blue channel only

Where `brightness` is the 16→8 bit mapped value.

### 16-bit → 8-bit Linear Mapping

```rust
fn map_value_raw(value: u16, black_level: u16, white_level: u16) -> u8 {
    if value <= black_level { return 0; }
    if value >= white_level { return 255; }
    let range = (white_level - black_level) as f32;
    let normalized = (value - black_level) as f32 / range;
    (normalized * 255.0) as u8
}
```

### Zoom Handling

**`zoom=fit`**: Calculate scale to fit entire sensor in viewport:
```rust
let scale_x = params.w as f32 / store.dimensions().0 as f32;
let scale_y = params.h as f32 / store.dimensions().1 as f32;
let scale = scale_x.min(scale_y);
// For each output pixel (ox, oy): sample source at (ox/scale, oy/scale)
```

**`zoom=N`** (numeric, e.g. `zoom=1` = 1:1, `zoom=2` = 2× magnification):
```rust
// Source region starts at (params.x, params.y) in sensor coords
// Each output pixel maps to source: (params.x + ox/zoom, params.y + oy/zoom)
```

Nearest-neighbor sampling — no interpolation (raw data must not be modified).

### Rayon Parallelism

```rust
use rayon::prelude::*;

let mut rgba = vec![0u8; (w * h * 4) as usize];
rgba.par_chunks_mut((w * 4) as usize) // one row at a time
    .enumerate()
    .for_each(|(row_idx, row)| {
        for col in 0..w {
            let (src_row, src_col) = map_output_to_source(row_idx, col, &params);
            let value = store.get_photosite(src_row, src_col).unwrap_or(0);
            let channel = store.get_channel(src_row, src_col);
            let brightness = map_value(value, ...);
            let pixel = render_bayer_pixel(channel, brightness);
            let offset = (col * 4) as usize;
            row[offset..offset + 4].copy_from_slice(&pixel);
        }
    });
```

### Protocol Handler State Access

```rust
pub fn handle<R: tauri::Runtime>(
    ctx: tauri::UriSchemeContext<'_, R>,
    request: tauri::http::Request<Vec<u8>>,
    responder: tauri::UriSchemeResponder,
) {
    use tauri::Manager;
    let app_handle = ctx.app_handle().clone();
    
    tauri::async_runtime::spawn(async move {
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let session_mgr = app_handle.state::<SessionManager>();
            // ... parse params, render, encode
        }));
        // Handle panic → 500, Ok(Err) → appropriate status, Ok(Ok) → 200
    });
}
```

### Dependencies to Add

```toml
rayon = "1"
```

### Project Structure After This Story

```
src-tauri/src/render/
├── mod.rs           # pub mod viewport, modes, scaling, encoder
├── viewport.rs      # ViewportRenderer, ViewportParams, render()
├── modes.rs         # render_bayer_pixel()
├── scaling.rs       # map_value_raw(), map_value_stretch()
└── encoder.rs       # encode_png()
```

### Critical Warnings
- **DO NOT apply gamma** — linear mapping only (NFR11)
- **DO NOT interpolate** between photosites — nearest-neighbor sampling preserves raw data
- **DO NOT forget catch_unwind** — rayon panics must not crash the app
- **DO NOT break the /viewport/test route** — it's still used by ProtocolTest.tsx
- **DO NOT compute min/max on every render** — cache or compute once per session if needed

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Viewport Rendering]
- [Source: _bmad-output/planning-artifacts/architecture.md#IPC Protocol Design]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: src-tauri/src/protocol/viewport_protocol.rs — existing handler to modify]
- [Source: src-tauri/src/session.rs — SessionManager.with_store()]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
