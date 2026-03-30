# Story 1.3: Register Custom rawview:// URI Protocol in Tauri

Status: review

## Story

As a developer,
I want the `rawview://viewport/` custom URI protocol registered in the Tauri backend and verified to transfer binary data to the frontend WebView,
so that viewport bitmaps can be served from Rust without JSON serialization overhead.

## Acceptance Criteria

1. Rust handler for `rawview://viewport/{id}` is registered via `register_asynchronous_uri_scheme_protocol`
2. Handler returns a valid response with `Content-Type: image/png` and a binary body
3. A test page/component issues a `fetch()` from the WebView and asserts a 200 response with correct binary content
4. Requests to unknown IDs return a 404 response rather than panicking
5. Protocol compiles and runs on macOS (Windows/Linux verified in CI in Story 1.4)
6. CORS headers (`Access-Control-Allow-Origin: *`) included for cross-platform compatibility

## Tasks / Subtasks

- [x] Task 1: Create protocol module and register handler in Tauri builder (AC: #1, #6)
  - [x] Create `src-tauri/src/protocol/mod.rs` and `src-tauri/src/protocol/viewport_protocol.rs`
  - [x] Add `mod protocol;` to `src-tauri/src/lib.rs`
  - [x] In `viewport_protocol.rs`, implement handler function matching Tauri v2 async protocol API signature
  - [x] Handler parses URL path to extract ID, returns a small test PNG for known IDs, 404 for unknown
  - [x] Include `Content-Type: image/png` and `Access-Control-Allow-Origin: *` headers
  - [x] Register protocol in `lib.rs` via `.register_asynchronous_uri_scheme_protocol("rawview", ...)`
  - [x] Verify `cargo build` compiles without errors

- [x] Task 2: Create a minimal test PNG generator (AC: #2)
  - [x] Add `image` crate as dependency to `src-tauri/Cargo.toml` (for PNG encoding)
  - [x] In protocol handler, generate a 2×2 solid-color PNG as test payload (red, green, blue, white pixels)
  - [x] This test PNG proves the binary pipeline works end-to-end; it will be replaced by ViewportRenderer in Story 2.2

- [x] Task 3: Frontend protocol verification component (AC: #3)
  - [x] Create `src/components/viewer/ProtocolTest.tsx` — a dev-only component
  - [x] Component uses `convertFileSrc("/viewport/test", "rawview")` to construct platform-correct URL
  - [x] Component fetches the URL, checks response status 200, and displays the test PNG in an `<img>` element
  - [x] Component also fetches `/viewport/unknown-id` and verifies 404 response
  - [x] Add `ProtocolTest` to `MainWindowContent.tsx` (temporary — removed when ViewerCanvas replaces it)

- [x] Task 4: Create TypeScript helper for viewport URLs (AC: #3)
  - [x] Create `src/lib/protocolUrl.ts`
  - [x] Export `buildViewportUrl(params: ViewportParams): string` that constructs the full URL using `convertFileSrc`
  - [x] TypeScript type: `ViewportParams = { sessionId: string; mode: string; zoom: number; x: number; y: number; w: number; h: number; stretch: boolean }`
  - [x] This is the canonical URL builder — no manual string construction anywhere (anti-pattern from architecture)

- [x] Task 5: Verify and run quality checks (AC: #4, #5)
  - [x] `cargo clippy -- -D warnings` passes (also fixed pre-existing unused `Manager` import)
  - [x] `cargo test --lib` passes (8 passed, 1 ignored — 4 protocol tests + 4 platform tests)
  - [x] `npm test` passes (27/27 — added `@tauri-apps/api/core` mock to test setup)
  - [x] Visual verification requires `npm run tauri:dev` — user should test on their machine

## Dev Notes

### Tauri v2 Custom Protocol API

**Registration (in lib.rs builder chain):**
```rust
.register_asynchronous_uri_scheme_protocol("rawview", |ctx, request, responder| {
    protocol::viewport_protocol::handle(ctx, request, responder);
})
```

**Handler signature:**
```rust
pub fn handle<R: tauri::Runtime>(
    _ctx: tauri::UriSchemeContext<'_, R>,
    request: http::Request<Vec<u8>>,
    responder: tauri::UriSchemeResponder,
) {
    tauri::async_runtime::spawn(async move {
        let path = request.uri().path();
        // Parse path, generate response...
        responder.respond(response);
    });
}
```

**Response construction:**
```rust
use tauri::http::ResponseBuilder;

let response = ResponseBuilder::new()
    .status(200)
    .header("Content-Type", "image/png")
    .header("Access-Control-Allow-Origin", "*")
    .body(png_bytes)
    .unwrap();
```

### Platform URL Differences (CRITICAL)

| Platform | URL format from frontend |
|----------|-------------------------|
| macOS (WebKit) | `rawview://localhost/viewport/test` |
| Linux (WebKitGTK) | `rawview://localhost/viewport/test` |
| Windows (WebView2) | `http://rawview.localhost/viewport/test` |

**Use `convertFileSrc()` from `@tauri-apps/api/core` to abstract this:**
```typescript
import { convertFileSrc } from "@tauri-apps/api/core";
const url = convertFileSrc("/viewport/test", "rawview");
// Correct URL for current platform
```

### Test PNG Generation

Use the `image` crate to generate a minimal 2×2 PNG in memory:
```rust
use image::{ImageBuffer, Rgba};

fn create_test_png() -> Vec<u8> {
    let img = ImageBuffer::from_fn(2, 2, |x, y| {
        match (x, y) {
            (0, 0) => Rgba([255, 0, 0, 255]),   // Red
            (1, 0) => Rgba([0, 255, 0, 255]),   // Green
            (0, 1) => Rgba([0, 0, 255, 255]),   // Blue
            _ => Rgba([255, 255, 255, 255]),     // White
        }
    });
    let mut buf = Vec::new();
    img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png).unwrap();
    buf
}
```

### Where to Register in lib.rs

Insert `.register_asynchronous_uri_scheme_protocol(...)` on the `app_builder` BEFORE `.setup(|app| { ... })`. The builder chain in the current `lib.rs` (line 66+) goes:
```
app_builder
    .plugin(tauri_plugin_fs::init())
    .plugin(...)
    // ADD PROTOCOL HERE
    .register_asynchronous_uri_scheme_protocol("rawview", ...)
    .setup(|app| { ... })
    .invoke_handler(builder.invoke_handler())
    .build(...)
```

### Dependencies to Add

In `src-tauri/Cargo.toml`:
```toml
image = { version = "0.25", default-features = false, features = ["png"] }
http = "1"
```

The `http` crate may already be pulled in by Tauri — check `Cargo.lock`. If so, use `tauri::http::*` re-exports instead.

### Project Structure After This Story

```
src-tauri/src/
├── protocol/
│   ├── mod.rs                    # pub mod viewport_protocol;
│   └── viewport_protocol.rs     # handle() function
├── lib.rs                        # + mod protocol; + register_asynchronous_uri_scheme_protocol
└── ...

src/
├── components/
│   └── viewer/
│       └── ProtocolTest.tsx      # Dev-only verification component (temporary)
└── lib/
    └── protocolUrl.ts            # buildViewportUrl() helper
```

### Previous Story Learnings (from 1.1 and 1.2)
- Template uses **npm** (not pnpm)
- Cargo workspace at `src-tauri/Cargo.toml` with `members = ["crates/rawview-libraw-sys"]`
- `cargo clippy -- -D warnings` must pass — use `is_some_and()` not `map_or(false, ...)`
- No `.unwrap()` in production Rust code — use `?` or proper error handling
- Handler must wrap in `tauri::async_runtime::spawn()` for async protocol
- `catch_unwind` safety principle applies to protocol handlers (implement in Story 2.2 when real rendering starts)

### Critical Warnings
- **DO NOT use `fetch("rawview://viewport/...")` directly** — URL format differs per platform. Always use `convertFileSrc()` or `buildViewportUrl()`
- **DO NOT skip CORS headers** — Linux production builds may fail without them
- **DO NOT add ViewportRenderer** — this story only proves the protocol works with test data. Real rendering is Story 2.2
- **DO NOT forget `tauri::async_runtime::spawn()`** — the handler must be async
- **DO NOT create `src/components/viewer/ViewerCanvas.tsx`** — that's Story 2.3

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#IPC Protocol Design]
- [Source: _bmad-output/planning-artifacts/architecture.md#Canvas Display]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: https://v2.tauri.app/develop/calling-rust/#custom-uri-scheme-protocol]
- [Source: https://github.com/tauri-apps/tauri/blob/dev/examples/streaming/main.rs]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
