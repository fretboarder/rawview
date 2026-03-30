# RawView

**See what your camera sensor actually captured — pre-demosaiced raw sensor data viewer**

---

## What is this?

Every raw developer — Lightroom, Darktable, RawTherapee, Capture One — applies demosaicing, white balance, color matrices, and tone curves before displaying a single pixel. You've never actually *seen* your raw file. You've seen an interpretation of it.

RawView shows what the sensor actually captured: the Bayer mosaic pattern of individual photosites, unprocessed and uninterpreted. Red photosites show red values. Green photosites show green values. No reconstruction, no interpolation, no color science applied. Just the silicon.

The open-source model is integral to this claim. A tool that says "this is unprocessed data" must be auditable. Every line of code between file read and pixel display is in this repository.

---

## Features

- **Bayer mosaic visualization** — color-coded photosites by CFA channel assignment (R/G1/G2/B)
- **Grayscale view** — raw photosite values mapped to brightness, no color-coding or demosaicing
- **Per-channel isolation** — view R, G1, G2, or B in isolation to diagnose channel-specific artifacts
- **Raw histogram** — per-channel and combined, computed from the raw Bayer array
- **Photosite inspector** — hover or click any photosite to see its channel identity, raw integer value, and row/column position
- **CFA pattern overlay** — visual diagram of the detected CFA (2×2 for Bayer, 6×6 for Fuji X-Trans)
- **Quick stats bar** — always-visible: file name, sensor dimensions, CFA pattern, bit depth, black level, white level, ISO
- **Metadata panel** — full EXIF data (camera model, lens, shutter, aperture, ISO, white balance, date) displayed for reference, never applied
- **Keyboard shortcuts** — full keyboard control for every primary action
- **Display stretch** — stretch the displayed value range for low-contrast scenes

---

## Supported Formats

RawView opens all formats supported by LibRaw — no manual configuration required:

| Manufacturer | Formats |
|---|---|
| Canon | CR2, CR3 |
| Nikon | NEF |
| Sony | ARW |
| Fujifilm | RAF (including X-Trans 6×6 CFA) |
| Panasonic | RW2 |
| Olympus / OM System | ORF |
| Pentax | PEF |
| Leica | DNG, RWL |
| Adobe | DNG |
| Many others | All LibRaw-supported formats |

---

## Installation

Download the latest release for your platform from [GitHub Releases](https://github.com/rawview/rawview/releases):

| Platform | File | Requirements |
|---|---|---|
| macOS | `.dmg` | macOS 12+ (Apple Silicon and Intel universal binary) |
| Windows | `.msi` | Windows 10+ (64-bit), WebView2 pre-installed on Win 10 1803+ |
| Linux | `.AppImage` | Ubuntu 22.04+, Fedora 38+, or Arch-based; WebKitGTK required |

No administrator or root privileges required to install.

---

## Quick Start

1. **Open the app** — launches in under 2 seconds
2. **Open a raw file** — drag it onto the window, or use **File > Open** (`Ctrl/Cmd+O`)
3. **Explore the mosaic** — zoom in with `+`, pan by dragging, hover photosites for values
4. **Switch views** — press `B` for Bayer, `G` for grayscale, `1`–`4` for individual channels
5. **Inspect data** — press `H` for the histogram, `I` for the metadata panel

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl/Cmd+O` | Open file |
| `B` | Bayer mosaic view |
| `G` | Grayscale view |
| `1` | R channel |
| `2` | G1 channel |
| `3` | G2 channel |
| `4` | B channel |
| `H` | Toggle histogram |
| `I` | Toggle metadata panel |
| `S` | Toggle display stretch |
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Fit to window |

---

## Built With

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://tauri.app) |
| Backend | Rust |
| Raw decoding | [LibRaw](https://www.libraw.org) |
| Frontend | React 19, TypeScript |
| UI | [shadcn/ui](https://ui.shadcn.com), [Tailwind CSS](https://tailwindcss.com) |

Bundle size is under 20MB per platform, with no Electron overhead. Fully offline — no network access, no telemetry, no accounts.

---

## Data Accuracy

RawView's core promise: displayed values are bit-exact with the sensor data in the raw file.

- Inspector photosite values match LibRaw's decoded integer array exactly — no rounding, no normalization, no gamma
- Histogram bin counts are validated against independent reference implementations (dcraw `-D`, rawpy)
- Per-channel statistics and quick stats bar values are identical across Windows, macOS, and Linux

The same raw file produces identical numerical output on all three platforms. Visual rendering may show minor sub-pixel differences across platforms due to different WebView compositing engines (see [RENDERING_NOTES.md](RENDERING_NOTES.md)) — this does not affect data accuracy.

Because RawView is open source, every step of the pipeline from file read to pixel display is auditable. No claim about unprocessed data should be taken on trust from closed-source software.

---

## Contributing

Issues and pull requests are welcome.

- **Bug reports:** Please include the camera model, raw file format, and a description of what you expected vs. what you saw. Sample raw files from [raw.pixls.us](https://raw.pixls.us) are useful for reproducible reports.
- **Feature requests:** Check [WONT_DO.md](WONT_DO.md) first — some things are intentionally out of scope.
- **Pull requests:** Open an issue to discuss significant changes before investing time in implementation.

---

## License

[MIT](LICENSE) — Copyright 2026 RawView contributors
