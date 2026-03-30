# Rendering Notes

This document describes known platform-specific visual rendering differences in RawView and explains why they exist and which aspects of the display are unaffected.

---

## Platform WebView Engines

RawView uses Tauri v2, which renders the UI inside the platform's native WebView component:

| Platform | WebView Engine |
|---|---|
| macOS | WebKit |
| Windows | WebView2 (Chromium-based) |
| Linux | WebKitGTK |

These engines composite, anti-alias, and render pixels differently. This is expected behavior inherent to the platform, not a bug in RawView.

---

## What Is Always Bit-Exact Across Platforms

The following values are computed in Rust and returned to the UI as integers or exact numeric data. They are **identical across Windows, macOS, and Linux** for the same raw file:

- **Photosite inspector values** — channel identity, raw integer value, row/column position
- **Histogram bin counts** — computed from the raw Bayer array, validated against independent reference implementations
- **Quick stats bar values** — file name, sensor dimensions, CFA pattern, bit depth, black level, white level, ISO
- **ROI statistics** (Tier 2) — mean, standard deviation, minimum, maximum per channel

These values are the ground truth. If you see a discrepancy between platforms in any of these numerical displays, that is a bug — please report it.

---

## Known Visual Rendering Differences

The following visual differences are expected and documented. They do not indicate data inaccuracy.

### Sub-pixel rendering differences

Different WebView engines and operating systems apply different sub-pixel rendering and anti-aliasing to text and fine graphical elements. The photosite grid, channel color swatches, and UI chrome may appear with slightly different crispness or fringing across platforms.

### Bayer mosaic color appearance

The color-coded Bayer mosaic may appear with slightly different saturation, brightness, or hue across platforms due to differences in how each OS and WebView engine handles color management and color profiles for canvas rendering. The underlying integer values driving those colors are identical; only the final display output may vary.

This difference is most visible on macOS with a wide-gamut display versus Windows or Linux with a standard gamut display.

### Histogram bar rendering

Histogram bars are rendered as canvas elements. Sub-pixel alignment of bar edges may differ slightly across WebView engines at certain window sizes.

---

## What This Means in Practice

If you are using RawView to inspect sensor values, diagnose artifacts, validate sensor output, or teach about CFA patterns — rely on the **numerical readouts** (inspector, histogram bins, stats bar). Those are your ground truth.

The visual mosaic is a representation to help you orient spatially. It is useful for identifying patterns, clusters, and artifacts at a glance. But if you need a precise value, read it from the inspector.

---

## Reference

This behavior is specified in the RawView PRD under Domain-Specific Requirements (Reproducibility):

> *"The same raw file must produce identical numerical output across all three platforms. Per-channel histograms and inspector values must match exactly. Visual rendering may differ slightly due to WebView compositing, but numerical data must be bit-exact."*

Cross-platform numerical parity is enforced by the CI test suite, which runs the full test corpus on Windows, macOS, and Linux on every release and asserts bit-exact match against reference values.
