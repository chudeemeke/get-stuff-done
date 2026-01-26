# Get Stuff Done: Documentation Index

**Version:** 0.2.0 (Research & Verification Complete)
**Last Updated:** 2026-01-25

---

## Quick Navigation

| Document | Purpose | Status |
|----------|---------|--------|
| [HYBRID-APPROACH.md](HYBRID-APPROACH.md) | **START HERE** - Main methodology spec | Complete (v0.2.0) |
| [GSD-METHODOLOGY.md](GSD-METHODOLOGY.md) | GlitterCowboy's original GSD (11 agents verified) | Complete |
| [MANUS-METHODOLOGY.md](MANUS-METHODOLOGY.md) | Manus.im context engineering (feasibility assessed) | Complete |
| [COMPARISON-MATRIX.md](COMPARISON-MATRIX.md) | Side-by-side analysis | Complete |
| [GSD-LITE-MANUAL.md](GSD-LITE-MANUAL.md) | Lightweight manual application | Complete |

---

## Architecture

| Document | Purpose | Status |
|----------|---------|--------|
| [architecture/SYSTEM-DESIGN.md](architecture/SYSTEM-DESIGN.md) | Technical system architecture + Option C pivot | Complete |
| [architecture/CLAUDE-CODE-INTEGRATION.md](architecture/CLAUDE-CODE-INTEGRATION.md) | Claude Code 2.1.17+ feature integration | Complete |

---

## Decisions

| Document | Purpose | Status |
|----------|---------|--------|
| [decisions/001-HYBRID-RATIONALE.md](decisions/001-HYBRID-RATIONALE.md) | Why hybrid approach | Complete |

---

## Plans (Empty - For Active Projects)

This directory will contain active project plans when using GSD.

---

## Document Hierarchy

```
docs/
├── INDEX.md                        # This file
│
├── HYBRID-APPROACH.md              # Main methodology (START HERE)
├── GSD-METHODOLOGY.md              # GlitterCowboy's GSD
├── MANUS-METHODOLOGY.md            # Manus.im approach
├── COMPARISON-MATRIX.md            # Analysis
├── GSD-LITE-MANUAL.md              # Lightweight guide
│
├── architecture/
│   └── SYSTEM-DESIGN.md            # Technical architecture
│
├── decisions/
│   └── 001-HYBRID-RATIONALE.md     # Decision records
│
├── plans/                          # Active project plans
│   └── (empty - for future use)
│
└── Session logs                    # Historical (will accumulate)
    ├── SESSION-LOG-2026-01-20.md
    └── ...
```

---

## Reading Order

### For Understanding the Methodology

1. **HYBRID-APPROACH.md** - The synthesized methodology
2. **COMPARISON-MATRIX.md** - Why certain choices were made
3. **GSD-METHODOLOGY.md** - Deep dive on GSD source
4. **MANUS-METHODOLOGY.md** - Deep dive on Manus source

### For Implementation

1. **architecture/SYSTEM-DESIGN.md** - Technical architecture
2. **HYBRID-APPROACH.md** - Methodology reference
3. **decisions/001-HYBRID-RATIONALE.md** - Design rationale

### For Quick Application (Without Full System)

1. **GSD-LITE-MANUAL.md** - Manual lightweight application

---

## Key Concepts Summary

### From GSD
- **Discuss Phase:** Capture preferences before planning
- **Atomic Tasks:** One commit per task
- **Fresh Context:** 200k tokens clean per task
- **Verification:** Explicit user acceptance testing

### From Manus
- **KV-Cache Optimization:** Stable prefix, append-only
- **File System as Memory:** Unlimited context extension
- **Error Preservation:** Keep failures visible
- **Attention Manipulation:** todo.md recitation

### Hybrid Innovations
- **Cached Prefix + Fresh Suffix:** Best of both caching strategies
- **Backward Reasoning:** Derive requirements from success conditions
- **Layered Verification:** Observation + task + UAT
- **Configurable Autonomy:** Adjust user involvement per task type

---

## Next Steps

When ready to implement:

1. **Phase 0:** Create core infrastructure using GSD-Lite manual process
2. **Phase 1:** Build command system using infrastructure
3. **Phase 2:** Build advanced features using commands
4. **Phase 3:** Full self-hosting (dogfooding)

See `architecture/SYSTEM-DESIGN.md` for detailed implementation roadmap.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2.0 | 2026-01-25 | Research & verification complete (Phase 4), HYBRID-APPROACH refined |
| 0.1.0 | 2026-01-23 | Initial documentation suite |
