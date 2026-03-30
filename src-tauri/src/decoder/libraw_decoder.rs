//! LibRaw-based raw file decoder.
//!
//! Decodes camera raw files via LibRaw FFI and produces a DecodedRaw struct
//! with the Bayer array (active area only), CFA pattern, levels, and metadata.

use std::ffi::CString;
use std::os::raw::c_char;
use std::path::Path;

use rawview_libraw_sys::*;

use crate::data::cfa::{bayer_pattern_from_color_indices, CfaPattern};
use crate::data::metadata::{ExifData, SensorInfo};
use crate::decoder::DecodedRaw;
use crate::error::RawViewError;

/// RAII guard that ensures libraw_close() is called on drop.
struct LibRawGuard {
    ptr: *mut libraw_data_t,
}

impl LibRawGuard {
    fn new() -> Result<Self, RawViewError> {
        let ptr = unsafe { libraw_init(0) };
        if ptr.is_null() {
            return Err(RawViewError::DecoderError {
                source: "libraw_init returned null".to_string(),
            });
        }
        Ok(Self { ptr })
    }

    fn as_ptr(&self) -> *mut libraw_data_t {
        self.ptr
    }
}

impl Drop for LibRawGuard {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe { libraw_close(self.ptr) };
        }
    }
}

/// Decode a camera raw file and return the raw Bayer data + metadata.
pub fn decode(path: &str) -> Result<DecodedRaw, RawViewError> {
    // Validate path exists and is readable
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(RawViewError::FileAccessDenied {
            path: path.to_string(),
        });
    }

    let extension = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // Initialize LibRaw (auto-closes on drop)
    let lr = LibRawGuard::new()?;

    // Open file
    let c_path = CString::new(path).map_err(|_| RawViewError::FileAccessDenied {
        path: path.to_string(),
    })?;

    let ret = unsafe { libraw_open_file(lr.as_ptr(), c_path.as_ptr()) };
    if ret != 0 {
        return Err(match ret {
            // LibRaw error codes: LIBRAW_FILE_UNSUPPORTED = -5, LIBRAW_INPUT_CLOSED = -7
            -5 => RawViewError::UnsupportedFormat { extension },
            _ => RawViewError::CorruptData {
                detail: format!("libraw_open_file returned error code {ret}"),
            },
        });
    }

    // Unpack raw data
    let ret = unsafe { libraw_unpack(lr.as_ptr()) };
    if ret != 0 {
        return Err(RawViewError::CorruptData {
            detail: format!("libraw_unpack returned error code {ret}"),
        });
    }

    // Get raw image pointer
    let raw_image_ptr = unsafe { rawview_get_raw_image(lr.as_ptr()) };
    if raw_image_ptr.is_null() {
        return Err(RawViewError::UnsupportedFormat {
            extension: format!("{extension} (no single-channel raw data — may be Foveon or multi-channel)"),
        });
    }

    // Get dimensions
    let (raw_width, raw_height, width, height, top_margin, left_margin) = get_sizes(lr.as_ptr());
    let raw_pitch = unsafe { rawview_get_raw_pitch(lr.as_ptr()) } as usize;

    // Get CFA pattern
    let filters = unsafe { rawview_get_filters(lr.as_ptr()) };
    let cfa_pattern = detect_cfa_pattern(filters, lr.as_ptr())?;

    // Get black/white levels
    let (black_levels, white_level) = get_levels(lr.as_ptr());

    // Get EXIF
    let exif = get_exif(lr.as_ptr());

    // Determine bit depth from white level
    let bit_depth = if white_level > 16383 {
        16
    } else if white_level > 4095 {
        14
    } else if white_level > 1023 {
        12
    } else {
        10
    };

    // Copy active area Bayer data into owned Vec<u16>
    let w = width as usize;
    let h = height as usize;
    let pitch_pixels = raw_pitch / 2; // raw_pitch is in bytes, array is u16
    let top = top_margin as usize;
    let left = left_margin as usize;

    let total_raw_pixels = (raw_height as usize) * pitch_pixels;
    let raw_slice = unsafe { std::slice::from_raw_parts(raw_image_ptr, total_raw_pixels) };

    let mut bayer_data = Vec::with_capacity(w * h);
    for row in 0..h {
        let src_row = row + top;
        let src_offset = src_row * pitch_pixels + left;
        let end_offset = src_offset + w;
        if end_offset > raw_slice.len() {
            return Err(RawViewError::CorruptData {
                detail: format!(
                    "Raw data bounds exceeded: offset {end_offset} > len {}",
                    raw_slice.len()
                ),
            });
        }
        bayer_data.extend_from_slice(&raw_slice[src_offset..end_offset]);
    }

    let sensor_info = SensorInfo {
        raw_width: raw_width as u32,
        raw_height: raw_height as u32,
        width: width as u32,
        height: height as u32,
        top_margin: top_margin as u32,
        left_margin: left_margin as u32,
        bit_depth,
    };

    // LibRawGuard drops here, calling libraw_close()
    Ok(DecodedRaw {
        bayer_data,
        cfa_pattern,
        black_levels,
        white_level,
        sensor_info,
        exif,
    })
}

/// Get sensor dimensions from LibRaw.
fn get_sizes(lr: *mut libraw_data_t) -> (u16, u16, u16, u16, u16, u16) {
    let mut raw_w: u16 = 0;
    let mut raw_h: u16 = 0;
    let mut w: u16 = 0;
    let mut h: u16 = 0;
    let mut top: u16 = 0;
    let mut left: u16 = 0;
    unsafe {
        rawview_get_sizes(lr, &mut raw_w, &mut raw_h, &mut w, &mut h, &mut top, &mut left);
    }
    (raw_w, raw_h, w, h, top, left)
}

/// Detect CFA pattern from LibRaw filters value.
fn detect_cfa_pattern(
    filters: u32,
    lr: *mut libraw_data_t,
) -> Result<CfaPattern, RawViewError> {
    if filters == 9 {
        // Fuji X-Trans: read 6×6 pattern from iparams
        let iparams = unsafe { libraw_get_iparams(lr) };
        if iparams.is_null() {
            return Err(RawViewError::DecoderError {
                source: "libraw_get_iparams returned null".to_string(),
            });
        }
        let xtrans_raw = unsafe { (*iparams).xtrans };
        let mut grid = [[0u8; 6]; 6];
        for r in 0..6 {
            for c in 0..6 {
                grid[r][c] = xtrans_raw[r][c] as u8;
            }
        }
        Ok(CfaPattern::XTrans { grid })
    } else if filters == 0 {
        Err(RawViewError::UnsupportedFormat {
            extension: "non-Bayer sensor (Foveon or similar)".to_string(),
        })
    } else {
        // Standard Bayer: read first 2×2 color indices
        let tl = unsafe { libraw_COLOR(lr, 0, 0) };
        let tr = unsafe { libraw_COLOR(lr, 0, 1) };
        let bl = unsafe { libraw_COLOR(lr, 1, 0) };
        let br = unsafe { libraw_COLOR(lr, 1, 1) };

        let pattern = bayer_pattern_from_color_indices(tl, tr, bl, br).ok_or_else(|| {
            RawViewError::DecoderError {
                source: format!("Unknown Bayer pattern: tl={tl} tr={tr} bl={bl} br={br}"),
            }
        })?;

        Ok(CfaPattern::Bayer { pattern })
    }
}

/// Get effective per-channel black levels and white level.
fn get_levels(lr: *mut libraw_data_t) -> ([u16; 4], u16) {
    let mut black: u32 = 0;
    let mut cblack = [0u32; 4];
    let mut maximum: u32 = 0;
    unsafe {
        rawview_get_color_info(lr, &mut black, cblack.as_mut_ptr(), &mut maximum);
    }

    // Combined effective black level per channel
    let black_levels = [
        (black + cblack[0]).min(u16::MAX as u32) as u16,
        (black + cblack[1]).min(u16::MAX as u32) as u16,
        (black + cblack[2]).min(u16::MAX as u32) as u16,
        (black + cblack[3]).min(u16::MAX as u32) as u16,
    ];

    let white_level = maximum.min(u16::MAX as u32) as u16;

    (black_levels, white_level)
}

/// Extract EXIF metadata.
fn get_exif(lr: *mut libraw_data_t) -> ExifData {
    let mut iso: f32 = 0.0;
    let mut shutter: f32 = 0.0;
    let mut aperture: f32 = 0.0;
    let mut focal_len: f32 = 0.0;
    let mut timestamp: i64 = 0;
    unsafe {
        rawview_get_imgother(lr, &mut iso, &mut shutter, &mut aperture, &mut focal_len, &mut timestamp);
    }

    // Camera make/model from iparams
    let iparams = unsafe { libraw_get_iparams(lr) };
    let (make, model) = if !iparams.is_null() {
        unsafe {
            let make = c_char_array_to_string(&(*iparams).make);
            let model = c_char_array_to_string(&(*iparams).model);
            (make, model)
        }
    } else {
        (String::new(), String::new())
    };

    // Lens name
    let mut lens_buf = [0i8; 128];
    unsafe {
        rawview_get_lens_name(lr, lens_buf.as_mut_ptr(), 128);
    }
    let lens = c_char_array_to_string(&lens_buf);

    ExifData {
        make,
        model,
        iso,
        shutter,
        aperture,
        focal_length: focal_len,
        timestamp: timestamp as i32,
        lens,
    }
}

/// Convert a null-terminated C char array to a Rust String.
fn c_char_array_to_string(arr: &[c_char]) -> String {
    let bytes: Vec<u8> = arr
        .iter()
        .take_while(|&&c| c != 0)
        .map(|&c| c as u8)
        .collect();
    String::from_utf8_lossy(&bytes).to_string()
}
