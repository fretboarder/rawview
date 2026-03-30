# Things RawView Won't Do

RawView is an analysis and education tool, not a raw processor. This document lists features that are explicitly out of scope for all v1.x releases.

These boundaries are intentional, not oversights. They keep RawView focused on what it does uniquely well: showing you what your sensor actually captured.

---

## Out of Scope

### Raw file editing, processing, or export

RawView is a viewer, not a processor. It reads raw files and displays their contents. It will never write, modify, convert, or export raw data. If you want to process raw files, use Darktable, RawTherapee, Lightroom, or any of the many excellent tools built for that purpose.

### Batch processing or file management

RawView opens one file at a time (multiple instances are supported for side-by-side comparison). It is not a DAM, a batch converter, or a folder browser. File management belongs in your OS or a dedicated tool.

### Plugin or extension system

Adding a plugin architecture introduces surface area, maintenance burden, and complexity that conflicts with RawView's goal of being a simple, auditable, trust-by-inspection tool. Third-party plugins could undermine the data accuracy guarantee.

### Color management / ICC profiles

Applying ICC profiles or color space conversions would transform the raw sensor values before display — the opposite of what RawView exists to do. White balance data from metadata is displayed for reference only and is never applied to the visualization.

### Multi-file comparison beyond separate instances

Opening two or more files in the same window (split-screen file comparison, diff view, overlay) is out of scope for v1.x. The supported workflow for comparison is opening multiple RawView instances side by side.

### Video or raw video formats

RawView targets still camera raw formats via LibRaw. Cinema DNG, BRAW, R3D, and other video raw formats are out of scope. The frame-by-frame interaction model does not extend naturally to video.

### Noise profiling beyond Tier 2 ROI statistics

Automated sensor characterization — noise profiling, DSNU/PRNU measurement, sensor fingerprinting — is research tooling beyond RawView's scope. Tier 2 ROI statistics (mean, std dev, min/max per channel) provide the building blocks; formal noise profiling is a separate problem domain.

### Internationalization (English-only for v1)

The v1.x interface is English-only. Internationalization is deferred; it may be added in a future version based on community demand. Community contributions for translations are welcome but not actively solicited for v1.
