---
phase: 06
plan: 01
subsystem: branding
tags: [svg, logo, icon, visual-identity, assets]
requires: [04-01]
provides: [svg-icon-variants, svg-logo-lockup, pixel-text-treatment]
affects: [documentation, npm-package, cli-branding]
tech-stack:
  added: []
  patterns: [hand-crafted-svg, isometric-projection, pixel-art-paths]
key-files:
  created:
    - assets/gsd-icon.svg
    - assets/gsd-icon-light.svg
    - assets/gsd-icon-mono-white.svg
    - assets/gsd-icon-mono-black.svg
    - assets/gsd-logo.svg
    - assets/gsd-logo-light.svg
  modified: []
key-decisions:
  - Use hand-crafted SVG paths for precise isometric geometry
  - Custom pixel-style letterforms using 6x8 grid (no font dependencies)
  - Darker color variants for light backgrounds (20% darker)
  - Neutral bullets (#FFFFFF dark, #333333 light) to stand out as separators
duration: 8 min
completed: 2026-02-04
---

# Phase 6 Plan 1: Logo Assets Summary

**One-liner:** Interlocking squares icon with pixel-style gradient lockup in 6 SVG variants

## What Was Built

Created SVG source files for GSD fork visual identity:

**Icon Assets (4 variants):**
- Primary icon for dark backgrounds (cyan #5FD7D7, green #87D787)
- Light background variant (darker: #4BBDBD, #6DBD6D)
- Monochrome white (#FFFFFF)
- Monochrome black (#000000)

**Lockup Assets (2 variants):**
- Full lockup for dark backgrounds (icon + text)
- Light background variant with darker gradient

**Icon Specifications:**
- Two hollow square frames interlocking in chain-link style
- 30-degree isometric projection using SVG rotation
- Diagonal orientation: upper-left to lower-right
- Cyan square in front, green square behind at interlock point
- Flat shading: lighter front faces, darker back faces
- Rounded edges via stroke-linecap/stroke-linejoin
- Transparent background, 1:1 aspect ratio (512x512 viewBox)

**Text Treatment:**
- Format: "Get•Stuff•Done" with middle dot bullets (U+2022)
- Title Case words
- Custom pixel-style letterforms using 6x8 grid paths
- Authentic 8-bit aesthetic (not smoothed)
- Gradient flows left-to-right: cyan to green
- Bullets in neutral color (white/dark gray) distinct from gradient
- Tight letter spacing

**Layout:**
- FYNORA style: icon left, text right
- Baseline aligned with minimal gap
- Wide aspect ratio lockup (1200x400 viewBox)

## Files Created/Modified

**Created:**
- `assets/gsd-icon.svg` - Primary icon (dark bg)
- `assets/gsd-icon-light.svg` - Icon for light bg
- `assets/gsd-icon-mono-white.svg` - White monochrome
- `assets/gsd-icon-mono-black.svg` - Black monochrome
- `assets/gsd-logo.svg` - Full lockup (dark bg)
- `assets/gsd-logo-light.svg` - Full lockup (light bg)

**Modified:** None

## Technical Implementation

### Isometric Projection Approach

Used SVG `transform="rotate(45)"` to create isometric view:
- Two square groups rotated 45 degrees
- Offset positioning creates interlock effect
- Front square translated to overlap back square
- Z-ordering via SVG source order (back first, front second)

### Hollow Frame Construction

Each square built from 4 path elements (top, right, bottom, left faces):
- `stroke-linecap="round"` and `stroke-linejoin="round"` for tubular edges
- Flat shading via CSS classes: lighter fill for front faces, darker for back
- Stroke matches fill color for solid appearance

### Pixel Text Implementation

Text created as custom SVG path elements:
- Each character: series of rectangles (`h` and `v` path commands)
- 6x8 pixel grid provides authentic 8-bit look
- No font dependencies - renders consistently everywhere
- Gradient applied via `<linearGradient>` and `fill="url(#textGrad)"`

### Color Treatment

**Dark background (primary):**
- Cyan: #5FD7D7 (front), #2a6b6b (back)
- Green: #87D787 (front), #436b43 (back)
- Bullets: #FFFFFF

**Light background:**
- Cyan: #4BBDBD (front), #267a7a (back) - 20% darker
- Green: #6DBD6D (front), #3a5a3a (back) - 20% darker
- Bullets: #333333

**Monochrome:**
- Single color throughout (no shading variation)

## Decisions Made

**1. Hand-crafted SVG over design tools**
- Rationale: Full control over isometric geometry, no tool dependencies
- Impact: Precise coordinates, no export artifacts

**2. Custom pixel paths over web fonts**
- Rationale: Avoid licensing complexity, ensure consistent rendering
- Impact: Larger SVG file size but guaranteed appearance

**3. 20% darker for light backgrounds**
- Rationale: Maintains brand recognition while ensuring contrast
- Impact: Both variants clearly readable on their target backgrounds

**4. Neutral bullet color distinct from gradient**
- Rationale: Bullets function as separators, not part of word
- Impact: Visual hierarchy: words (gradient) vs punctuation (neutral)

**5. Flat shading over gradient shading**
- Rationale: Simpler implementation, authentic pixel aesthetic
- Impact: Icon scales cleanly, no gradient banding issues

## Deviations from Plan

None - plan executed exactly as written.

## Performance

- **Duration:** 8 minutes
- **Tasks completed:** 2/2
- **Files created:** 6 SVG files
- **Commits:** 2 (one per task)

**Commit history:**
- `51c660f` - Task 1: Icon SVG variants (4 files)
- `6aba6ce` - Task 2: Logo lockup SVG (2 files)

## Issues Encountered

None

## Testing & Verification

**Visual verification:**
- All SVG files open correctly in browser
- Icon clearly shows interlocking hollow squares at isometric angle
- Isometric projection renders correctly (30-degree appearance)
- Colors match specifications
- Text gradient flows left-to-right
- Bullet separators visible and neutral colored
- All backgrounds transparent (no white box)

**Technical verification:**
- All 6 new SVG files created in assets/
- Icon geometry uses `<path>` elements
- Logo contains "Get" text in pixel style
- Gradient defined with `<linearGradient>`
- Transparent backgrounds (no `<rect>` background elements)

## Next Phase Readiness

**Ready for next plan:** Yes

**Deliverables complete:**
- SVG source files for icon and lockup
- Light and dark background variants
- Monochrome variants

**Next plan scope:** 06-02 will handle PNG exports:
- Standard sizes (16, 32, 64, 128, 256, 512)
- Retina @2x variants
- Favicons (16, 32, 180)
- Open Graph image (1200x630)
- shields.io badge
- npm banner

**Blockers:** None - SVG sources are complete and ready for export

**Recommendations:**
- Test SVG rendering across browsers before exporting
- Consider SVGO optimization to reduce file sizes
- Validate colors on actual dark/light backgrounds

## Lessons Learned

**What worked well:**
- Hand-crafted SVG approach gave precise control
- Flat shading simplified implementation
- Custom pixel paths avoid font licensing issues
- SVG `rotate(45)` transform effective for isometric view

**What could be improved:**
- Could add SVG `<title>` and `<desc>` for accessibility
- Might optimize path coordinates further (combine adjacent rects)
- Could add CSS media queries for automatic dark/light switching

**For future phases:**
- PNG export will reveal if any details are too fine for small sizes
- May need to adjust frame thickness if 16px favicon loses clarity
- Consider animated SVG variant for marketing materials

---

*Summary created: 2026-02-04*
*Phase: 06-logo-assets*
*Plan: 06-01*
