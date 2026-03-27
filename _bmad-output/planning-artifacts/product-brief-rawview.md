---
title: "Product Brief: RawView"
status: "complete"
created: "2026-03-27"
updated: "2026-03-27"
inputs: [user-discovery-session, web-research-competitive-landscape, web-research-technology-stack]
---

# Product Brief: RawView

## Executive Summary

You've never actually seen your raw file. Every raw image developer — Lightroom, Darktable, RawTherapee, Capture One — shows you an interpretation of what your camera captured. They silently apply demosaicing, white balance, color matrices, and tone curves before a single pixel reaches your screen. The actual sensor data — the Bayer mosaic pattern of red, green, and blue photosites — is hidden behind layers of processing.

RawView strips all of that away. It opens standard camera raw files from every major manufacturer and displays the pre-demosaiced sensor data exactly as the silicon captured it. Think of it as an oscilloscope for your camera sensor — precision instrumentation, not photo editing software. For photographers who want to understand their tools, engineers who need to analyze sensor behavior, and educators teaching computational photography, RawView provides the one thing no existing tool does: ground truth.

Built as a cross-platform desktop application using Tauri v2 (Rust backend, modern web frontend), RawView is fast, lightweight, and available on Windows, macOS, and Linux. It launches as an open-source project — and that's not just a distribution choice. A tool that claims to show unprocessed sensor data must be verifiable. You can audit every line of code between your raw file and the pixels on screen. No commercial tool can make that promise.

**Why now:** Camera sensors have crossed 60MP, making sensor-level analysis increasingly relevant. Computational photography curricula are expanding globally. And Tauri v2 has matured to the point where high-performance, cross-platform desktop apps can be built without Electron's overhead — making a lightweight imaging tool viable for the first time.

## The Problem

Digital photographers and imaging professionals operate on faith. When a raw developer displays a raw file, it has already been through a complex processing pipeline — demosaicing, white balance correction, color space transformation, tone mapping — and the user sees the result, not the source. This creates real problems:

- **Photographers** can't distinguish sensor artifacts (hot pixels, pattern noise, banding) from processing artifacts. They troubleshoot the wrong layer.
- **Imaging engineers and sensor designers** need dedicated (often expensive) proprietary tools to inspect raw sensor output during development and QA.
- **Educators and students** studying computational photography or image processing have no accessible tool to show what the Bayer pattern actually looks like and how demosaicing reconstructs color.
- **Camera reviewers and testers** analyzing sensor performance must rely on indirect measurements through processed output rather than examining the data directly.

**The status quo is fragmented and inadequate:**

| Tool | Can open camera raw files? | Shows pre-demosaic data? | Limitation |
|------|---------------------------|--------------------------|------------|
| PixelViewer | No — requires pre-extracted pixel dumps | Yes (Bayer mode) | Must manually specify resolution, stride, bit depth |
| Browser Bayer viewers | No — raw pixel data only | Yes | Same manual config; no camera format support |
| dcraw `-D` flag | Yes | Outputs undemosaiced TIFF | CLI-only; no visualization, zoom, or analysis |
| RawDigger | Yes | Yes (paid, $35-100) | Commercial, Windows-only, not open source |
| RawTherapee / Darktable | Yes | No — always demosaiced | No option to disable demosaicing |

RawView is the first tool that opens standard camera raw files and provides an interactive, visual, free analysis environment for pre-demosaiced sensor data.

## The Solution

RawView is a focused desktop viewer that opens camera raw files from all major vendors and renders the sensor data without demosaicing. Format support is provided by LibRaw, covering Canon (CR2/CR3), Nikon (NEF), Sony (ARW), Fuji (RAF), Panasonic (RW2), Olympus/OM System (ORF), Pentax (PEF), Leica (DNG/RWL), plus Adobe DNG as the universal standard — and any other format LibRaw supports.

**Core capabilities:**

- **Bayer mosaic visualization** — see the raw CFA (Color Filter Array) pattern as captured by the sensor, with color-coded photosites at zoom levels where individual cells are visible, and a visual CFA pattern overlay diagram for self-documenting context
- **Full-sensor heatmap** — zoom out to see the entire sensor as a value heatmap, instantly revealing vignetting, lens shading, and sensor uniformity patterns
- **Photosite inspector** — hover or click on any photosite to see its channel identity (R/G1/G2/B), raw sensor value, and position — making the Bayer view interpretable, not just visual
- **Pixel-level zoom** — navigate down to individual photosites to inspect sensor-level detail
- **Channel separation** — view R, G1, G2, and B channels independently to analyze per-channel behavior
- **Raw histogram with spatial brushing** — histogram of actual sensor values before any processing; brush a value range on the histogram and the corresponding photosites highlight on the Bayer view, showing where clipping or noise occurs spatially
- **Saturation clipping overlay** — highlight photosites at sensor maximum value directly on the Bayer view to evaluate exposure and identify clipped highlights
- **ROI statistics** — select a region and get per-channel statistics (mean, standard deviation, min/max, hot pixel count) for quantitative sensor analysis
- **Split-screen comparison** — draggable slider divider: raw Bayer on one side, basic demosaiced rendering on the other, for intuitive before/after exploration
- **Sensor metadata display** — always-visible quick stats bar (file name, dimensions, CFA pattern, bit depth, black level, white level, ISO) plus full EXIF panel — showing the data without applying it to the rendering

**Technical approach:** LibRaw provides battle-tested raw format decoding across virtually all camera manufacturers. Tauri v2 delivers a native-feeling desktop app at a fraction of Electron's bundle size (~5-10MB vs ~150MB), with a Rust backend handling raw file parsing and pixel data processing, and a modern web frontend (React/TypeScript) for the visualization layer — leveraging WebGL/Canvas for performant pixel rendering. The Rust backend is not a compromise — it's a performance advantage for processing multi-megapixel sensor data.

## What Makes This Different

1. **First free interactive viewer of its kind** — No existing free tool opens standard camera raw files and provides interactive visualization of pre-demosaiced sensor data. RawDigger is the closest, but it's commercial and Windows-only.
2. **Zero-config file support** — Opens CR2, CR3, NEF, ARW, RAF, and dozens more formats natively. No manual pixel format configuration required. Drag, drop, see sensor data.
3. **Dual purpose** — Serves both technical analysis (sensor QA, noise characterization) and education (understanding raw capture and demosaicing) in a single, accessible tool.
4. **Lightweight and modern** — Tauri v2 + Rust means sub-second startup, minimal resource usage, and a ~5-10MB download. Built for performance with large sensor data, not wrapped in a browser runtime.
5. **Open source as proof** — The ground truth claim is verifiable. Every step from file read to pixel display is auditable. This isn't just a distribution model — it's the credibility model.

## Who This Serves

**Primary: Technical Photographers**
Experienced photographers who want to understand what their sensor actually captured. They're the type who reads DPReview forums, compares sensor performance across camera bodies, and wants to know why their shadow recovery looks noisy. RawView gives them direct access to ground truth.

**Primary: Imaging Engineers & Researchers**
Professionals working on sensor design, ISP (Image Signal Processor) development, or computational photography research. They need to inspect raw sensor output for QA, algorithm development, or benchmarking. Current options are either expensive proprietary tools or manual pixel-dump workflows. They congregate on imaging Slack communities, academic conferences (CVPR, ICCV, SIGGRAPH), and specialized LinkedIn groups.

**Secondary: Educators & Students**
University instructors teaching digital imaging, computational photography, or signal processing. RawView provides an instant visual demonstration of the Bayer pattern, channel separation, and the before/after of demosaicing — concepts that are abstract in textbooks but vivid when seen. One professor assigning RawView in a course generates dozens of students who carry the tool into industry.

## Success Criteria

- **Adoption:** 500+ GitHub stars and 1,000+ total downloads within 6 months of release (measured via GitHub release download counts)
- **Format coverage:** Successfully opens raw files from the top 8 camera manufacturers without user configuration
- **Performance:** Opens and renders a 45MP raw file in under 3 seconds on a mid-range machine (8GB RAM, integrated GPU)
- **Community signal:** Organic mentions on photography and imaging forums (DPReview, Fred Miranda, r/photography, r/computationalPhotography)
- **Stability:** <1% crash rate across supported formats on Windows, macOS, and Linux

## Scope

**Tier 1 (v1.0 — Launch):**
- Open raw files from all major camera vendors via LibRaw (including Fuji X-Trans with 6×6 CFA support)
- Bayer mosaic visualization with CFA pattern auto-detection and visual CFA overlay
- Pixel-level zoom and pan with color-coded photosites
- Photosite inspector (hover/click: channel identity, raw value, position)
- Individual channel views (R/G1/G2/B)
- Raw data histogram (per-channel and combined)
- Always-visible quick stats bar (file name, dimensions, CFA pattern, bit depth, black/white level, ISO)
- Full sensor metadata and EXIF display (non-applied)
- Windows, macOS, and Linux builds

**Tier 2 (v1.1 — Fast Follow):**
- Interactive histogram ↔ Bayer spatial brushing (select value range, highlight photosites)
- Saturation/clipping overlay on Bayer view
- ROI selection with per-channel statistics (mean, std dev, min/max, hot pixel count)
- Split-screen slider: raw Bayer vs basic demosaiced view
- Full-sensor heatmap view for sensor characterization at a glance

**Out for v1.x:**
- Raw file editing or export
- Batch processing or file management
- Plugin/extension system
- Color management / ICC profiles
- Comparison across multiple files
- Video / raw video formats
- Noise profiling or statistical analysis features

## Known Risks

- **LibRaw dependency:** LibRaw is the foundation for format support. New camera formats (e.g., Canon CR3 CRAW variants) may lag behind camera releases. Mitigation: LibRaw is actively maintained and widely used; format support gaps will be documented transparently.
- **Large file performance:** Transferring 45MP+ of 16-bit sensor data from Rust to the WebView rendering layer is non-trivial. The Tauri IPC boundary with large binary payloads needs early prototyping and validation.
- **Niche audience:** The target audience is specialized. Growth depends on reaching the right communities, not broad consumer marketing.

## Vision

RawView starts as the definitive tool for seeing what your camera sensor actually captures — a specialized, focused viewer that fills a gap nobody else has addressed. If it succeeds, it becomes the standard reference tool in the imaging community: the application photographers open when they want truth, the tool sensor engineers use for quick visual QA, and the teaching aid that makes computational photography tangible — the ImageJ of raw sensor analysis.

The project stays focused on analysis and education rather than evolving into another raw processor. There are enough of those. There's only one tool that shows you the raw truth — and that's RawView.
