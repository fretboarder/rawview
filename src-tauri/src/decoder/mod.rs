pub mod libraw_decoder;

use crate::data::cfa::CfaPattern;
use crate::data::metadata::{ExifData, SensorInfo};
use crate::error::RawViewError;

/// Decoded raw file data ready for BayerDataStore.
#[derive(Debug)]
pub struct DecodedRaw {
    /// Raw 16-bit Bayer array (active area only, row-major)
    pub bayer_data: Vec<u16>,
    /// CFA pattern
    pub cfa_pattern: CfaPattern,
    /// Effective per-channel black levels [R, G1, B, G2]
    pub black_levels: [u16; 4],
    /// White level (saturation point)
    pub white_level: u16,
    /// Sensor geometry
    pub sensor_info: SensorInfo,
    /// EXIF metadata
    pub exif: ExifData,
}

/// Decode a raw file and return the decoded data.
pub fn decode(path: &str) -> Result<DecodedRaw, RawViewError> {
    libraw_decoder::decode(path)
}
