# Story 1.2: Create rawview-libraw-sys Cargo Workspace Crate

Status: done

## Story

As a developer,
I want a `rawview-libraw-sys` crate inside the Cargo workspace that vendors LibRaw 0.21.x source and compiles it via a `build.rs` script,
so that LibRaw is available as a statically linked dependency with zero runtime install requirements.

## Acceptance Criteria

1. Workspace `Cargo.toml` lists `crates/rawview-libraw-sys` as a member
2. LibRaw 0.21.5 source is vendored under `src-tauri/crates/rawview-libraw-sys/vendor/libraw/` and committed
3. `build.rs` uses the `cc` crate to compile vendored LibRaw C/C++ sources into a static library
4. The crate exposes raw `libraw_init` FFI binding in `src/lib.rs` with an unsafe extern block
5. `cargo build -p rawview-libraw-sys` succeeds on macOS (and is structured for Windows/Linux)
6. `cargo test -p rawview-libraw-sys` passes a smoke test that calls `libraw_init(0)` and asserts the returned pointer is non-null
7. LibRaw LGPL-2.1 license file is included in the vendor directory

## Tasks / Subtasks

- [x] Task 1: Create crate directory structure and Cargo.toml (AC: #1)
  - [x] Create `src-tauri/crates/rawview-libraw-sys/` directory
  - [x] Create `Cargo.toml` with name `rawview-libraw-sys`, edition 2021, dependencies: `cc` (build-dep)
  - [x] Update workspace `src-tauri/Cargo.toml`: add `"crates/rawview-libraw-sys"` to `[workspace] members`
  - [x] Create `src/lib.rs` with placeholder
  - [x] Verify `cargo check -p rawview-libraw-sys` compiles

- [x] Task 2: Vendor LibRaw 0.21.5 source (AC: #2, #7)
  - [x] Download LibRaw 0.21.5 source from https://github.com/LibRaw/LibRaw/archive/refs/tags/0.21.5.tar.gz
  - [x] Extract to `src-tauri/crates/rawview-libraw-sys/vendor/libraw/`
  - [x] Verify key directories exist: `vendor/libraw/src/`, `vendor/libraw/libraw/` (headers)
  - [x] Include `vendor/libraw/LICENSE.LGPL` and `vendor/libraw/LICENSE.CDDL`
  - [x] Add a `vendor/libraw/README.rawview.md` noting: "LibRaw 0.21.5 vendored for RawView. LGPL-2.1/CDDL dual-licensed."

- [x] Task 3: Write build.rs to compile LibRaw from source (AC: #3)
  - [x] Create `build.rs` that uses `cc::Build` to compile LibRaw C++ sources
  - [x] Include all .cpp files recursively via collect_cpp_files() (78 source files total)
  - [x] Set include path to `vendor/libraw/` and `vendor/libraw/libraw/`
  - [x] Set C++ standard to C++11
  - [x] Disable warnings (`warnings(false)`) — vendored code, not our problem
  - [x] Add platform-specific flags: `-fPIC` on Linux, `-fno-openmp` on all non-MSVC, `LIBRAW_NOTHREADS` define
  - [x] cc::Build::compile("raw") handles link-lib and link-search automatically
  - [x] Link C++ standard library: `cargo:rustc-link-lib=c++` on macOS, `cargo:rustc-link-lib=stdc++` on Linux
  - [x] Verify `cargo build -p rawview-libraw-sys` compiles LibRaw and links successfully (78 source files, ~33s)

- [x] Task 4: Declare FFI bindings for core LibRaw functions (AC: #4)
  - [x] In `src/lib.rs`, declare `#[repr(C)]` opaque struct `libraw_data_t`
  - [x] Declare extern "C" functions: libraw_init, libraw_close, libraw_open_file, libraw_unpack, libraw_get_raw_width, libraw_get_raw_height, libraw_get_iparams, libraw_get_color_maximum
  - [x] Declare `#[repr(C)]` struct `libraw_iparams_t` with make, model, software, normalized_make, normalized_model, maker_index, raw_count, dng_version, is_foveon, colors, filters, xtrans, xtrans_abs, cdesc, xmplen, xmpdata
  - [x] All FFI declarations in an `extern "C"` block, all functions `pub unsafe`

- [x] Task 5: Write smoke test (AC: #6)
  - [x] Test in `src/lib.rs` #[cfg(test)] module
  - [x] Test calls `libraw_init(0)`, asserts pointer is non-null
  - [x] Test calls `libraw_close()` to clean up — no leaks
  - [x] `cargo test -p rawview-libraw-sys` passes (1 test, 0 failures)

## Dev Notes

### LibRaw Version
- **Version:** 0.21.5 (final release in 0.21 branch, released December 24, 2025)
- **Source:** https://github.com/LibRaw/LibRaw/archive/refs/tags/0.21.5.tar.gz
- **License:** Dual LGPL-2.1 / CDDL-1.0
- 0.22.0 exists (January 2026) but 0.21.5 is the stable, battle-tested choice

### LibRaw Source Files to Compile

The key source files in LibRaw 0.21.5 that must be compiled:

**Core files (required):**
- `src/libraw_cxx.cpp` — main library implementation
- `src/libraw_datastream.cpp` — file/buffer I/O
- `src/libraw_c_api.cpp` — C API wrapper (this is what our FFI calls)

**Decoder files (in `src/decoders/`):**
- All `.cpp` files — each handles specific camera format decoders

**Demosaic/preprocessing files (in `src/demosaic/` and `src/preprocessing/`):**
- All `.cpp` files — needed for `dcraw_process()` in Tier 2

**Strategy:** Glob all `.cpp` files under `vendor/libraw/src/` recursively. This is simpler than listing individual files and ensures nothing is missed.

### build.rs Pattern

```rust
fn main() {
    let libraw_src = std::path::PathBuf::from("vendor/libraw");

    let mut build = cc::Build::new();
    build
        .cpp(true)
        .std("c++11")
        .warnings(false)
        .include(&libraw_src)
        .include(libraw_src.join("libraw"));

    // Glob all .cpp files under src/
    for entry in glob::glob(libraw_src.join("src/**/*.cpp").to_str().unwrap()).unwrap() {
        if let Ok(path) = entry {
            build.file(&path);
        }
    }

    // Platform-specific
    if cfg!(target_os = "linux") {
        build.flag("-fPIC");
    }

    build.compile("raw");

    // Link C++ stdlib
    if cfg!(target_os = "macos") {
        println!("cargo:rustc-link-lib=c++");
    } else if cfg!(target_os = "linux") {
        println!("cargo:rustc-link-lib=stdc++");
    }
    // MSVC links C++ stdlib automatically
}
```

**Note:** Add `glob` as a build dependency, or use `std::fs::read_dir` recursively to find .cpp files.

### FFI Binding Approach

We declare **manual** FFI bindings (not bindgen) because:
- We only need ~10-15 C API functions from LibRaw
- Manual bindings are simpler, no bindgen build-time dependency
- LibRaw's C API (`libraw_c_api.cpp`) is stable and well-documented
- More control over safety boundaries

### Key C API Structures

```c
// After libraw_unpack(), raw Bayer data is at:
imgdata.rawdata.raw_image    // ushort* — single-channel mosaic (most cameras)
// For X-Trans:
imgdata.idata.filters == 9   // Indicates X-Trans 6×6 pattern
imgdata.idata.xtrans[6][6]   // X-Trans color pattern

// Black/white levels:
imgdata.color.black           // Base black level
imgdata.color.cblack[4]       // Per-channel black corrections
imgdata.color.maximum         // White level (saturation point)

// Dimensions:
imgdata.sizes.raw_width, raw_height   // Full sensor
imgdata.sizes.width, height           // Visible area
```

**For this story (1.2), we only need `libraw_init` and `libraw_close` to prove the FFI works. The full struct access comes in Story 2.1.**

### LGPL Compliance Note
LibRaw is LGPL-2.1/CDDL dual-licensed. For RawView (open source, MIT or Apache-2.0):
- Open source distribution satisfies LGPL requirements automatically
- Include LibRaw license files in the vendored directory
- Document in README that LibRaw is LGPL-2.1/CDDL

### Previous Story Learnings (from 1.1)
- Template uses **npm** (not pnpm)
- Cargo workspace is at `src-tauri/Cargo.toml` with `[workspace] members = []`
- `src-tauri/crates/.gitkeep` already exists from Story 1.1
- Rust 1.94.1 is the current stable (March 2026)
- `cargo clippy -- -D warnings` should pass — no `.unwrap()` in production code

### Project Structure After This Story

```
src-tauri/
├── Cargo.toml                    # [workspace] members = ["crates/rawview-libraw-sys"]
├── crates/
│   └── rawview-libraw-sys/
│       ├── Cargo.toml            # name = "rawview-libraw-sys", build-deps: cc, glob
│       ├── build.rs              # Compiles LibRaw from vendor/ via cc crate
│       ├── src/
│       │   └── lib.rs            # FFI bindings: libraw_init, libraw_close, etc.
│       └── vendor/
│           └── libraw/           # LibRaw 0.21.5 source tree
│               ├── LICENSE.LGPL
│               ├── LICENSE.CDDL
│               ├── README.rawview.md
│               ├── libraw/       # Headers
│               └── src/          # Source files
```

### Critical Warnings
- **DO NOT use bindgen** — manual FFI bindings are simpler for our needs
- **DO NOT modify LibRaw source** — keep vendored source pristine for LGPL compliance
- **DO NOT add rawview-libraw-sys as a dependency of the main rawview crate yet** — that's Story 2.1
- **DO NOT expose more FFI than needed** — just init/close for this story's smoke test
- **DO use `glob` or `walkdir`** as build-dep to find .cpp files, or use recursive `read_dir`

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Pipeline Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#LibRaw FFI Boundary]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: https://www.libraw.org/docs/API-CXX.html]
- [Source: https://github.com/LibRaw/LibRaw/releases/tag/0.21.5]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

### Review Findings

- [x] [Review][Patch] Unused `glob` build-dependency — `glob = "0.3"` declared in Cargo.toml but never imported; `collect_cpp_files` uses `std::fs::read_dir` instead. Dead dependency with supply-chain surface. [Cargo.toml:10] — **fixed**: removed `glob` from build-dependencies
- [x] [Review][Patch] Silent empty file list if vendor dir missing — `collect_cpp_files` silently returns empty Vec on read_dir failure; `cc::Build::compile` then produces an empty archive with undefined symbols, causing confusing linker errors later. [build.rs:40] — **fixed**: added `is_empty()` guard with panic and actionable error message
- [x] [Review][Defer] `cfg!(target_os = "linux")` checks host OS, not target — `-fPIC` flag controlled by host OS instead of `CARGO_CFG_TARGET_OS`; breaks Linux cross-compilation [build.rs:22] — deferred, CI builds natively per-platform
- [x] [Review][Defer] `rerun-if-changed` on directories is shallow — Cargo only watches direct children of `vendor/libraw/src`, not recursive changes; stale incremental builds possible if vendored source is patched [build.rs:67-68] — deferred, vendored source is committed and stable
