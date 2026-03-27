---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: [prd.md, product-brief-rawview.md, product-brief-rawview-distillate.md]
workflowType: 'architecture'
project_name: 'RawView'
user_name: 'Klaus'
date: '2026-03-27'
status: 'complete'
completedAt: '2026-03-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
40 FRs across 9 groups. Tier 1 (FR1–FR34) covers the core viewing pipeline: file ingestion, Bayer visualization, channel separation, inspection, histogram, metadata, and UI shell. Tier 2 (FR35–FR40) adds interactive analysis: histogram brushing, clipping overlay, ROI statistics, split-screen demosaic comparison, and full-sensor heatmap. Architecturally, Tier 1 requires a unidirectional data pipeline (file → decode → render) while Tier 2 introduces bidirectional interaction (UI selection → data query → visual feedback).

**Non-Functional Requirements:**
24 NFRs with quantified targets. The most architecturally significant:
- **NFR1/NFR7:** 3-second render target with 5-second performance gate — drives data transfer strategy
- **NFR3:** 30fps zoom/pan — requires efficient rendering, not full-array re-transfer
- **NFR6:** 500MB memory ceiling for 45MP — constrains data duplication
- **NFR8–NFR11:** Bit-exact accuracy — forbids any value transformation for numerical readouts
- **NFR10:** Cross-platform numerical parity — identical output across three WebView engines

**Scale & Complexity:**
- Primary domain: Desktop application (Tauri v2 + Rust + Canvas/WebGL)
- Complexity level: Medium
- Estimated architectural components: 7 (raw decoder, Bayer data store, viewport renderer, data query service, stats calculator, IPC layer, UI shell)

### Technical Constraints & Dependencies

- **LibRaw (C library):** Core dependency via Rust FFI. Dictates format coverage, CFA pattern detection, and raw data access API. LGPL license — must be dynamically linked or use a compatible wrapper.
- **Tauri v2:** Framework determines IPC mechanism, WebView integration, OS packaging, and auto-update capability. Constrains frontend to web technologies rendered in platform-native WebViews.
- **No WebGL dependency for Tier 1:** Party mode analysis concluded that Rust-side rendering eliminates the need for WebGL in the frontend. A Canvas 2D or `<img>` element can display Rust-rendered RGBA bitmaps. WebGL may be reconsidered for Tier 2 interactive overlays.
- **No network dependency:** Fully offline. Simplifies architecture (no API layer, no auth, no state sync).
- **Solo developer:** Architecture must be simple enough to maintain alone. Complexity budget is limited.

### Cross-Cutting Concerns

- **Data accuracy enforcement:** All raw sensor data stays in Rust memory as the single source of truth. The WebView never holds the Bayer array. Inspector values and histogram bins are computed in Rust and returned via lightweight IPC. Display bitmaps are visual representations, not data — the ground truth is in the query responses, not the pixels on screen.
- **Cross-platform rendering consistency:** Rust-side rendering eliminates WebView/WebGL divergence. The same Rust code on all three platforms produces identical bitmaps. WebView just displays an image. NFR10 becomes trivially satisfied for numerical data.
- **Performance budgets:** Viewport-sized rendering (~8MB RGBA for 1080p) replaces full-array transfer (~90MB). The 3-second budget now covers: file decode + viewport render + IPC of ~8MB bitmap. The 30fps pan budget requires Rust to re-render a viewport region in <33ms (parallelizable with rayon).
- **Progressive disclosure:** UI pattern designed into the React component architecture — panels, layout slots, visibility state. Affects frontend only; Rust backend is panel-agnostic.
- **Tier 1 → Tier 2 extensibility:** The `DataQueryService` in Rust needs to support Tier 2 query types (ROI rectangle stats, value-range highlighting) without refactoring. Design the query interface with Tier 2 in mind.

### Architectural Model: Rust-Side Rendering (Party Mode Decision)

**Key decision:** Raw data never leaves Rust. The Rust backend renders viewport-sized RGBA bitmaps for display, and answers point/aggregate queries for exact numerical data.

```
┌──────────────────────────────────────────────┐
│  Rust Backend (Tauri)                         │
│                                               │
│  ┌─────────────┐  ┌────────────────────────┐ │
│  │ RawDecoder   │→│ BayerDataStore          │ │
│  │ (LibRaw FFI) │  │ (canonical 16-bit array)│ │
│  └─────────────┘  └────────┬───────────────┘ │
│                             │                 │
│         ┌──────────────────┼──────────┐       │
│         │                  │          │       │
│  ┌──────▼──────┐  ┌───────▼───┐ ┌────▼────┐ │
│  │ViewportRender│  │DataQuery  │ │StatsCalc│ │
│  │(→RGBA bitmap)│  │(point/ROI)│ │(histogram│ │
│  └──────┬──────┘  └─────┬─────┘ │ bins)   │ │
│         │                │       └────┬────┘ │
│         └────────┬───────┘            │       │
│                  │ Tauri IPC          │       │
│                  ▼                    ▼       │
├──────────────────────────────────────────────┤
│  WebView Frontend (React/TypeScript)          │
│                                               │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ │
│  │Canvas/Image │ │Inspector │ │Histogram   │ │
│  │Display      │ │Panel     │ │Panel       │ │
│  └────────────┘ └──────────┘ └────────────┘ │
│  ┌────────────────────────────────────────┐  │
│  │UIShell (toolbar, panels, keyboard,     │  │
│  │ progressive disclosure, layout state)  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Why this over full-array transfer to WebGL:**
1. Eliminates 90MB IPC bottleneck — viewport bitmaps are ~8MB
2. Eliminates WebGL cross-platform inconsistency — Rust renders identically on all platforms
3. Preserves bit-exact accuracy — raw data never leaves Rust; exact values served via queries
4. Simplifies frontend — Canvas 2D or `<img>` display, no WebGL shaders needed for Tier 1
5. Memory efficient — one copy of data in Rust + one viewport bitmap, well under 500MB (NFR6)

**Contingency:** If Rust-side viewport rendering is too slow for 30fps pan (<33ms per frame), fall back to tile-based caching: Rust pre-renders fixed-size tiles at each zoom level, caches them, and the WebView composites visible tiles with GPU acceleration (slippy map pattern). This is more complex but proven.

**Impact on PRD assumptions:**
- NFR7 performance gate redefined: measures viewport render + IPC time, not full-array transfer
- WebGL explicitly optional for Tier 1 (may be used for Tier 2 overlays)
- The "display bitmap is a visualization; exact data comes from queries" distinction must be understood by all downstream consumers

## Starter Template Evaluation

### Primary Technology Domain

Desktop application (Tauri v2) with Rust backend and web frontend, requiring high-performance data transfer between layers.

### Starter Options Considered

1. **dannysmith/tauri-template** (207★) — Production-ready Tauri v2 + React 19 + TypeScript + Vite 7 + shadcn/ui + Tailwind CSS v4 + Zustand + Vitest. Includes type-safe Rust↔TypeScript IPC via tauri-specta, cross-platform window controls, comprehensive tooling.
2. **kitlib/tauri-app-template** (58★) — Similar stack but less mature, fewer architectural patterns established.
3. **Official create-tauri-app** — Minimal scaffolding, no UI library or testing infrastructure.
4. **SolidJS option** — Considered for raw DOM performance (70% faster than React). Rejected: RawView's frontend is bitmap-display-heavy, not DOM-heavy. SolidJS lacks equivalent component libraries (no shadcn/ui) and has minimal Tauri community starters.

### Selected Starter: dannysmith/tauri-template

**Rationale:**
- Type-safe IPC via tauri-specta is critical for our architecture (Rust-side rendering + data queries)
- shadcn/ui provides polished dark-mode UI components (NFR20) without custom design work
- Cross-platform window controls already solved for Windows, macOS, and Linux
- Zustand is the right weight for panel visibility state, zoom level, active visualization mode
- Solo developer: batteries-included starter saves weeks of infrastructure decisions
- AI-development-ready documentation and patterns

**Initialization Command:**

```bash
git clone https://github.com/dannysmith/tauri-template.git rawview
cd rawview
npm install
npm run tauri dev
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Frontend: TypeScript (strict mode), React 19 with React Compiler (automatic memoization)
- Backend: Rust (latest stable), Tauri v2
- IPC: tauri-specta for compile-time-checked TypeScript bindings from Rust commands

**Styling Solution:**
- Tailwind CSS v4 (utility-first, dark mode built-in)
- shadcn/ui component library (accessible, customizable, Tailwind-based)
- Dark theme as default (aligns with NFR20)

**Build Tooling:**
- Vite 7 (frontend bundling, HMR)
- Cargo (Rust compilation)
- Tauri CLI (cross-platform builds: .dmg, .msi, .AppImage)

**Testing Framework:**
- Vitest v4 + Testing Library (frontend)
- Clippy (Rust linting)
- Tauri command mocking for integration tests

**Code Organization:**
- `src/` — React frontend (components, hooks, stores, services)
- `src-tauri/src/` — Rust backend (commands, modules)
- `src/components/ui/` — shadcn/ui components
- Three-layer state: useState (component) → Zustand (global UI) → TanStack Query (persistent data)

**Development Experience:**
- Vite HMR + Tauri hot reload
- ESLint + Prettier + ast-grep (architecture enforcement)
- `npm run check:all` — single quality gate (TypeScript, ESLint, Prettier, clippy, tests)
- GitHub Actions CI/CD pre-configured

**Customizations Required:**
- Remove: i18n, command palette, sidebar scaffolding, single-instance plugin
- Add: LibRaw FFI module, viewport rendering pipeline, Canvas display component
- Modify: Window configuration for RawView layout, Tauri permissions for file access

**Note:** Project initialization using this template should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. LibRaw integration: Custom `libraw-sys` FFI as primary decoder; `rawloader` as validation reference for accuracy testing
2. IPC binary transfer: Custom URI protocol serving PNG-encoded viewports; Tauri invoke for typed data queries
3. Viewport rendering: Rust-side rayon-parallelized renderer with linear 16→8-bit mapping + display stretch toggle

**Important Decisions (Shape Architecture):**
4. Canvas display: Canvas 2D for bitmap display + overlay drawing + mouse coordinate mapping
5. Error handling: Typed error enum with 6 variants covering file errors, render errors, and session lifecycle; `catch_unwind` on all handlers

**Deferred Decisions (Tier 2):**
- Tile caching strategy (contingency for pan performance)
- Demosaic algorithm selection for split-screen
- Histogram brushing overlay rendering approach
- Auto-updater configuration

### Data Pipeline Architecture

**Raw File Decoding:**
- Primary decoder: Custom `libraw-sys` FFI bindings to LibRaw C library (actively maintained, 1000+ camera models, same decoder used by Darktable and RawTherapee). LibRaw is statically linked during build.
- Validation reference: `rawloader` crate (pure Rust) used in test suite for bit-exact accuracy comparison against LibRaw output
- Decoder output: 16-bit single-channel Bayer array + CFA pattern enum + black/white levels + EXIF metadata
- The BayerDataStore holds the decoded array for the lifetime of the file session. Immutable after decode.

**Viewport Rendering:**
- `ViewportRenderer` takes `(mode, zoom_level, viewport_rect, display_scaling)` → `PNG-encoded Vec<u8>`
- Modes: Bayer mosaic (CFA-colored), grayscale (linear), channel isolation (single channel)
- Display scaling options:
  - **Raw mode (default):** Linear 16→8-bit mapping from `black_level` to `white_level`. Faithful representation, may appear dark for typical exposures.
  - **Display stretch mode:** Linear 16→8-bit mapping from actual `min_value` to `max_value` in the file. Better visibility for first impressions. Toggle via UI.
  - Both modes are display-only transforms. Inspector always shows true raw values.
- Parallelized with `rayon` per-row for viewport-sized output
- Output encoded as PNG via `image` crate parallel encoder (~5ms) before serving
- Target: <33ms total (render + encode) for 1080p viewport from 45MP source on 4+ cores

### IPC Protocol Design

**Binary transfer (PNG-encoded viewports via custom URI protocol):**
- Protocol: `rawview://viewport/{session_id}?mode={mode}&zoom={zoom}&x={x}&y={y}&w={w}&h={h}&stretch={bool}`
- Rust registers a protocol handler that renders the viewport on demand, encodes as PNG, and returns bytes with `Content-Type: image/png`
- Frontend loads via `new Image()` with protocol URL, draws to Canvas 2D
- Bypasses Tauri JSON serialization entirely — PNG payload ~500KB-1MB vs ~8MB raw RGBA
- Browser caches previously viewed viewports for instant back-navigation

**Data queries (typed, small payloads via tauri-specta):**
- `open_file(path)` → `Result<SessionInfo, RawViewError>`
- `get_photosite_info(row, col)` → `{ channel: CfaChannel, value: u16, row: u32, col: u32 }`
- `get_histogram(channel: Option<CfaChannel>)` → `{ bins: Vec<u32>, min: u16, max: u16, black_level: u16, white_level: u16 }`
- `get_file_metadata()` → `{ filename, dimensions, cfa_pattern, bit_depth, black_level, white_level, exif: ExifData }`

**Tier 2 queries (designed now, implemented later):**
- `get_roi_stats(x, y, w, h)` → per-channel mean, std_dev, min, max, hot_pixel_count
- `get_photosites_in_range(min_value, max_value)` → coordinate list for histogram brushing

### Frontend Architecture

**Canvas Display:**
- Canvas 2D element as the central display surface
- Rust-rendered PNG loaded as `Image` via custom URI protocol, drawn with `drawImage()`
- Mouse position mapped to photosite coordinates via zoom/pan transform matrix
- Overlay layer for: viewport position indicator (FR14), pinned inspector marker (FR23)
- Tier 2 overlays: ROI rectangle, clipping highlights, histogram brush selection

**State Management (Zustand):**
- `viewerStore`: current file session ID, zoom level, pan offset, active visualization mode, active channel, display stretch toggle
- `panelStore`: panel visibility flags (histogram, metadata, channel selector)
- `inspectorStore`: hovered photosite info, pinned photosite info

**Component Tree:**
- `App` → `Toolbar` + `ViewerCanvas` + `QuickStatsBar`
- Toggleable panels: `HistogramPanel`, `MetadataPanel`, `ChannelSelector`
- `PhotositeInspector` (tooltip, follows cursor)

### Error Handling

**Rust error enum:**
```rust
enum RawViewError {
    UnsupportedFormat { extension: String },
    CorruptData { detail: String },
    FileAccessDenied { path: String },
    DecoderError { source: String },
    RenderError { detail: String },
    SessionExpired { session_id: String },
}
```

- Maps directly to FR6 categorized error taxonomy
- Propagated to TypeScript via tauri-specta typed errors
- Frontend displays via shadcn/ui toast notifications
- **Safety principle:** Every Tauri command and protocol handler wraps its entire body in `catch_unwind` for rayon panic safety. Log the panic, return a graceful error, never crash the app (NFR13).

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold from dannysmith/tauri-template (strip unused features)
2. Custom `libraw-sys` FFI bindings + BayerDataStore (decode a raw file, hold Bayer array)
3. ViewportRenderer (Bayer mosaic mode → PNG-encoded bitmap)
4. Custom URI protocol (serve rendered viewport to frontend)
5. Canvas 2D display (show bitmap, mouse coordinate mapping)
6. Photosite inspector (point query IPC)
7. Channel separation + grayscale modes + display stretch toggle
8. Histogram computation + panel
9. Metadata extraction + panels
10. Quick stats bar + CFA overlay
11. Cross-platform testing + packaging

**Cross-Component Dependencies:**
- ViewportRenderer depends on BayerDataStore (source data)
- Canvas display depends on Custom URI protocol (PNG delivery)
- Inspector depends on DataQueryService + Canvas mouse mapping
- Histogram depends on StatsCalc (Rust-side bin computation)
- All visualization modes share ViewportRenderer with different mode params
- Display stretch toggle affects ViewportRenderer only — no impact on data queries

## Implementation Patterns & Consistency Rules

### Conflict Points Identified

8 areas where AI agents could make different choices, specific to RawView's two-language (Rust + TypeScript) architecture.

### Naming Patterns

**Rust Naming:**
- Modules: `snake_case` — `raw_decoder`, `viewport_renderer`, `data_query`
- Structs: `PascalCase` — `BayerDataStore`, `ViewportRenderer`, `RawViewError`
- Functions: `snake_case` — `open_file`, `get_photosite_info`, `render_viewport`
- Enums: `PascalCase` with `PascalCase` variants — `CfaChannel::Green1`, `VisualizationMode::BayerMosaic`
- Constants: `SCREAMING_SNAKE_CASE` — `MAX_VIEWPORT_WIDTH`, `DEFAULT_ZOOM_LEVEL`

**TypeScript Naming:**
- Components: `PascalCase` files and exports — `ViewerCanvas.tsx`, `HistogramPanel.tsx`
- Hooks: `camelCase` with `use` prefix — `useViewerStore`, `usePhotositeInfo`
- Stores (Zustand): `camelCase` with `Store` suffix — `viewerStore`, `panelStore`
- Utility files: `camelCase` — `coordinateMapper.ts`, `protocolUrl.ts`
- Types/interfaces: `PascalCase` — `PhotositeInfo`, `SessionInfo`, `ViewerState`
- Constants: `SCREAMING_SNAKE_CASE` — `VISUALIZATION_MODES`, `DEFAULT_PANEL_STATE`

**IPC Command Naming (tauri-specta):**
- Rust commands: `snake_case` — `open_file`, `get_photosite_info`, `get_histogram`
- TypeScript bindings: auto-generated `camelCase` by tauri-specta — `openFile`, `getPhotositeInfo`
- Protocol URLs: `kebab-case` paths — `rawview://viewport/{session_id}`

**Tauri Event Naming:**
- Pattern: `namespace:action` — `file:opened`, `file:error`, `render:complete`
- Payload: always a typed object, never bare primitives

### Structure Patterns

**Tests:**
- Rust: co-located `#[cfg(test)] mod tests` in each module file + `tests/` directory for integration tests
- TypeScript: co-located `*.test.tsx` / `*.test.ts` next to source files
- Test data: `test-data/` directory at project root with sample raw files (git-lfs tracked)
- E2E testing (Playwright/WebDriver driving Tauri window): deferred to post-Tier-1

**Components:**
- One component per file
- Co-located styles (Tailwind classes inline, no separate CSS files)
- Co-located tests
- Shared UI primitives in `src/components/ui/` (shadcn/ui)
- RawView-specific components in `src/components/viewer/`, `src/components/panels/`

### Format Patterns

**IPC Response Format:**
- Success: typed return value directly (tauri-specta handles serialization)
- Error: `RawViewError` enum variant (tauri-specta maps to TypeScript discriminated union)
- No wrapper objects — tauri-specta's type safety is the contract

**Numerical Data:**
- Sensor values: always `u16` integers, never floating point, never normalized
- Coordinates: always `(row: u32, col: u32)`, row-first (matches array layout)
- Histogram bins: `Vec<u32>` with explicit `bin_count`, `min_value`, `max_value`

### Communication Patterns

**State Updates:**
- Zustand stores use immutable update patterns (spread operator)
- No direct DOM manipulation — all rendering via React state → Canvas redraw
- Viewport changes (zoom, pan, mode switch) trigger new protocol URL → Canvas redraw
- Inspector updates on mouse move → Tauri invoke → update inspector store (debounced to 60fps)

**Canvas Render Loop:**
- `ViewerCanvas.tsx` uses a `useEffect` watching the viewport URL (derived from `viewerStore` state)
- On URL change: create `new Image()`, set `src` to protocol URL, on `Image.onload` → `canvas.getContext('2d').drawImage(image, 0, 0)`
- Canvas ref is stable (React ref). Image loading is async. Stale loads are discarded if session/state changed before `onload` fires.
- Pan via canvas CSS transform for sub-pixel smoothness; new protocol request only when viewport region changes significantly (debounced)

**Loading States:**
- `viewerStore.status`: `'idle' | 'loading' | 'ready' | 'error'`
- Loading shown during file decode (may take 1-3 seconds for large files)
- Mode switches are fast enough to not need loading states (<500ms per NFR2)

### Process Patterns

**Error Handling:**
- Rust: all public functions return `Result<T, RawViewError>`. No `.unwrap()` except in tests.
- TypeScript: wrap Tauri invoke calls in try/catch. Display errors via shadcn/ui toast.
- Protocol handler: return HTTP 500 with error detail on render failure. Canvas shows last valid frame.
- Principle: **never crash, always inform.** A corrupt file produces a toast, not a blank screen.

**File Lifecycle:**
- `open_file()` creates a `Session` with a unique ID (managed by `session.rs`). All subsequent queries reference the session.
- The `Session` owns the `BayerDataStore`. Commands and protocol handlers borrow from the session.
- Closing a file (or opening a new one) invalidates the session. Stale protocol URLs return `SessionExpired`.
- One active session per window. Opening a new file replaces the current session.

**Accuracy Test Pattern:**
```rust
#[test]
fn test_photosite_values_match_reference() {
    let store = open_test_file("test-data/canon_cr3_sample.cr3");
    let reference: ReferenceData = load_json("test-data/reference/canon_cr3_sample.json");
    
    for point in &reference.sample_points {
        let info = store.get_photosite(point.row, point.col);
        assert_eq!(info.value, point.expected_value,
            "Mismatch at ({}, {}): got {}, expected {}",
            point.row, point.col, info.value, point.expected_value);
        assert_eq!(info.channel, point.expected_channel);
    }
}
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow Rust naming conventions (snake_case functions, PascalCase types) — enforced by `clippy`
2. Follow TypeScript naming conventions (PascalCase components, camelCase functions) — enforced by ESLint
3. Never perform sensor value transformations in TypeScript — all data accuracy logic stays in Rust
4. Return `Result<>` from all Rust public functions — enforced by ast-grep rule
5. Use tauri-specta types — never manually define IPC payloads in TypeScript

**Anti-Patterns:**
- ❌ Storing the Bayer array in JavaScript (memory, accuracy)
- ❌ Performing histogram computation in TypeScript (must be Rust)
- ❌ Using `unwrap()` in Rust production code (use `?` operator)
- ❌ Manually constructing protocol URLs as strings (use a typed builder function)
- ❌ Passing sensor values as floating point anywhere in the pipeline

## Project Structure & Boundaries

### Complete Project Directory Structure

```
rawview/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, test, clippy — runs on Windows, macOS, Ubuntu
│       └── release.yml               # Cross-platform build + GitHub Release
├── src/                              # Frontend (React/TypeScript)
│   ├── main.tsx                      # App entry point
│   ├── App.tsx                       # Root component, layout shell
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (Button, Toast, etc.)
│   │   ├── viewer/
│   │   │   ├── ViewerCanvas.tsx      # Canvas 2D display surface + render loop
│   │   │   ├── ViewerCanvas.test.tsx
│   │   │   ├── PhotositeInspector.tsx # Hover/pin tooltip
│   │   │   ├── PhotositeInspector.test.tsx
│   │   │   ├── ViewportIndicator.tsx  # Minimap/position indicator
│   │   │   └── CfaOverlay.tsx        # CFA pattern diagram overlay
│   │   ├── panels/
│   │   │   ├── HistogramPanel.tsx     # Raw histogram display
│   │   │   ├── HistogramPanel.test.tsx
│   │   │   ├── MetadataPanel.tsx      # EXIF/metadata display
│   │   │   ├── ChannelSelector.tsx    # R/G1/G2/B channel toggle
│   │   │   └── QuickStatsBar.tsx      # Always-visible bottom bar
│   │   └── toolbar/
│   │       ├── Toolbar.tsx            # Top toolbar (mode, panels, zoom)
│   │       └── KeyboardShortcuts.tsx  # Shortcut handler
│   ├── stores/
│   │   ├── viewerStore.ts            # Session, zoom, pan, mode, channel, stretch
│   │   ├── panelStore.ts             # Panel visibility flags
│   │   └── inspectorStore.ts         # Hovered/pinned photosite data
│   ├── hooks/
│   │   ├── usePhotositeInfo.ts       # Debounced inspector query
│   │   ├── useHistogram.ts           # Histogram data fetch
│   │   ├── useFileMetadata.ts        # Metadata query
│   │   └── useViewportUrl.ts         # Protocol URL builder
│   ├── lib/
│   │   ├── protocolUrl.ts            # Typed viewport URL construction
│   │   ├── coordinateMapper.ts       # Mouse position → photosite coords
│   │   └── constants.ts              # Shared constants
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   └── styles/
│       └── globals.css               # Tailwind base + dark theme
├── src-tauri/                        # Backend (Rust/Tauri)
│   ├── Cargo.toml                    # Workspace root
│   ├── tauri.conf.json               # Tauri config (window, permissions)
│   ├── crates/
│   │   └── rawview-libraw-sys/       # Isolated -sys crate for LibRaw FFI
│   │       ├── Cargo.toml
│   │       ├── build.rs              # Compiles LibRaw from vendored source via cc crate
│   │       ├── src/
│   │       │   └── lib.rs            # unsafe FFI bindings to LibRaw C API
│   │       └── vendor/
│   │           └── libraw/           # LibRaw 0.21.x source (vendored, committed)
│   ├── src/
│   │   ├── main.rs                   # Tauri app entry, plugin registration
│   │   ├── lib.rs                    # Module declarations
│   │   ├── error.rs                  # RawViewError enum + conversions
│   │   ├── session.rs                # Session manager (owns BayerDataStore + lifecycle)
│   │   ├── decoder/
│   │   │   ├── mod.rs                # Decoder trait + dispatch
│   │   │   └── libraw_decoder.rs     # LibRaw FFI primary decoder (uses rawview-libraw-sys)
│   │   ├── data/
│   │   │   ├── mod.rs
│   │   │   ├── bayer_store.rs        # BayerDataStore (owns 16-bit array)
│   │   │   ├── cfa.rs                # CFA pattern types and detection
│   │   │   └── metadata.rs           # EXIF and sensor metadata types
│   │   ├── render/
│   │   │   ├── mod.rs
│   │   │   ├── viewport.rs           # ViewportRenderer (mode → RGBA pixels)
│   │   │   ├── modes.rs              # Bayer mosaic, grayscale, channel isolation
│   │   │   ├── scaling.rs            # 16→8 bit mapping, display stretch
│   │   │   └── encoder.rs            # PNG encoding (RGBA → PNG bytes)
│   │   ├── query/
│   │   │   ├── mod.rs
│   │   │   ├── photosite.rs          # Point query (row, col → info)
│   │   │   ├── histogram.rs          # Histogram bin computation
│   │   │   └── stats.rs              # ROI statistics (Tier 2)
│   │   ├── protocol/
│   │   │   └── viewport_protocol.rs  # Custom URI protocol handler
│   │   └── commands/
│   │       ├── mod.rs
│   │       ├── file_commands.rs      # open_file, close_file
│   │       ├── query_commands.rs     # get_photosite_info, get_histogram
│   │       └── metadata_commands.rs  # get_file_metadata
│   └── tests/
│       ├── decoder_tests.rs          # Format coverage (8+ manufacturers)
│       ├── accuracy_tests.rs         # Bit-exact validation vs JSON reference sidecars
│       └── render_tests.rs           # Viewport rendering correctness
├── test-data/                        # Sample raw files (git-lfs tracked)
│   ├── README.md                     # Source attribution (raw.pixls.us)
│   ├── canon_cr3_sample.cr3
│   ├── nikon_nef_sample.nef
│   ├── sony_arw_sample.arw
│   ├── fuji_raf_xtrans_sample.raf
│   └── reference/                    # Expected values JSON sidecars
│       ├── canon_cr3_sample.json
│       ├── nikon_nef_sample.json
│       └── ...
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── .gitattributes                    # git-lfs for test-data/*.{cr3,nef,arw,...}
└── README.md
```

### Architectural Boundaries

**Rust ↔ TypeScript Boundary (Tauri IPC):**
- All raw data stays in Rust. TypeScript never holds sensor values.
- Binary data flows via custom URI protocol (PNG bitmaps). Typed data flows via tauri-specta commands.
- TypeScript requests, Rust responds. No TypeScript → Rust push (except file open triggers).

**Session ↔ Components Boundary:**
- `session.rs` is the single coordination point. It owns the `BayerDataStore` and the session ID.
- Commands borrow from the session (read-only shared reference via `Arc<RwLock<>>`).
- Protocol handler borrows from the session for viewport rendering.
- Opening a new file replaces the session atomically.

**Decoder ↔ Data Store Boundary:**
- Decoder produces a `DecodedRaw` struct (Bayer array + metadata). Session takes ownership via BayerDataStore.
- Decoder is stateless — decode and hand off.

**Render ↔ Encode Boundary:**
- `viewport.rs` produces RGBA pixel buffer. `encoder.rs` compresses to PNG.
- Separated for swappability (WebP future option) and testability (render correctness independent of encoding).

**LibRaw FFI Boundary:**
- All unsafe FFI code isolated in `rawview-libraw-sys` crate (Cargo workspace member).
- LibRaw C source vendored in `crates/rawview-libraw-sys/vendor/libraw/` for reproducible cross-platform builds.
- `libraw_decoder.rs` provides safe Rust API on top of the `-sys` crate. No unsafe code outside the `-sys` crate.

### FR → Structure Mapping

| FR Group | Rust Module | TypeScript Component |
|----------|-------------|---------------------|
| File Management (FR1-FR8) | `decoder/`, `session.rs`, `commands/file_commands.rs` | `App.tsx` (drag-drop), `Toolbar.tsx` (File > Open) |
| Bayer Visualization (FR9-FR14) | `render/viewport.rs`, `render/modes.rs` | `ViewerCanvas.tsx`, `CfaOverlay.tsx`, `ViewportIndicator.tsx` |
| Visualization Modes (FR15-FR16) | `render/modes.rs` | `Toolbar.tsx`, `ChannelSelector.tsx` |
| Channel Separation (FR17-FR21) | `render/modes.rs` | `ChannelSelector.tsx` |
| Photosite Inspector (FR22-FR24) | `query/photosite.rs` | `PhotositeInspector.tsx`, `usePhotositeInfo.ts` |
| Histogram (FR25-FR28) | `query/histogram.rs` | `HistogramPanel.tsx`, `useHistogram.ts` |
| Metadata (FR29-FR32) | `data/metadata.rs`, `commands/metadata_commands.rs` | `QuickStatsBar.tsx`, `MetadataPanel.tsx` |
| UI (FR33-FR34) | — | `Toolbar.tsx`, `KeyboardShortcuts.tsx`, `panelStore.ts` |
| Tier 2 (FR35-FR40) | `query/stats.rs`, `render/` extensions | Future components |

### Data Flow

```
User drops .NEF file
    → Tauri file dialog / drag-drop event
    → file_commands::open_file(path)
        → libraw_decoder::decode(path) → DecodedRaw
        → Session::new(decoded_raw) → session_id
    → Frontend receives SessionInfo { session_id, dimensions, cfa, bit_depth, ... }
    → viewerStore.setSession(session_info)
    → useViewportUrl builds: rawview://viewport/{session_id}?mode=bayer&zoom=fit&...
    → ViewerCanvas useEffect detects URL change
        → new Image(), src = protocol URL
        → protocol::viewport_protocol handles request
            → ViewportRenderer::render(store, mode, zoom, rect) → RGBA pixels
            → encoder::to_png(pixels) → PNG bytes
        → Image.onload → canvas.drawImage(image, 0, 0)
    → User hovers pixel → coordinateMapper → (row, col)
    → usePhotositeInfo invokes get_photosite_info(row, col) → { channel, value, row, col }
    → PhotositeInspector displays tooltip
```

### CI/CD Pipeline

**CI (`.github/workflows/ci.yml`):**
- Runs on: `ubuntu-latest`, `macos-latest`, `windows-latest`
- Steps per platform: install Rust, install Node.js, install platform deps (WebKitGTK on Linux), compile `rawview-libraw-sys` (LibRaw from vendored source), run `cargo clippy`, run `cargo test` (decoder + accuracy + render tests), run `npm run check:all` (TypeScript, ESLint, Prettier, Vitest)
- LibRaw compilation uses `cc` crate in `build.rs` — handles MSVC (Windows), clang (macOS), GCC (Linux) automatically

**Release (`.github/workflows/release.yml`):**
- Triggered by `v*` tags
- Cross-platform builds: `.dmg` (macOS universal), `.msi` + portable `.exe` (Windows), `.AppImage` + `.deb` (Linux)
- Published to GitHub Releases

### GPU Acceleration Strategy

**Tier 1: Browser-native GPU only (no explicit GPU compute)**
- Canvas CSS transforms (`transform: translate() scale()`) provide GPU-accelerated pan/zoom smoothness during user gestures. The browser compositor handles this natively.
- Rust re-renders a new viewport asynchronously after the gesture settles (debounced). The CSS transform provides instant visual feedback; the re-render provides pixel-accurate data.
- Canvas 2D `drawImage()` of PNG bitmaps is GPU-composited by the browser. No optimization needed.
- Rust-side rendering uses CPU parallelism (rayon) — estimated 15-25ms for 1080p from 45MP, well within the 33ms budget.
- Explicit GPU compute (wgpu/Vulkan/Metal/DX12) is **not used** in Tier 1. The complexity cost (shader code, GPU memory management, cross-platform GPU API differences) is not justified when CPU rendering meets performance targets.

**Tier 2: Evaluate GPU compute for interactive overlays**
- Histogram brushing (FR35): highlighting thousands of photosites in real-time may benefit from GPU shader-based overlay rendering via WebGL in the Canvas.
- Full-sensor heatmap (FR40): downsampling 45MP to a display-sized heatmap could be faster on GPU.
- If Tier 2 interactive features exceed CPU performance budgets, introduce a WebGL overlay canvas layered on top of the bitmap Canvas for GPU-accelerated highlighting.

## Architecture Validation Results

### Coherence Validation ✅

All technology choices are compatible and proven by the selected starter template. The Cargo workspace cleanly isolates unsafe FFI. The session manager provides clear ownership. Naming conventions are enforced by tooling (clippy + ESLint). Error handling is consistent from Rust through TypeScript.

### Requirements Coverage ✅

- **40/40 FRs** have an architectural home (Tier 1 FR1-FR34 fully specified, Tier 2 FR35-FR40 interfaces designed)
- **24/24 NFRs** are addressed (performance via rayon + PNG protocol, accuracy via Rust-only data path, reliability via catch_unwind + typed errors, portability via Tauri cross-platform builds)
- **5/5 user journeys** are architecturally supported

### Implementation Readiness ✅

- Every FR maps to specific Rust modules and TypeScript components
- Implementation sequence ordered by dependency chain (11 steps)
- CI/CD covers all three platforms with LibRaw compilation
- Accuracy test pattern with concrete code example provided
- No ambiguity in session ownership, render loop, or data flow

### Architecture Completeness Checklist

- [x] Project context analyzed with architectural implications
- [x] Technical constraints identified (LibRaw FFI, Tauri IPC, WebView divergence)
- [x] Cross-cutting concerns mapped (accuracy, cross-platform, performance)
- [x] Critical decisions documented with rationale and party-mode validation
- [x] Technology stack specified (Tauri v2, React 19, Rust, LibRaw, rayon, shadcn/ui)
- [x] Starter template selected and customizations documented
- [x] Integration patterns defined (custom URI protocol, tauri-specta, Canvas render loop)
- [x] Performance strategy validated (Rust-side rendering, PNG encoding, CSS transform pan)
- [x] GPU acceleration strategy documented (browser-native Tier 1, evaluate wgpu Tier 2)
- [x] Naming conventions established for both languages
- [x] Project structure with complete directory tree (Cargo workspace, -sys crate, vendored LibRaw)
- [x] Communication patterns specified (state management, render loop, IPC protocol)
- [x] Process patterns documented (errors, session lifecycle, accuracy testing)
- [x] Component boundaries established (session, decoder, render, encode, query, protocol)
- [x] FR → structure mapping complete
- [x] Data flow diagram from file drop to pixel display
- [x] CI/CD pipeline specified for all three platforms
- [x] Anti-patterns documented

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level: HIGH**
