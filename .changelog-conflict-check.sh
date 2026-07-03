#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
usage:
  bash .changelog-conflict-check.sh --self-test
  bash .changelog-conflict-check.sh <changelog.md>

Flags a "- " bullet inside a concrete published release section headed by
"## [X.Y.Z]". Bullets under "## [Unreleased]" are allowed.
USAGE
}

check_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "error: changelog file not found: $file" >&2
    return 2
  fi

  awk '
    /^## \[Unreleased\]/ {
      state = "unreleased"
      next
    }

    /^## \[[0-9]+\.[0-9]+\.[0-9]+\]/ {
      state = "published"
      next
    }

    /^## \[/ {
      state = "other"
      next
    }

    state == "published" && /^- / {
      printf "%s:%d: bullet inside published release section\n", FILENAME, FNR
      exit 1
    }
  ' "$file"
}

self_test() {
  local fixture_dir="tests/fixtures/changelog-conflict"
  local good="$fixture_dir/good-changelog.md"
  local bad="$fixture_dir/bad-changelog.md"
  local output

  check_file "$good"

  if output="$(check_file "$bad" 2>&1)"; then
    echo "error: bad changelog fixture unexpectedly passed" >&2
    return 1
  fi

  if [[ "$output" != *"bad-changelog.md:"* ]]; then
    echo "error: bad changelog fixture did not report a line-numbered path" >&2
    echo "$output" >&2
    return 1
  fi
}

case "${1:-}" in
  --self-test)
    self_test
    ;;
  -h|--help)
    usage
    ;;
  "")
    usage
    exit 2
    ;;
  *)
    check_file "$1"
    ;;
esac
