#!/usr/bin/env bash
#
# setup-branch-protection.sh — Apply branch protection rules to main
#
# Phase 40.5 Wave 1.7 (amendment A-11). Reads scripts/setup-branch-protection.json,
# strips documentation fields (keys prefixed with `_`), and PUTs the rules
# to GitHub via `gh api`. Idempotent — running twice is a no-op (PUT is
# replace-semantics on the same canonical config).
#
# Usage:
#   bash scripts/setup-branch-protection.sh                    # apply to default repo + branch
#   bash scripts/setup-branch-protection.sh --check            # diff live state vs JSON, no apply
#   bash scripts/setup-branch-protection.sh --repo OWNER/REPO  # override target repo
#   bash scripts/setup-branch-protection.sh --branch BRANCH    # override target branch
#
# Exit codes:
#   0 — applied successfully (or --check found no drift)
#   1 — apply failed (see stderr)
#   2 — invalid usage / preflight failed
#   3 — --check found drift (live state differs from JSON)
#
# Author: Chude <chude@emeke.org>

set -euo pipefail

# Resolve script-relative paths so the script works from any CWD.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/setup-branch-protection.json"

# Defaults.
REPO="chudeemeke/get-stuff-done"
BRANCH="main"
MODE="apply"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check)  MODE="check"; shift ;;
    --repo)   REPO="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    -h|--help)
      sed -n '3,18p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Preflight: gh installed, gh authenticated, jq installed, config exists.
# Fail fast with actionable messages — never proceed with half-checked state.
# ---------------------------------------------------------------------------
preflight() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "ERROR: gh not installed. https://cli.github.com" >&2
    exit 2
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq not installed. https://jqlang.github.io/jq/" >&2
    exit 2
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "ERROR: gh not authenticated. Run: gh auth login" >&2
    exit 2
  fi

  if [[ ! -f "$CONFIG_PATH" ]]; then
    echo "ERROR: config not found at $CONFIG_PATH" >&2
    exit 2
  fi

  if ! jq empty "$CONFIG_PATH" 2>/dev/null; then
    echo "ERROR: $CONFIG_PATH is not valid JSON" >&2
    exit 2
  fi

  if ! gh api "repos/$REPO" >/dev/null 2>&1; then
    echo "ERROR: cannot access repos/$REPO. Check repo exists and gh has 'repo' scope." >&2
    exit 2
  fi
}

# ---------------------------------------------------------------------------
# Strip documentation fields (keys starting with `_`) so the JSON we send
# to the GitHub API contains only API-recognized fields. This pattern lets
# the JSON file double as inline documentation.
# ---------------------------------------------------------------------------
canonical_payload() {
  jq 'walk(if type == "object" then with_entries(select(.key | startswith("_") | not)) else . end)' \
    "$CONFIG_PATH"
}

# ---------------------------------------------------------------------------
# Apply mode: PUT the canonical payload to the protection endpoint.
# PUT is replace-semantics; idempotent.
# ---------------------------------------------------------------------------
apply_protection() {
  local payload
  payload="$(canonical_payload)"

  echo "Applying branch protection to $REPO@$BRANCH..."
  echo "Required status checks: $(echo "$payload" | jq -r '.required_status_checks.contexts | join(", ")')"
  echo "Required reviews: $(echo "$payload" | jq -r '.required_pull_request_reviews.required_approving_review_count')"
  echo "Linear history: $(echo "$payload" | jq -r '.required_linear_history')"
  echo "Force pushes: $(echo "$payload" | jq -r '.allow_force_pushes')"
  echo

  if echo "$payload" | gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" --input - >/dev/null; then
    echo "OK: branch protection applied to $REPO@$BRANCH"
    echo
    echo "Verify live state:"
    echo "  gh api repos/$REPO/branches/$BRANCH/protection | jq"
    return 0
  else
    echo "FAIL: gh api PUT failed. See stderr for response." >&2
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Check mode: diff live state vs JSON. Report drift; do not apply.
# Useful as a CI gate or post-public-flip verification step.
# ---------------------------------------------------------------------------
check_protection() {
  local desired live diff_output

  desired="$(canonical_payload)"

  if ! live="$(gh api "repos/$REPO/branches/$BRANCH/protection" 2>/dev/null)"; then
    echo "DRIFT: branch protection NOT configured on $REPO@$BRANCH"
    echo "Run without --check to apply."
    return 3
  fi

  # Compare key fields. Live state has additional metadata wrappers we don't
  # set; we compare only the fields we control. jq -c canonicalizes ordering.
  local desired_checks live_checks
  desired_checks=$(echo "$desired" | jq -c '.required_status_checks.contexts | sort')
  live_checks=$(echo "$live" | jq -c '.required_status_checks.contexts | sort')

  local desired_reviews live_reviews
  desired_reviews=$(echo "$desired" | jq -r '.required_pull_request_reviews.required_approving_review_count')
  live_reviews=$(echo "$live" | jq -r '.required_pull_request_reviews.required_approving_review_count // 0')

  local desired_linear live_linear
  desired_linear=$(echo "$desired" | jq -r '.required_linear_history')
  live_linear=$(echo "$live" | jq -r '.required_linear_history.enabled // false')

  local drift=0
  if [[ "$desired_checks" != "$live_checks" ]]; then
    echo "DRIFT in required_status_checks.contexts:"
    echo "  desired: $desired_checks"
    echo "  live:    $live_checks"
    drift=1
  fi

  if [[ "$desired_reviews" != "$live_reviews" ]]; then
    echo "DRIFT in required_approving_review_count:"
    echo "  desired: $desired_reviews"
    echo "  live:    $live_reviews"
    drift=1
  fi

  if [[ "$desired_linear" != "$live_linear" ]]; then
    echo "DRIFT in required_linear_history:"
    echo "  desired: $desired_linear"
    echo "  live:    $live_linear"
    drift=1
  fi

  if [[ $drift -eq 0 ]]; then
    echo "OK: branch protection on $REPO@$BRANCH matches $CONFIG_PATH"
    return 0
  else
    echo "Run without --check to apply the desired state."
    return 3
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
preflight

case "$MODE" in
  apply) apply_protection ;;
  check) check_protection ;;
  *) echo "Unknown mode: $MODE" >&2; exit 2 ;;
esac
