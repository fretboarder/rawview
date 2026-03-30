//! Application-level error types for RawView.
//!
//! All errors are typed for tauri-specta serialization to TypeScript.

use serde::Serialize;
use specta::Type;

/// Application error enum covering all failure modes.
/// Maps to FR6 categorized error taxonomy.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(tag = "type")]
pub enum RawViewError {
    /// File format not recognized by LibRaw
    UnsupportedFormat { extension: String },
    /// File exists but contains corrupt or unreadable raw data
    CorruptData { detail: String },
    /// File cannot be read (permissions, not found, etc.)
    FileAccessDenied { path: String },
    /// LibRaw decoder returned an error
    DecoderError { source: String },
    /// Viewport rendering failed
    RenderError { detail: String },
    /// Referenced session no longer exists
    SessionExpired { session_id: String },
}

impl std::fmt::Display for RawViewError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UnsupportedFormat { extension } => {
                write!(f, "Unsupported format: .{extension}")
            }
            Self::CorruptData { detail } => {
                write!(f, "Corrupt or unreadable file data: {detail}")
            }
            Self::FileAccessDenied { path } => {
                write!(f, "File access denied: {path}")
            }
            Self::DecoderError { source } => {
                write!(f, "Decoder error: {source}")
            }
            Self::RenderError { detail } => {
                write!(f, "Render error: {detail}")
            }
            Self::SessionExpired { session_id } => {
                write!(f, "Session expired: {session_id}")
            }
        }
    }
}

impl std::error::Error for RawViewError {}

impl From<std::io::Error> for RawViewError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound | std::io::ErrorKind::PermissionDenied => {
                Self::FileAccessDenied {
                    path: err.to_string(),
                }
            }
            _ => Self::DecoderError {
                source: err.to_string(),
            },
        }
    }
}
