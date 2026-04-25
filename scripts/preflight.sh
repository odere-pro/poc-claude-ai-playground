#!/usr/bin/env bash
# Pre-zero preflight validator — see docs/PRE_ZERO_CHECKLIST.md
#
# Exits 0 only if every pre-zero config check passes. Prints [OK]/[FAIL]
# per check so a single failure points straight at the section to fix.
#
# Flags (env vars):
#   PREFLIGHT_SKIP_E2E=1        skip Playwright (added in a later commit)
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

# ----- §4. CLI tools -----
section "4. CLI tools"

require_cli() {
  local name="$1"
  command -v "$name" >/dev/null 2>&1 \
    || fail "$name not on PATH — see docs/PRE_ZERO_CHECKLIST.md §5"
  ok "$name present"
}

require_cli node
require_cli npm
require_cli git
require_cli gh
require_cli d2


# ----- §5. Local env -----
section "5. Local env (.env.local)"

[ -f .env.local ] || fail ".env.local missing — cp .env.example .env.local and fill ANTHROPIC_API_KEY"
ok ".env.local exists"

if grep -Eq '^ANTHROPIC_API_KEY=.+' .env.local; then
  ok "ANTHROPIC_API_KEY set in .env.local"
else
  fail "ANTHROPIC_API_KEY missing or empty in .env.local"
fi

if [ "${PREFLIGHT_WITH_GEMINI:-0}" = "1" ]; then
  grep -Eq '^GEMINI_API_KEY=.+' .env.local \
    || fail "GEMINI_API_KEY missing or empty in .env.local (required when PREFLIGHT_WITH_GEMINI=1)"
  ok "GEMINI_API_KEY set in .env.local"
fi

# ----- §6. GitHub auth -----
section "6. GitHub auth"

gh auth status >/dev/null 2>&1 || fail "gh not authenticated — run: gh auth login"
ok "gh authenticated"

# ----- §7. GitHub Actions secrets -----
section "7. GitHub Actions secrets"

# gh secret list returns lines like "NAME  Updated ...". Just grep names.
secret_list="$(gh secret list 2>/dev/null || true)"

require_secret() {
  local name="$1"
  if printf '%s\n' "$secret_list" | awk '{print $1}' | grep -Fxq "$name"; then
    ok "GH secret set: $name"
  else
    fail "GH secret missing: $name — run: gh secret set $name --body \"<value>\""
  fi
}

require_secret ANTHROPIC_API_KEY

# ----- §8. App health -----
section "8. App health (npm run check)"

npm run --silent check \
  || fail "npm run check failed — typecheck / lint / format issue. Run: npm run fix"
ok "npm run check passed"

# ----- §9. Build -----
section "9. Production build (npm run build)"

npm run --silent build \
  || fail "npm run build failed — see output above"
ok "npm run build passed"

# ----- §10. E2E -----
section "10. E2E (npm run test:e2e)"

if [ "${PREFLIGHT_SKIP_E2E:-0}" = "1" ]; then
  warn "PREFLIGHT_SKIP_E2E=1 — skipping Playwright"
else
  npm run --silent test:e2e \
    || fail "npm run test:e2e failed — see docs/gotchas.md for Playwright troubleshooting"
  ok "npm run test:e2e passed"
fi

# ----- All clear -----
printf "\n%b[ALL CLEAR]%b pre-zero config is green. Safe to tag v0.1.0-preflight-ready.\n" "$GREEN" "$RESET"
