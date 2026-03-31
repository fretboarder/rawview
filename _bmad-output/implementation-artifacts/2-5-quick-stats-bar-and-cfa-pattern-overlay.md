# Story 2.5: Quick Stats Bar and CFA Pattern Overlay

Status: done

## Story

As a user who has just opened a raw file,
I want an always-visible quick stats bar and a visual CFA pattern diagram,
so that I always have sensor context visible and understand the repeating CFA structure.

## Acceptance Criteria

1. Always-visible bar at bottom shows: filename, dimensions, CFA pattern name, bit depth, black level, white level, ISO (FR29)
2. All numeric values in monospace at min 12px with 4.5:1 contrast ratio (NFR19, NFR18, NFR17)
3. No file open → placeholder dashes in all fields
4. CFA overlay: small 2×2 color grid for Bayer, 6×6 for X-Trans, with channel labels (FR10)
5. Overlay positioned in corner of the canvas view
6. Display stretch toggle is already in the Toolbar (Story 2.3) — no duplication here

## Tasks

- [ ] Task 1: Create QuickStatsBar component
  - [ ] Create `src/components/panels/QuickStatsBar.tsx`
  - [ ] Fixed at bottom of viewport area
  - [ ] Reads `session` from viewerStore via selectors
  - [ ] Format: `filename | WxH | RGGB | 14-bit | BL:512 | WL:16383 | ISO 400`
  - [ ] No session: `— | — | — | — | — | — | —`
  - [ ] Monospace for all values, dark background, high contrast text

- [ ] Task 2: Create CfaOverlay component
  - [ ] Create `src/components/viewer/CfaOverlay.tsx`
  - [ ] Small (64×64px) color-coded grid overlaid on the canvas
  - [ ] Bayer: 2×2 grid with R(red)/G(green)/G(green)/B(blue) cells + channel labels
  - [ ] X-Trans: 6×6 grid scaled down
  - [ ] Positioned in top-right corner with slight padding
  - [ ] Semi-transparent background for readability

- [ ] Task 3: Integrate into layout
  - [ ] Add QuickStatsBar below ViewerCanvas in MainWindowContent
  - [ ] Add CfaOverlay as an overlay inside ViewerCanvas container (only when session active)

- [ ] Task 4: Tests
  - [ ] QuickStatsBar test: renders placeholders when no session, renders values when session exists
  - [ ] CfaOverlay test: renders correct grid for RGGB pattern
  - [ ] `npm test -- --run` passes
  - [ ] `npx tsc --noEmit` passes

## Dev Notes

### QuickStatsBar Data Source
All data comes from `viewerStore.session` (SessionInfo type) — no additional Rust commands needed.

```typescript
const session = useViewerStore(s => s.session)
// session.filename, session.width, session.height, session.cfa_pattern,
// session.bit_depth, session.black_level, session.white_level, session.iso
```

### CFA Pattern Display
```typescript
// session.cfa_pattern is: { type: "Bayer", pattern: "Rggb" } or { type: "XTrans", grid: number[][] }
const label = session.cfa_pattern.type === "Bayer" ? session.cfa_pattern.pattern.toUpperCase() : "X-Trans"
```

### Critical Warnings
- Zustand selector pattern
- No useMemo/useCallback
- This is pure frontend — no Rust changes needed
- Monospace font: use `font-mono` Tailwind class

### Review Findings

**Date**: 2026-03-31
**Reviewer**: AI Code Review (3-layer parallel)

#### Patched
- **S25-2 (LOW)**: RTL violation — `right-3` changed to `end-3` in CFA overlay positioning for both Bayer and X-Trans variants [src/components/viewer/CfaOverlay.tsx:34,57]

#### Deferred
- **S25-1 (MEDIUM)**: `useEffectiveZoom` uses fragile `document.querySelector('[aria-label="Raw image canvas"]')?.parentElement` to find canvas container — should use a shared ref or context [src/components/panels/QuickStatsBar.tsx:17-19]
- **S25-3 (LOW)**: Placeholder count mismatch — empty state shows 7 placeholders but populated state shows 9 fields
- **S25-4 (LOW)**: G1/G2 collapse test — no verification that both green channels are correctly labeled

#### Dismissed
- Stats bar layout and styling meet accessibility requirements
- CFA overlay correctly renders both Bayer 2×2 and X-Trans 6×6 patterns
