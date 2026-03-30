//! Custom URI protocol handler for serving viewport bitmaps.
//!
//! Handles `rawview://viewport/{session_id}?...` requests by rendering
//! the Bayer mosaic from the BayerDataStore and returning PNG-encoded images.

use tauri::http::Response;
use tauri::Manager;

use crate::render::encoder;
use crate::render::viewport;
use crate::session::SessionManager;

/// Handle an incoming custom protocol request.
///
/// Routes viewport requests to the renderer pipeline:
/// parse params → access session → render viewport → encode PNG → respond.
///
/// Wrapped in catch_unwind for rayon panic safety (NFR13).
pub fn handle<R: tauri::Runtime>(
    ctx: tauri::UriSchemeContext<'_, R>,
    request: tauri::http::Request<Vec<u8>>,
    responder: tauri::UriSchemeResponder,
) {
    let app_handle = ctx.app_handle().clone();

    tauri::async_runtime::spawn(async move {
        let path = request.uri().path().to_string();
        let query = request.uri().query().unwrap_or("").to_string();
        log::debug!("rawview:// protocol request: path={path} query={query}");

        // Wrap in catch_unwind for rayon panic safety
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            route_request(&app_handle, &path, &query)
        }));

        let response = match result {
            Ok(Ok(png_bytes)) => build_png_response(png_bytes),
            Ok(Err(status)) => build_error_response(status),
            Err(panic_info) => {
                let msg = if let Some(s) = panic_info.downcast_ref::<&str>() {
                    s.to_string()
                } else if let Some(s) = panic_info.downcast_ref::<String>() {
                    s.clone()
                } else {
                    "Unknown panic in renderer".to_string()
                };
                log::error!("Panic in protocol handler: {msg}");
                build_error_response(500)
            }
        };

        responder.respond(response);
    });
}

/// Route a request to the appropriate handler.
fn route_request<R: tauri::Runtime>(
    app_handle: &tauri::AppHandle<R>,
    path: &str,
    query: &str,
) -> Result<Vec<u8>, u16> {
    let decoded_path = percent_decode_str(path);
    let path = decoded_path.trim_start_matches('/');

    // Test route — kept for protocol verification (Story 1.3)
    if path == "viewport/test" {
        return Ok(create_test_png());
    }

    // Viewport render route: /viewport/{session_id}?mode=...&zoom=...
    if let Some(rest) = path.strip_prefix("viewport/") {
        let session_id = rest.to_string();
        return render_viewport(app_handle, &session_id, query);
    }

    log::warn!("Unknown protocol path: {path}");
    Err(404)
}

/// Render a viewport for the given session.
fn render_viewport<R: tauri::Runtime>(
    app_handle: &tauri::AppHandle<R>,
    session_id: &str,
    query: &str,
) -> Result<Vec<u8>, u16> {
    // Parse viewport parameters from query string
    let mut params = viewport::parse_viewport_params(query).map_err(|e| {
        log::error!("Failed to parse viewport params: {e}");
        400u16
    })?;
    params.session_id = session_id.to_string();

    // Access session manager
    let session_mgr = app_handle.try_state::<SessionManager>().ok_or_else(|| {
        log::error!("SessionManager not available");
        500u16
    })?;

    // Check session ID matches
    let current_id = session_mgr.current_session_id();
    if current_id.as_deref() != Some(session_id) {
        log::warn!("Session mismatch: requested={session_id}, current={current_id:?}");
        return Err(404);
    }

    // Render
    let render_result = session_mgr
        .with_store(|store| {
            let rgba = viewport::render(store, &params)?;
            encoder::encode_png(&rgba, params.w, params.h)
        })
        .map_err(|e| {
            log::error!("Session error: {e}");
            404u16
        })?;

    render_result.map_err(|e| {
        log::error!("Render/encode error: {e}");
        500u16
    })
}

/// Build an HTTP response with PNG content and required headers.
fn build_png_response(png_bytes: Vec<u8>) -> Response<Vec<u8>> {
    Response::builder()
        .status(200)
        .header("Content-Type", "image/png")
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "no-cache")
        .body(png_bytes)
        .expect("failed to build PNG response")
}

/// Build an error HTTP response.
fn build_error_response(status: u16) -> Response<Vec<u8>> {
    let body = match status {
        400 => b"Bad Request".to_vec(),
        404 => b"Not Found".to_vec(),
        500 => b"Internal Server Error".to_vec(),
        _ => format!("Error {status}").into_bytes(),
    };

    Response::builder()
        .status(status)
        .header("Content-Type", "text/plain")
        .header("Access-Control-Allow-Origin", "*")
        .body(body)
        .expect("failed to build error response")
}

/// Generate a minimal 2×2 test PNG with RGBW pixels.
fn create_test_png() -> Vec<u8> {
    use image::{ImageBuffer, Rgba};

    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(2, 2, |x, y| match (x, y) {
        (0, 0) => Rgba([255u8, 0, 0, 255]),
        (1, 0) => Rgba([0u8, 255, 0, 255]),
        (0, 1) => Rgba([0u8, 0, 255, 255]),
        _ => Rgba([255u8, 255, 255, 255]),
    });

    let mut buf = Vec::new();
    img.write_to(
        &mut std::io::Cursor::new(&mut buf),
        image::ImageFormat::Png,
    )
    .expect("failed to encode test PNG");
    buf
}

/// Simple percent-decoding for URL paths.
fn percent_decode_str(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let mut chars = input.chars();
    while let Some(c) = chars.next() {
        if c == '%' {
            let hex: String = chars.by_ref().take(2).collect();
            if let Ok(byte) = u8::from_str_radix(&hex, 16) {
                result.push(byte as char);
            } else {
                result.push('%');
                result.push_str(&hex);
            }
        } else {
            result.push(c);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_test_png_is_valid() {
        let png = create_test_png();
        assert_eq!(&png[..8], &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        assert!(png.len() > 50);
        assert!(png.len() < 1000);
    }

    #[test]
    fn test_percent_decode() {
        assert_eq!(percent_decode_str("%2Fviewport%2Ftest"), "/viewport/test");
        assert_eq!(percent_decode_str("/viewport/test"), "/viewport/test");
    }
}
