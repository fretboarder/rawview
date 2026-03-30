/*
 * helpers.c — Thin C getter functions for accessing LibRaw internal struct fields.
 *
 * LibRaw's C API provides limited getters. These helpers expose fields
 * needed by RawView's Rust FFI without replicating LibRaw's complex struct layout.
 *
 * Compiled alongside LibRaw by rawview-libraw-sys/build.rs.
 */

#include "libraw/libraw.h"
#include <string.h>

/* Raw pixel data pointer (after libraw_unpack) */
const unsigned short* rawview_get_raw_image(libraw_data_t* lr) {
    if (!lr) return NULL;
    return lr->rawdata.raw_image;
}

/* Row stride in bytes (after libraw_unpack) */
unsigned rawview_get_raw_pitch(libraw_data_t* lr) {
    if (!lr) return 0;
    return lr->sizes.raw_pitch;
}

/* Sensor dimensions — active and full */
void rawview_get_sizes(libraw_data_t* lr,
    unsigned short* raw_width, unsigned short* raw_height,
    unsigned short* width, unsigned short* height,
    unsigned short* top_margin, unsigned short* left_margin) {
    if (!lr) return;
    *raw_width = lr->sizes.raw_width;
    *raw_height = lr->sizes.raw_height;
    *width = lr->sizes.width;
    *height = lr->sizes.height;
    *top_margin = lr->sizes.top_margin;
    *left_margin = lr->sizes.left_margin;
}

/* Black level (global + per-channel) and white level */
void rawview_get_color_info(libraw_data_t* lr,
    unsigned* black, unsigned* cblack, unsigned* maximum) {
    if (!lr) return;
    *black = lr->color.black;
    for (int i = 0; i < 4; i++) {
        cblack[i] = lr->color.cblack[i];
    }
    *maximum = lr->color.maximum;
}

/* Shooting parameters (EXIF) */
void rawview_get_imgother(libraw_data_t* lr,
    float* iso_speed, float* shutter, float* aperture,
    float* focal_len, long long* timestamp) {
    if (!lr) return;
    *iso_speed = lr->other.iso_speed;
    *shutter = lr->other.shutter;
    *aperture = lr->other.aperture;
    *focal_len = lr->other.focal_len;
    *timestamp = (long long)lr->other.timestamp;
}

/* Lens name */
void rawview_get_lens_name(libraw_data_t* lr, char* buf, int buf_len) {
    if (!lr || !buf || buf_len <= 0) return;
    strncpy(buf, lr->lens.Lens, buf_len - 1);
    buf[buf_len - 1] = '\0';
}

/* CFA filters value */
unsigned rawview_get_filters(libraw_data_t* lr) {
    if (!lr) return 0;
    return lr->idata.filters;
}
