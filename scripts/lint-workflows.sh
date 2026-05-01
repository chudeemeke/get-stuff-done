#!/usr/bin/env bash
# Lint .github/workflows/*.yml with actionlint.
#
# Uses the official actionlint Docker image so contributors don't need to
# install the Go binary locally. Requires Docker. CI runs on ubuntu-latest
# which has Docker pre-installed.
#
# Run from anywhere in the repo; resolves to repo root automatically.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required but not found on PATH" >&2
  echo "install Docker Desktop or Docker Engine, then re-run." >&2
  exit 127
fi

# Pin to the official image. -color forces ANSI output even when stdout
# is not a TTY (useful in CI logs).
exec docker run --rm \
  -v "$REPO_ROOT:/repo" \
  -w /repo \
  rhysd/actionlint:latest -color
