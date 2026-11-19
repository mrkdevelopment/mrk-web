#!/usr/bin/env bash
# mrk-web setup check. Reports what is ready and what is missing. Changes nothing.
# Usage: bash setup-check.sh
# Exit 0 when every required item is present, 1 otherwise.
set -u

missing_required=0
row() { printf '%-36s %-9s %s\n' "$1" "$2" "${3:-}"; }
have() { command -v "$1" >/dev/null 2>&1; }

has_skill() {
  local name="$1" dir
  for dir in "$HOME/.claude/skills/$name" "./.claude/skills/$name" \
             "$HOME/.agents/skills/$name" "./.agents/skills/$name"; do
    [ -f "$dir/SKILL.md" ] && return 0
  done
  find "$HOME/.claude/plugins" -maxdepth 8 -type d -name "$name" 2>/dev/null | grep -q .
}

echo "REQUIRED"
if have node; then
  node_version="$(node -v | tr -d v)"
  # What the newest Astro asks for, e.g. ">=22.12.0" or "^20.3.0 || >=22.0.0". Empty when offline.
  wanted="$(npm view astro engines.node 2>/dev/null || true)"
  if [ -n "$wanted" ]; then
    if node -e '
      const have = process.argv[1].split(".").map(Number);
      const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
      const ok = process.argv[2].split("||").some((part) => {
        const m = part.trim().match(/^(>=|\^)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
        if (!m) return false;
        const want = [Number(m[2]), Number(m[3] || 0), Number(m[4] || 0)];
        if (m[1] === ">=") return cmp(have, want) >= 0;
        if (m[1] === "^") return have[0] === want[0] && cmp(have, want) >= 0;
        return cmp(have, want) === 0;
      });
      process.exit(ok ? 0 : 1);
    ' "$node_version" "$wanted"; then
      row "Node" "ready" "v$node_version (Astro wants $wanted)"
    else
      row "Node" "TOO OLD" "v$node_version, Astro wants $wanted"; missing_required=1
    fi
  else
    row "Node" "ready?" "v$node_version (could not look up what Astro wants; offline?)"
  fi
else
  row "Node" "MISSING" "install from nodejs.org"; missing_required=1
fi

if have git; then row "git" "ready"; else row "git" "MISSING"; missing_required=1; fi

if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ] \
   || have google-chrome || have google-chrome-stable || have chromium || have chromium-browser; then
  row "Chrome (screenshots, speed tests)" "ready"
else
  row "Chrome (screenshots, speed tests)" "MISSING" "install Google Chrome"; missing_required=1
fi

echo
echo "FREE SKILLS (no account, no key; each step has a fallback without them)"
for skill in design-taste-frontend impeccable refactoring-ui ui-ux-pro-max emil-design-eng \
             modern-web-guidance web-design-guidelines ponytail ponytail-audit ponytail-review \
             no-ai-slop seo-unlighthouse seo-agentic seo-geo seo-schema seo-images seo-audit \
             seo-technical seo-local wrangler cloudflare; do
  if has_skill "$skill"; then row "skill: $skill" "ready"; else row "skill: $skill" "-" "free to add"; fi
done

connectors=""
if have claude; then connectors="$(claude mcp list 2>/dev/null || true)"; fi
connector() { # name, note shown when missing
  if [ -z "$connectors" ]; then row "connector: $1" "unknown" "could not list connectors"
  elif printf '%s' "$connectors" | grep -i "$1" | grep -qi "connected"; then row "connector: $1" "ready"
  elif printf '%s' "$connectors" | grep -qi "$1"; then row "connector: $1" "sign in" "listed but not connected"
  else row "connector: $1" "-" "$2"; fi
}

echo
echo "FREE CONNECTOR (no account, no key)"
connector astro "free to add"

echo
echo "FREE ACCOUNTS, NEEDED LATER (browser sign-in, no key)"
if have gh; then
  if gh auth status >/dev/null 2>&1; then row "GitHub (step 14)" "ready" "signed in"
  else row "GitHub (step 14)" "sign in" "owner runs: gh auth login"; fi
else
  row "GitHub (step 14)" "later" "account at github.com; the gh tool is optional"
fi
if have wrangler; then row "Cloudflare (step 15)" "later" "account at cloudflare.com; wrangler is installed"
else row "Cloudflare (step 15)" "later" "account at cloudflare.com; wrangler runs through npx"; fi

echo
echo "API KEYS: none needed for a preview. All optional, offered at step 15 (see references/keys.md)."

echo
echo "PAID, OPTIONAL (never needed to finish a build)"
connector mobbin "paid"
connector higgsfield "paid"

echo
if [ "$missing_required" -eq 0 ]; then echo "All required items are ready."
else echo "Some required items are missing (see above)."; fi
exit "$missing_required"
