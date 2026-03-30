//! Session management for RawView.
//!
//! A Session owns the BayerDataStore for a single open file.
//! SessionManager provides atomic session replacement and thread-safe access.

use std::sync::{Arc, RwLock};
use std::time::Instant;

use serde::Serialize;
use specta::Type;
use uuid::Uuid;

use crate::data::bayer_store::BayerDataStore;
use crate::data::cfa::CfaPattern;
use crate::decoder::DecodedRaw;
use crate::error::RawViewError;

/// A single open-file session.
pub struct Session {
    pub id: String,
    pub store: BayerDataStore,
    pub file_path: String,
    pub created_at: Instant,
}

impl Session {
    /// Create a new session from decoded raw data.
    pub fn new(decoded: DecodedRaw, file_path: &str) -> Self {
        let store = BayerDataStore::new(
            decoded.bayer_data,
            decoded.cfa_pattern,
            decoded.black_levels,
            decoded.white_level,
            decoded.sensor_info,
            decoded.exif,
        );
        Self {
            id: Uuid::new_v4().to_string(),
            store,
            file_path: file_path.to_string(),
            created_at: Instant::now(),
        }
    }

    /// Build SessionInfo for the frontend.
    pub fn info(&self) -> SessionInfo {
        let (width, height) = self.store.dimensions();
        let sensor = self.store.sensor_info();
        let exif = self.store.exif();
        SessionInfo {
            session_id: self.id.clone(),
            filename: std::path::Path::new(&self.file_path)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            width,
            height,
            cfa_pattern: self.store.cfa_pattern().clone(),
            bit_depth: sensor.bit_depth,
            black_level: self.store.black_levels()[0],
            white_level: self.store.white_level(),
            iso: exif.iso,
        }
    }
}

/// Information sent to the frontend after opening a file.
#[derive(Debug, Clone, Serialize, Type)]
pub struct SessionInfo {
    pub session_id: String,
    pub filename: String,
    pub width: u32,
    pub height: u32,
    pub cfa_pattern: CfaPattern,
    pub bit_depth: u32,
    pub black_level: u16,
    pub white_level: u16,
    pub iso: f32,
}

/// Thread-safe session manager. Holds at most one active session.
pub struct SessionManager {
    current: Arc<RwLock<Option<Session>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            current: Arc::new(RwLock::new(None)),
        }
    }

    /// Open a new file, replacing any existing session.
    pub fn open(&self, path: &str) -> Result<SessionInfo, RawViewError> {
        let decoded = crate::decoder::decode(path)?;
        let session = Session::new(decoded, path);
        let info = session.info();
        let mut guard = self.current.write().map_err(|e| RawViewError::DecoderError {
            source: format!("Session lock poisoned: {e}"),
        })?;
        *guard = Some(session);
        Ok(info)
    }

    /// Execute a function with read access to the current BayerDataStore.
    pub fn with_store<T, F>(&self, f: F) -> Result<T, RawViewError>
    where
        F: FnOnce(&BayerDataStore) -> T,
    {
        let guard = self.current.read().map_err(|e| RawViewError::DecoderError {
            source: format!("Session lock poisoned: {e}"),
        })?;
        guard
            .as_ref()
            .map(|s| f(&s.store))
            .ok_or_else(|| RawViewError::SessionExpired {
                session_id: String::new(),
            })
    }

    /// Get the current session ID, if any.
    pub fn current_session_id(&self) -> Option<String> {
        self.current
            .read()
            .ok()
            .and_then(|guard| guard.as_ref().map(|s| s.id.clone()))
    }
}

impl Default for SessionManager {
    fn default() -> Self {
        Self::new()
    }
}
