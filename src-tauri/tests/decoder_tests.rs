//! Integration tests for the raw file decoder.
//!
//! Tests that don't need a real raw file run unconditionally.
//! Tests that need a real file are gated behind the TEST_RAW_FILE env var.
//!
//! To run with a real file:
//! TEST_RAW_FILE=/path/to/any.cr2 cargo test --workspace

use rawview_lib::decoder;
use rawview_lib::error::RawViewError;

#[test]
fn test_decode_nonexistent_path() {
    let result = decoder::decode("/nonexistent/path/image.cr2");
    assert!(result.is_err());
    match result.unwrap_err() {
        RawViewError::FileAccessDenied { path } => {
            assert!(path.contains("nonexistent"));
        }
        other => panic!("Expected FileAccessDenied, got: {other}"),
    }
}

#[test]
fn test_decode_unsupported_format() {
    // Create a temp file with a .jpg extension (not a raw format)
    let tmp = std::env::temp_dir().join("rawview_test_unsupported.jpg");
    std::fs::write(&tmp, b"not a raw file").unwrap();
    let result = decoder::decode(tmp.to_str().unwrap());
    std::fs::remove_file(&tmp).ok();

    assert!(result.is_err());
    match result.unwrap_err() {
        RawViewError::UnsupportedFormat { .. } | RawViewError::CorruptData { .. } => {
            // Either is acceptable — LibRaw may report different errors
        }
        other => panic!("Expected UnsupportedFormat or CorruptData, got: {other}"),
    }
}

#[test]
fn test_decode_corrupt_file() {
    // Create a temp file with .cr2 extension but garbage content
    let tmp = std::env::temp_dir().join("rawview_test_corrupt.cr2");
    std::fs::write(&tmp, b"this is not a valid CR2 file at all").unwrap();
    let result = decoder::decode(tmp.to_str().unwrap());
    std::fs::remove_file(&tmp).ok();

    assert!(result.is_err());
    // LibRaw should report this as corrupt or unsupported
    match result.unwrap_err() {
        RawViewError::CorruptData { .. } | RawViewError::UnsupportedFormat { .. } => {}
        other => panic!("Expected CorruptData or UnsupportedFormat, got: {other}"),
    }
}

/// This test only runs when TEST_RAW_FILE env var points to a real raw file.
/// Usage: TEST_RAW_FILE=/path/to/image.cr2 cargo test --workspace
#[test]
fn test_decode_real_file() {
    let path = match std::env::var("TEST_RAW_FILE") {
        Ok(p) if !p.is_empty() => p,
        _ => {
            eprintln!("Skipping test_decode_real_file: set TEST_RAW_FILE env var to a raw file path");
            return;
        }
    };

    let result = decoder::decode(&path);
    assert!(result.is_ok(), "Failed to decode {path}: {:?}", result.err());

    let decoded = result.unwrap();

    // Basic sanity checks
    let (w, h) = (decoded.sensor_info.width, decoded.sensor_info.height);
    assert!(w > 0, "Width must be > 0");
    assert!(h > 0, "Height must be > 0");
    assert_eq!(
        decoded.bayer_data.len(),
        (w as usize) * (h as usize),
        "Bayer data length must match width × height"
    );
    assert!(decoded.white_level > 0, "White level must be > 0");

    // Verify CFA pattern was detected
    match &decoded.cfa_pattern {
        rawview_lib::data::cfa::CfaPattern::Bayer { pattern } => {
            println!("Detected Bayer pattern: {:?}", pattern);
        }
        rawview_lib::data::cfa::CfaPattern::XTrans { .. } => {
            println!("Detected X-Trans pattern");
        }
    }

    // Verify EXIF was extracted
    println!(
        "Camera: {} {} | ISO: {} | {:.4}s f/{:.1} | {}mm",
        decoded.exif.make,
        decoded.exif.model,
        decoded.exif.iso,
        decoded.exif.shutter,
        decoded.exif.aperture,
        decoded.exif.focal_length
    );
    println!(
        "Dimensions: {}×{} (raw: {}×{}) | BL: {:?} WL: {} | Bits: {}",
        w, h,
        decoded.sensor_info.raw_width,
        decoded.sensor_info.raw_height,
        decoded.black_levels,
        decoded.white_level,
        decoded.sensor_info.bit_depth
    );

    // Verify some pixel values are in valid range
    let max_val = decoded.bayer_data.iter().max().unwrap_or(&0);
    assert!(
        *max_val <= decoded.white_level,
        "Max pixel value ({max_val}) exceeds white level ({})",
        decoded.white_level
    );
}
