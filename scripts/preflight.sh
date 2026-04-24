#!/usr/bin/env bash
# Pre-zero preflight validator — see docs/PRE_ZERO_CHECKLIST.md
#
# Exits 0 only if every pre-zero config check passes. Prints [OK]/[FAIL]
# per check so a single failure points straight at the section to fix.
#
# Flags (env vars):
#   PREFLIGHT_SKIP_E2E=1        skip Playwright (added in a later commit)
#   PREFLIGHT_WITH_AWS=1        require `aws` CLI
#   PREFLIGHT_WITH_NGROK=1      require `ngrok` CLI
#   PREFLIGHT_WITH_GEMINI=1     require gemini-image MCP connected

set -euo pipefail

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[0;33m'
RESET=$'\033[0m'

ok()   { printf "%b[OK]%b   %s\n"   "$GREEN" "$RESET" "$1"; }
fail() { printf "%b[FAIL]%b %s\n"   "$RED"   "$RESET" "$1" >&2; exit 1; }
warn() { printf "%b[WARN]%b %s\n"   "$YELLOW" "$RESET" "$1"; }
section() { printf "\n=== %s ===\n" "$1"; }

# ----- §1. Claude Code baseline -----
section "1. Claude Code baseline"

command -v claude >/dev/null 2>&1 \
  || fail "claude CLI not found on PATH — install Claude Code before running preflight."
ok "claude CLI present ($(claude --version 2>/dev/null | head -1))"

# ----- §2. Claude plugins + ECC -----
section "2. Claude plugins + ECC"

plugins="$(claude plugin list 2>/dev/null || true)"
if printf '%s\n' "$plugins" | grep -q "vercel@claude-plugins-official"; then
  ok "vercel@claude-plugins-official installed"
else
  fail "vercel@claude-plugins-official missing — run: claude plugin install vercel@claude-plugins-official"
fi

# ECC = global ~/.claude/rules + agents (not a CLI). Verify presence best-effort.
if [ -d "$HOME/.claude/rules" ]; then
  ok "~/.claude/rules/ present (ECC rules)"
else
  warn "~/.claude/rules/ missing — run the ECC install command from docs/PRE_ZERO_CHECKLIST.md §2"
fi

if [ -d "$HOME/.claude/agents" ]; then
  for agent in code-reviewer security-reviewer typescript-reviewer; do
    if ls "$HOME/.claude/agents/" 2>/dev/null | grep -q "$agent"; then
      ok "agent present: $agent"
    else
      warn "agent missing: $agent — re-run the ECC install command"
    fi
  done
else
  warn "~/.claude/agents/ missing — ECC agents not installed"
fi

# ----- §3. MCP servers -----
section "3. MCP servers"

mcp_output="$(claude mcp list 2>&1 || true)"

check_mcp() {
  local name="$1"
  if printf '%s\n' "$mcp_output" | grep -E "^${name}:" | grep -q "Connected"; then
    ok "MCP connected: $name"
  else
    fail "MCP not connected: $name — see docs/PRE_ZERO_CHECKLIST.md §3"
  fi
}

check_mcp shadcn
check_mcp nextjs
check_mcp playwright
check_mcp structurizr

if [ "${PREFLIGHT_WITH_GEMINI:-0}" = "1" ]; then
  check_mcp gemini-image
else
  if printf '%s\n' "$mcp_output" | grep -E "^gemini-image:" | grep -q "Connected"; then
    ok "MCP connected: gemini-image (optional — detected)"
  else
    warn "MCP not connected: gemini-image (optional; set PREFLIGHT_WITH_GEMINI=1 to require)"
  fi
fi

# ----- end of §1–§3 (later commits extend: CLIs, env, GH auth, Vercel, secrets, build, e2e) -----

printf "\n%b[PARTIAL CLEAR]%b Claude + plugins + MCP checks green. Extended checks pending in subsequent commits.\n" "$GREEN" "$RESET"
