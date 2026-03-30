//! Tauri application library entry point.
//!
//! This module serves as the main entry point for the Tauri application.
//! Command implementations are organized in the `commands` module,
//! and shared types are in the `types` module.

mod bindings;
mod commands;
pub mod data;
pub mod decoder;
pub mod error;
mod protocol;
pub mod session;
mod types;
mod utils;

use tauri::{Manager, RunEvent, WindowEvent};

/// Application entry point. Sets up all plugins and initializes the app.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = bindings::generate_bindings();

    // Export TypeScript bindings in debug builds
    #[cfg(debug_assertions)]
    bindings::export_ts_bindings();

    // Build with common plugins
    let mut app_builder = tauri::Builder::default();

    // Window state plugin - saves/restores window position and size
    #[cfg(desktop)]
    {
        app_builder = app_builder.plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(tauri_plugin_window_state::StateFlags::all())
                .build(),
        );
    }

    app_builder = app_builder
        .plugin(tauri_plugin_process::init())
        .plugin({
            #[allow(unused_mut)]
            let mut targets = vec![
                // Always log to stdout for development
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                // Log to system logs on macOS (appears in Console.app)
                #[cfg(target_os = "macos")]
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                    file_name: None,
                }),
            ];
            // Log to webview console — excluded on Linux where the WebKitGTK webview
            // doesn't exist during setup(), causing app.emit() to deadlock on the IPC socket.
            #[cfg(not(target_os = "linux"))]
            targets.push(tauri_plugin_log::Target::new(
                tauri_plugin_log::TargetKind::Webview,
            ));
            tauri_plugin_log::Builder::new()
                // Use Debug level in development, Info in production
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Debug
                } else {
                    log::LevelFilter::Info
                })
                .targets(targets)
                .build()
        });

    app_builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .register_asynchronous_uri_scheme_protocol("rawview", |ctx, request, responder| {
            protocol::viewport_protocol::handle(ctx, request, responder);
        })
        .setup(|app| {
            // Initialize session manager
            app.manage(session::SessionManager::new());

            log::info!("Application starting up");
            log::debug!(
                "App handle initialized for package: {}",
                app.package_info().name
            );

            // Set up global shortcut plugin (without any shortcuts - we register them separately)
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::Builder;

                app.handle().plugin(Builder::new().build())?;
            }

            // NOTE: Application menu is built from JavaScript
            // See src/lib/menu.ts for the menu implementation

            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match &event {
            // Cleanup on actual exit (Cmd+Q, menu Quit, or window close on non-macOS).
            RunEvent::WindowEvent {
                label,
                event: WindowEvent::CloseRequested { .. },
                ..
            } if label == "main" => {
                // On macOS: save window state before close
                #[cfg(target_os = "macos")]
                {
                    use tauri_plugin_window_state::{AppHandleExt, StateFlags};
                    if let Err(e) = app_handle.save_window_state(StateFlags::all()) {
                        log::warn!("Failed to save window state: {e}");
                    }
                }
            }

            // Cleanup on actual exit
            RunEvent::Exit => {
                log::info!("Application exiting — performing cleanup");

                // Unregister global shortcuts
                #[cfg(desktop)]
                {
                    use tauri_plugin_global_shortcut::GlobalShortcutExt;
                    if let Err(e) = app_handle.global_shortcut().unregister_all() {
                        log::warn!("Failed to unregister global shortcuts: {e}");
                    }
                }

                log::info!("Cleanup complete");
            }

            _ => {}
        });
}
