//! Raw FFI bindings to LibRaw C API.
//! 
//! This crate provides unsafe bindings to LibRaw 0.21.5.
//! Higher-level safe wrappers are provided by the main rawview crate.

#![allow(non_camel_case_types)]

use std::os::raw::{c_char, c_int, c_uint};

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
    /// Initialize a new LibRaw processor instance.
    /// `flags` should be 0 for default behavior.
    /// Returns a pointer to the processor, or null on failure.
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
