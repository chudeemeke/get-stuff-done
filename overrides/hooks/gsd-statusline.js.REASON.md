# Override: hooks/gsd-statusline.js

## Why
Enhanced context usage bar with autocompact-relative scaling. Our version computes context proximity as a percentage of the distance to Claude Code's autocompact threshold (~16.5%), giving a more accurate "how close am I to compaction" signal than the raw remaining percentage upstream uses.

## Upstream snapshot
- Version: 1.34.2
- SHA-256: 2e155c727e12190dfbddd13a7f18f1e9d85a4f62a66cec2d4ab2b489d17e31c5

## What's different
- Autocompact-relative context bar (0% = fresh, 100% = compaction imminent)
- Reads `gsd.role` from config for consumer/maintainer display
- Fork branding in output
- Detailed formula comments explaining the scaling math

## Review trigger
When upstream hooks/gsd-statusline.js changes, review whether upstream adopted similar scaling.
If upstream's context bar becomes threshold-relative, this override may no longer be needed.
