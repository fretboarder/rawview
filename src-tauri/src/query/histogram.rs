//! Histogram computation from raw Bayer data.
//!
//! Computes 256-bin histograms from the raw u16 Bayer array using rayon parallelism.
//! All computation happens on exact sensor values — no display transforms applied.

use rayon::prelude::*;
use serde::Serialize;
use specta::Type;

use crate::data::bayer_store::BayerDataStore;
use crate::data::cfa::CfaChannel;

/// Histogram data for a single channel or combined.
#[derive(Debug, Clone, Serialize, Type)]
pub struct HistogramData {
    /// 256 bin counts
    pub bins: Vec<u32>,
    /// Number of bins (always 256)
    pub bin_count: u32,
    /// Minimum value in the data
    pub min_value: u16,
    /// Maximum value in the data
    pub max_value: u16,
    /// Black level used for bin mapping
    pub black_level: u16,
    /// White level used for bin mapping
    pub white_level: u16,
}

/// Compute a histogram from the BayerDataStore.
///
/// If `channel` is Some, only counts photosites matching that channel.
/// If `channel` is None, counts all photosites (combined histogram).
pub fn compute_histogram(
    store: &BayerDataStore,
    channel: Option<CfaChannel>,
) -> HistogramData {
    let bl = store.black_levels();
    let avg_bl = ((bl[0] as u32 + bl[1] as u32 + bl[2] as u32 + bl[3] as u32) / 4) as u16;
    let wl = store.white_level();
    let (width, _height) = store.dimensions();
    let data = store.raw_data();

    // Use rayon to compute partial histograms per chunk, then merge
    let chunk_size = 64 * width as usize; // ~64 rows per chunk
    let partial_histograms: Vec<([u32; 256], u16, u16)> = data
        .par_chunks(chunk_size)
        .enumerate()
        .map(|(chunk_idx, chunk)| {
            let mut bins = [0u32; 256];
            let mut min_val = u16::MAX;
            let mut max_val = 0u16;
            let start_row = (chunk_idx * chunk_size) / width as usize;

            for (i, &value) in chunk.iter().enumerate() {
                let row = start_row + i / width as usize;
                let col = i % width as usize;

                // Filter by channel if specified
                if let Some(ref ch) = channel {
                    let pixel_ch = store.get_channel(row as u32, col as u32);
                    if std::mem::discriminant(&pixel_ch) != std::mem::discriminant(ch) {
                        continue;
                    }
                }

                // Track min/max
                if value < min_val {
                    min_val = value;
                }
                if value > max_val {
                    max_val = value;
                }

                // Map value to bin index
                let bin = if wl <= avg_bl || value <= avg_bl {
                    0
                } else if value >= wl {
                    255
                } else {
                    let range = (wl - avg_bl) as u32;
                    let offset = (value - avg_bl) as u32;
                    ((offset * 255 + range / 2) / range) as usize
                };

                bins[bin.min(255)] += 1;
            }

            (bins, min_val, max_val)
        })
        .collect();

    // Merge partial histograms
    let mut final_bins = [0u32; 256];
    let mut final_min = u16::MAX;
    let mut final_max = 0u16;

    for (bins, min_val, max_val) in &partial_histograms {
        for (i, &count) in bins.iter().enumerate() {
            final_bins[i] += count;
        }
        if *min_val < final_min {
            final_min = *min_val;
        }
        if *max_val > final_max {
            final_max = *max_val;
        }
    }

    // Handle empty case
    if final_min == u16::MAX {
        final_min = 0;
    }

    HistogramData {
        bins: final_bins.to_vec(),
        bin_count: 256,
        min_value: final_min,
        max_value: final_max,
        black_level: avg_bl,
        white_level: wl,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data::bayer_store::BayerDataStore;
    use crate::data::cfa::{BayerPattern, CfaPattern};
    use crate::data::metadata::{ExifData, SensorInfo};

    fn make_test_store() -> BayerDataStore {
        // 4×4 with values spanning full range
        let data: Vec<u16> = vec![
            0, 4000, 8000, 12000,
            1000, 5000, 9000, 13000,
            2000, 6000, 10000, 14000,
            3000, 7000, 11000, 16383,
        ];
        BayerDataStore::new(
            data,
            CfaPattern::Bayer { pattern: BayerPattern::Rggb },
            [0, 0, 0, 0],
            16383,
            SensorInfo {
                raw_width: 4, raw_height: 4,
                width: 4, height: 4,
                top_margin: 0, left_margin: 0,
                bit_depth: 14,
            },
            ExifData::default(),
        )
    }

    #[test]
    fn test_combined_histogram() {
        let store = make_test_store();
        let hist = compute_histogram(&store, None);
        assert_eq!(hist.bins.len(), 256);
        assert_eq!(hist.bin_count, 256);
        // Total pixel count should equal 16 (4×4)
        let total: u32 = hist.bins.iter().sum();
        assert_eq!(total, 16);
        assert_eq!(hist.min_value, 0);
        assert_eq!(hist.max_value, 16383);
    }

    #[test]
    fn test_channel_histogram() {
        let store = make_test_store();
        // R channel: only photosites at (0,0), (0,2), (2,0), (2,2) = 4 pixels
        let hist = compute_histogram(&store, Some(CfaChannel::R));
        let total: u32 = hist.bins.iter().sum();
        assert_eq!(total, 4, "R channel should have 4 photosites in 4×4 RGGB");
    }
}
