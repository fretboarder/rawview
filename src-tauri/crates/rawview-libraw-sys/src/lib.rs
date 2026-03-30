//! Raw FFI bindings to LibRaw C API and RawView helper functions.
//!
//! This crate provides unsafe bindings to LibRaw 0.21.5.
//! Higher-level safe wrappers are provided by the main rawview crate.

#![allow(non_camel_case_types)]

use std::os::raw::{c_char, c_int, c_uint, c_ushort};

// Opaque handle to LibRaw processor
#[repr(C)]
pub struct libraw_data_t {
    _private: [u8; 0],
}

// Image parameters returned by libraw_get_iparams
#[repr(C)]
pub struct libraw_iparams_t {
    pub guard: [c_char; 4],
    pub make: [c_char; 64],
    pub model: [c_char; 64],
    pub software: [c_char; 64],
    pub normalized_make: [c_char; 64],
    pub normalized_model: [c_char; 64],
    pub maker_index: c_uint,
    pub raw_count: c_uint,
    pub dng_version: c_uint,
    pub is_foveon: c_uint,
    pub colors: c_int,
    pub filters: c_uint,
    pub xtrans: [[c_char; 6]; 6],
    pub xtrans_abs: [[c_char; 6]; 6],
    pub cdesc: [c_char; 5],
    pub xmplen: c_uint,
    pub xmpdata: *mut c_char,
}

extern "C" {
    // ========================================================================
    // LibRaw C API functions
    // ========================================================================

    /// Initialize a new LibRaw processor instance.
    pub fn libraw_init(flags: c_uint) -> *mut libraw_data_t;

    /// Close and free a LibRaw processor instance.
    pub fn libraw_close(lr: *mut libraw_data_t);

    /// Open a raw file by path. Returns 0 on success.
    pub fn libraw_open_file(lr: *mut libraw_data_t, fname: *const c_char) -> c_int;

    /// Unpack raw data from the opened file. Returns 0 on success.
    pub fn libraw_unpack(lr: *mut libraw_data_t) -> c_int;

    /// Get raw image width.
    pub fn libraw_get_raw_width(lr: *mut libraw_data_t) -> c_int;

    /// Get raw image height.
    pub fn libraw_get_raw_height(lr: *mut libraw_data_t) -> c_int;

    /// Get image parameters (make, model, CFA pattern, etc.)
    pub fn libraw_get_iparams(lr: *mut libraw_data_t) -> *const libraw_iparams_t;

    /// Get maximum pixel value (white level / saturation point).
    pub fn libraw_get_color_maximum(lr: *mut libraw_data_t) -> c_int;

    /// Get CFA color index at (row, col). Returns 0=R, 1=G, 2=B, 3=G2.
    pub fn libraw_COLOR(lr: *mut libraw_data_t, row: c_int, col: c_int) -> c_int;

    // ========================================================================
    // RawView helper functions (from helpers.c)
    // ========================================================================

    /// Get pointer to the raw Bayer image data (after unpack).
    /// Returns NULL if no single-channel raw data available.
    pub fn rawview_get_raw_image(lr: *mut libraw_data_t) -> *const c_ushort;

    /// Get row stride in bytes (after unpack).
    pub fn rawview_get_raw_pitch(lr: *mut libraw_data_t) -> c_uint;

    /// Get sensor dimensions (full and active area).
    pub fn rawview_get_sizes(
        lr: *mut libraw_data_t,
        raw_width: *mut c_ushort,
        raw_height: *mut c_ushort,
        width: *mut c_ushort,
        height: *mut c_ushort,
        top_margin: *mut c_ushort,
        left_margin: *mut c_ushort,
    );

    /// Get black level (global + per-channel) and white level.
    pub fn rawview_get_color_info(
        lr: *mut libraw_data_t,
        black: *mut c_uint,
        cblack: *mut c_uint, // array of 4
        maximum: *mut c_uint,
    );

    /// Get shooting parameters (EXIF).
    pub fn rawview_get_imgother(
        lr: *mut libraw_data_t,
        iso_speed: *mut f32,
        shutter: *mut f32,
        aperture: *mut f32,
        focal_len: *mut f32,
        timestamp: *mut i64,
    );

    /// Get lens name string. Writes into buf (max buf_len chars).
    pub fn rawview_get_lens_name(
        lr: *mut libraw_data_t,
        buf: *mut c_char,
        buf_len: c_int,
    );

    /// Get CFA filters value from idata.
    pub fn rawview_get_filters(lr: *mut libraw_data_t) -> c_uint;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn smoke_test_init_and_close() {
        unsafe {
            let lr = libraw_init(0);
            assert!(!lr.is_null(), "libraw_init(0) returned null pointer");
            libraw_close(lr);
        }
    }
}
