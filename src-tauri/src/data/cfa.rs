//! CFA (Color Filter Array) pattern types.

use serde::{Deserialize, Serialize};
use specta::Type;

/// The CFA pattern of the sensor.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum CfaPattern {
    /// Standard 2×2 Bayer pattern
    Bayer { pattern: BayerPattern },
    /// Fuji X-Trans 6×6 pattern
    XTrans { grid: [[u8; 6]; 6] },
}

/// Standard 2×2 Bayer pattern variants.
/// Named by the top-left 2×2 arrangement.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum BayerPattern {
    /// R G / G B
    Rggb,
    /// B G / G R
    Bggr,
    /// G R / B G
    Grbg,
    /// G B / R G
    Gbrg,
}

/// Individual CFA channel identity.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum CfaChannel {
    R,
    G1,
    G2,
    B,
}

impl CfaPattern {
    /// Get the CFA channel for a given sensor coordinate.
    pub fn channel_at(&self, row: u32, col: u32) -> CfaChannel {
        match self {
            CfaPattern::Bayer { pattern } => pattern.channel_at(row, col),
            CfaPattern::XTrans { grid } => {
                let r = (row % 6) as usize;
                let c = (col % 6) as usize;
                match grid[r][c] {
                    0 => CfaChannel::R,
                    2 => CfaChannel::B,
                    // X-Trans has only one "green" concept; we map all greens to G1
                    _ => CfaChannel::G1,
                }
            }
        }
    }

    /// Human-readable label for the pattern.
    pub fn label(&self) -> &'static str {
        match self {
            CfaPattern::Bayer { pattern } => pattern.label(),
            CfaPattern::XTrans { .. } => "X-Trans 6×6",
        }
    }
}

impl BayerPattern {
    /// Get the CFA channel for a given sensor coordinate.
    pub fn channel_at(&self, row: u32, col: u32) -> CfaChannel {
        let r = (row % 2) as usize;
        let c = (col % 2) as usize;
        let layout = self.layout();
        layout[r][c]
    }

    /// The 2×2 channel layout for this Bayer variant.
    fn layout(&self) -> [[CfaChannel; 2]; 2] {
        use CfaChannel::*;
        match self {
            BayerPattern::Rggb => [[R, G1], [G2, B]],
            BayerPattern::Bggr => [[B, G1], [G2, R]],
            BayerPattern::Grbg => [[G1, R], [B, G2]],
            BayerPattern::Gbrg => [[G1, B], [R, G2]],
        }
    }

    pub fn label(&self) -> &'static str {
        match self {
            BayerPattern::Rggb => "RGGB",
            BayerPattern::Bggr => "BGGR",
            BayerPattern::Grbg => "GRBG",
            BayerPattern::Gbrg => "GBRG",
        }
    }
}

/// Map LibRaw COLOR() output (0=R, 1=G, 2=B, 3=G2) for the first 2×2
/// to a BayerPattern enum variant.
pub fn bayer_pattern_from_color_indices(tl: i32, tr: i32, bl: i32, br: i32) -> Option<BayerPattern> {
    // LibRaw COLOR: 0=R, 1=G, 2=B, 3=G2
    // We need to identify which 2×2 pattern this is
    match (tl, tr, bl, br) {
        (0, 1, 3, 2) | (0, 1, 1, 2) => Some(BayerPattern::Rggb),
        (2, 1, 3, 0) | (2, 1, 1, 0) => Some(BayerPattern::Bggr),
        (1, 0, 2, 3) | (1, 0, 2, 1) => Some(BayerPattern::Grbg),
        (1, 2, 0, 3) | (1, 2, 0, 1) => Some(BayerPattern::Gbrg),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rggb_channel_at() {
        let p = BayerPattern::Rggb;
        assert_eq!(p.channel_at(0, 0), CfaChannel::R);
        assert_eq!(p.channel_at(0, 1), CfaChannel::G1);
        assert_eq!(p.channel_at(1, 0), CfaChannel::G2);
        assert_eq!(p.channel_at(1, 1), CfaChannel::B);
        // Repeating pattern
        assert_eq!(p.channel_at(2, 2), CfaChannel::R);
        assert_eq!(p.channel_at(3, 3), CfaChannel::B);
    }

    #[test]
    fn test_bggr_channel_at() {
        let p = BayerPattern::Bggr;
        assert_eq!(p.channel_at(0, 0), CfaChannel::B);
        assert_eq!(p.channel_at(0, 1), CfaChannel::G1);
        assert_eq!(p.channel_at(1, 0), CfaChannel::G2);
        assert_eq!(p.channel_at(1, 1), CfaChannel::R);
    }

    #[test]
    fn test_pattern_from_color_indices() {
        assert_eq!(
            bayer_pattern_from_color_indices(0, 1, 3, 2),
            Some(BayerPattern::Rggb)
        );
        assert_eq!(
            bayer_pattern_from_color_indices(2, 1, 3, 0),
            Some(BayerPattern::Bggr)
        );
        assert_eq!(
            bayer_pattern_from_color_indices(1, 0, 2, 3),
            Some(BayerPattern::Grbg)
        );
        assert_eq!(
            bayer_pattern_from_color_indices(1, 2, 0, 3),
            Some(BayerPattern::Gbrg)
        );
        assert_eq!(bayer_pattern_from_color_indices(0, 0, 0, 0), None);
    }
}
