# Phase 43: Upgrade Resilience - Verify, Matrix, Dogfood - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves alternatives considered.

**Date:** 2026-07-03T17:52:37Z
**Phase:** 43-upgrade-resilience-verify-matrix-dogfood
**Mode:** Auto-selected infrastructure defaults
**Areas discussed:** Upgrade verification, upstream version policy, override staleness, hook reconciliation, dogfood evidence, SBOM/churn, inbox constraints

---

## Upgrade Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Temp-isolated maintainer verifier | Use temp dirs/local registry and avoid global install mutation. | yes |
| Global install dogfood first | Mutate the operator install as the main proof path. | no |
| Docs-only runbook | Document manual upgrade steps without executable verification. | no |

**Selected default:** Temp-isolated maintainer verifier.
**Notes:** This follows first principles for upgrade safety: prove the process without risking the active toolchain. It also folds the memory-nexus partial-install concern where it directly affects upgrade trust.

---

## Upstream Version Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Exact stable candidate after live verification | Query upstream, then write a reviewed stable version pin. | yes |
| Use `latest` tag directly | Let npm resolve the active upstream at install/compose time. | no |
| Include prerelease `next` | Target release candidates for dogfood. | no |

**Selected default:** Exact stable candidate after live verification.
**Notes:** Live evidence on 2026-07-03 showed `latest = 1.6.1`, `next = 1.7.0-rc.2`, and current pin `1.5.0`. The implementation must recheck before the dogfood bump.

---

## Override Staleness

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic comparator port for JavaScript | Keep the CLI facade but add a parser/canonicalization boundary for `.js`. | yes |
| Replace byte-hash gate globally | Make all text files semantic immediately. | no |
| Whitelist noisy files | Suppress false positives with allowlists. | no |

**Selected default:** Semantic comparator port for JavaScript.
**Notes:** This keeps the current blocking gate while reducing false positives only where the requirement demands it. Markdown semantic diff remains deferred.

---

## Hook Reconciliation

| Option | Description | Selected |
|--------|-------------|----------|
| Atomic check-update + statusline review | Update coupled runtime hooks in one plan/PR-sized slice. | yes |
| Update check-update only | Risk mismatch with statusline output/state expectations. | no |
| Defer hook reconciliation | Leave UPGRADE-07 incomplete. | no |

**Selected default:** Atomic check-update + statusline review.
**Notes:** The REASON file already records upstream hook improvements to reconcile while preserving fork behavior.

---

## Dogfood Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Dogfood after gates exist | Run live bump once verifier/matrix/staleness gates exist. | yes |
| Dogfood first | Use the live bump to discover missing gates. | no |
| Defer dogfood to Phase 44 | Leaves Phase 43 unproven. | no |

**Selected default:** Dogfood after gates exist.
**Notes:** The live bump is proof of the system. It should produce a D-7 evidence record in MAINTENANCE.md but not claim Phase 44 documentation completeness.

---

## SBOM and Override Churn

| Option | Description | Selected |
|--------|-------------|----------|
| Deterministic generated artifacts | Generate `dist/bom.json` and override-churn CHANGELOG output from source data. | yes |
| Manual release-note editing | Hand-curate churn and SBOM material. | no |
| Defer SBOM to publish phase | Would leave SHIP-03 incomplete in Phase 43. | no |

**Selected default:** Deterministic generated artifacts.
**Notes:** Phase 43 owns SBOM production and churn generation; Phase 44 wires broader release/publish ceremony.

---

## Inbox Constraints

| Option | Description | Selected |
|--------|-------------|----------|
| Fold only upgrade-relevant leftovers | Include memory-nexus install/version safety where it affects upgrade trust. | yes |
| Fold all open inbox items | Pull authkey market-ready methodology and teams schema work into Phase 43. | no |
| Ignore inbox items | Risk hiding active cross-project debt. | no |

**Selected default:** Fold only upgrade-relevant leftovers.
**Notes:** The authkey market-ready gate is broader Phase 44/methodology work. `teams` config-schema drift stays with backlog 999.2 unless directly touched.

---

## Deferred Ideas

- Dynamic `latest`/`next` consumption remains out of scope.
- Markdown semantic staleness remains v1.3.0 deferred unless research proves a low-risk deterministic approach.
- Full market-ready gate methodology belongs in Phase 44 or a dedicated methodology phase.
- Complete publish/provenance/docs polish remains Phase 44.
