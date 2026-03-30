//! Tauri command handlers organized by domain.
//!
//! Each submodule contains related commands and their helper functions.
//! Import specific commands via their submodule (e.g., `commands::recovery::save_emergency_data`).

pub mod file_commands;
pub mod query_commands;
pub mod recovery;
