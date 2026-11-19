#!/usr/bin/env bash
# mrk-web setup check. Lists everything the skill uses or recommends, and whether it is installed.
# It changes nothing.
#
# Usage: bash setup-check.sh            plain list, grouped
#        bash setup-check.sh --table    one markdown table, ready to show the owner as it is
# Exit 0 when every required item is present, 1 otherwise.
set -u

mode="plain"
[ "${1:-}" = "--table" ] && mode="table"

have() { command -v "$1" >/dev/null 2>&1; }

has_skill() {
  local name="$1" dir
  for dir in "$HOME/.claude/skills/$name" "./.claude/skills/$name" \
             "$HOME/.agents/skills/$name" "./.agents/skills/$name"; do
    [ -f "$dir/SKILL.md" ] && return 0
  done
  find "$HOME/.claude/plugins" -maxdepth 8 -type d -name "$name" 2>/dev/null | grep -q .
}

# Everything the skill uses, in the order it should be set up.
# group | type | name | what it is for | used in steps | cost
catalogue() { cat <<'EOF'
required|Tool|Node|Runs the build|All|Free
required|Tool|git|Keeps the site's history|All|Free
required|Tool|Chrome|Screenshots and speed tests|3, 9, 13, 18|Free
free|Skill|design-taste-frontend|Art direction; keeps the AI look out|4, 6, 7|Free
free|Skill|impeccable|Design critique and polish|3, 6, 9|Free
free|Skill|refactoring-ui|Spacing, hierarchy and colour|4, 6, 7|Free
free|Skill|ui-ux-pro-max|Type, palette and pattern ideas by industry|6|Free
free|Skill|emil-design-eng|How things move and respond|7|Free
free|Skill|modern-web-guidance|Current HTML and CSS practice|7, 9|Free
free|Skill|web-design-guidelines|Second opinion on the interface|9|Free
free|Skill|ponytail|Smallest change that solves the task|11|Free
free|Skill|ponytail-audit|Finds code to delete or simplify|11|Free
free|Skill|ponytail-review|Checks each change|11|Free
free|Skill|no-ai-slop|Finds writing that reads AI-made|12|Free
free|Skill|seo-unlighthouse|Speed scores across every page|3, 9|Free
free|Skill|seo-images|Image size and format checks|9, 11|Free
free|Skill|seo-agentic|Whether AI agents can use the site|10|Free
free|Skill|seo-geo|Being quoted by AI search|10|Free
free|Skill|seo-schema|Structured data for search engines|10|Free
free|Skill|seo-audit|Whole-site SEO audit|18|Free
free|Skill|seo-technical|Technical SEO audit|18|Free
free|Skill|seo-local|Local business SEO|18|Free
free|Skill|wrangler|Current Cloudflare commands|15, 19|Free
free|Skill|cloudflare|Current Cloudflare guidance|15, 19|Free
free|Connector|Astro docs|Up-to-date Astro documentation|7|Free
account|Account|GitHub|Stores the site and its history|14|Free
account|Account|Cloudflare|Hosts the site and the preview|15, 19|Free
paid|Connector|Mobbin|Library of real design references|5|Paid
paid|Connector|Higgsfield|Generated images and video|8|Paid
EOF
}

# Gathered once, before the loop, so nothing inside it reads from the catalogue by accident.
node_state="missing"; node_note="install from nodejs.org"
if have node; then
  node_version="$(node -v | tr -d v)"
  wanted="$(npm view astro engines.node 2>/dev/null </dev/null || true)"
  if [ -z "$wanted" ]; then
    node_state="ready"; node_note="v$node_version (could not look up what Astro wants)"
  elif node -e '
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
    ' "$node_version" "$wanted" </dev/null; then
    node_state="ready"; node_note="v$node_version"
  else
    node_state="old"; node_note="v$node_version, Astro wants $wanted"
  fi
fi

chrome_state="missing"
if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ] \
   || have google-chrome || have google-chrome-stable || have chromium || have chromium-browser; then
  chrome_state="ready"
fi

connectors=""
if have claude; then connectors="$(claude mcp list 2>/dev/null </dev/null || true)"; fi

github_state="later"; github_note="account at github.com"
if have gh; then
  if gh auth status >/dev/null 2>&1 </dev/null; then github_state="ready"; github_note="signed in"
  else github_state="signin"; github_note="the owner runs: gh auth login"; fi
fi

# Sets $state (ready | missing | old | signin | later | unknown) and $note for one catalogue row.
check() { # type, name
  state="missing"; note=""
  case "$1:$2" in
    Tool:Node)   state="$node_state"; note="$node_note" ;;
    Tool:git)    if have git; then state="ready"; fi ;;
    Tool:Chrome) state="$chrome_state"; [ "$state" = "missing" ] && note="install Google Chrome" ;;
    Skill:*)     if has_skill "$2"; then state="ready"; fi ;;
    Connector:*)
      local key; key="$(printf '%s' "$2" | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]')"
      if [ -z "$connectors" ]; then state="unknown"; note="could not list connectors"
      elif printf '%s' "$connectors" | grep -i "$key" | grep -qi "connected"; then state="ready"
      elif printf '%s' "$connectors" | grep -qi "$key"; then state="signin"; note="listed but not connected"
      fi ;;
    Account:GitHub)     state="$github_state"; note="$github_note" ;;
    Account:Cloudflare) state="later"; note="account at cloudflare.com" ;;
  esac
}

words() { # state, group -> the wording shown to the owner
  case "$1" in
    ready)   echo "Yes" ;;
    old)     echo "Too old" ;;
    signin)  echo "Sign-in needed" ;;
    later)   echo "Set up at its step" ;;
    unknown) echo "Could not check" ;;
    *)       if [ "$2" = "required" ]; then echo "MISSING"; else echo "No"; fi ;;
  esac
}

missing_required=0
free_total=0; free_ready=0; paid_total=0; paid_ready=0
last_group=""

if [ "$mode" = "table" ]; then
  echo "| Item | Type | What it is for | Used in steps | Cost | Installed |"
  echo "|---|---|---|---|---|---|"
fi

while IFS='|' read -r group type name purpose steps cost; do
  [ -z "$group" ] && continue
  check "$type" "$name"
  shown="$(words "$state" "$group")"
  [ -n "$note" ] && shown="$shown ($note)"

  case "$group" in
    required) if [ "$state" != "ready" ]; then missing_required=1; fi ;;
    free)     free_total=$((free_total + 1)); [ "$state" = "ready" ] && free_ready=$((free_ready + 1)) ;;
    paid)     paid_total=$((paid_total + 1)); [ "$state" = "ready" ] && paid_ready=$((paid_ready + 1)) ;;
  esac

  if [ "$mode" = "table" ]; then
    label="$name"
    [ "$group" = "required" ] && label="**$name** (required)"
    echo "| $label | $type | $purpose | $steps | $cost | $shown |"
  else
    if [ "$group" != "$last_group" ]; then
      [ -n "$last_group" ] && echo
      case "$group" in
        required) echo "REQUIRED" ;;
        free)     echo "FREE (no account, no key; every step has a fallback without them)" ;;
        account)  echo "FREE ACCOUNTS, NEEDED LATER (browser sign-in, no key)" ;;
        paid)     echo "PAID, OPTIONAL (never needed to finish a build)" ;;
      esac
      last_group="$group"
    fi
    printf '%-10s %-26s %-22s %s\n' "$type" "$name" "$shown" "steps $steps"
  fi
done <<EOF
$(catalogue)
EOF

echo
if [ "$missing_required" -eq 0 ]; then summary="Required: all ready."
else summary="Required: something is missing (see above)."; fi
echo "$summary Free add-ons: $free_ready of $free_total installed. Paid, optional: $paid_ready of $paid_total."
echo "API keys: none needed for a preview. All optional, offered at step 15 (see references/keys.md)."
exit "$missing_required"
