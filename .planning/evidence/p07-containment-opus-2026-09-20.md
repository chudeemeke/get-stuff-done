# Final approval-readiness review — section 21 narrowed Windows containment spike

**Verdict: PASS.** Approvable as an owner-approvable experiment contract, subject to three text-only pre-registration lines below (no scope, budget, platform, claim-count or policy change). I found no material blocker that alters what is being bought.

Packet-only. I ran nothing, opened no file, and verified no source claim. Owner-stated source confirmations (capability-consent/lifecycle `acquireLock` call sites, existing foreign/unknown deadman branch, wrapper does not import the transaction module, WSL lists Ubuntu only, `.claude/**` already ESLint-ignored) are accepted as owner attestation, not as findings of mine.

## Disposition of my prior findings

All 23 are addressed, and several are addressed more strictly than I asked:

- **1/14** — Windows/local NTFS only, with explicit "no execution authorization or proof" for WSL2/ext4, shared paths, native Linux, macOS, plus the face-of-approval statement that Windows-only evidence cannot approve a portable API. macOS correctly kept as existing CI, not a new install promise. Closed.
- **2** — Bound is now total, not per-platform, and the one-fix cap is stricter than my unlimited-but-logged suggestion. Your cap is the better choice for a bounded study; I withdraw the suggestion. Closed.
- **3/17/18/20** — Receipt fields now house non-claims, provenance, timing, environment, controls; per-run `<runId>-<caseId>.json` + `index.json`; binary hash and build command; enumerated actions/outcomes/aliases; non-PASS verdict vocabulary. Closed.
- **4/5** — Nine fixed claim identities, all-and-only per row, per-claim positive **and** unsafe control, FFI signature inspection, missing/failed positive control → UNVERIFIED, uninducible negative control → UNVERIFIED, and the owner-impact observational carve-out. Closed, and the carve-out is a better answer than my original phrasing.
- **6** — Timeout is UNVERIFIED, never refutation or death evidence; host load captured. Closed.
- **7** — CARGO_HOME/RUSTUP_HOME/TEMP/incremental redirected, build before the measured snapshot, direct compiler invocation, "outside the observation window, not a broad cache exclusion." Closed without reintroducing a §20-forbidden glob.
- **8** — Source under `.claude/...`, no lint config change, explicit Markdown CLI (which also sidesteps the tracked-files-only discovery limit), actual output recorded. Closed.
- **9/10** — Policy explicitly not reopened; containment framed as independent of takeover and unsolved for refusal-only too; positive/negative/unverified branches plus the "if this envelope is unacceptable, do not run the spike" gate. Closed, and the envelope gate is the single best addition in this revision.
- **11/12** — moved-directory promoted to a case with three claims and the "mutation via a moved handle does not pass the pathname-boundary claim" rule; owner-impact claims in all three cases; release latency correctly deferred with the removed OS-lock scope rather than claimed proved. Closed.
- **13/22** — Shipped capability-lock consumers/heuristics/deadman disclosed, must-not-reuse stated, reachability/race assessment assigned, "study approval does not accept this shipped risk," installer seam unwired. Closed.
- **15/16/19/21/23** — Duplicated P08/P09 scenarios removed, host-language rationale recorded and scoped to the spike, manual review explicitly not a new validator, orphan/quiescence scenario removed, continuity deliverables named. Closed.

## Three pre-registration lines to fix in the approved text (text-only)

These are not scope objections. Each is one sentence, and none requires another review pass.

1. **Termination precedence for the single correction.** "Timeout" appears in the stop list while "at most one supervisor/probe defect correction … may rerun affected cases once" also applies, and a timeout caused by an unsignalled barrier satisfies both clauses. State which wins, and state that pre-measurement toolchain/link failure (no working compiler or linker) is UNVERIFIED-and-return that does **not** consume the correction. Without this, the sole cost control is self-ambiguous at the exact moment it is invoked.
2. **Run-verdict composition from claim statuses.** The prohibition list (missing/unexpected claims, malformed events, unobserved barriers, drift, absent closure, cleanup failure) does not say that an unverified *claim* blocks a `mechanism-observed-in-fixture` *run* verdict. Add the one-line rule (e.g. weakest claim status governs; refuted dominates), so the field the owner will cite cannot outrun its own claim rows.
3. **Unsafe-control configuration.** Say that each unsafe control runs with the candidate guard **absent**, on its own fixture instance, as a named phase inside the same case run. As written, an implementer could attempt the violation against the live guard, have it correctly refused, and then score the control "could not induce its violation" → UNVERIFIED — burning a single-run, single-correction budget on a specification gap rather than on evidence.

## Optional refinements (do not expand the experiment)

- Add `provenance.sourceSha256` beside `binarySha256`; if reviewed source text is copied into `.planning/evidence/...`, copy it as non-lint-visible text (`.cjs.txt`), since that tree is linted and §17 was paid for once already.
- Add `release-latency-bound` (and `symbolic-link-traversal`) to `nonClaims`: case 3 measures one post-exit retry, and junctions — chosen to avoid privilege — do not cover symlink reparse behaviour.
- State that case 1's owner parent/ancestor rename and junction-replacement outcomes are **event-only** records, so the nine-claim inventory is not read as adjudicating them (cases 2 and 3 carry the rename-effect claims).
- Have `index.json` record the correction event and the superseding/superseded `runId` pair, not just attempted/unattempted cases and reasons.
- Name the required `events[].detail` content for open/create actions (desired access, share mode, create disposition, flags), since "exactly these fields" leaves the decision-relevant FFI arguments with only `detail` as a home.
- Require the run to abort UNVERIFIED if the measured volume query contradicts `scope.filesystem:"NTFS"`, rather than emitting a constant label beside contrary evidence.
- Pre-register the nine positive-control and nine unsafe-control identities in the README before run 1 — the same constant-inventory principle already applied to claims.
- Confirm that the 180 s case budget is understood to include control phases (case 2 runs three substitutions plus controls plus cleanup), since a budget-only timeout ends the whole spike.
- Require the later mechanism/cost table to mark every non-Windows row citation-only/unverified, so "prepare the cross-platform table" cannot be read as cross-platform evidence.

## Preservation check

No validator, harness or lock source is touched; P03/P04/P05 approvals are not reopened and their shape is unchanged; no lint rule, severity or exemption is requested; takeover policy is untouched and not re-asked; production lock tests, P08/P09 RED, preflight/snapshot, commit and push remain unauthorised by this approval; the allowlist extension is two named directories. The experiment is genuinely narrower than the draft it supersedes: one candidate, one platform, three cases, one run each, one correction total.

*No tools were run and no files were written, per the packet-only instruction.*