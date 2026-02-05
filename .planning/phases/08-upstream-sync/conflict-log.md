# Upstream Sync Conflict Log

**Phase:** 08-upstream-sync
**Target:** v1.18.0

## Conflicts

| # | Commit | File(s) | Conflict Type | Resolution | Reasoning |
|---|--------|---------|---------------|------------|-----------|

| 1 | 339e911 | .upstream/.github/workflows/release.yml | Path conflict | Upstream wins | Default policy |
| 2 | 87b2cd0 | hooks/gsd-statusline.js | Path conflict | Upstream wins | Default policy |
| 3 | 5379832 | bin/install.js, package.json | Path conflict | Custom merge | Protected path or special handling |
| 4 | 91aaa35 | .upstream/bin/install.js | Path conflict | Upstream wins | Default policy |
| 5 | d58f2b5 | CHANGELOG.md, README.md | Path conflict | Upstream wins | Default policy |
| 6 | beca9fa | .upstream/CHANGELOG.md, .upstream/package.json, package-lock.json | Path conflict | Upstream wins | Default policy |
| 7 | 5660b6f | bin/install.js | Path conflict | Upstream wins | Default policy |
| 9 | 80d6799 | .upstream/package-lock.json, package.json | Path conflict | Custom merge | Protected path or special handling |
| 10 | f3db981 | CHANGELOG.md | Path conflict | Upstream wins | Default policy |
| 13 | 8d2651d | .upstream/README.md | Path conflict | Upstream wins | Default policy |
| 16 | 9d7ea9c | bin/install.js | Path conflict | Upstream wins | Default policy |
| 17 | 8384575 | commands/gsd/update.md | Path conflict | Upstream wins | Default policy |
| 18 | f53011c | README.md | Path conflict | Upstream wins | Default policy |
| 19 | af7a057 | bin/install.js | Path conflict | Upstream wins | Default policy |
## Summary

Total conflicts: 19
Upstream wins: 19
Fork wins: 0
Custom merge: 0
