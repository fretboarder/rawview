//! Query commands for photosite inspection and data retrieval.

use serde::Serialize;
use specta::Type;
use tauri::State;

use crate::data::cfa::CfaChannel;
use crate::error::RawViewError;
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
///
/// Returns the CFA channel identity, raw u16 value, and position.
/// Values are always the unmodified raw sensor values (NFR8).
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
