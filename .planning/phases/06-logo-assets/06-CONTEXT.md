# Phase 6: Logo Assets - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create custom logo assets for the GSD fork identity. Includes isometric icon of interlocking squares, pixel-style wordmark with bullet separators, and comprehensive asset exports. This phase delivers visual identity files only — integration into documentation or CLI is separate.

</domain>

<decisions>
## Implementation Decisions

### Icon Geometry
- Two hollow square frames interlocking in chain-link style
- Classic 30-degree isometric viewing angle
- Diagonal chain orientation: upper-left to lower-right (\)
- Equal-sized squares
- Thin/delicate frame thickness with rounded edge profile
- Sharp corners on the square shapes themselves
- Flat shading (single color per face, no gradients for lighting)
- Obvious interlock visibility — clearly shows one passing through the other
- Cyan square in front, green square behind at interlock point
- Transparent background only — no background element
- Square (1:1) aspect ratio for icon

### Text Treatment
- Low-res chunky pixel/8-bit style font
- Title Case: Get•Stuff•Done
- Middle dot (•) bullet separators
- White/neutral bullet color (stands out as separators)
- Tight/compact letter spacing
- Gradient flows left-to-right: cyan (#5FD7D7) to green (#87D787)
- Baseline aligned with icon
- Minimal gap between icon and text (tight lockup)
- FYNORA layout: icon left, text right

### Color Application
- Exact hex values: cyan #5FD7D7, green #87D787
- Light and dark background variants needed
- Light variant: Claude's discretion on treatment
- Both monochrome versions: white and black single-color
- Unified color treatment across icon and text
- Icon gradient follows 3D depth: front faces lighter, back faces darker within each color

### Asset Formats
- Both SVG (vector source) and PNG (raster exports)
- Comprehensive PNG sizes: all standard (16, 32, 64, 128, 256, 512px) + @2x retina + social media dimensions
- Both icon-only and combined lockup versions
- Assets live in existing assets/ folder (not subfolder)
- Modern PNG favicons (favicon-16.png, favicon-32.png)
- Social preview: 1200x630 Open Graph image
- Descriptive naming: gsd-logo-dark-512.png, gsd-icon-light-32.png
- Small badge for README header (shields.io style)
- npm-specific banner image

### Claude's Discretion
- Light-mode variant color treatment
- Exact pixel font selection or creation
- npm banner dimensions and layout
- Badge proportions and styling
- @2x retina exact sizes
- Social media layout/composition

</decisions>

<specifics>
## Specific Ideas

- "FYNORA style" layout reference — icon on left, text on right, tight relationship
- Low-res chunky pixel font is authentically retro, not smoothed
- Chain-link interlock should be immediately recognizable
- The diagonal flow (upper-left to lower-right) matches natural reading direction
- Rounded edge profile on frames gives tubular feel despite flat shading

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-logo-assets*
*Context gathered: 2026-02-04*
