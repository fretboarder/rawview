# Story 2.6: Error Handling for Unsupported, Corrupt, and Inaccessible Files

Status: review

## Story

As a user who attempts to open an unsupported, corrupt, or inaccessible file,
I want a clear, categorized error message without the application crashing,
so that I understand the problem and can take corrective action.

## Acceptance Criteria

1. Unsupported format → toast "Unsupported format: .ext" within 3 seconds (FR6, NFR13)
2. Corrupt file → toast "Corrupt or unreadable file data" (FR6)
3. File access denied → toast "File access denied: {path}" (FR6)
4. Rayon panic → caught by catch_unwind, returns graceful error (NFR13)
5. Stale session URL → protocol returns 404, canvas retains last valid frame
6. Application never crashes on any error condition

## Tasks

- [ ] Task 1: Verify existing error handling is complete
  - [ ] Confirm viewer-store.ts maps all 6 RawViewError variants to toast messages ✓ (done in 2.3)
  - [ ] Confirm ViewerCanvas shows toast on error ✓ (done in 2.3)
  - [ ] Confirm protocol handler has catch_unwind ✓ (done in 2.2)
  - [ ] Confirm protocol handler returns 404 for stale sessions ✓ (done in 2.2)

- [ ] Task 2: Add error handling integration test
  - [ ] Create `src/components/viewer/__tests__/error-handling.test.tsx`
  - [ ] Test: openFile with UnsupportedFormat error → error state rendered
  - [ ] Test: openFile with CorruptData error → error message displayed
  - [ ] Test: openFile with FileAccessDenied error → path shown in message
  - [ ] Verify all tests pass

- [ ] Task 3: Verify Rust error paths
  - [ ] `cargo test --workspace` — decoder_tests already cover error cases ✓
  - [ ] Confirm all Rust public functions return Result (no unwrap in production)

## Dev Notes

### Status
Most error handling was implemented in Stories 2.2 (Rust catch_unwind, protocol 404) and 2.3 (viewer-store error mapping, toast display). This story primarily validates and tests the complete error flow rather than building new code.

### Already Done
- viewer-store.ts: maps all 6 RawViewError variants (UnsupportedFormat, CorruptData, FileAccessDenied, DecoderError, RenderError, SessionExpired) to human-readable messages
- ViewerCanvas.tsx: useEffect watches errorMessage → toast.error()
- viewport_protocol.rs: catch_unwind wraps handler, stale sessions return 404
- decoder_tests.rs: tests for nonexistent, unsupported, and corrupt files
