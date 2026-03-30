//! Metadata types for raw files.

use serde::Serialize;
use specta::Type;

/// Sensor geometry information.
#[derive(Debug, Clone, Serialize, Type)]
pub struct SensorInfo {
    /// Full sensor width including margins
    pub raw_width: u32,
    /// Full sensor height including margins
    pub raw_height: u32,
    /// Active image width
    pub width: u32,
    /// Active image height
    pub height: u32,
    /// Top margin (offset from raw to active)
    pub top_margin: u32,
    /// Left margin (offset from raw to active)
    pub left_margin: u32,
    /// Bits per sample (typically 12, 14, or 16)
    pub bit_depth: u32,
}

/// EXIF metadata extracted from the raw file.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ExifData {
    pub make: String,
    pub model: String,
    pub iso: f32,
    pub shutter: f32,
    pub aperture: f32,
    pub focal_length: f32,
    pub timestamp: i64,
    pub lens: String,
}

impl Default for ExifData {
    fn default() -> Self {
        Self {
            make: String::new(),
            model: String::new(),
            iso: 0.0,
            shutter: 0.0,
            aperture: 0.0,
            focal_length: 0.0,
            timestamp: 0,
            lens: String::new(),
        }
    }
}
