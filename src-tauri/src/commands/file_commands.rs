//! File management Tauri commands.

use tauri::State;

use crate::error::RawViewError;
use crate::session::{SessionInfo, SessionManager};

/// Open a raw file and create a new session.
///
/// Decodes the file via LibRaw, creates a BayerDataStore,
/// and returns SessionInfo to the frontend.
#[tauri::command]
#[specta::specta]
pub async fn open_file(
    path: String,
    session: State<'_, SessionManager>,
) -> Result<SessionInfo, RawViewError> {
    log::info!("Opening raw file: {path}");
    let info = session.open(&path)?;
    log::info!(
        "File opened: {} ({}×{}, {}, BL={}, WL={})",
        info.filename,
        info.width,
        info.height,
        info.cfa_pattern.label(),
        info.black_level,
        info.white_level
    );
    Ok(info)
}
