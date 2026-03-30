//! 16-bit → 8-bit value scaling for display.
//!
//! All mapping is strictly linear — no gamma, no curves, no tone mapping.
//! This is a display-only transform; raw values are always available via the inspector.

/// Map a 16-bit sensor value to 8-bit brightness using the sensor's black/white levels.
/// Values at or below black_level map to 0; at or above white_level map to 255.
#[inline]
pub fn map_value_raw(value: u16, black_level: u16, white_level: u16) -> u8 {
    if white_level <= black_level {
        return 0;
    }
    if value <= black_level {
        return 0;
    }
    if value >= white_level {
        return 255;
    }
    let range = (white_level - black_level) as u32;
    let offset = (value - black_level) as u32;
    // Use integer math to avoid floating point: (offset * 255 + range/2) / range
    ((offset * 255 + range / 2) / range) as u8
}

/// Map a 16-bit sensor value to 8-bit brightness using actual data min/max.
/// Stretches the visible range to use the full 0-255 output space.
#[inline]
pub fn map_value_stretch(value: u16, min_val: u16, max_val: u16) -> u8 {
    map_value_raw(value, min_val, max_val)
}

/// Compute the actual min and max values in a Bayer data slice.
pub fn compute_data_range(data: &[u16]) -> (u16, u16) {
    if data.is_empty() {
        return (0, 0);
    }
    let mut min = u16::MAX;
    let mut max = 0u16;
    for &v in data {
        if v < min {
            min = v;
        }
        if v > max {
            max = v;
        }
    }
    (min, max)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_map_value_raw_boundaries() {
        // Black level → 0
        assert_eq!(map_value_raw(512, 512, 16383), 0);
        // Below black → 0
        assert_eq!(map_value_raw(100, 512, 16383), 0);
        // White level → 255
        assert_eq!(map_value_raw(16383, 512, 16383), 255);
        // Above white → 255
        assert_eq!(map_value_raw(20000, 512, 16383), 255);
    }

    #[test]
    fn test_map_value_raw_midpoint() {
        // Midpoint between 0 and 16383 should be ~128
        let mid = (0 + 16383) / 2;
        let result = map_value_raw(mid, 0, 16383);
        assert!((125..=130).contains(&result), "Midpoint mapped to {result}, expected ~128");
    }

    #[test]
    fn test_map_value_raw_degenerate() {
        // Equal black and white
        assert_eq!(map_value_raw(100, 100, 100), 0);
        // White below black
        assert_eq!(map_value_raw(100, 200, 100), 0);
    }

    #[test]
    fn test_compute_data_range() {
        let data: Vec<u16> = vec![100, 500, 200, 50, 1000];
        assert_eq!(compute_data_range(&data), (50, 1000));
    }

    #[test]
    fn test_compute_data_range_empty() {
        assert_eq!(compute_data_range(&[]), (0, 0));
    }
}
