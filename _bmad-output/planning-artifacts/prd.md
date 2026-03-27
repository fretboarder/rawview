---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: [product-brief-rawview.md, product-brief-rawview-distillate.md]
workflowType: 'prd'
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: desktop_app
  domain: scientific
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document — RawView

**Author:** Klaus
**Date:** 2026-03-27

## Executive Summary

RawView is an open-source, cross-platform desktop application that displays pre-demosaiced sensor data from digital camera raw files. Every existing raw developer — Lightroom, Darktable, RawTherapee, Capture One — applies demosaicing, white balance, color matrices, and tone curves before displaying a single pixel. RawView shows what the sensor actually captured: the Bayer mosaic pattern of individual photosites, unprocessed and uninterpreted.

The product targets three user segments: technical photographers diagnosing sensor-level artifacts (hot pixels, banding, noise), imaging engineers and researchers inspecting raw sensor output for QA and algorithm development, and educators teaching computational photography who need visual demonstrations of demosaicing and CFA patterns. A fourth segment — astrophotographers evaluating raw frames before stacking — emerged during discovery. The closest competitor, RawDigger ($35–100), is commercial, Windows-only, and closed source. No free, interactive, cross-platform tool exists for this purpose.

RawView opens standard camera raw files from all major manufacturers (Canon, Nikon, Sony, Fuji, Panasonic, Olympus, Pentax, Leica, plus DNG) via LibRaw, requiring zero manual configuration. Core features include Bayer mosaic visualization with color-coded photosites, per-channel separation (R/G1/G2/B), raw data histograms, a photosite inspector showing channel identity and sensor values, and an always-visible quick stats bar displaying black level, white level, bit depth, and CFA pattern. The product ships on Windows, macOS, and Linux from v1.0.

The open-source model is integral to the product's credibility: a tool claiming to show unprocessed sensor data must be auditable. Every line of code between file read and pixel display is verifiable.

### What Makes This Special

- **Category creator in the free/open-source space.** First free interactive viewer that opens standard camera raw files and visualizes pre-demosaiced sensor data. Zero-config drag-and-drop — no manual resolution, stride, or format specification.
- **Revelation, not complexity.** The core experience is designed around the moment a user first sees their actual sensor data — precision instrumentation positioned as insight. Progressive disclosure ensures photographers see a clean interface while engineers can activate full analysis panels.
- **Open source as proof, not just distribution.** The ground truth claim is verifiable by design. No commercial tool can offer the same transparency guarantee.
- **Tauri v2 + Rust performance stack.** Sub-second startup, ~5–10MB download, native-feeling app without Electron's overhead. Rust backend provides a performance advantage for processing multi-megapixel sensor data.
- **Fuji X-Trans support from day one.** 6×6 CFA pattern handling alongside standard 2×2 Bayer, capturing Fuji's passionate user base without a costly late refactor.

## Project Classification

- **Type:** Cross-platform desktop application (Tauri v2, Rust backend, React/TypeScript frontend, WebGL rendering)
- **Domain:** Scientific imaging / analysis tooling
- **Complexity:** Medium — no regulatory or compliance requirements; complexity concentrated in raw file decoding (LibRaw FFI), large-data rendering pipeline (WebGL for 45MP+ sensors), and cross-platform WebView consistency
- **Context:** Greenfield

## Success Criteria

### User Success

- First-time user can identify CFA pattern and read individual photosite values within 60 seconds of opening a file — validates that the revelation moment works without external guidance
- Users can distinguish sensor-level artifacts from processing artifacts using channel separation and raw histogram — the core diagnostic use case functions end-to-end
- Photosite inspector, CFA overlay, and quick stats bar provide sufficient context that no documentation is required for basic exploration

### Business Success

- 500+ GitHub stars within 6 months of launch (measured via GitHub API)
- 1,000+ total downloads across all platforms within 6 months (measured via GitHub release download counts)
- Organic mentions on 3+ photography/imaging forums (DPReview, Fred Miranda, r/photography, r/computationalPhotography, Hacker News) within 6 months — unprompted, not self-posted
- At least 1 university course or workshop adoption within 12 months
- At least 5 community-submitted bug reports or feature requests within 3 months — indicates engaged users, not just drive-by downloads

### Technical Success

- Performance, accuracy, and reliability targets defined in Non-Functional Requirements (NFR1–NFR24)
- **Performance gate:** If full-array transfer (Rust → WebView) exceeds 5 seconds for 45MP files during Tier 1 development, switch to tile-based architecture before beginning Tier 2 (see NFR7)
- Successfully opens raw files from the top 8 camera manufacturers plus DNG without user configuration

### Measurable Outcomes

| Metric | Target | Timeframe | Measurement |
|--------|--------|-----------|-------------|
| GitHub stars | 500+ | 6 months | GitHub API |
| Total downloads | 1,000+ | 6 months | GitHub release counts |
| Forum mentions | 3+ forums | 6 months | Manual tracking |
| Academic adoption | 1+ course | 12 months | Direct outreach / inbound |
| 45MP render time | <3 seconds | At launch | Automated benchmark (NFR1) |
| Crash rate | <1% | Ongoing | Test corpus (NFR12) |
| Format coverage | 8+ manufacturers | At launch | Test suite with sample files (NFR24) |

## Product Scope & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP — prove that raw sensor data can be visualized interactively from standard camera files in a lightweight desktop app. Tier 1 delivers the "revelation moment" end-to-end.

**Resource model:** Solo developer, open source. Constrains scope aggressively — Tier 1 is the smallest thing that's genuinely useful. Community contributions may accelerate Tier 2.

**First development spike:** Before any UI work, build a bare-bones proof of concept: open a 45MP NEF, decode via LibRaw in Rust, transfer the Bayer array to the Tauri WebView, render it with WebGL. This validates the riskiest assumption (IPC performance) and establishes the data pipeline everything else depends on.

### Tier 1 — v1.0 Launch

All four user journeys (Marcus, Dr. Patel, Tomás, Yuki) are fully supported:

1. Open raw files via drag-and-drop or File > Open (all LibRaw-supported formats including Fuji X-Trans 6×6 CFA)
2. Bayer mosaic visualization with color-coded photosites and visual CFA overlay
3. Grayscale raw data view (value → brightness, no CFA color-coding)
4. Pixel-level zoom and pan with viewport position indicator
5. Photosite inspector (hover/click: channel identity, raw value, position)
6. Channel separation (R/G1/G2/B individual views)
7. Raw data histogram (per-channel and combined)
8. Always-visible quick stats bar (file name, dimensions, CFA pattern, bit depth, black/white level, ISO)
9. Full EXIF/metadata panel (non-applied)
10. Error handling with clear, specific messages for unsupported/corrupt/unreadable files
11. Dark color scheme as default
12. Windows, macOS, and Linux builds

### Tier 2 — v1.1 Fast Follow

- Interactive histogram ↔ Bayer spatial brushing (select value range, highlight photosites)
- Saturation/clipping overlay on Bayer view
- ROI selection with per-channel statistics (mean, std dev, min/max, hot pixel count)
- Split-screen slider: raw Bayer vs demosaiced view (standard algorithm, recognizable output)
- Full-sensor heatmap view for sensor characterization
- Tauri built-in auto-updater (evaluate)

### Vision (Future)

- "Peel back layers" reverse flow — toggle processing stages off from a demosaiced starting point
- 3D heightmap visualization of sensor values
- Waveform monitor display for banding detection
- Multiple demosaic algorithm comparison in split-screen
- Noise profiling and sensor fingerprinting
- CLI/library mode for research pipeline integration
- Educator course kit with sample files and guided exercises

### Out of Scope

The following are explicitly excluded from all v1.x releases. RawView is an analysis and education tool, not a raw processor.

- Raw file editing, processing, or export
- Batch processing or file management
- Plugin or extension system
- Color management / ICC profiles
- Multi-file comparison (beyond separate instances)
- Video or raw video formats
- Noise profiling or statistical analysis beyond Tier 2 ROI stats
- Internationalization (v1 is English-only; i18n deferred based on community demand)

## User Journeys

### Journey 1: Marcus Diagnoses Shadow Banding

**Who:** Marcus, 42, landscape photographer. Shoots with a Nikon Z8 (45.7MP). Active on DPReview, obsesses over dynamic range. Recently noticed horizontal banding in shadow recovery on his dawn shots and can't tell if it's his sensor or Lightroom's demosaicing.

**Opening Scene:** Marcus has been pushing shadow recovery +4 stops on a series of dawn landscapes. Three images show faint horizontal banding in the sky gradient. He's posted on DPReview asking if this is a known Z8 issue. Someone replies: "Have you looked at the raw data before demosaicing? Try RawView."

**Rising Action:** Marcus downloads RawView (8MB, installs in seconds). Drags his NEF file onto the window. Instead of a photo, he sees something he's never seen before — a mosaic of tiny colored dots. The quick stats bar at the bottom reads: `Z8_dawn_0347.NEF | 8256×5504 | RGGB | 14-bit | BL: 600 | WL: 15520 | ISO 400`. A small 2×2 colored grid in the corner shows the RGGB Bayer pattern. He hovers over a pixel — the inspector shows `G1 | Value: 612 | Row 2041, Col 3877`.

**Climax:** Marcus switches to the green channel view and zooms into the shadow region where banding appears in Lightroom. He sees it — faint horizontal stripes in the raw data, rows of consistently lower values repeating every 8 rows. This is sensor-level read noise banding, not a demosaicing artifact. The raw histogram confirms it: the green channel shows a bimodal distribution in the shadows. The problem is in the silicon, not the software.

**Resolution:** Marcus posts his findings on DPReview with screenshots from RawView showing the per-channel raw data. The thread becomes a reference for Z8 shadow banding discussion. He now opens every camera's raw files in RawView before blaming his raw developer.

**Capabilities revealed:** FR1, FR3, FR5, FR6, FR7, FR8, FR9, FR11–15, FR16, FR19–22, FR23.

---

### Journey 2: Dr. Patel Validates a Prototype Sensor

**Who:** Dr. Anika Patel, 35, imaging engineer at a sensor company. Works on Ubuntu, evaluates prototype CMOS sensors daily. Currently writes Python scripts with rawpy + matplotlib for every visualization.

**Opening Scene:** Anika has 200+ test captures from a new 50MP prototype sensor in DNG format. Her standard workflow: write a Python script, extract the Bayer array, plot it, compute statistics — 20 minutes of scripting per new analysis. A colleague mentions RawView.

**Rising Action:** Anika installs RawView on Ubuntu (AppImage, no dependencies). Opens the first DNG. The quick stats bar immediately shows: `proto_50mp_flat_001.DNG | 8688×5792 | RGGB | 16-bit | BL: 256 | WL: 65535 | ISO 100`. She zooms into the corner where they've been seeing fixed-pattern noise.

**Climax:** She switches between R, G1, G2, and B channels individually. In G2, she spots a cluster of abnormally bright photosites in rows 4800–4850 — a defect region not caught by automated scripts because it only affects one green sub-array. G1 is clean. RawView showed it in two clicks instead of 30 lines of Python.

**Resolution:** Anika files the defect report with RawView screenshots. She requests Tier 2 features on GitHub: ROI statistics and the clipping overlay would replace half her remaining matplotlib workflow.

**Capabilities revealed:** FR1, FR3, FR5, FR8, FR9, FR11–15, FR23, FR24. Linux platform support critical.

---

### Journey 5: Dr. Patel Replaces Her MATLAB Workflow (Tier 2)

**Who:** Dr. Anika Patel — same engineer from Journey 2, now 3 months after RawView v1.1 ships with Tier 2 features.

**Opening Scene:** Anika has been using RawView daily for visual QA since Tier 1. But she still drops into Python for two tasks: computing per-region statistics and identifying clipped highlights. She opens GitHub and sees v1.1 released with histogram brushing, ROI stats, and clipping overlay.

**Rising Action:** She updates RawView and opens a flat-field calibration frame from the prototype sensor. She toggles the saturation clipping overlay — immediately, 47 bright photosites light up red across the sensor. These are the hot pixels she's been cataloguing manually in spreadsheets. Now they're visible at a glance.

**Climax:** She drags a 200×200 ROI rectangle over the center of the sensor and reads the stats panel: `R mean: 1024.3, σ: 12.1 | G1 mean: 1023.8, σ: 11.9 | G2 mean: 1024.1, σ: 12.0 | B mean: 1023.5, σ: 12.4`. Uniformity confirmed. Then she brushes the histogram between values 15000–16383 and watches the Bayer view light up — the brushed photosites cluster in the upper-left corner, revealing a lens shading gradient she hadn't noticed. She drags the split-screen slider to compare raw Bayer against the demosaiced view — the shading is invisible after demosaicing because the raw developer's vignette correction masks it.

**Resolution:** Anika retires three Python scripts. RawView now handles visual QA, hot pixel identification, and region statistics in a single tool. She writes a blog post: "How RawView replaced my sensor analysis scripts."

**Capabilities revealed:** FR35 (histogram brushing), FR36 (clipping overlay), FR37–FR38 (ROI + stats), FR39 (split-screen slider), FR40 (heatmap implied via brushing spatial view).

---

### Journey 3: Tomás Learns What Demosaicing Actually Does

**Who:** Tomás, 23, graduate student in computational photography at ETH Zürich. The textbook explains demosaicing with diagrams of 4×4 Bayer grids, but he's never seen what a real 45-megapixel Bayer pattern looks like.

**Opening Scene:** Professor assigns: "Open a raw file in RawView and document what you observe about the CFA pattern." Tomás doesn't own a high-end camera — he downloads a sample CR3 from imaging-resource.com.

**Rising Action:** Tomás opens the CR3. His first reaction: "That's... not a photo." He sees a dim, greenish mosaic. The CFA overlay shows a 2×2 RGGB grid. He zooms in until individual photosites are visible and hovers over them: red, green, green, blue, repeating.

**Climax:** He switches to individual channels. The red channel shows only 25% of photosites — a sparse grid with gaps. He understands *why* demosaicing exists: three-quarters of every channel is missing data. The histogram shows the red channel has a completely different distribution than green — the raw data isn't white-balanced, and the metadata confirms it's displayed but not applied.

**Resolution:** His professor starts using RawView in all subsequent labs. Tomás keeps it installed as a reference throughout the semester.

**Capabilities revealed:** FR1, FR3, FR6, FR7, FR8, FR11–15, FR16, FR19–22, FR23–25. Sample files from the web (no camera required).

---

### Journey 4: Yuki Evaluates Frames Before Stacking

**Who:** Yuki, 38, astrophotographer in rural Japan. Shoots with a Canon EOS Ra on a tracking mount. Captures 200+ raw frames per session for deep-sky stacking.

**Opening Scene:** Yuki shot 180 frames of the Orion Nebula — 3 hours at ISO 1600. She needs to identify bad frames (tracking errors, satellite trails, hot pixels from sensor warming). Current method: open each CR3 in Canon DPP, squint at the processed preview. Takes over an hour.

**Rising Action:** She opens frame #1 and frame #180 in separate RawView windows. In the red channel on frame #180, she sees scattered bright dots not present in frame #1 — hot pixels from sensor heating. The histogram shows a longer high-value tail.

**Climax:** She spots a linear streak across 200 photosites in the green channel of frame #150 — a satellite trail invisible in the Canon preview but obvious in raw data. She identifies 12 bad frames in 15 minutes instead of an hour.

**Resolution:** Yuki shares her workflow on Cloudy Nights: "Use RawView to QA your subs before stacking." The post gets 40+ replies.

**Capabilities revealed:** FR1, FR3, FR4, FR8, FR11–15, FR19–22, FR23, FR40. Multiple instances critical.

---

### Journey Requirements Summary

| Capability | Marcus | Dr. Patel | Tomás | Yuki |
|-----------|--------|-----------|-------|------|
| Drag-and-drop file open | ✓ | ✓ | ✓ | ✓ |
| Multi-format support | ✓ | ✓ | ✓ | ✓ |
| Bayer mosaic visualization | ✓ | ✓ | ✓ | ✓ |
| CFA pattern overlay | ✓ | | ✓ | |
| Photosite inspector | ✓ | | ✓ | |
| Quick stats bar | ✓ | ✓ | | ✓ |
| Channel separation (R/G1/G2/B) | ✓ | ✓ | ✓ | ✓ |
| Raw histogram (per-channel) | ✓ | | ✓ | ✓ |
| Pixel-level zoom and pan | ✓ | ✓ | ✓ | ✓ |
| Linux support | | ✓ | | |
| Multiple instances | | | | ✓ |

Every Tier 1 feature is exercised by at least two journeys. Channel separation is the most universally critical — all four personas rely on it.

## Domain-Specific Requirements

RawView operates in the scientific imaging domain. No regulatory compliance, certifications, or third-party integrations required. Two domain concerns apply:

- **Data accuracy:** The rendered visualization must exactly represent the values in the raw file. No rounding, gamma, tone mapping, or transformation between LibRaw's decoded array and the displayed pixel. The "ground truth" claim is the product's core promise — any deviation is a product-breaking defect. (Enforced by NFR8–NFR11.)
- **Reproducibility:** The same raw file must produce identical numerical output across all three platforms. Per-channel histograms and inspector values must match exactly. Visual rendering may differ slightly due to WebView compositing, but numerical data must be bit-exact. (Enforced by NFR10.)

### Validation Methodology

Accuracy is validated through three independent verification paths:

1. **Bit-exact comparison:** For each supported format, compare RawView's displayed photosite values against dcraw `-D` output and rawpy's `raw_image` array. All three sources must produce identical integer values for a test to pass.
2. **Histogram verification:** Compute histograms independently from the raw Bayer array using a reference script (Python/rawpy). Compare bin counts against RawView's displayed histogram. Zero-tolerance for discrepancies.
3. **Cross-platform parity:** Run the full test corpus on all three platforms (Windows, macOS, Linux). Assert that inspector values, histogram bins, and stats bar values are identical across platforms. Visual rendering differences (sub-pixel, anti-aliasing) are documented exceptions.

Test corpus: 100+ raw files sourced from raw.pixls.us covering 8+ camera manufacturers (see NFR24). Validation runs as part of CI on every release.

### Reproducibility Plan

- **Test fixtures:** A curated set of raw files from raw.pixls.us stored in the repository's test data directory, covering Bayer RGGB/BGGR/GRBG/GBRG and Fuji X-Trans 6×6 patterns
- **Reference values:** For each test file, a JSON sidecar containing expected photosite values at 10 known coordinates, expected histogram bins, and expected stats bar values — generated once from a validated reference run
- **CI matrix:** GitHub Actions running on Windows (latest), macOS (latest), and Ubuntu (latest). Each platform runs the full test suite and asserts bit-exact match against reference values
- **Known exceptions catalog:** Visual rendering differences (WebView-specific compositing) documented in a RENDERING_NOTES.md file. Numerical discrepancies are never acceptable

## Innovation & Competitive Landscape

### Innovation Areas

- **Category creation:** First free, interactive, cross-platform viewer for pre-demosaiced camera raw data. No existing open-source tool combines direct camera raw file support with interactive Bayer visualization.
- **Zero-config raw file access:** Existing Bayer viewers require pre-extracted pixel dumps with manual format specification. RawView: drag, drop, see sensor data.
- **Open source as verifiability:** Using open source as a trust mechanism for the ground truth claim — product credibility depends on code auditability.

### Competitive Landscape

| Segment | Current Solution | RawView Advantage |
|---------|-----------------|-------------------|
| Photographers diagnosing artifacts | No tool — blame the raw developer | See pre-demosaic data directly |
| Sensor engineers (visual QA) | Custom Python/MATLAB scripts | Interactive GUI, no scripting |
| Sensor engineers (commercial) | RawDigger ($35–100, Windows) | Free, cross-platform, open source |
| Educators | Simulated Bayer diagrams in textbooks | Real sensor data from real cameras |
| Astrophotographers | Manual inspection in raw developers | Raw channel data reveals hidden artifacts |

## Desktop Application Requirements

### Platform Support

- **Windows:** Windows 10+ (64-bit). WebView2 runtime (pre-installed on Win 10 1803+). Distributed as `.msi` and portable `.exe`.
- **macOS:** macOS 12+ (Apple Silicon and Intel universal binary). WebKit WebView. Distributed as `.dmg`.
- **Linux:** Ubuntu 22.04+, Fedora 38+, Arch-based. WebKitGTK required. Distributed as `.AppImage` and `.deb`.

### System Integration

- **File opening:** Drag-and-drop and File > Open dialog. No OS-level file type registration in v1.
- **File associations:** Not registered — users already have raw developers associated with these extensions.
- **Multiple instances:** Supported for side-by-side frame comparison.

### Update Strategy

- **Tier 1:** Manual downloads from GitHub Releases.
- **Tier 2:** Evaluate Tauri v2 built-in updater (checks GitHub releases, prompts user).
- **Package managers:** Community-driven (Homebrew, winget, AUR, Snap/Flatpak).

### Offline & Privacy

- Fully offline — no network access required.
- No user accounts, telemetry, or server communication.
- All processing local.

## Risk Mitigation

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Tauri IPC bottleneck (90MB for 45MP) | High | First dev spike validates before UI work. 5-second gate triggers tile-based refactor (NFR7) |
| WebGL rendering accuracy (compositor tone mapping) | High | Validate 16-bit integer textures bypass OS transforms. Canvas 2D fallback |
| Cross-platform WebView inconsistency | Medium | Automated visual regression + bit-exact numerical validation (NFR10) |
| LibRaw FFI from Rust | Low | libraw-rs crate exists. Build early, fail fast |

### Market Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Audience too niche | Medium | Three distinct segments reduce single-segment dependency |
| Users open once, never return | Medium | Tier 2 analysis features create ongoing utility |
| RawDigger adds cross-platform/free tier | Low | Open source trust model not replicable by commercial product |

### Resource Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Solo developer bandwidth | High | Tier split ensures shippable product at each phase |
| Scope creep from community | Medium | "Things we won't do" doc published with v1 |

### Validation Strategy

- **Technical:** Prototype Tauri IPC pipeline with 45MP file before UI work
- **Product:** Launch Tier 1, post to r/photography and DPReview, measure downloads and engagement
- **Accuracy:** Compare displayed values against dcraw `-D` and rawpy for bit-exact match on 10+ formats

## Functional Requirements

### File Management

- **FR1:** Users can open raw image files via drag-and-drop onto the application window
- **FR2:** Users can open raw image files via a File > Open dialog with file type filtering
- **FR3:** The application can decode raw files from all camera manufacturers supported by LibRaw, including Canon (CR2/CR3), Nikon (NEF), Sony (ARW), Fuji (RAF), Panasonic (RW2), Olympus/OM System (ORF), Pentax (PEF), Leica (DNG/RWL), and Adobe DNG
- **FR4:** Users can open multiple application instances simultaneously for side-by-side file comparison
- **FR5:** The application auto-detects the CFA pattern (RGGB, BGGR, GRBG, GBRG for Bayer; 6×6 for Fuji X-Trans) without user configuration
- **FR6:** Users receive a categorized error message when opening an unsupported, corrupt, or unreadable file: "Unsupported format" (with file extension), "Corrupt or unreadable file data", or "File access denied" (with path)
- **FR7:** The application displays the currently open file's name in the window title bar
- **FR8:** The application decodes raw file data without modifying, transforming, or reinterpreting sensor values during the decode pipeline

### Bayer Mosaic Visualization

- **FR9:** Users can view the raw sensor data as a Bayer mosaic with photosites color-coded by CFA channel assignment
- **FR10:** Users can see a visual CFA pattern overlay diagram (2×2 for Bayer, 6×6 for X-Trans) on the Bayer view
- **FR11:** Users can zoom from full-sensor overview down to individual photosite level
- **FR12:** Users can pan across the sensor area at any zoom level
- **FR13:** The Bayer visualization displays exact sensor values with no rounding, gamma, tone mapping, or transformation
- **FR14:** Users can see their current viewport position within the full sensor area when zoomed in

### Visualization Modes

- **FR15:** Users can switch between visualization modes (Bayer mosaic, grayscale, individual channels) via toolbar or keyboard shortcuts
- **FR16:** Users can view the raw sensor data as a grayscale image where each photosite's brightness corresponds to its raw value, without CFA color-coding or demosaicing

### Channel Separation

- **FR17:** Users can view the R channel in isolation
- **FR18:** Users can view the G1 channel in isolation (first green position)
- **FR19:** Users can view the G2 channel in isolation (second green position)
- **FR20:** Users can view the B channel in isolation
- **FR21:** Users can switch between full Bayer view and individual channel views without re-loading the file

### Photosite Inspector

- **FR22:** Users can hover over any photosite to see its channel identity (R, G1, G2, or B), raw sensor value, and row/column position
- **FR23:** Users can click on a photosite to pin the inspector display
- **FR24:** The inspector displays raw sensor values as integers matching the source file's bit depth (no normalization)

### Histogram

- **FR25:** Users can view a histogram of raw sensor values for the entire image
- **FR26:** Users can view per-channel histograms (R, G1, G2, B) individually or overlaid
- **FR27:** Users can view a combined histogram of all channels
- **FR28:** The histogram displays the full value range from black level to white level

### Metadata Display

- **FR29:** Users can view an always-visible quick stats bar showing: file name, sensor dimensions, CFA pattern, bit depth, black level, white level, and ISO
- **FR30:** Users can view a full metadata panel showing all available EXIF data (ISO, shutter speed, aperture, white balance, camera model, lens, date/time)
- **FR31:** Metadata is displayed for informational purposes only and never applied to the visualization
- **FR32:** Users can toggle the full metadata panel on/off

### User Interface

- **FR33:** Users can toggle visibility of each panel (histogram, metadata, channel selector) independently via toolbar or keyboard shortcuts
- **FR34:** The application provides keyboard shortcuts for all primary actions (open file, switch channels, toggle panels, zoom)

### Tier 2 — Interactive Analysis (v1.1)

- **FR35:** Users can select a value range on the histogram and see corresponding photosites highlighted on the Bayer view
- **FR36:** Users can toggle a saturation clipping overlay highlighting photosites at the sensor's maximum value
- **FR37:** Users can draw a rectangular region of interest (ROI) on the Bayer view
- **FR38:** Users can view per-channel statistics for a selected ROI: mean, standard deviation, minimum, maximum, and hot pixel count
- **FR39:** Users can view a split-screen comparison with a draggable slider: raw Bayer on one side, demosaiced rendering using bilinear interpolation (LibRaw default) on the other
- **FR40:** Users can view a full-sensor heatmap representing the entire sensor as aggregated value intensities

## Non-Functional Requirements

### Performance

- **NFR1:** Opens and renders a 45MP raw file in under 3 seconds on a mid-range machine (8GB RAM, integrated GPU, SSD), measured from file drop to visible mosaic
- **NFR2:** Visualization mode switching completes in under 500ms for 45MP files
- **NFR3:** Zoom and pan maintain 30fps at stable zoom levels for files up to 45MP; zoom level transitions may incur brief re-render delays
- **NFR4:** Histogram renders within 1 second of file open; updates within 500ms on channel switch
- **NFR5:** Cold start (launch to ready) completes in under 2 seconds on a mid-range machine (8GB RAM, integrated GPU, SSD)
- **NFR6:** Memory usage ≤500MB for single 45MP file (Tier 1); ≤750MB with split-screen demosaiced view (Tier 2)
- **NFR7:** Performance gate: if full-array IPC transfer exceeds 5 seconds for 45MP, refactor to tile-based rendering before Tier 2

### Data Accuracy

- **NFR8:** Inspector photosite values must be bit-exact with LibRaw's decoded array — zero tolerance for rounding, truncation, or transformation
- **NFR9:** Histogram bin counts must match independently computed histograms (validated against dcraw `-D` and rawpy)
- **NFR10:** Same raw file produces identical numerical data (inspector, histogram, stats bar) across Windows, macOS, and Linux
- **NFR11:** Visual rendering must not apply gamma correction, tone mapping, or color space conversion to pixel data (platform compositing differences in anti-aliasing/sub-pixel rendering are acceptable)

### Reliability

- **NFR12:** Crash rate <1% across all supported formats, measured on test corpus of 100+ files from 8+ manufacturers sourced from raw.pixls.us
- **NFR13:** Corrupt or malformed files handled gracefully — no crashes, no hangs, clear error within 3 seconds
- **NFR14:** Read-only application — never modifies source files
- **NFR15:** Detects missing system dependencies (WebView, GPU) at startup with clear error message

### Accessibility

- **NFR16:** All primary actions accessible via keyboard without mouse
- **NFR17:** UI text maintains minimum 4.5:1 contrast ratio (WCAG 2.1 AA)
- **NFR18:** Numerical displays use minimum 12px font size

### Visual & Presentation

- **NFR19:** All numerical displays use a monospace typeface for alignment and precision
- **NFR20:** Dark color scheme as default, suitable for low-ambient-light environments

### Portability

- **NFR21:** Bundle size ≤20MB per platform (excluding system WebView)
- **NFR22:** Zero runtime dependencies beyond OS-provided WebView
- **NFR23:** Installation requires no administrator/root privileges

### Testing

- **NFR24:** Test corpus sourced from raw.pixls.us covering 8+ manufacturers for format and accuracy validation
