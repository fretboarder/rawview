---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: [prd.md, architecture.md]
---

# RawView - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for RawView, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can open raw image files via drag-and-drop onto the application window
FR2: Users can open raw image files via a File > Open dialog with file type filtering
FR3: The application can decode raw files from all camera manufacturers supported by LibRaw, including Canon (CR2/CR3), Nikon (NEF), Sony (ARW), Fuji (RAF), Panasonic (RW2), Olympus/OM System (ORF), Pentax (PEF), Leica (DNG/RWL), and Adobe DNG
FR4: Users can open multiple application instances simultaneously for side-by-side file comparison
FR5: The application auto-detects the CFA pattern (RGGB, BGGR, GRBG, GBRG for Bayer; 6×6 for Fuji X-Trans) without user configuration
FR6: Users receive a categorized error message when opening an unsupported, corrupt, or unreadable file
FR7: The application displays the currently open file's name in the window title bar
FR8: The application decodes raw file data without modifying, transforming, or reinterpreting sensor values during the decode pipeline
FR9: Users can view the raw sensor data as a Bayer mosaic with photosites color-coded by CFA channel assignment
FR10: Users can see a visual CFA pattern overlay diagram (2×2 for Bayer, 6×6 for X-Trans) on the Bayer view
FR11: Users can zoom from full-sensor overview down to individual photosite level
FR12: Users can pan across the sensor area at any zoom level
FR13: The Bayer visualization displays exact sensor values with no rounding, gamma, tone mapping, or transformation
FR14: Users can see their current viewport position within the full sensor area when zoomed in
FR15: Users can switch between visualization modes (Bayer mosaic, grayscale, individual channels) via toolbar or keyboard shortcuts
FR16: Users can view the raw sensor data as a grayscale image where each photosite's brightness corresponds to its raw value
FR17: Users can view the R channel in isolation
FR18: Users can view the G1 channel in isolation (first green position)
FR19: Users can view the G2 channel in isolation (second green position)
FR20: Users can view the B channel in isolation
FR21: Users can switch between full Bayer view and individual channel views without re-loading the file
FR22: Users can hover over any photosite to see its channel identity (R, G1, G2, or B), raw sensor value, and row/column position
FR23: Users can click on a photosite to pin the inspector display
FR24: The inspector displays raw sensor values as integers matching the source file's bit depth (no normalization)
FR25: Users can view a histogram of raw sensor values for the entire image
FR26: Users can view per-channel histograms (R, G1, G2, B) individually or overlaid
FR27: Users can view a combined histogram of all channels
FR28: The histogram displays the full value range from black level to white level
FR29: Users can view an always-visible quick stats bar showing: file name, sensor dimensions, CFA pattern, bit depth, black level, white level, and ISO
FR30: Users can view a full metadata panel showing all available EXIF data
FR31: Metadata is displayed for informational purposes only and never applied to the visualization
FR32: Users can toggle the full metadata panel on/off
FR33: Users can toggle visibility of each panel independently via toolbar or keyboard shortcuts
FR34: The application provides keyboard shortcuts for all primary actions
FR35: Users can select a value range on the histogram and see corresponding photosites highlighted on the Bayer view (Tier 2)
FR36: Users can toggle a saturation clipping overlay highlighting photosites at the sensor's maximum value (Tier 2)
FR37: Users can draw a rectangular region of interest (ROI) on the Bayer view (Tier 2)
FR38: Users can view per-channel statistics for a selected ROI (Tier 2)
FR39: Users can view a split-screen comparison with a draggable slider: raw Bayer vs demosaiced (Tier 2)
FR40: Users can view a full-sensor heatmap representing the entire sensor as aggregated value intensities (Tier 2)

### NonFunctional Requirements

NFR1-NFR24 as defined in the PRD (performance, accuracy, reliability, accessibility, visual, portability, testing).

### Additional Requirements

- Architecture specifies dannysmith/tauri-template as starter template
- Custom rawview-libraw-sys Cargo workspace crate with vendored LibRaw source
- Custom URI protocol for binary viewport transfer
- Rust-side viewport rendering with rayon parallelism
- PNG encoding of viewport bitmaps
- tauri-specta for type-safe IPC
- Session manager owns BayerDataStore and file lifecycle
- Display stretch toggle
- Canvas 2D render loop
- catch_unwind on all handlers
- CI/CD on all three platforms
- Accuracy test infrastructure with JSON reference sidecars
- Test data from raw.pixls.us via git-lfs

### UX Design Requirements

No UX Design specification document exists. UX decisions are embedded in the PRD and Architecture.

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 | Epic 2 | 2.3 |
| FR2 | Epic 2 | 2.3 |
| FR3 | Epic 2 | 2.1 |
| FR4 | Epic 2 | 2.3 |
| FR5 | Epic 2 | 2.1 |
| FR6 | Epic 2 | 2.6 |
| FR7 | Epic 2 | 2.3 |
| FR8 | Epic 2 | 2.1 |
| FR9 | Epic 2 | 2.2 |
| FR10 | Epic 2 | 2.5 |
| FR11 | Epic 2 | 2.3 |
| FR12 | Epic 2 | 2.3 |
| FR13 | Epic 2 | 2.2 |
| FR14 | Epic 2 | 2.4 |
| FR15 | Epic 3 | 3.3 |
| FR16 | Epic 3 | 3.1 |
| FR17 | Epic 3 | 3.2 |
| FR18 | Epic 3 | 3.2 |
| FR19 | Epic 3 | 3.2 |
| FR20 | Epic 3 | 3.2 |
| FR21 | Epic 3 | 3.2 |
| FR22 | Epic 2 | 2.4 |
| FR23 | Epic 2 | 2.4 |
| FR24 | Epic 2 | 2.4 |
| FR25 | Epic 4 | 4.1 |
| FR26 | Epic 4 | 4.2 |
| FR27 | Epic 4 | 4.2 |
| FR28 | Epic 4 | 4.1 |
| FR29 | Epic 2 | 2.5 |
| FR30 | Epic 5 | 5.1, 5.2 |
| FR31 | Epic 5 | 5.1, 5.2 |
| FR32 | Epic 5 | 5.2 |
| FR33 | Epic 5 | 5.2, 5.3 |
| FR34 | Epic 5 | 5.3 |
| FR35 | Epic 7 | 7.2 |
| FR36 | Epic 7 | 7.1 |
| FR37 | Epic 7 | 7.3 |
| FR38 | Epic 7 | 7.4 |
| FR39 | Epic 7 | 7.5 |
| FR40 | Epic 7 | 7.6 |

**Coverage: 40/40 FRs mapped to specific stories.**

## Epic List

### Epic 1: Project Scaffold & Build Pipeline
Set up the project foundation: scaffold from starter template, create rawview-libraw-sys Cargo workspace crate with vendored LibRaw, register custom URI protocol, establish CI/CD on all three platforms.
**FRs covered:** None (infrastructure)

### Epic 2: The Revelation Moment (Open, View, Inspect)
Users can open a camera raw file, see the pre-demosaiced Bayer mosaic with color-coded photosites, zoom to individual photosite level, pan across the sensor, inspect any photosite's channel and value, and view sensor metadata in a quick stats bar.
**FRs covered:** FR1-FR14, FR22-FR24, FR29

### Epic 3: Visualization Modes & Channel Separation
Users can switch between Bayer mosaic, grayscale, and individual R/G1/G2/B channel views without reloading the file.
**FRs covered:** FR15-FR21

### Epic 4: Raw Histogram
Users can view histograms of actual raw sensor values per-channel and combined, from black level to white level.
**FRs covered:** FR25-FR28

### Epic 5: Metadata, Panels & Keyboard Polish
Users can view full EXIF metadata, toggle all panels independently, and control the entire application via keyboard shortcuts.
**FRs covered:** FR30-FR34

### Epic 6: Cross-Platform Release
Users can download and install RawView on Windows, macOS, or Linux from GitHub Releases.
**FRs covered:** None (NFR-driven)

### Epic 7: Interactive Analysis — Tier 2
Users can brush histogram ranges, overlay saturation clipping, select ROIs for statistics, compare raw vs demosaiced, and view heatmaps.
**FRs covered:** FR35-FR40

## Epic 1: Project Scaffold & Build Pipeline

Set up the project foundation: scaffold from starter template, create rawview-libraw-sys Cargo workspace crate with vendored LibRaw, register custom URI protocol, establish CI/CD on all three platforms.

### Story 1.1: Scaffold Project from Starter Template

As a developer,
I want the project scaffolded from the dannysmith/tauri-template starter with unnecessary features stripped and core architecture preserved,
So that the team starts from a clean, validated foundation with type-safe IPC, theming, and testing already wired up.

**Acceptance Criteria:**

**Given** the dannysmith/tauri-template repository is cloned and renamed to `rawview`
**When** the scaffolding cleanup is complete
**Then** the project root contains a valid Cargo workspace `Cargo.toml` with a `src-tauri` member
**And** the React frontend bootstraps without errors via `pnpm dev`
**And** the Tauri app launches without errors via `cargo tauri dev`
**And** the following features are removed: i18n module, command palette component, sidebar scaffolding, single-instance Tauri plugin, and all associated imports/config entries
**And** the following features are retained and functional: tauri-specta type-safe IPC bindings, dark theme with shadcn/ui, cross-platform custom title bar, Zustand store, Vitest test runner, and Tailwind v4 styling
**And** `pnpm test` executes the Vitest suite and all included baseline tests pass
**And** `cargo test` in `src-tauri/` passes with no compilation errors
**And** no TypeScript compilation errors are reported by `pnpm tsc --noEmit`
**And** the app window title reads "RawView" and the default window dimensions are 1280×800
**And** the application reaches an interactive state (window rendered, ready for file open) within 2 seconds of launch on a mid-range machine (NFR5)

### Story 1.2: Create rawview-libraw-sys Cargo Workspace Crate with Vendored LibRaw

As a developer,
I want a `rawview-libraw-sys` crate inside the Cargo workspace that vendors LibRaw 0.21.x source and compiles it via a `build.rs` script,
So that LibRaw is available as a statically linked dependency with zero runtime install requirements.

**Acceptance Criteria:**

**Given** the scaffolded workspace from Story 1.1 exists
**When** the `rawview-libraw-sys` crate is created at `src-tauri/crates/rawview-libraw-sys/`
**Then** the workspace `Cargo.toml` lists `crates/rawview-libraw-sys` as a member
**And** LibRaw 0.21.x source is vendored under `src-tauri/crates/rawview-libraw-sys/vendor/libraw/` and committed to the repository
**And** `build.rs` uses the `cc` crate to compile the vendored LibRaw C/C++ sources into a static library
**And** the crate exposes at minimum a raw `libraw_init` FFI binding declared in `src/lib.rs` with an unsafe extern block
**And** `cargo build -p rawview-libraw-sys` succeeds on macOS, Ubuntu, and Windows without any system-installed LibRaw
**And** `cargo test -p rawview-libraw-sys` passes a smoke test that calls `libraw_init(0)` and asserts the returned pointer is non-null

### Story 1.3: Register Custom rawview:// URI Protocol in Tauri

As a developer,
I want the `rawview://viewport/` custom URI protocol registered in the Tauri backend and verified to transfer binary data to the frontend WebView,
So that viewport bitmaps can be served from Rust without JSON serialization overhead.

**Acceptance Criteria:**

**Given** the scaffolded Tauri app from Story 1.1 exists
**When** the custom protocol handler is implemented and the app is launched
**Then** the Rust handler for `rawview://viewport/{id}` is registered via the Tauri v2 protocol API
**And** the handler returns a valid response with `Content-Type: image/png` and a binary body
**And** a test issues a `fetch("rawview://viewport/test")` from the WebView and asserts the response status is 200
**And** the binary response body received in the WebView matches the exact byte sequence sent from the Rust handler
**And** requests to unknown IDs return a 404 response rather than panicking
**And** the protocol is registered on all three platforms without platform-specific compilation errors

### Story 1.4: Establish CI/CD Pipeline for All Three Platforms

As a developer,
I want a GitHub Actions CI workflow that builds and tests the full Tauri application on Windows, macOS, and Ubuntu,
So that every pull request is validated across all target platforms.

**Acceptance Criteria:**

**Given** the repository has the scaffolded project, vendored LibRaw crate, and custom protocol
**When** a pull request is opened or a push is made to `main`
**Then** the GitHub Actions workflow triggers jobs for `ubuntu-latest`, `macos-latest`, and `windows-latest` in parallel
**And** each job installs Rust stable, Node.js LTS, and `pnpm`
**And** each job runs `pnpm install --frozen-lockfile`, `pnpm tsc --noEmit`, and `pnpm test`
**And** each job runs `cargo test --workspace` including the `rawview-libraw-sys` smoke test
**And** each job runs `cargo tauri build` and produces a platform-native artifact
**And** build artifacts are uploaded and retained for 7 days
**And** the workflow uses caching for Cargo registry and node_modules

## Epic 2: The Revelation Moment (Open, View, Inspect)

Users can open a camera raw file, see the pre-demosaiced Bayer mosaic with color-coded photosites, zoom to individual photosite level, pan across the sensor, inspect any photosite's channel and value, and view sensor metadata in a quick stats bar.

### Story 2.1: Raw File Decoder and Bayer Data Store

As a developer building the RawView pipeline,
I want a Rust decoder that reads a camera raw file via LibRaw FFI and stores the decoded 16-bit Bayer array in a session-scoped BayerDataStore,
So that all downstream rendering and query components have a single, accurate, immutable source of truth for sensor data.

**Acceptance Criteria:**

**Given** a valid raw file path is passed to `open_file(path)` via Tauri command
**When** `libraw_decoder::decode(path)` is called using the `rawview-libraw-sys` crate
**Then** it produces a `DecodedRaw` struct containing: a 16-bit single-channel Bayer array, the CFA pattern enum, black level, white level, sensor dimensions, and EXIF metadata
**And** a new `Session` is created in `session.rs` that owns a `BayerDataStore`, returning a `SessionInfo` to the frontend (FR3, FR5, FR8)

**Given** a Fuji RAF file with an X-Trans 6×6 CFA pattern is opened
**When** the decoder runs CFA detection
**Then** the CFA pattern is identified as `XTrans6x6` without user configuration (FR5)

**Given** a raw file from any of the 8 supported manufacturers is opened
**When** decoding completes
**Then** the decoded photosite values are bit-exact with LibRaw's array — validated by a unit test that decodes a known test file and asserts specific photosite values at hardcoded coordinates (NFR8, FR8). Full test corpus with JSON reference sidecars is established in Story 6.1.

**Given** a new file is opened while a session already exists
**When** `open_file()` is called
**Then** the previous Session is atomically replaced and stale protocol URLs return `SessionExpired`

**Given** a raw file is opened, inspected, and then the session is closed
**When** the source file is checked after the session ends
**Then** the source file's modification time and content are unchanged — the application never writes to, modifies, or locks source files (NFR14)

### Story 2.2: Viewport Renderer and Custom URI Protocol Integration

As a developer building the display pipeline,
I want a Rust-side ViewportRenderer that renders viewport-sized RGBA bitmaps from the BayerDataStore and serves them as PNG via the custom URI protocol,
So that the frontend can display the Bayer mosaic without transferring raw sensor data across the IPC boundary.

**Acceptance Criteria:**

**Given** a Session with a loaded BayerDataStore exists
**When** a request arrives at `rawview://viewport/{session_id}?mode=bayer&zoom={z}&x={x}&y={y}&w={w}&h={h}&stretch={bool}`
**Then** `ViewportRenderer::render()` produces an RGBA pixel buffer for the requested viewport region
**And** `encoder::to_png()` encodes it to PNG bytes, returned with `Content-Type: image/png` (FR9, FR13)

**Given** `mode=bayer` is specified
**When** the renderer maps each photosite
**Then** R photosites render red, G1/G2 render green, B renders blue, with brightness proportional to raw value
**And** no gamma, tone mapping, or color space conversion is applied (NFR11)

**Given** `stretch=false` (default)
**When** the 16-bit value is mapped to 8-bit brightness
**Then** the mapping spans linearly from black_level to white_level
**And** when `stretch=true`, the mapping uses actual min/max values

**Given** a rayon thread panic occurs during rendering
**When** the panic propagates
**Then** `catch_unwind` catches it and returns a `RenderError` — the process does not crash (NFR13)

### Story 2.3: Canvas Display, Zoom, Pan, and File Open UI

As a user opening a raw file for the first time,
I want to drag-and-drop or use File > Open to open a raw file and see the Bayer mosaic on a Canvas that I can zoom and pan,
So that I experience the revelation moment of seeing my sensor's raw data.

**Acceptance Criteria:**

**Given** the application window is open with no file loaded
**When** a user drags a raw file onto the window
**Then** the backend decodes the file and the ViewerCanvas displays the Bayer mosaic within 3 seconds (FR1, NFR1)

**Given** a File > Open menu item is available
**When** a user selects a raw file through the OS file picker
**Then** the same decode-and-display pipeline fires (FR2)
**And** the file picker filters for known raw extensions

**Given** a file is open and displayed
**When** the user scrolls to zoom in
**Then** the Canvas applies CSS `transform: scale()` immediately for smooth feedback, and a debounced protocol URL request triggers a fresh render (FR11, NFR3)

**Given** the user is zoomed in
**When** the user drags to pan
**Then** CSS transform updates immediately for 30fps smoothness, and a new viewport render is requested after the gesture ends (FR12, NFR3)

**Given** a file is successfully opened
**When** decode and render complete
**Then** the file name is displayed in the window title bar as `{filename} — RawView` (FR7)

**And** multiple application instances can be opened simultaneously — given two instances are running with different files open, closing one does not crash or affect the other (FR4)

### Story 2.4: Photosite Inspector and Viewport Position Indicator

As a technical photographer or imaging engineer,
I want to hover over any photosite to see its channel identity, exact raw sensor value, and position in a tooltip, and click to pin that information,
So that I can read precise sensor values and diagnose artifacts at specific pixel locations.

**Acceptance Criteria:**

**Given** a file is open and the Bayer mosaic is displayed
**When** the user moves the mouse over the Canvas
**Then** `coordinateMapper` converts mouse position to (row, col) sensor coordinates
**And** `usePhotositeInfo` invokes `getPhotositeInfo(row, col)` debounced to 60fps (FR22)

**Given** `getPhotositeInfo` returns `{ channel, value, row, col }`
**When** the PhotositeInspector renders
**Then** it displays channel name (R/G1/G2/B), raw integer value, and position — the value is always the unmodified u16 (FR22, FR24, NFR8)
**And** all numerical values use monospace typeface at minimum 12px (NFR19, NFR18)

**Given** a user clicks on a photosite
**When** the click event fires
**Then** the inspector data is pinned and remains visible while the user hovers elsewhere (FR23)

**Given** the user is zoomed in
**When** the viewport position changes
**Then** a ViewportIndicator renders showing current viewport rectangle relative to the full sensor (FR14)

### Story 2.5: Quick Stats Bar and CFA Pattern Overlay

As a user who has just opened a raw file,
I want an always-visible quick stats bar and a visual CFA pattern diagram,
So that I always have sensor context visible and understand the repeating CFA structure.

**Acceptance Criteria:**

**Given** a file has been successfully opened
**When** the QuickStatsBar renders
**Then** it always displays: file name, sensor dimensions, CFA pattern, bit depth, black level, white level, and ISO (FR29)
**And** all numeric values use monospace typeface at minimum 12px with 4.5:1 contrast ratio (NFR19, NFR18, NFR17)

**Given** no file is open
**When** the QuickStatsBar renders
**Then** it shows placeholder dashes — the bar is always present in the layout

**Given** the Bayer mosaic view is active
**When** the CfaOverlay renders
**Then** it displays a small color-coded grid: 2×2 for RGGB/BGGR/GRBG/GBRG, or 6×6 for Fuji X-Trans (FR10)
**And** each cell is labeled with its channel letter and uses the same color coding as the mosaic

**Given** the display stretch toggle is activated
**When** the viewport re-renders
**Then** the 16-bit to 8-bit mapping switches between raw linear (BL→WL) and auto-stretch (actual min→max)
**And** the inspector always returns the unmodified raw u16 value regardless of stretch setting (NFR11)

### Story 2.6: Error Handling for Unsupported, Corrupt, and Inaccessible Files

As a user who attempts to open an unsupported, corrupt, or inaccessible file,
I want a clear, categorized error message without the application crashing,
So that I understand the problem and can take corrective action.

**Acceptance Criteria:**

**Given** a user opens a file with an unsupported extension (e.g. .jpg, .tiff)
**When** LibRaw cannot identify the format
**Then** `RawViewError::UnsupportedFormat` is returned and a toast displays "Unsupported format: .jpg" within 3 seconds (FR6, NFR13)

**Given** a user opens a corrupt raw file
**When** LibRaw returns a decode error
**Then** `RawViewError::CorruptData` is returned and a toast displays "Corrupt or unreadable file data" (FR6)

**Given** a user opens a file without read permission
**When** file access is denied
**Then** `RawViewError::FileAccessDenied` is returned and a toast displays "File access denied: {path}" (FR6)

**Given** any handler encounters a rayon panic
**When** the panic occurs
**Then** `catch_unwind` catches it and returns a graceful error — the process stays alive (NFR13)

**Given** a stale protocol URL references a closed session
**When** the browser attempts to load it
**Then** the protocol handler returns HTTP 500 with `SessionExpired` and the Canvas retains the last valid frame

## Epic 3: Visualization Modes & Channel Separation

Users can switch between Bayer mosaic, grayscale, and individual R/G1/G2/B channel views without re-loading the file.

### Story 3.1: Grayscale Visualization Mode

As a technical photographer or imaging engineer,
I want to switch to a grayscale view of raw sensor values,
So that I can inspect raw brightness data without CFA color-coding influencing my perception.

**Acceptance Criteria:**

**Given** a raw file is open and the Bayer mosaic view is active
**When** the user clicks the "Grayscale" mode button in the toolbar or presses the assigned keyboard shortcut
**Then** the viewport re-renders using grayscale mode, mapping each photosite's raw u16 value to 8-bit brightness with no CFA color assignment (FR16)
**And** the mode switch completes in under 500ms for a 45MP file (NFR2)
**And** the toolbar visually indicates the active mode
**And** the display stretch toggle continues to function in grayscale mode
**And** the photosite inspector continues to return the original u16 raw value (NFR11)

### Story 3.2: Individual Channel Isolation Views (R / G1 / G2 / B)

As a technical photographer or imaging engineer,
I want to view each raw color channel in isolation,
So that I can diagnose per-channel sensor artifacts in a single sub-array.

**Acceptance Criteria:**

**Given** a raw file is open in any visualization mode
**When** the user selects R, G1, G2, or B from the ChannelSelector panel or keyboard shortcut
**Then** the viewport renders only photosites belonging to that channel — others are rendered as black (FR17, FR18, FR19, FR20)
**And** switching between channels completes in under 500ms without reloading the file (FR21, NFR2)
**And** keyboard shortcuts cycle through modes: Bayer → Grayscale → R → G1 → G2 → B → Bayer
**And** the ChannelSelector highlights the active channel

### Story 3.3: Mode Switching Toolbar Integration and Keyboard Shortcuts

As any RawView user,
I want all visualization modes reachable from the toolbar and fully keyboard-operable,
So that I can explore sensor data rapidly without lifting my hands from the keyboard.

**Acceptance Criteria:**

**Given** the application has a file open
**When** the user inspects the toolbar
**Then** the toolbar contains a segmented mode control with buttons for "Bayer", "Grayscale", and a "Channels" toggle (FR15)
**And** the following keyboard shortcuts are registered: `B` → Bayer, `G` → Grayscale, `1` → R, `2` → G1, `3` → G2, `4` → B, `C` → toggle ChannelSelector panel (FR34)
**And** pressing a shortcut with no file open has no effect and does not throw an error
**And** `npm run check:all` passes with no errors

## Epic 4: Raw Histogram

Users can view histograms of actual raw sensor values per-channel and combined, from black level to white level.

### Story 4.1: Rust-Side Histogram Computation

As the application,
I want per-channel and combined histogram bin counts computed in Rust from the raw u16 Bayer array using rayon parallelism,
So that histogram data is bit-exact, fast, and never derived from display-transformed values.

**Acceptance Criteria:**

**Given** a raw file has been decoded and a Session is active
**When** `get_histogram` is invoked with an optional CfaChannel parameter
**Then** `query/histogram.rs` computes 256 bins by linearly mapping [black_level, white_level] to bin indices 0–255 via rayon parallel iteration (FR25, FR26, FR27, FR28)
**And** photosites below black_level are counted in bin 0; above white_level in bin 255
**And** the command returns `{ bins, bin_count, min_value, max_value, black_level, white_level }` as a tauri-specta typed response
**And** computation for 45MP completes within 1 second (NFR4)
**And** all public functions return `Result<T, RawViewError>`

### Story 4.2: HistogramPanel React Component

As a photographer or imaging engineer,
I want to see a visual histogram panel showing raw sensor value distributions per channel and combined,
So that I can identify exposure distribution, clipping, and per-channel tonal differences at a glance.

**Acceptance Criteria:**

**Given** a raw file is open and the HistogramPanel is visible
**When** the panel renders
**Then** `useHistogram` invokes `getHistogram()` and renders four overlaid channel histograms (R red, G1 green, G2 lighter green, B blue) plus a combined toggle (FR26, FR27)
**And** the X axis spans from black_level to white_level with labels (FR28)
**And** channel toggle buttons (R/G1/G2/B/All) above the histogram allow independent visibility
**And** all bin values correspond exactly to the Rust computation with no rounding in TypeScript (NFR9)
**And** the histogram re-fetches within 500ms on channel toggle (NFR4)

### Story 4.3: Histogram Panel Toggle and Toolbar Integration

As any RawView user,
I want to toggle the histogram panel on and off via toolbar and keyboard,
So that I can reclaim viewport space when I don't need the histogram.

**Acceptance Criteria:**

**Given** a file is open
**When** the user clicks the Histogram toggle or presses `H`
**Then** `panelStore.histogramVisible` is toggled and the HistogramPanel mounts/unmounts (FR33)
**And** when reshown, data is restored from cache without a new IPC call
**And** the toolbar button reflects current visibility state
**And** the `H` shortcut does not conflict with existing shortcuts

## Epic 5: Metadata, Panels & Keyboard Polish

Full EXIF panel, independent panel toggles, and keyboard shortcuts for all primary actions.

### Story 5.1: Rust Metadata Extraction and IPC Command

As the application,
I want all available EXIF and sensor metadata extracted in Rust and served via a typed IPC command,
So that the frontend can display full metadata without accuracy concerns crossing the boundary.

**Acceptance Criteria:**

**Given** a raw file has been decoded and a Session is active
**When** `get_file_metadata()` is invoked
**Then** `data/metadata.rs` returns an ExifData struct containing: camera make/model, lens, date/time, ISO, shutter speed, aperture, white balance, focal length (FR30)
**And** the SessionInfo returned by `open_file()` already includes quick stats fields so QuickStatsBar needs no separate IPC call (FR29)
**And** metadata values are returned as source types; absent fields are null (FR31)
**And** unit tests assert non-null camera make/model for test corpus files

### Story 5.2: MetadataPanel Component and Independent Panel Toggles

As a photographer, engineer, or educator,
I want a full metadata panel and independent toggle for each panel,
So that I can inspect EXIF data alongside the visualization without cluttering the screen.

**Acceptance Criteria:**

**Given** a raw file is open
**When** the user clicks the Metadata toggle or presses `I`
**Then** `panelStore.metadataVisible` is toggled and the MetadataPanel displays all ExifData fields grouped into sections (FR30, FR32)
**And** fields with null values are omitted
**And** metadata, histogram, and channel selector panels each have independent visibility flags (FR33)
**And** all numerical values use monospace typeface (NFR19) at minimum 12px (NFR18)
**And** metadata is displayed for reference only — never applied to visualization (FR31)

### Story 5.3: Complete Keyboard Shortcut Coverage

As any RawView user,
I want every primary action reachable via keyboard,
So that power users can operate entirely without a mouse.

**Acceptance Criteria:**

**Given** the application is running
**When** the user presses `Cmd/Ctrl+O`
**Then** the File > Open dialog is triggered (FR34)

**Given** a file is open
**When** the user presses `+`/`-`
**Then** zoom level increments/decrements (FR34)

**Given** a file is open
**When** the user presses `0`
**Then** zoom resets to fit-to-window (FR34)

**And** all keyboard shortcuts are registered in a centralized handler
**And** the full shortcut map is accessible via `?` key
**And** modifier-free shortcuts are active only when no text input is focused (NFR16)
**And** `npm run check:all` passes after complete Epic 5 implementation

## Epic 6: Cross-Platform Release

Users can download and install RawView from GitHub Releases on macOS, Windows, and Linux.

### Story 6.1: Test Corpus, JSON Reference Sidecars, and Accuracy CI

As the project maintainer,
I want a curated test corpus with JSON reference sidecars and CI accuracy validation on all platforms,
So that data accuracy and crash-rate targets are continuously enforced.

**Acceptance Criteria:**

**Given** `test-data/` is tracked via git-lfs
**When** the corpus is assembled
**Then** it contains at least one raw file per manufacturer for 8+ manufacturers from raw.pixls.us (NFR24)
**And** each file has a JSON sidecar with 10 known (row, col) points with expected channel and u16 value, plus expected histogram bins and stats bar values
**And** `tests/accuracy_tests.rs` asserts bit-exact match for every reference point (NFR8)
**And** `tests/decoder_tests.rs` asserts `open_file()` returns Ok for all corpus files (NFR12)
**And** `cargo test` passes on all three CI platforms, asserting cross-platform parity (NFR10)

### Story 6.2: GitHub Actions Release Workflow and Platform Packaging

As a user on any platform,
I want to download a native installer from GitHub Releases,
So that I can install RawView without build tools or admin privileges.

**Acceptance Criteria:**

**Given** a `v*` tag is pushed
**When** the release workflow runs
**Then** it builds: `.dmg` (macOS universal), `.msi` + portable `.exe` (Windows), `.AppImage` + `.deb` (Linux)
**And** all artifacts are uploaded to a GitHub Release draft
**And** each artifact is ≤20MB (NFR21)
**And** LibRaw is compiled from vendored source on each platform
**And** accuracy tests pass as a pre-release gate

### Story 6.3: README, "Things We Won't Do" Doc, and Launch Readiness

As a first-time visitor to the RawView repository,
I want a clear README and scope document,
So that I immediately understand the tool's purpose and what it intentionally excludes.

**Acceptance Criteria:**

**Given** the repository is public
**When** a visitor opens README.md
**Then** it contains: product summary, screenshot/GIF, download links per platform, quick start guide, supported formats list, accuracy & open source section, and contributing guide
**And** a WONT_DO.md lists all Out of Scope items from the PRD with rationale
**And** RENDERING_NOTES.md documents known platform visual differences
**And** the repo has topics (`raw`, `photography`, `bayer`, `sensor`, `tauri`, `rust`) and a license file
**And** a keyboard shortcut reference table is included

## Epic 7: Interactive Analysis — Tier 2

Users can brush histogram ranges to highlight photosites spatially, overlay saturation clipping, select ROIs for per-channel statistics, compare raw vs demosaiced side-by-side, and view full-sensor heatmaps.

### Story 7.1: Saturation Clipping Overlay

As a sensor engineer,
I want to toggle a saturation clipping overlay that highlights photosites at the sensor's maximum value,
So that I can instantly identify hot pixels and fully saturated regions.

**Acceptance Criteria:**

**Given** a raw file is open
**When** the user toggles the clipping overlay via toolbar or shortcut
**Then** all photosites where value equals white_level are highlighted with a red overlay on the Canvas (FR36)
**And** the overlay persists across zoom and pan without re-querying Rust
**And** toggling off removes all highlights
**And** `get_clipped_photosites()` returns `Vec<(u32, u32)>` computed once per session
**And** the clipped count is displayed in the quick stats bar

### Story 7.2: Histogram Range Brushing with Spatial Highlight

As a technical photographer,
I want to brush a value range on the histogram and see corresponding photosites highlighted on the Bayer view,
So that I can understand the spatial distribution of any tonal region.

**Acceptance Criteria:**

**Given** a raw file is open and the histogram panel is visible
**When** the user click-drags across histogram bins
**Then** a brush selection is drawn on the histogram showing the selected range
**And** `get_photosites_in_range(min, max)` returns matching coordinates (FR35)
**And** highlighted photosites render as a semi-transparent yellow overlay on the Canvas
**And** the highlight updates within 500ms for a 45MP file
**And** the count of highlighted photosites is displayed in the histogram panel
**And** pressing Escape clears the brush selection

### Story 7.3: ROI Drawing on the Bayer View

As an imaging engineer,
I want to draw a rectangular region of interest directly on the Bayer view,
So that I can select a specific sensor area for statistical analysis.

**Acceptance Criteria:**

**Given** ROI mode is active (toggled via toolbar or `R` shortcut)
**When** the user click-drags on the Canvas
**Then** a dashed rectangle is drawn in real-time, snapping to photosite boundaries (FR37)
**And** on release, the ROI sensor coordinates are stored in `viewerStore.activeRoi`
**And** the ROI scales correctly with zoom and pan
**And** only one ROI can be active at a time
**And** pressing Escape clears the ROI

### Story 7.4: Per-Channel ROI Statistics Panel

As an imaging engineer,
I want to view per-channel statistics for a selected ROI,
So that I can evaluate sensor uniformity and noise without custom scripts.

**Acceptance Criteria:**

**Given** an ROI has been drawn
**When** the stats panel renders
**Then** `get_roi_stats(x, y, w, h)` returns per-channel: mean, std_dev, min, max, hot_pixel_count (FR38)
**And** hot pixels are defined as value > white_level × 0.99, computed in Rust
**And** mean/std_dev displayed to two decimal places in monospace (NFR19)
**And** min/max displayed as raw u16 integers
**And** the panel updates within 500ms when the ROI changes
**And** an empty prompt shows when no ROI is active

### Story 7.5: Split-Screen Raw vs Demosaiced Comparison

As a technical photographer,
I want to compare raw Bayer and demosaiced rendering side-by-side with a draggable divider,
So that I can see which artifacts are present in raw data versus introduced by demosaicing.

**Acceptance Criteria:**

**Given** a raw file is open
**When** split-screen mode is activated via toolbar or shortcut
**Then** the Canvas is divided by a vertical draggable slider at 50% (FR39)
**And** left side shows raw Bayer, right side shows bilinear-interpolated demosaic via LibRaw `dcraw_process()`
**And** both sides share the same zoom, pan, and viewport
**And** dragging the divider only changes clip regions — no new Rust renders on drag
**And** new renders are requested only on zoom/pan changes
**And** memory stays within 750MB for 45MP in split-screen (NFR6)

### Story 7.6: Full-Sensor Heatmap View

As an astrophotographer,
I want a full-sensor heatmap showing aggregated value intensities,
So that I can quickly identify large-scale patterns like lens shading and hot pixel clusters.

**Acceptance Criteria:**

**Given** a raw file is open
**When** heatmap view is selected via toolbar or shortcut
**Then** the Canvas displays a full-sensor heatmap with aggregated photosite blocks scaled to fit the viewport (FR40)
**And** mean values map to a heat gradient (dark blue → cyan → yellow → red) from black_level to white_level
**And** all aggregation and color mapping happens in Rust
**And** the heatmap renders within 3 seconds for 45MP (NFR1)
**And** channel isolation applies to heatmap mode when a channel is selected
**And** a color scale legend is overlaid on the Canvas
**And** zooming in triggers finer aggregation blocks
