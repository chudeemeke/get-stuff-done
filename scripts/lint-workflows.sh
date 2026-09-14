#!/usr/bin/env bash
# Lint .github/workflows/*.yml with actionlint.
#
# Uses the official actionlint Docker image in CI. When Docker is unavailable
# locally, falls back to a pinned Node wrapper that downloads the official
# actionlint binary.
#
# Run from anywhere in the repo; resolves to repo root automatically.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [[ "${CI:-}" != "true" && "${GITHUB_ACTIONS:-}" != "true" ]] && command -v actionlint >/dev/null 2>&1; then
  exec actionlint -color .github/workflows/*.yml
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  # Pin the official image by digest so lint behavior cannot drift between
  # otherwise identical commits. -color keeps CI output readable.
  exec docker run --rm \
    -v "$REPO_ROOT:/repo" \
    -w /repo \
    rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 -color
fi

if [[ "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]; then
  echo 'CI workflow lint requires the pinned Docker image and a running Docker daemon.' >&2
  exit 1
fi

exec npx --yes github-actionlint@1.7.12 -color .github/workflows/*.yml
