# Deferred Work

Items identified during code review that are acknowledged but deferred for later resolution.

## Deferred from: code review of story-1.1 (2026-03-31)

- [ ] CSP `unsafe-inline` in script-src — allows inline script execution in the WebView, potential XSS vector when rendering untrusted file metadata [src-tauri/tauri.conf.json:34] — revisit when EXIF/metadata rendering is implemented
- [ ] `recovery.rs` TOCTOU on file existence check — `.exists()` then `read_to_string` is a race condition; should match on read error kind instead [src-tauri/src/commands/recovery.rs:99-102] — pre-existing template code
- [ ] `recovery.rs` u64 underflow on cleanup timestamp — `now - 604800` can overflow if system clock is near epoch [src-tauri/src/commands/recovery.rs:139] — pre-existing template code
- [ ] `recovery.rs` pre-epoch clock aborts cleanup entirely [src-tauri/src/commands/recovery.rs:133-139] — pre-existing template code
- [ ] `recovery.rs` concurrent saves share same .tmp path — two concurrent saves could collide [src-tauri/src/commands/recovery.rs:62-63] — pre-existing template code
- [ ] `recovery.ts` crash filename millisecond collision — two crashes in same ms overwrite each other [src/lib/recovery.ts:172-173] — pre-existing template code
- [ ] Command registry silent duplicate overwrites — no warning on duplicate command IDs [src/lib/commands/registry.ts:3] — template pattern
- [ ] App.tsx double-init in React Strict Mode — initializeCommandSystem and buildAppMenu called twice in dev [src/App.tsx:16-43] — dev-only
- [ ] `img-src` allows any HTTPS origin — potential exfiltration channel [src-tauri/tauri.conf.json:34] — revisit with metadata display
- [ ] Filename regex validates name only, not resolved path — validate final path is within expected directory [src-tauri/src/types.rs:13-16] — pre-existing template code
- [ ] Window state not saved on Windows/Linux CloseRequested — only macOS explicitly saves [src-tauri/src/lib.rs:111-124] — template pattern

## Deferred from: code review of story-1.2 (2026-03-31)

- [ ] `cfg!(target_os = "linux")` in build.rs checks host OS, not target — `-fPIC` flag misapplied during cross-compilation [src-tauri/crates/rawview-libraw-sys/build.rs:22] — CI builds natively per-platform
- [ ] `rerun-if-changed` on directories is shallow — Cargo only watches direct children, not recursive changes to vendored source [src-tauri/crates/rawview-libraw-sys/build.rs:67-68] — vendored source is committed and stable

## Deferred from: code review of story-1.3 (2026-03-31)

- [ ] `percent_decode_str` corrupts multi-byte UTF-8 — casts each decoded byte independently to char; breaks non-ASCII paths [src-tauri/src/protocol/viewport_protocol.rs:84] — all current paths are ASCII UUIDs
- [ ] `Access-Control-Allow-Origin: *` on custom URI scheme — any WebView content can fetch from rawview:// [src-tauri/src/protocol/viewport_protocol.rs] — standard Tauri pattern; revisit with CSP hardening
- [ ] `sessionId` not URI-encoded in URL path — special characters could break routing [src/lib/protocolUrl.ts:41] — session IDs are UUIDs today

## Deferred from: code review of story-1.4 (2026-03-31)

- [ ] macOS CI builds ARM64 only — no Intel Mac / Universal Binary support [.github/workflows/ci.yml matrix] — revisit for broader platform support
- [ ] rust-cache key doesn't include vendored LibRaw source hash — stale cache possible after vendor update [.github/workflows/ci.yml:46-48] — vendored source is stable
- [ ] `lts/*` is floating Node version ref — minor reproducibility concern [.github/workflows/ci.yml:39] — standard GHA pattern
- [ ] workflow_dispatch could create duplicate release tag if branch name matches existing tag [.github/workflows/release.yml:65] — edge case in release workflow

## Deferred from: code review of story-2.1 (2026-03-31)

- [ ] TOCTOU session ID check — `current_session_id()` and `with_store()` use two separate lock acquisitions; session can change between check and use [src-tauri/src/protocol/viewport_protocol.rs:106-121]
- [ ] AC9 gap — `decoder_tests.rs` doesn't assert specific photosite values at hardcoded coordinates for bit-exact verification
- [ ] `raw_pitch % 2` assert would catch odd-stride data from exotic sensors [src-tauri/src/decoder/libraw_decoder.rs]
- [ ] File-exists TOCTOU — `.exists()` then open is a race condition in the open_file command

## Deferred from: code review of story-2.2 (2026-03-31)

- [ ] `percent_decode_str` corrupts multi-byte UTF-8 (same as story-1.3 deferred) [src-tauri/src/protocol/viewport_protocol.rs:84]
- [ ] TOCTOU session ID check (same as story-2.1) [src-tauri/src/protocol/viewport_protocol.rs:106-121]

## Deferred from: code review of story-2.3 (2026-03-31)

- [ ] `e.preventDefault()` on React synthetic WheelEvent is a no-op with passive listeners — canvas doesn't scroll so low impact [src/components/viewer/ViewerCanvas.tsx:144]
- [ ] Stale unlisten race in drag-drop cleanup — small window between promise resolution and cleanup [src/components/viewer/ViewerCanvas.tsx:137-139]
- [ ] Multi-file drop only opens first file silently — no user feedback about skipped files
- [ ] Canvas default 800×600 before ResizeObserver fires — brief flash of wrong size

## Deferred from: code review of story-2.4 (2026-03-31)

- [ ] `usePhotositeInfo` fires IPC even when inspector is pinned — should skip fetch when `pinned !== null` [src/hooks/usePhotositeInfo.ts]
- [ ] Click after drag pins inspector unintentionally — `handleClick` fires after mouseup without drag-distance guard [src/components/viewer/ViewerCanvas.tsx:231-241]
- [ ] ViewportIndicator pan math approximation slightly off for portrait sensors [src/components/viewer/ViewportIndicator.tsx:156]
- [ ] Misleading error messages in edge cases
- [ ] Tooltip can overflow container bounds
- [ ] `void sensorH` suppresses unused variable warning — dead code smell [src/components/viewer/ViewportIndicator.tsx:171]

## Deferred from: code review of story-2.5 (2026-03-31)

- [ ] `useEffectiveZoom` uses fragile `document.querySelector` to find canvas container — should use shared ref or context [src/components/panels/QuickStatsBar.tsx:17-19]
- [ ] Placeholder count mismatch — empty state shows 7 placeholders but populated state shows 9 fields
- [ ] G1/G2 collapse test — no verification that both green channels are correctly labeled

## Deferred from: code review of story-2.6 (2026-03-31)

- [ ] `raw_pitch` odd-byte edge case — exotic sensors with non-even raw pitch could produce shifted data
