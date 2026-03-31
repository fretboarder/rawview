# Story 1.4: Establish CI/CD Pipeline for All Three Platforms

Status: done

## Story

As a developer,
I want a GitHub Actions CI workflow that builds and tests the full Tauri application on Windows, macOS, and Ubuntu,
so that every pull request is validated across all target platforms.

## Acceptance Criteria

1. GitHub Actions CI workflow triggers on push to `main` and on pull requests
2. CI runs parallel jobs for `ubuntu-22.04`, `macos-latest`, and `windows-latest`
3. Each job installs Rust stable, Node.js LTS, and npm
4. Each job runs `npm ci`, TypeScript check, Vitest, cargo clippy, and cargo test (including rawview-libraw-sys smoke test)
5. Each job runs `cargo tauri build` and produces a platform-native artifact
6. Build artifacts are uploaded and retained for 7 days
7. Workflow uses Cargo and npm caching for fast rebuilds
8. Existing `release.yml` is updated for RawView (rename, fix descriptions)

## Tasks / Subtasks

- [x] Task 1: Create `.github/workflows/ci.yml` (AC: #1, #2, #3, #4, #7)
  - [x] CI triggered on push to main and pull requests, with concurrency cancellation
  - [x] Matrix: ubuntu-22.04, macos-latest, windows-latest with fail-fast: false
  - [x] Steps: checkout, Node.js LTS + npm cache, Rust stable, swatinem/rust-cache, Linux deps, npm ci, tsc, vitest, clippy, cargo test

- [x] Task 2: Add build step to CI (AC: #5, #6)
  - [x] npx tauri build with platform-specific bundle args
  - [x] Upload artifacts via actions/upload-artifact@v4 with 7-day retention

- [x] Task 3: Update release.yml for RawView (AC: #8)
  - [x] Renamed to "Release RawView", updated descriptions and release body
  - [x] Removed includeUpdaterJson and signing keys (Tier 2)
  - [x] Changed tauri-action from @dev to @v0 (stable)

- [x] Task 4: Fix Linux build compatibility (pre-emptive)
  - [x] Changed `strip = true` to `strip = "symbols"` (fixes Linux AppImage bundler issue #14186)
  - [x] Changed `panic = "abort"` to `panic = "unwind"` (required for catch_unwind in protocol handlers)

- [x] Task 5: Verify locally and validate workflow syntax
  - [x] cargo clippy --workspace -- -D warnings: passes
  - [x] cargo test --workspace: 11 passed (10 rawview + 1 libraw-sys)
  - [x] npm test -- --run: 27/27 passed
  - [x] YAML syntax valid for both workflow files

## Dev Notes

### CI Workflow Structure

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  CARGO_TERM_COLOR: always
  CARGO_REGISTRIES_CRATES_IO_PROTOCOL: sparse

jobs:
  check:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: '--bundles app,dmg'
          - platform: ubuntu-22.04
            args: '--bundles appimage'
          - platform: windows-latest
            args: '--bundles msi'
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 'lts/*', cache: 'npm' }
      - uses: dtolnay/rust-toolchain@stable
      - uses: swatinem/rust-cache@v2
        with: { workspaces: './src-tauri -> target' }
      - if: matrix.platform == 'ubuntu-22.04'
        run: sudo apt-get update && sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --run
      - run: cargo clippy --workspace -- -D warnings
        working-directory: src-tauri
      - run: cargo test --workspace
        working-directory: src-tauri
      - run: npx tauri build ${{ matrix.args }}
      - uses: actions/upload-artifact@v4
        with:
          name: rawview-${{ matrix.platform }}
          path: |
            src-tauri/target/release/bundle/**/*.dmg
            src-tauri/target/release/bundle/**/*.app
            src-tauri/target/release/bundle/**/*.msi
            src-tauri/target/release/bundle/**/*.AppImage
          retention-days: 7
```

### Key Actions and Versions
- `actions/checkout@v4`
- `actions/setup-node@v4` with `cache: 'npm'`
- `dtolnay/rust-toolchain@stable`
- `swatinem/rust-cache@v2` with `workspaces: './src-tauri -> target'`
- `actions/upload-artifact@v4`
- `tauri-apps/tauri-action@v0` (for release workflow, v0.6.2 latest)

### Linux Dependencies
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```
No additional deps needed for LibRaw — `build-essential` (pre-installed on ubuntu runners) provides `g++` which the `cc` crate uses.

### Known Issue: `strip = true` Breaks Linux Bundler
Tauri v2 Linux bundler (AppImage) fails when `[profile.release] strip = true` is set (Issue #14186). Change to `strip = "symbols"` or remove entirely.

### Known Issue: `panic = "abort"` vs `catch_unwind`
Our architecture mandates `catch_unwind` on protocol handlers for rayon panic safety. `panic = "abort"` makes `catch_unwind` a no-op — panics will abort the process. **Must change to `panic = "unwind"`** to preserve catch_unwind behavior.

### No Extra LibRaw Dependencies in CI
The `cc` crate compiles LibRaw using the platform's native C++ compiler:
- Ubuntu: `g++` (from `build-essential`, pre-installed)
- macOS: `clang++` (from Xcode CLT, pre-installed)
- Windows: `cl.exe` (from MSVC, pre-installed)

### Previous Story Learnings
- Template uses **npm** (not pnpm) — CI uses `npm ci`
- Cargo workspace includes `rawview-libraw-sys` — use `cargo test --workspace` to test both crates
- LibRaw compile time: ~33s on local machine, expect ~60-90s on CI runners
- Epics AC says `pnpm` — this is incorrect, use `npm`

### Critical Warnings
- **DO NOT use `pnpm`** — project uses npm
- **DO NOT skip the `strip` fix** — Linux builds will fail without it
- **DO NOT skip the `panic` fix** — catch_unwind is an architectural requirement
- **DO NOT add code signing** — that's a future story
- **DO NOT add auto-updater config** — that's Tier 2

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#CI/CD Pipeline]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: https://v2.tauri.app/distribute/pipelines/github]
- [Source: https://github.com/tauri-apps/tauri-action]

## Review Findings

**Review date**: 2026-03-31
**Verdict**: ✅ APPROVED — all 8 ACs met

### Patches Applied (1)
- **BH-1** (medium): Quoted `${{ matrix.bundle_args }}` in ci.yml:74 to prevent shell injection via unquoted variable expansion

### Deferred (4)
- EC-1: macOS ARM64 only — no Intel Mac / Universal Binary support
- EC-3: rust-cache key doesn't include vendored LibRaw source hash — stale cache possible
- EC-5: `lts/*` is floating Node version — minor reproducibility concern
- EC-6: workflow_dispatch could create duplicate release tag if branch name matches existing tag

### Dismissed (9)
- BH-2: `ref_name || inputs.version` fallback works correctly for both trigger types
- BH-3: Concurrency cancellation is intentional CI pattern
- BH-4: `strip="symbols"` is correct for release builds without crash reporting
- EC-2: Already deferred in story 1-2 (host vs target OS in build.rs)
- EC-4: `npm test -- --run` works on all modern npm versions; verified locally
- EC-7: `tauri-action@v0` is intentionally pinned to stable major series
- EC-8: upload-artifact produces warning on empty glob, doesn't fail
- EC-9: No crash reporter planned; stripped symbols are acceptable
- EC-10: Same as BH-3 — concurrency group is intentional

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
