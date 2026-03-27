---
title: "Product Brief Distillate: RawView"
type: llm-distillate
source: "product-brief-rawview.md"
created: "2026-03-27"
purpose: "Token-efficient context for downstream PRD creation"
---

# RawView — Product Brief Distillate

## Requirements Hints

- Must support ALL LibRaw-supported camera raw formats — not just the named 8 vendors; any format LibRaw can decode should work
- CFA pattern auto-detection (RGGB, BGGR, GRBG, GBRG) — no manual user config
- Bayer mosaic display must color-code individual photosites at high zoom levels
- Channel separation: R, G1, G2, B individually — user emphasized "all of that" when asked about features
- Raw histogram must show per-channel AND combined views
- Side-by-side: raw Bayer vs basic demosaiced rendering — included in v1 scope per user decision
- Metadata displayed but explicitly NOT applied to rendering (ISO, shutter speed, aperture, WB, etc.)
- User specified "state of the art" for tech stack — research concluded Tauri v2 + Rust backend + React/TypeScript frontend + WebGL/Canvas rendering
- **Photosite inspector panel** — hover/click on a photosite to see: channel identity (R/G1/G2/B), raw value, position. Essential for making the Bayer view interpretable rather than just "a green grid." Surfaced by user persona focus group — all three personas needed help understanding what they're looking at
- **Saturation/clipping overlay** — highlight photosites at sensor maximum value directly on the Bayer view. Low-effort, high-impact analysis feature. Photographers identified this as a "killer feature" for evaluating exposure
- **ROI statistics** — select a rectangular region and get per-channel statistics (mean, std dev, min, max, hot pixel count). Engineers won't switch from scripts without basic region analysis capability
- **Black level and white level display** — show sensor-level metadata (black level offset, saturation point) alongside EXIF data. Critical for engineers, educational for everyone. Not just camera EXIF — the actual sensor data range
- **Interactive histogram ↔ Bayer brushing** — brush/select a value range on the histogram and corresponding photosites highlight on the Bayer view. Merges two existing features into something unique — shows WHERE highlights clip spatially, not just that they clip. Surfaced via SCAMPER brainstorm
- **Split-screen slider** — replace side-by-side toggle with a draggable before/after divider (raw Bayer left, demosaiced right). Familiar UX pattern, more fluid than mode switching
- **Full-sensor heatmap view** — zoom all the way out to see entire sensor as a value heatmap. Instantly reveals vignetting, lens shading, sensor uniformity patterns. Single-glance sensor characterization
- **Quick stats bar** — always-visible status bar: file name, dimensions, CFA pattern, bit depth, black level, white level, ISO. No panel to open. Instant context
- **CFA pattern visual overlay** — instead of just showing "RGGB" text, overlay a visual 2×2 color grid diagram in the corner of the Bayer view. Self-documenting, eliminates need to understand CFA terminology
- **Astrophotography as a user segment** — astrophotographers evaluate individual raw frames before stacking, care deeply about hot pixels, dark current, sensor noise. Natural fit for RawView's feature set, worth targeting in positioning

## Technical Context

- **LibRaw** is the core dependency for raw file decoding — LGPL licensed, actively maintained, widely used
- LibRaw provides `rawdata.raw_image` (Bayer array) and CFA pattern info via `idata.cdesc` and `idata.filters`
- LibRaw raw pixel access: `open_file()` → `unpack()` → access `imgdata.rawdata.raw_image` (16-bit Bayer array)
- **Tauri v2** chosen over Electron: ~5-10MB bundle vs ~150MB, Rust backend for performance, native WebView per OS
- Tauri IPC boundary (Rust → WebView) with large binary payloads (45MP × 16-bit = ~90MB) is a known performance risk — needs early prototyping
- WebGL/Canvas rendering for pixel-level visualization of multi-megapixel data
- Cross-platform: Windows, macOS, Linux — all three from v1
- Tauri v2 WebView differences per OS: WebKit on Mac, WebView2 on Windows, WebKitGTK on Linux — rendering consistency needs testing

## Competitive Intelligence

- **RawDigger** ($35-100): closest competitor, opens camera raw files, shows pre-demosaic data, but commercial + Windows-only + closed source
- **PixelViewer** (carina-studio, .NET, open source): reads raw Bayer pixel data but NOT camera raw files — requires pre-extracted pixel dumps with manual resolution/stride/format config
- **Browser Bayer viewers** (benfzc): same limitation as PixelViewer — raw pixel data only, no camera format support
- **dcraw -D flag**: outputs undemosaiced TIFF from camera raw files, but CLI-only with no visualization, zoom, or interactive analysis
- **RawTherapee / Darktable / Lightroom / Capture One**: all apply demosaicing before display with no option to disable
- **Imatest**: industrial testing tool, expensive, not aimed at individual photographers or educators
- Key differentiator: "first free interactive viewer" — not "first of its kind" (RawDigger exists). Open source is the trust differentiator

## Detailed User Scenarios

- Photographer notices banding in shadow recovery → opens raw in RawView → inspects raw channel data to determine if banding is sensor-level or processing artifact
- Sensor engineer testing new CMOS design → opens sample captures in RawView → examines hot pixel distribution, fixed-pattern noise, per-channel uniformity
- University instructor demonstrating demosaicing → opens any raw file → shows Bayer mosaic → flips to demosaiced side-by-side → students see the reconstruction in real time
- Camera reviewer comparing sensor performance → opens files from two camera bodies → examines raw histograms and channel separation to characterize dynamic range and noise floor

## Future Opportunities (Explicitly Out of v1, Captured for Roadmap)

- **"Peel back layers" reverse flow** — open to a familiar demosaiced image, let users toggle processing stages off one by one. Solves onboarding intimidation and is highly educational. High-impact v2 feature
- **3D heightmap visualization** — render photosite values as elevation (bright=tall, dark=low). Noise and banding become topography. High wow factor, unique in the space
- **Waveform monitor display** — per-column/row value distribution, familiar to video engineers, useful for detecting row/column banding that histograms miss
- **Multiple demosaic algorithm comparison** — toggle between bilinear, AHD, DCB in the split-screen. Educational gold for students comparing algorithm quality
- **Re-mosaic a JPEG** — import a processed image and show what its Bayer pattern would have looked like. Not real sensor data, but powerful educational demonstration

- **Noise profiling and sensor fingerprinting** — mean, sigma per channel, hot pixel map. Analysis, not processing — aligns with product philosophy
- **Forensic/provenance use case** — CFA pattern inconsistencies reveal image manipulation, deepfake detection, re-saved JPEGs posing as raws. Growing field (legal, journalism, insurance)
- **ML dataset validation** — CV researchers training on raw images need to inspect training data at sensor level. No accessible tool exists
- **CLI/library mode** — `rawview extract --channel=R file.ARW > r_channel.tiff` for embedding in research pipelines and CI systems
- **Course kit** — sample raw files + guided exercises for university educators to accelerate academic adoption
- **Public compatibility matrix** — every new camera release that works with RawView becomes a distribution event and SEO asset

## Scope Signals

- User explicitly chose "focused viewer" for v1 — not a processing tool
- "Analysis/educational tool" is the stated long-term direction — not a raw processor
- Open source, but monetization is "undecided" — user would "start with open source"
- Linux added to v1 scope after reviewer feedback about engineering segment importance
- **v1 split into two tiers** after cross-functional war room brainstorm:
  - Tier 1 (v1.0): core viewing experience — file open, Bayer viz, zoom, channels, inspector, histogram, metadata, cross-platform
  - Tier 2 (v1.1 fast follow): interactive analysis — histogram brushing, clipping overlay, ROI stats, split-screen slider, full-sensor heatmap
  - Rationale: ship sooner, validate core concept and Tauri IPC performance before building complex GPU interactions
- Fuji X-Trans (6×6 CFA) supported in v1 — passionate user base, avoids costly late refactor

## Architecture Decisions (from War Room)

- **Data transfer approach:** Start with full-array transfer (Rust → WebView, ~90MB for 45MP) for Tier 1 — simplest path. Refactor to tile-based rendering if performance requires it in Tier 2
- **Rendering model:** Tier 1 needs one rendering path (Bayer canvas). Tier 2 adds a second path (heatmap aggregation) and demands GPU shaders for interactive brushing
- **Demosaic processing:** Only needed in Tier 2 (split-screen slider). Run via LibRaw `dcraw_process()` in Rust on file open
- **UX architecture:** Progressive disclosure — default view is clean (Bayer canvas + quick stats bar + photosite tooltip). Histogram, ROI stats, panels toggled via toolbar/keyboard. Engineers can activate "cockpit mode," photographers see an inviting interface

## Rejected Ideas / Non-Goals

- Evolving into a raw processor/developer — explicitly rejected ("there are enough of those")
- Batch processing or file management features — out of scope
- Plugin/extension system — out of scope for v1
- Color management / ICC profiles — out of scope for v1
- Multi-file comparison — out of scope for v1
- Video / raw video formats — out of scope for v1
- Raw file editing or export — out of scope

## Open Questions

- Monetization model if project gains traction (sponsorship? pro tier for engineers? donations?)
- Governance model for scope control as contributors request features — needs a "things we won't do" document
- Telemetry/analytics approach for measuring active users in an open-source context (opt-in? download counts only?)
- Rendering accuracy: WebGL in WebView may apply OS compositor tone mapping — contradicts "ground truth" claim. Needs investigation
- Fuji X-Trans sensors use a non-Bayer CFA pattern — how does RawView handle non-standard CFA layouts?
- Performance validation needed: 45MP file → Rust decode → IPC transfer → WebGL render in <3 seconds. Unproven
- i18n considerations: major camera manufacturing hubs (Japan, Germany, China) are non-English-speaking markets

## Strategic Positioning Notes

- "The oscilloscope for your camera sensor" — positions as precision instrumentation, not photography software
- "You've never actually seen your raw file" — provocative, shareable hook
- Open source = verifiability of the ground truth claim — this is the trust argument, not just a distribution choice
- "The ImageJ of raw sensor analysis" — aspirational comp for academic adoption
- Tauri/Rust stack is itself a story for technical communities (HN, Rust community)
- Potential strategic partners: Photons to Photos (Bill Claff), camera manufacturer dev relations, computational photography textbook authors
