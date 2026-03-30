//! BayerDataStore — immutable owner of decoded raw sensor data.
//!
//! This is the single source of truth for all sensor data in a session.
//! After creation, the data is never modified.

use super::cfa::{CfaChannel, CfaPattern};
use super::metadata::{ExifData, SensorInfo};

/// Immutable store for decoded raw Bayer sensor data.
///
/// Owns the 16-bit Bayer array (active area only, no margins),
/// CFA pattern, black/white levels, sensor info, and EXIF metadata.
pub struct BayerDataStore {
    /// Raw 16-bit Bayer array (active area, row-major, width × height)
    bayer_data: Vec<u16>,
    /// CFA pattern (Bayer 2×2 or X-Trans 6×6)
    cfa_pattern: CfaPattern,
    /// Effective per-channel black levels [R, G1, B, G2]
    black_levels: [u16; 4],
    /// White level (saturation point)
    white_level: u16,
    /// Sensor geometry
    sensor_info: SensorInfo,
    /// EXIF metadata
    exif: ExifData,
}

impl BayerDataStore {
    /// Create a new BayerDataStore from decoded raw data.
    pub fn new(
        bayer_data: Vec<u16>,
        cfa_pattern: CfaPattern,
        black_levels: [u16; 4],
        white_level: u16,
        sensor_info: SensorInfo,
        exif: ExifData,
    ) -> Self {
        Self {
            bayer_data,
            cfa_pattern,
            black_levels,
            white_level,
            sensor_info,
            exif,
        }
    }

    /// Get the raw u16 value at (row, col) in the active area.
    /// Returns None if coordinates are out of bounds.
    pub fn get_photosite(&self, row: u32, col: u32) -> Option<u16> {
        let w = self.sensor_info.width;
        let h = self.sensor_info.height;
        if row >= h || col >= w {
            return None;
        }
        let idx = (row as usize) * (w as usize) + (col as usize);
        self.bayer_data.get(idx).copied()
    }

    /// Get the CFA channel at (row, col).
    pub fn get_channel(&self, row: u32, col: u32) -> CfaChannel {
        self.cfa_pattern.channel_at(row, col)
    }

    /// Active area dimensions (width, height).
    pub fn dimensions(&self) -> (u32, u32) {
        (self.sensor_info.width, self.sensor_info.height)
    }

    /// Reference to the CFA pattern.
    pub fn cfa_pattern(&self) -> &CfaPattern {
        &self.cfa_pattern
    }

    /// Per-channel black levels [R, G1, B, G2].
    pub fn black_levels(&self) -> &[u16; 4] {
        &self.black_levels
    }

    /// White level (saturation point).
    pub fn white_level(&self) -> u16 {
        self.white_level
    }

    /// Reference to sensor geometry.
    pub fn sensor_info(&self) -> &SensorInfo {
        &self.sensor_info
    }

    /// Reference to EXIF metadata.
    pub fn exif(&self) -> &ExifData {
        &self.exif
    }

    /// Reference to the raw Bayer data slice.
    pub fn raw_data(&self) -> &[u16] {
        &self.bayer_data
    }

    /// Total number of photosites in the active area.
    pub fn pixel_count(&self) -> usize {
        self.bayer_data.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data::cfa::BayerPattern;

    fn make_test_store() -> BayerDataStore {
        // 4×4 test Bayer array with known values
        let data: Vec<u16> = vec![
            100, 200, 300, 400,
            500, 600, 700, 800,
            900, 1000, 1100, 1200,
            1300, 1400, 1500, 1600,
        ];
        BayerDataStore::new(
            data,
            CfaPattern::Bayer { pattern: BayerPattern::Rggb },
            [64, 64, 64, 64],
            16383,
            SensorInfo {
                raw_width: 6, raw_height: 6,
                width: 4, height: 4,
                top_margin: 1, left_margin: 1,
                bit_depth: 14,
            },
            ExifData::default(),
        )
    }

    #[test]
    fn test_get_photosite() {
        let store = make_test_store();
        assert_eq!(store.get_photosite(0, 0), Some(100));
        assert_eq!(store.get_photosite(0, 3), Some(400));
        assert_eq!(store.get_photosite(3, 3), Some(1600));
        assert_eq!(store.get_photosite(4, 0), None); // Out of bounds
    }

    #[test]
    fn test_dimensions() {
        let store = make_test_store();
        assert_eq!(store.dimensions(), (4, 4));
    }

    #[test]
    fn test_get_channel() {
        let store = make_test_store();
        assert_eq!(store.get_channel(0, 0), CfaChannel::R);
        assert_eq!(store.get_channel(0, 1), CfaChannel::G1);
    }
}
