//! Viewport renderer — generates RGBA bitmaps from BayerDataStore.
//!
//! Renders a viewport-sized region of the sensor data in the requested
//! visualization mode, parallelized with rayon.

use rayon::prelude::*;

use crate::data::bayer_store::BayerDataStore;
use crate::error::RawViewError;
use crate::render::modes;
use crate::render::scaling;

/// Parameters for a viewport render request.
#[derive(Debug, Clone)]
pub struct ViewportParams {
    pub session_id: String,
    pub mode: RenderMode,
    pub zoom: ZoomLevel,
    /// Viewport output width in pixels
    pub w: u32,
    /// Viewport output height in pixels
    pub h: u32,
    /// Source origin X (in sensor coordinates, for panned views)
    pub x: f64,
    /// Source origin Y (in sensor coordinates, for panned views)
    pub y: f64,
    /// Display stretch mode
    pub stretch: bool,
}

/// Visualization mode.
#[derive(Debug, Clone, PartialEq)]
pub enum RenderMode {
    Bayer,
    Grayscale,
    ChannelR,
    ChannelG1,
    ChannelG2,
    ChannelB,
}

/// Zoom level specification.
#[derive(Debug, Clone)]
pub enum ZoomLevel {
    /// Fit entire sensor in viewport
    Fit,
    /// Scale factor: 1.0 = 1:1, 2.0 = 2× magnification, 0.5 = half size
    Scale(f64),
}

/// Parse viewport parameters from a URL query string.
pub fn parse_viewport_params(query: &str) -> Result<ViewportParams, RawViewError> {
    let mut session_id = String::new();
    let mut mode = RenderMode::Bayer;
    let mut zoom = ZoomLevel::Fit;
    let mut w: u32 = 800;
    let mut h: u32 = 600;
    let mut x: f64 = 0.0;
    let mut y: f64 = 0.0;
    let mut stretch = false;

    for pair in query.split('&') {
        let mut kv = pair.splitn(2, '=');
        let key = kv.next().unwrap_or("");
        let val = kv.next().unwrap_or("");
        match key {
            "session" => session_id = val.to_string(),
            "mode" => {
                mode = match val {
                    "bayer" => RenderMode::Bayer,
                    "grayscale" => RenderMode::Grayscale,
                    "channel_r" => RenderMode::ChannelR,
                    "channel_g1" => RenderMode::ChannelG1,
                    "channel_g2" => RenderMode::ChannelG2,
                    "channel_b" => RenderMode::ChannelB,
                    _ => RenderMode::Bayer,
                };
            }
            "zoom" => {
                zoom = if val == "fit" {
                    ZoomLevel::Fit
                } else {
                    ZoomLevel::Scale(val.parse().unwrap_or(1.0))
                };
            }
            "w" => w = val.parse().unwrap_or(800),
            "h" => h = val.parse().unwrap_or(600),
            "x" => x = val.parse().unwrap_or(0.0),
            "y" => y = val.parse().unwrap_or(0.0),
            "stretch" => stretch = val == "true",
            _ => {}
        }
    }

    // Clamp viewport size to reasonable limits
    w = w.clamp(1, 8192);
    h = h.clamp(1, 8192);

    Ok(ViewportParams {
        session_id,
        mode,
        zoom,
        w,
        h,
        x,
        y,
        stretch,
    })
}

/// Render a viewport from the BayerDataStore.
/// Returns an RGBA pixel buffer of size (w × h × 4).
pub fn render(store: &BayerDataStore, params: &ViewportParams) -> Result<Vec<u8>, RawViewError> {
    let (sensor_w, sensor_h) = store.dimensions();
    let out_w = params.w as usize;
    let out_h = params.h as usize;

    // Determine scale factor
    let scale = match &params.zoom {
        ZoomLevel::Fit => {
            let sx = out_w as f64 / sensor_w as f64;
            let sy = out_h as f64 / sensor_h as f64;
            sx.min(sy)
        }
        ZoomLevel::Scale(s) => *s,
    };

    // Compute source origin for fit mode (center the image)
    let (src_x, src_y) = match &params.zoom {
        ZoomLevel::Fit => {
            // Center the sensor in the viewport
            let rendered_w = sensor_w as f64 * scale;
            let rendered_h = sensor_h as f64 * scale;
            let offset_x = -(out_w as f64 - rendered_w) / 2.0 / scale;
            let offset_y = -(out_h as f64 - rendered_h) / 2.0 / scale;
            (offset_x, offset_y)
        }
        ZoomLevel::Scale(_) => (params.x, params.y),
    };

    // Determine value mapping range
    let (map_min, map_max) = if params.stretch {
        // Stretch mode: percentile-based range for usable display
        scaling::compute_stretch_range(store.raw_data())
    } else {
        // Raw mode: full sensor range (BL to WL) — very dark, for analysis
        let bl = store.black_levels();
        let avg_bl = ((bl[0] as u32 + bl[1] as u32 + bl[2] as u32 + bl[3] as u32) / 4) as u16;
        (avg_bl, store.white_level())
    };

    // Allocate output buffer
    let mut rgba = vec![0u8; out_w * out_h * 4];

    log::info!(
        "Render: sensor={}×{}, output={}×{}, scale={:.6}, src_origin=({:.2},{:.2}), map=[{}..{}]",
        sensor_w, sensor_h, out_w, out_h, scale, src_x, src_y, map_min, map_max
    );

    // Sample a few pixel values for debugging
    {
        let center_row = sensor_h / 2;
        let center_col = sensor_w / 2;
        if let Some(v) = store.get_photosite(center_row, center_col) {
            let b = scaling::map_value_raw(v, map_min, map_max);
            log::info!("Sample pixel at ({center_row},{center_col}): raw={v}, brightness={b}, channel={:?}", store.get_channel(center_row, center_col));
        }
        if let Some(v) = store.get_photosite(0, 0) {
            log::info!("Sample pixel at (0,0): raw={v}");
        }
        if let Some(v) = store.get_photosite(100, 100) {
            log::info!("Sample pixel at (100,100): raw={v}");
        }
    }

    // Render rows in parallel with rayon
    rgba.par_chunks_mut(out_w * 4)
        .enumerate()
        .for_each(|(out_row, row_buf)| {
            for out_col in 0..out_w {
                // Map output pixel to source sensor coordinate (nearest-neighbor)
                let src_col_f = src_x + out_col as f64 / scale;
                let src_row_f = src_y + out_row as f64 / scale;

                let pixel = if src_col_f < 0.0
                    || src_row_f < 0.0
                    || src_col_f >= sensor_w as f64
                    || src_row_f >= sensor_h as f64
                {
                    // Out of bounds — render as dark gray
                    [32u8, 32, 32, 255]
                } else {
                    let src_row = src_row_f as u32;
                    let src_col = src_col_f as u32;
                    let value = store.get_photosite(src_row, src_col).unwrap_or(0);
                    let brightness = scaling::map_value_raw(value, map_min, map_max);

                    match &params.mode {
                        RenderMode::Bayer => {
                            let channel = store.get_channel(src_row, src_col);
                            modes::render_bayer_pixel(channel, brightness)
                        }
                        RenderMode::Grayscale => modes::render_grayscale_pixel(brightness),
                        RenderMode::ChannelR => {
                            let channel = store.get_channel(src_row, src_col);
                            modes::render_channel_pixel(channel, brightness, &crate::data::cfa::CfaChannel::R)
                        }
                        RenderMode::ChannelG1 => {
                            let channel = store.get_channel(src_row, src_col);
                            modes::render_channel_pixel(channel, brightness, &crate::data::cfa::CfaChannel::G1)
                        }
                        RenderMode::ChannelG2 => {
                            let channel = store.get_channel(src_row, src_col);
                            modes::render_channel_pixel(channel, brightness, &crate::data::cfa::CfaChannel::G2)
                        }
                        RenderMode::ChannelB => {
                            let channel = store.get_channel(src_row, src_col);
                            modes::render_channel_pixel(channel, brightness, &crate::data::cfa::CfaChannel::B)
                        }
                    }
                };

                let offset = out_col * 4;
                row_buf[offset..offset + 4].copy_from_slice(&pixel);
            }
        });

    Ok(rgba)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data::bayer_store::BayerDataStore;
    use crate::data::cfa::{BayerPattern, CfaPattern};
    use crate::data::metadata::{ExifData, SensorInfo};

    fn make_test_store() -> BayerDataStore {
        // 4×4 sensor with known values (RGGB pattern)
        // Values: 0=black, 1000=mid, 16383=white
        let data: Vec<u16> = vec![
            1000, 2000, 1000, 2000, // row 0: R  G1 R  G1
            3000, 4000, 3000, 4000, // row 1: G2 B  G2 B
            5000, 6000, 5000, 6000, // row 2: R  G1 R  G1
            7000, 8000, 7000, 8000, // row 3: G2 B  G2 B
        ];
        BayerDataStore::new(
            data,
            CfaPattern::Bayer {
                pattern: BayerPattern::Rggb,
            },
            [0, 0, 0, 0],
            16383,
            SensorInfo {
                raw_width: 4,
                raw_height: 4,
                width: 4,
                height: 4,
                top_margin: 0,
                left_margin: 0,
                bit_depth: 14,
            },
            ExifData::default(),
        )
    }

    #[test]
    fn test_render_bayer_fit() {
        let store = make_test_store();
        let params = ViewportParams {
            session_id: "test".to_string(),
            mode: RenderMode::Bayer,
            zoom: ZoomLevel::Fit,
            w: 4,
            h: 4,
            x: 0.0,
            y: 0.0,
            stretch: false,
        };
        let rgba = render(&store, &params).unwrap();
        assert_eq!(rgba.len(), 4 * 4 * 4); // 4×4 pixels × 4 bytes

        // Top-left pixel is R channel with value 1000/16383 → ~15 brightness
        // Should be (brightness, 0, 0, 255)
        assert!(rgba[0] > 0); // Red component > 0
        assert_eq!(rgba[1], 0); // Green = 0
        assert_eq!(rgba[2], 0); // Blue = 0
        assert_eq!(rgba[3], 255); // Alpha = 255
    }

    #[test]
    fn test_render_grayscale() {
        let store = make_test_store();
        let params = ViewportParams {
            session_id: "test".to_string(),
            mode: RenderMode::Grayscale,
            zoom: ZoomLevel::Fit,
            w: 4,
            h: 4,
            x: 0.0,
            y: 0.0,
            stretch: false,
        };
        let rgba = render(&store, &params).unwrap();
        // Grayscale: R = G = B for every pixel
        for pixel in rgba.chunks(4) {
            assert_eq!(pixel[0], pixel[1], "R != G for grayscale");
            assert_eq!(pixel[1], pixel[2], "G != B for grayscale");
            assert_eq!(pixel[3], 255);
        }
    }

    #[test]
    fn test_render_zoomed() {
        let store = make_test_store();
        let params = ViewportParams {
            session_id: "test".to_string(),
            mode: RenderMode::Bayer,
            zoom: ZoomLevel::Scale(2.0), // 2× zoom
            w: 4,
            h: 4,
            x: 0.0,
            y: 0.0,
            stretch: false,
        };
        let rgba = render(&store, &params).unwrap();
        assert_eq!(rgba.len(), 4 * 4 * 4);
        // At 2× zoom, each source pixel covers 2×2 output pixels
        // (0,0) and (1,0) and (0,1) and (1,1) should all map to source (0,0) = R channel
        assert_eq!(rgba[0], rgba[4]); // Same brightness
    }

    #[test]
    fn test_parse_viewport_params() {
        let params =
            parse_viewport_params("session=abc&mode=bayer&zoom=fit&w=1920&h=1080&stretch=true")
                .unwrap();
        assert_eq!(params.session_id, "abc");
        assert_eq!(params.mode, RenderMode::Bayer);
        assert!(matches!(params.zoom, ZoomLevel::Fit));
        assert_eq!(params.w, 1920);
        assert_eq!(params.h, 1080);
        assert!(params.stretch);
    }

    #[test]
    fn test_parse_viewport_params_numeric_zoom() {
        let params = parse_viewport_params("zoom=2.5&x=100&y=200").unwrap();
        assert!(matches!(params.zoom, ZoomLevel::Scale(s) if (s - 2.5).abs() < f64::EPSILON));
        assert!((params.x - 100.0).abs() < f64::EPSILON);
        assert!((params.y - 200.0).abs() < f64::EPSILON);
    }
}
