//! Visualization mode renderers.
//!
//! Each mode maps a CFA channel + brightness to an RGBA pixel color.

use crate::data::cfa::CfaChannel;

/// Render a Bayer mosaic pixel: channel determines hue, brightness determines intensity.
/// R → red, G1/G2 → green, B → blue. Alpha is always 255.
#[inline]
pub fn render_bayer_pixel(channel: CfaChannel, brightness: u8) -> [u8; 4] {
    match channel {
        CfaChannel::R => [brightness, 0, 0, 255],
        CfaChannel::G1 | CfaChannel::G2 => [0, brightness, 0, 255],
        CfaChannel::B => [0, 0, brightness, 255],
    }
}

/// Render a grayscale pixel: value mapped to equal R=G=B.
#[inline]
pub fn render_grayscale_pixel(brightness: u8) -> [u8; 4] {
    [brightness, brightness, brightness, 255]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bayer_red() {
        assert_eq!(render_bayer_pixel(CfaChannel::R, 200), [200, 0, 0, 255]);
    }

    #[test]
    fn test_bayer_green1() {
        assert_eq!(render_bayer_pixel(CfaChannel::G1, 150), [0, 150, 0, 255]);
    }

    #[test]
    fn test_bayer_green2() {
        assert_eq!(render_bayer_pixel(CfaChannel::G2, 150), [0, 150, 0, 255]);
    }

    #[test]
    fn test_bayer_blue() {
        assert_eq!(render_bayer_pixel(CfaChannel::B, 100), [0, 0, 100, 255]);
    }

    #[test]
    fn test_grayscale() {
        assert_eq!(render_grayscale_pixel(128), [128, 128, 128, 255]);
    }
}
