# Add A No-Publish Release Plan Gate

**Status:** Local issue draft; implementation is blocked on Phase 44

**Proposed labels:** `type:release-plan`, `type:release-blocker`,
`status:blocked`, `priority:p1`

**Linked GSD artifact:** Phase 44 in `.planning/ROADMAP.md` and
`.planning/quick/pr-issue-evidence-workflow-CONTEXT.md`

## Problem

The current pull-request workflow does not have a no-publish job proving the
package and artifact set that a release would produce. Install smoke and a green
build do not independently verify package metadata, publish contents, SBOM, or
the final release plan.

## Desired Outcome

Add a blocking Phase 44 release-plan job that builds the exact candidate and
uses a structured dry run to prove package identity and contents without
publishing, tagging, changing versions, or requiring write credentials.

## Scope Boundaries

- Build and inspect the candidate using the project's release and package
  contracts without publishing it.
- Validate expected metadata, executable entries, included files, SBOM, and
  deterministic artifact identity where the selected tools support it.
- Do not add registry write credentials, create a tag or release, change a
  version, merge another pull request, or claim install success from dry-run
  evidence alone.
- Keep live publish and post-publish install verification in their explicit
  owner-gated release steps.

## Acceptance Criteria

- The job runs on pull requests against the final PR HEAD with no publish token.
- Distribution build and structured package dry run both complete.
- Expected package name, version, license, executable mapping, included files,
  and SBOM are asserted; missing or unexpected release-critical content fails.
- The job proves no tag, release, registry publish, version mutation, or tracked
  working-tree mutation occurred.
- The final HEAD SHA, hosted run ID, tool versions, planned package identity,
  and artifact/content digest are recorded in the issue and release ledger.

## Verification Required

Run the Phase 44 local release-plan command and its negative fixtures, then
verify the hosted job with:

```bash
gh pr checks <number>
gh run list --branch <branch>
```

Confirm the job ran on the final PR HEAD, used no write credential, failed on a
real malformed plan, and did not publish or mutate release state.

## Explicit Non-Claims

- This draft does not implement the missing release-plan job.
- A no-publish dry run does not prove registry publication or consumer install.
- A green release-plan job does not authorize a merge, tag, release, or publish.
- Completing this issue alone does not complete Phase 44 or v1.2.
