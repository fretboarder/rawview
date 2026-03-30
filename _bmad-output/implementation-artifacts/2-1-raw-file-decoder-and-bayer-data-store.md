# Story 2.1: Raw File Decoder and Bayer Data Store

Status: review

## Story

As a developer building the RawView pipeline,
I want a Rust decoder that reads a camera raw file via LibRaw FFI and stores the decoded 16-bit Bayer array in a session-scoped BayerDataStore,
so that all downstream rendering and query components have a single, accurate, immutable source of truth for sensor data.

## Acceptance Criteria

1. `open_file(path)` Tauri command decodes a raw file and returns `SessionInfo` to the frontend
2. `DecodedRaw` struct contains: 16-bit Bayer array, CFA pattern, black/white levels, dimensions, EXIF
3. Fuji X-Trans 6×6 CFA is detected as `XTrans` when `filters == 9` (FR5)
4. Standard Bayer patterns (RGGB/BGGR/GRBG/GBRG) auto-detected from `filters` (FR5)
5. Decoded photosite values are bit-exact with LibRaw's array (NFR8, FR8)
6. Opening a new file atomically replaces the previous session (stale requests → `SessionExpired`)
7. Source files are never modified, locked, or written to (NFR14)
8. Unsupported/corrupt/inaccessible files return typed `RawViewError` (FR6)
9. Unit test decodes a known raw file and asserts specific photosite values at hardcoded coordinates
10. `open_file` command is registered in tauri-specta bindings and callable from TypeScript

## Tasks / Subtasks

- [ ] Task 1: Extend rawview-libraw-sys FFI bindings for data access (AC: #5)
  - [ ] Add C helper file `src-tauri/crates/rawview-libraw-sys/helpers.c` with getter functions for fields not exposed by the C API: `rawview_get_raw_image_ptr()`, `rawview_get_raw_pitch()`, `rawview_get_sizes()`, `rawview_get_color_info()`, `rawview_get_imgother()`
  - [ ] Update `build.rs` to compile `helpers.c`
  - [ ] Declare FFI bindings for new helper functions + `libraw_COLOR()` + `libraw_get_imgother()` + `libraw_get_lensinfo()`
  - [ ] Add necessary C struct definitions: `libraw_image_sizes_t`, `libraw_colordata_t`, `libraw_imgother_t`, `libraw_lensinfo_t`

- [ ] Task 2: Create error.rs with RawViewError enum (AC: #8)
  - [ ] Create `src-tauri/src/error.rs` with `RawViewError` enum: `UnsupportedFormat`, `CorruptData`, `FileAccessDenied`, `DecoderError`, `RenderError`, `SessionExpired`
  - [ ] Implement `std::fmt::Display`, `std::error::Error`, and `serde::Serialize` for tauri-specta
  - [ ] Implement `From<std::io::Error>` for `RawViewError`
  - [ ] Add `mod error;` to `lib.rs`

- [ ] Task 3: Create data module: CFA types, metadata, BayerDataStore (AC: #2, #3, #4)
  - [ ] Create `src-tauri/src/data/mod.rs`, `cfa.rs`, `metadata.rs`, `bayer_store.rs`
  - [ ] `cfa.rs`: `CfaPattern` enum (`Bayer { pattern: BayerPattern }`, `XTrans { grid: [[u8; 6]; 6] }`), `BayerPattern` enum (RGGB/BGGR/GRBG/GBRG), `CfaChannel` enum (R/G1/G2/B)
  - [ ] `metadata.rs`: `ExifData` struct (iso, shutter, aperture, focal_len, timestamp, make, model, lens), `SensorInfo` struct (raw_width, raw_height, width, height, top_margin, left_margin, bit_depth)
  - [ ] `bayer_store.rs`: `BayerDataStore` owning `Vec<u16>` Bayer array, `CfaPattern`, black_level, white_level, dimensions. Immutable after creation. Methods: `get_photosite(row, col) -> u16`, `get_channel(row, col) -> CfaChannel`, `dimensions() -> (u32, u32)`
  - [ ] All types derive `serde::Serialize` + `specta::Type` for tauri-specta

- [ ] Task 4: Create decoder module (AC: #1, #5, #7)
  - [ ] Create `src-tauri/src/decoder/mod.rs` and `libraw_decoder.rs`
  - [ ] `DecodedRaw` struct: `bayer_data: Vec<u16>`, `cfa_pattern: CfaPattern`, `black_level: u16`, `white_level: u16`, `sensor_info: SensorInfo`, `exif: ExifData`
  - [ ] `decode(path: &str) -> Result<DecodedRaw, RawViewError>`:
    - Call `libraw_init(0)`, `libraw_open_file()`, `libraw_unpack()`
    - Copy `raw_image` into owned `Vec<u16>` (active area only: offset by top_margin/left_margin, using width×height not raw_width×raw_height)
    - Extract CFA pattern from `filters` + `libraw_COLOR()` for Bayer, `xtrans` for X-Trans
    - Extract black level: `color.black + cblack[channel]` for per-channel
    - Extract white level: `color.maximum`
    - Extract EXIF from `imgother` + `iparams` + `lensinfo`
    - Call `libraw_close()` in all code paths (use Drop guard)
    - Never modify the source file (open read-only)

- [ ] Task 5: Create session.rs (AC: #6)
  - [ ] Create `src-tauri/src/session.rs`
  - [ ] `Session` struct: `id: String` (uuid), `store: BayerDataStore`, `file_path: String`, `created_at: Instant`
  - [ ] `SessionManager`: wraps `Arc<RwLock<Option<Session>>>`, provides `open(path) -> SessionInfo`, `get() -> Option<Session>`, `close()`
  - [ ] `SessionInfo` struct (returned to frontend): `session_id`, `filename`, `dimensions`, `cfa_pattern`, `bit_depth`, `black_level`, `white_level`, `iso`
  - [ ] Opening a new file atomically replaces the old session
  - [ ] `SessionManager` implements `tauri::Manager` state

- [ ] Task 6: Create open_file Tauri command (AC: #1, #10)
  - [ ] Create `src-tauri/src/commands/file_commands.rs`
  - [ ] `open_file(path: String, state: State<SessionManager>) -> Result<SessionInfo, RawViewError>`
  - [ ] Annotate with `#[tauri::command]` and `#[specta::specta]`
  - [ ] Register in `bindings.rs` via `collect_commands!`
  - [ ] Add `SessionManager` as managed state in `lib.rs` `.setup()`
  - [ ] Add dependencies to `src-tauri/Cargo.toml`: `rawview-libraw-sys`, `uuid`, `serde`, `specta`

- [ ] Task 7: Write tests (AC: #9)
  - [ ] Download one small raw file for testing (e.g., a DNG from raw.pixls.us ~1-5MB)
  - [ ] Place in `test-data/` (add to .gitattributes for git-lfs or .gitignore if too large)
  - [ ] Test: decode file, assert dimensions match expected, assert CFA pattern, assert photosite values at 3+ known coordinates, assert black/white levels
  - [ ] Test: decode unsupported file → `UnsupportedFormat` error
  - [ ] Test: decode nonexistent path → `FileAccessDenied` error
  - [ ] `cargo test --workspace` passes

## Dev Notes

### LibRaw Raw Data Access (from research)

**Critical: Direct struct access needed.** LibRaw's C API has getters for basic info but NOT for raw pixel data, raw_pitch, black level array, or margins. We must access struct fields directly.

**Approach: Thin C helper functions.** Instead of replicating LibRaw's complex struct layout in Rust (fragile, version-dependent), write a small C file compiled alongside LibRaw that provides safe getter functions:

```c
// helpers.c — compiled with LibRaw, linked into rawview-libraw-sys
#include "libraw/libraw.h"

// Raw pixel data access
const unsigned short* rawview_get_raw_image(libraw_data_t* lr) {
    return lr->rawdata.raw_image;
}

unsigned rawview_get_raw_pitch(libraw_data_t* lr) {
    return lr->sizes.raw_pitch;
}

// Sensor dimensions (active area)
void rawview_get_sizes(libraw_data_t* lr, 
    unsigned short* raw_width, unsigned short* raw_height,
    unsigned short* width, unsigned short* height,
    unsigned short* top_margin, unsigned short* left_margin) {
    *raw_width = lr->sizes.raw_width;
    *raw_height = lr->sizes.raw_height;
    *width = lr->sizes.width;
    *height = lr->sizes.height;
    *top_margin = lr->sizes.top_margin;
    *left_margin = lr->sizes.left_margin;
}

// Black/white levels
void rawview_get_color_info(libraw_data_t* lr,
    unsigned* black, unsigned* cblack, unsigned* maximum) {
    *black = lr->color.black;
    for (int i = 0; i < 4; i++) cblack[i] = lr->color.cblack[i];
    *maximum = lr->color.maximum;
}
```

### Bayer Array Copy Strategy

Copy only the **active area** (not full sensor with margins):
```rust
let width = sensor_info.width as usize;
let height = sensor_info.height as usize;
let raw_pitch = raw_pitch as usize / 2; // pitch is in bytes, array is u16
let top = sensor_info.top_margin as usize;
let left = sensor_info.left_margin as usize;

let mut bayer_data = Vec::with_capacity(width * height);
for row in 0..height {
    let src_offset = (row + top) * raw_pitch + left;
    let row_slice = &raw_image_slice[src_offset..src_offset + width];
    bayer_data.extend_from_slice(row_slice);
}
```

### CFA Pattern Detection

```rust
fn detect_cfa_pattern(filters: u32, lr: *mut libraw_data_t) -> CfaPattern {
    if filters == 9 {
        // X-Trans: read xtrans[6][6] from iparams
        let iparams = unsafe { libraw_get_iparams(lr) };
        let xtrans = unsafe { (*iparams).xtrans };
        CfaPattern::XTrans { grid: convert_xtrans(xtrans) }
    } else if filters == 0 {
        // Non-Bayer (Foveon, etc.) — not supported in v1
        return Err(RawViewError::UnsupportedFormat { extension: "foveon".into() })
    } else {
        // Standard Bayer — read first 2×2 using libraw_COLOR
        let tl = unsafe { libraw_COLOR(lr, 0, 0) };
        let tr = unsafe { libraw_COLOR(lr, 0, 1) };
        let bl = unsafe { libraw_COLOR(lr, 1, 0) };
        let br = unsafe { libraw_COLOR(lr, 1, 1) };
        // Map (R=0, G=1, B=2, G2=3) → BayerPattern enum
        CfaPattern::Bayer { pattern: map_bayer_pattern(tl, tr, bl, br) }
    }
}
```

### Session Manager Pattern

```rust
pub struct SessionManager {
    current: Arc<RwLock<Option<Session>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self { current: Arc::new(RwLock::new(None)) }
    }

    pub fn open(&self, path: &str) -> Result<SessionInfo, RawViewError> {
        let decoded = decoder::decode(path)?;
        let session = Session::new(decoded, path);
        let info = session.info();
        *self.current.write().unwrap() = Some(session);
        Ok(info)
    }

    pub fn with_store<T>(&self, f: impl FnOnce(&BayerDataStore) -> T) -> Result<T, RawViewError> {
        let guard = self.current.read().unwrap();
        guard.as_ref()
            .map(|s| f(&s.store))
            .ok_or_else(|| RawViewError::SessionExpired { session_id: String::new() })
    }
}
```

### Tauri State Registration

In `lib.rs` `.setup()`:
```rust
use crate::session::SessionManager;

.setup(|app| {
    app.manage(SessionManager::new());
    // ...
})
```

### Tauri Command Pattern

```rust
#[tauri::command]
#[specta::specta]
pub async fn open_file(
    path: String,
    session: tauri::State<'_, SessionManager>,
) -> Result<SessionInfo, RawViewError> {
    session.open(&path)
}
```

### Dependencies to Add

In `src-tauri/Cargo.toml`:
```toml
rawview-libraw-sys = { path = "crates/rawview-libraw-sys" }
uuid = { version = "1", features = ["v4"] }
rayon = "1"
```

Note: `serde` and `specta` are likely already present from the template.

### Test Raw File

Download a small DNG from raw.pixls.us (e.g., Leica DNG ~3MB). Store in `test-data/`. If too large for git, add to `.gitignore` and note that CI test corpus is Story 6.1.

For unit tests, we can also create a minimal synthetic raw file, but using a real file is more valuable for validation.

### Project Structure After This Story

```
src-tauri/src/
├── error.rs                    # RawViewError enum
├── session.rs                  # SessionManager + Session
├── data/
│   ├── mod.rs
│   ├── cfa.rs                  # CfaPattern, BayerPattern, CfaChannel
│   ├── metadata.rs             # ExifData, SensorInfo
│   └── bayer_store.rs          # BayerDataStore
├── decoder/
│   ├── mod.rs
│   └── libraw_decoder.rs       # decode() function
├── commands/
│   └── file_commands.rs        # open_file Tauri command
└── ...

src-tauri/crates/rawview-libraw-sys/
├── helpers.c                   # Thin C getters for raw data access
├── build.rs                    # Updated to compile helpers.c
└── src/lib.rs                  # Extended FFI bindings
```

### Critical Warnings
- **DO NOT access raw_image directly from Rust via opaque struct** — use helper C functions
- **DO NOT forget to call `libraw_close()`** — use a Drop guard or ensure cleanup in all error paths
- **DO NOT store the `raw_image` pointer** — copy data into owned `Vec<u16>` before closing LibRaw
- **DO NOT include top_margin/left_margin pixels** — copy only the active area
- **DO NOT use `unwrap()` in production code** — use `?` operator and `RawViewError`
- **DO NOT modify the raw file** — open read-only (NFR14)
- **DO make `BayerDataStore` immutable** after creation — no `&mut self` methods

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Pipeline Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling]
- [Source: _bmad-output/planning-artifacts/architecture.md#Session ↔ Components Boundary]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: https://libraw.org/docs/API-C.html]
- [Source: https://libraw.org/docs/API-datastruct.html]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
