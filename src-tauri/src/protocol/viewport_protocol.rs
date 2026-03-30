//! Custom URI protocol handler for serving viewport bitmaps.
//!
//! Handles `rawview://viewport/{id}` requests by returning PNG-encoded images.
//! This bypasses Tauri's JSON IPC serialization for binary data transfer.

use tauri::http::Response;

/// Handle an incoming custom protocol request.
///
/// Currently serves a test PNG for the path `/viewport/test` and
/// returns 404 for all other paths. In Story 2.2, this will be replaced
/// by the ViewportRenderer that generates real Bayer mosaic bitmaps.
pub fn handle<R: tauri::Runtime>(
    _ctx: tauri::UriSchemeContext<'_, R>,
    request: tauri::http::Request<Vec<u8>>,
    responder: tauri::UriSchemeResponder,
) {
    // Spawn async to avoid blocking the main thread
    tauri::async_runtime::spawn(async move {
        let path = request.uri().path();
        log::debug!("rawview:// protocol request: {path}");

        let response = match route_request(path) {
            Ok(png_bytes) => build_png_response(png_bytes),
            Err(status) => build_error_response(status),
        };

        responder.respond(response);
    });
}

/// Route a request path to the appropriate handler.
/// Returns Ok(png_bytes) for valid paths, Err(status_code) for errors.
fn route_request(path: &str) -> Result<Vec<u8>, u16> {
    // URL-decode the path — convertFileSrc may encode slashes as %2F on some platforms
    let decoded = percent_decode_str(path);
    // Normalize: strip leading slashes
    let path = decoded.trim_start_matches('/');

    match path {
        "viewport/test" => Ok(create_test_png()),
        p if p.starts_with("viewport/") => {
            // Valid viewport path but unknown ID — 404
            log::warn!("Unknown viewport ID: {p}");
            Err(404)
        }
        _ => {
            log::warn!("Unknown protocol path: {path}");
            Err(404)
        }
    }
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
///
/// This proves the binary protocol pipeline works end-to-end.
/// Will be replaced by ViewportRenderer in Story 2.2.
fn create_test_png() -> Vec<u8> {
    use image::{ImageBuffer, Rgba};

    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(2, 2, |x, y| match (x, y) {
        (0, 0) => Rgba([255u8, 0, 0, 255]),     // Red
        (1, 0) => Rgba([0u8, 255, 0, 255]),     // Green
        (0, 1) => Rgba([0u8, 0, 255, 255]),     // Blue
        _ => Rgba([255u8, 255, 255, 255]),       // White
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
/// Handles %XX sequences (e.g. %2F → /).
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
    fn test_route_valid_test_path() {
        let result = route_request("/viewport/test");
        assert!(result.is_ok());
        let png = result.unwrap();
        // PNG magic bytes
        assert_eq!(&png[..4], &[0x89, 0x50, 0x4E, 0x47]);
    }

    #[test]
    fn test_route_unknown_viewport_id() {
        let result = route_request("/viewport/unknown-id");
        assert_eq!(result, Err(404));
    }

    #[test]
    fn test_route_invalid_path() {
        let result = route_request("/something-else");
        assert_eq!(result, Err(404));
    }

    #[test]
    fn test_create_test_png_is_valid() {
        let png = create_test_png();
        // Check PNG signature
        assert_eq!(&png[..8], &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        // Should be a small but non-empty PNG
        assert!(png.len() > 50);
        assert!(png.len() < 1000);
    }

    #[test]
    fn test_percent_decode() {
        assert_eq!(percent_decode_str("%2Fviewport%2Ftest"), "/viewport/test");
        assert_eq!(percent_decode_str("/viewport/test"), "/viewport/test");
        assert_eq!(percent_decode_str("no-encoding"), "no-encoding");
    }

    #[test]
    fn test_route_encoded_path() {
        // This is how macOS WebKit sends the path via convertFileSrc
        let result = route_request("/%2Fviewport%2Ftest");
        assert!(result.is_ok());
    }
}
