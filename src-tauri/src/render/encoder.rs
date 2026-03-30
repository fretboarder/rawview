//! PNG encoder for viewport bitmaps.

use crate::error::RawViewError;
use image::{ImageBuffer, Rgba};

/// Encode an RGBA pixel buffer as PNG bytes.
pub fn encode_png(rgba: &[u8], width: u32, height: u32) -> Result<Vec<u8>, RawViewError> {
    let img: ImageBuffer<Rgba<u8>, &[u8]> =
        ImageBuffer::from_raw(width, height, rgba).ok_or_else(|| RawViewError::RenderError {
            detail: format!(
                "RGBA buffer size mismatch: expected {} bytes for {width}×{height}, got {}",
                width as usize * height as usize * 4,
                rgba.len()
            ),
        })?;

    let mut buf = Vec::with_capacity(rgba.len() / 4); // PNG is typically smaller than raw RGBA
    img.write_to(
        &mut std::io::Cursor::new(&mut buf),
        image::ImageFormat::Png,
    )
    .map_err(|e| RawViewError::RenderError {
        detail: format!("PNG encoding failed: {e}"),
    })?;

    Ok(buf)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_png_valid() {
        // 2×2 red image
        let rgba = [
            255, 0, 0, 255, 0, 255, 0, 255, // row 0
            0, 0, 255, 255, 255, 255, 255, 255, // row 1
        ];
        let result = encode_png(&rgba, 2, 2);
        assert!(result.is_ok());
        let png = result.unwrap();
        // Check PNG magic bytes
        assert_eq!(&png[..4], &[0x89, 0x50, 0x4E, 0x47]);
    }

    #[test]
    fn test_encode_png_size_mismatch() {
        let rgba = [0u8; 8]; // 8 bytes = 2 pixels, but we claim 4×4
        let result = encode_png(&rgba, 4, 4);
        assert!(result.is_err());
    }
}
