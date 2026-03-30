//! Query commands for photosite inspection, histogram, and metadata retrieval.

use serde::Serialize;
use specta::Type;
use tauri::State;

use crate::data::cfa::CfaChannel;
use crate::data::metadata::ExifData;
use crate::error::RawViewError;
use crate::query::histogram::{self, HistogramData};
use crate::session::SessionManager;

/// Information about a single photosite.
#[derive(Debug, Clone, Serialize, Type)]
pub struct PhotositeInfo {
    pub channel: CfaChannel,
    pub value: u16,
    pub row: u32,
    pub col: u32,
}

/// Get photosite information at a specific sensor coordinate.
#[tauri::command]
#[specta::specta]
pub async fn get_photosite_info(
    row: u32,
    col: u32,
    session: State<'_, SessionManager>,
) -> Result<PhotositeInfo, RawViewError> {
    session.with_store(|store| {
        let value = store.get_photosite(row, col).ok_or_else(|| RawViewError::RenderError {
            detail: format!("Photosite ({row}, {col}) out of bounds"),
        })?;
        let channel = store.get_channel(row, col);
        Ok(PhotositeInfo {
            channel,
            value,
            row,
            col,
        })
    })?
}

/// Get histogram data, optionally filtered by CFA channel.
///
/// Returns 256 bins computed from raw sensor values.
/// All computation uses exact u16 values — no display transforms.
#[tauri::command]
#[specta::specta]
pub async fn get_histogram(
    channel: Option<CfaChannel>,
    session: State<'_, SessionManager>,
) -> Result<HistogramData, RawViewError> {
    session.with_store(|store| histogram::compute_histogram(store, channel))
}

/// Get full EXIF metadata for the current session.
#[tauri::command]
#[specta::specta]
pub async fn get_file_metadata(
    session: State<'_, SessionManager>,
) -> Result<ExifData, RawViewError> {
    session.with_store(|store| store.exif().clone())
}
