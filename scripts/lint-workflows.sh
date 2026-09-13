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

if command -v actionlint >/dev/null 2>&1; then
  exec actionlint -color .github/workflows/*.yml
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  # Pin to the official image. -color forces ANSI output even when stdout
  # is not a TTY (useful in CI logs).
  exec docker run --rm \
    -v "$REPO_ROOT:/repo" \
    -w /repo \
    rhysd/actionlint:latest -color
fi

exec npx --yes github-actionlint@1.7.12 -color .github/workflows/*.yml
