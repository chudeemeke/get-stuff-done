# Phase 6: Logo Assets - Research

**Researched:** 2026-02-04
**Domain:** SVG graphics creation, PNG export, brand assets
**Confidence:** HIGH

## Summary

This phase creates custom logo assets for the GSD fork identity. The existing `assets/gsd-logo-2000.svg` uses solid isometric cubes in a 2x2 grid - this needs to be redesigned per CONTEXT.md specifications: two hollow square frames interlocking in chain-link style.

Key deliverables: SVG source files for icon and lockup, PNG exports at standard sizes, favicons, Open Graph image, shields.io badge, and npm banner.

**Primary recommendation:** Create SVG sources manually using coordinate geometry for isometric projection, then use `svgexport` CLI for batch PNG generation.

## Standard Stack

### Core Tools
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| Hand-crafted SVG | Vector source files | Full control over isometric geometry, no dependencies |
| svgexport | SVG to PNG CLI | Node.js based, scriptable, handles transparency |
| sharp (optional) | Image processing | High-performance, can optimize PNGs |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| SVGO | SVG optimization | Reduce file size before distribution |
| TinyPNG/Squoosh | PNG compression | Keep Open Graph under 300KB |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| svgexport | Inkscape CLI | More powerful but heavier dependency |
| svgexport | sharp | More control but requires more code |
| Hand-crafted SVG | Figma/Illustrator | Better UI but adds tool dependency |

**Installation:**
```bash
bun add -d svgexport sharp svgo
```

## Architecture Patterns

### Recommended Asset Structure
```
assets/
├── gsd-icon.svg              # Icon only (interlocking squares)
├── gsd-logo.svg              # Full lockup (icon + text)
├── gsd-icon-dark-*.png       # Icon variants for dark backgrounds
├── gsd-icon-light-*.png      # Icon variants for light backgrounds
├── gsd-logo-dark-*.png       # Lockup variants for dark backgrounds
├── gsd-logo-light-*.png      # Lockup variants for light backgrounds
├── gsd-icon-mono-white.svg   # Monochrome white
├── gsd-icon-mono-black.svg   # Monochrome black
├── favicon-16.png            # Browser tab
├── favicon-32.png            # Retina browser tab
├── apple-touch-icon.png      # iOS (180x180)
├── og-image.png              # Open Graph (1200x630)
├── gsd-badge.svg             # shields.io compatible
└── npm-banner.png            # npm package page
```

### Pattern: Isometric Projection via SVG Transform

To create isometric view in SVG (2D), apply transformation matrix:
- Rotate 45 degrees
- Scale Y to ~57.7% (or skewX/skewY approach)

For interlocking hollow squares:
```svg
<!-- Isometric transform group -->
<g transform="matrix(0.866, 0.5, -0.866, 0.5, 0, 0)">
  <!-- Draw squares as paths with stroke, no fill -->
  <rect x="0" y="0" width="100" height="100"
        fill="none" stroke="#5FD7D7" stroke-width="8"/>
</g>
```

### Pattern: SVG Text Gradient
```svg
<defs>
  <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#5FD7D7"/>
    <stop offset="100%" stop-color="#87D787"/>
  </linearGradient>
</defs>
<text fill="url(#textGrad)">Get•Stuff•Done</text>
```

### Anti-Patterns to Avoid
- **Raster-first workflow:** Always create SVG source, then export PNG
- **Embedded fonts in SVG:** Use `<path>` for text to ensure rendering
- **Non-square icon canvas:** Icon must be 1:1 aspect ratio for favicons

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PNG export | Custom Node script | svgexport CLI | Handles edge cases, tested |
| SVG optimization | Manual cleanup | SVGO | Comprehensive, maintained |
| Base64 encoding | Custom function | Built-in btoa/Buffer | Standard, reliable |
| Image compression | Manual | TinyPNG API or Squoosh | Better algorithms |

**Key insight:** SVG creation should be manual (precision needed), but export pipeline should use established tools.

## Common Pitfalls

### Pitfall 1: Favicon Detail Loss
**What goes wrong:** Fine details disappear at 16x16
**Why it happens:** Too much complexity in source design
**How to avoid:** Design icon to work at minimum 16px - use bold, simple shapes
**Warning signs:** Icon looks like "mud" when scaled down

### Pitfall 2: Inconsistent Rendering
**What goes wrong:** SVG looks different in browsers vs export
**Why it happens:** Font rendering, filter support varies
**How to avoid:** Convert text to paths, avoid complex filters for critical elements
**Warning signs:** Export looks different from browser preview

### Pitfall 3: Transparent Background Issues
**What goes wrong:** White fringing on transparent PNGs
**Why it happens:** Anti-aliasing against assumed white background
**How to avoid:** Use pre-multiplied alpha, test on both dark and light backgrounds
**Warning signs:** Visible halo around edges

### Pitfall 4: Open Graph Cropping
**What goes wrong:** Key content cut off on different platforms
**Why it happens:** Platforms crop differently (some use 1.91:1, some square)
**How to avoid:** Keep important content in center 60% of image
**Warning signs:** Logo cut off in Twitter/LinkedIn previews

## Specifications Reference

### Favicon Sizes (2026 Best Practice)
| Size | Purpose | Format |
|------|---------|--------|
| 16x16 | Browser tab | PNG |
| 32x32 | Retina browser tab | PNG |
| 180x180 | Apple Touch Icon | PNG |
| 192x192 | Android Chrome | PNG |
| 512x512 | PWA splash | PNG |

**Minimal set:** 16, 32, 180 covers 99% of use cases.

### Open Graph Image
- **Size:** 1200x630 pixels (1.91:1 ratio)
- **Format:** PNG or JPEG
- **File size:** Under 300KB recommended
- **Safe zone:** Keep key content in center 60%

### shields.io Badge
- **Format:** SVG with base64-encoded logo
- **Logo size:** 14x14 pixels recommended
- **URL pattern:** `?logo=data:image/svg+xml;base64,[BASE64]`

### Retina (@2x) Sizes
| Base | @2x |
|------|-----|
| 16 | 32 |
| 32 | 64 |
| 64 | 128 |
| 128 | 256 |
| 256 | 512 |

### npm Banner
- **No official spec** - common sizes: 1280x640, 1200x400
- **Recommendation:** 1200x400 (3:1 ratio) works well in README

## Recommendations for Claude's Discretion Items

### Light-Mode Variant Treatment
**Recommendation:** Darken the cyan/green by 20% for light backgrounds
- Light cyan: #4BBDBD (darker than #5FD7D7)
- Light green: #6DBD6D (darker than #87D787)
- Maintains brand recognition while ensuring contrast

### Pixel Font Selection
**Recommendation:** Create custom pixel paths in SVG
- Existing pixel fonts (Press Start 2P, VT323) may have licensing complexity
- Custom paths ensure consistent rendering everywhere
- 8-bit aesthetic achieved with 5x7 or 6x8 pixel grid per character

### npm Banner Dimensions
**Recommendation:** 1200x400 pixels (3:1 ratio)
- Fits well in README without dominating
- Matches common hero image patterns
- Same width as Open Graph for consistency

### Badge Proportions
**Recommendation:** Standard shields.io style
- Height: 20px
- Logo: 14x14 internal
- Padding: 4px horizontal
- Format: `[icon] GSD | v0.1.0`

### @2x Retina Exact Sizes
**Recommendation:** Generate both base and 2x for: 16, 32, 64, 128, 256
- Results in: 16, 32, 64, 128, 256, 512 (512 serves as 256@2x)
- Apple Touch Icon: 180x180 (already high-res)

### Social Media Layout
**Recommendation:** Center-weighted composition
- Icon prominently centered
- Text below or right of icon
- Brand colors as accent, not background
- Dark variant as primary (matches terminal aesthetic)

## Existing Assets Analysis

**Current `gsd-logo-2000.svg`:**
- Uses 2x2 grid of solid isometric cubes
- Dark background (#1a1b26) baked in
- Correct colors (#5FD7D7 cyan, #87D787 green)
- System fonts (SF Mono, etc.) - not pixel style
- Text: "[GSD]" and "GetStuffDone" - not "Get•Stuff•Done"

**Gap from CONTEXT.md requirements:**
1. Icon should be hollow interlocking squares, not solid cubes
2. Text should use pixel/8-bit font style
3. Text should be "Get•Stuff•Done" with bullet separators
4. Need transparent background variants
5. Need light-mode variants
6. Need comprehensive export sizes

## Open Questions

1. **Exact interlock geometry**
   - What we know: Chain-link style, cyan front at interlock point
   - What's unclear: Exact overlap percentage, frame thickness ratio
   - Recommendation: Start with 15% frame thickness, 30% overlap

## Sources

### Primary (HIGH confidence)
- [shields.io Logos Documentation](https://shields.io/docs/logos) - Badge specifications
- [Evil Martians Favicon Guide](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs) - Modern favicon best practices
- [svgexport npm](https://www.npmjs.com/package/svgexport) - Export tool documentation

### Secondary (MEDIUM confidence)
- [JointJS Isometric Diagrams](https://www.jointjs.com/blog/isometric-diagrams) - SVG isometric techniques
- [Open Graph Image Guide](https://www.ogimage.gallery/libary/the-ultimate-guide-to-og-image-dimensions-2024-update) - OG image specifications

### Tertiary (LOW confidence)
- npm banner dimensions - No official spec, based on common practice

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - Well-documented tools
- Architecture: HIGH - SVG/PNG workflow is standard
- Specifications: HIGH - Official platform documentation
- Pitfalls: MEDIUM - Based on common issues

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain)

---
*Phase: 06-logo-assets*
*Research completed: 2026-02-04*
