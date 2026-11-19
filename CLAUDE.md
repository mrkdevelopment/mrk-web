# Working on MRK-Web

This repo is a Claude Code skill (and plugin) that guides a website build. These notes are for whoever edits
the skill itself.

## Who the skill is for

Business owners and marketing agencies from a WordPress, Wix or Squarespace background. They want AI-built
websites without AI slop, and they do not know Git, the terminal or Cloudflare. Every guide should make the
agent explain things in plain words and never leave the owner holding an error.

## Layout

- `skills/mrk-web/SKILL.md`: the step table, the eight rules, the commands. Keep it under 250 lines. It
  stays in context for the whole build, so every line costs.
- `skills/mrk-web/references/NN-name.md`: one guide per step, loaded when that step starts. Same shape each
  time: Purpose, what to do, tools and models, "Done when".
- `skills/mrk-web/scripts/`: Node scripts with no dependencies. Anything exact and repeatable belongs here,
  not in a model's hands.
- `skills/mrk-web/templates/`: starter files the agent copies into a site and adapts.
- `.claude-plugin/`: plugin and marketplace manifests. The repo root is the plugin.

Scripts and templates must stay inside `skills/mrk-web/`, because the skill finds them through
`${CLAUDE_SKILL_DIR}`, which works both as a plugin and as a copied skill folder.

## Principles

- **Few rules, strong defaults.** The eight rules in `SKILL.md` are the only fixed ones. Everything in the
  guides is a default the brief or the owner can override. Before adding a rule, ask whether it would stop a
  good outcome on some real site. If it could, make it a default with its reason.
- **Say why.** A guide that explains the reason lets the agent adapt sensibly. A bare instruction gets
  followed off a cliff.
- **Every step ends in a file.** Progress lives in the site's `_mrk/` folder so a new session can continue.
- **The client's material outranks our taste.** In a site project, `resources/` is the client's (brand kit,
  photos, documents, links, inspiration) and is read-only. Order of authority: the eight rules, then
  `resources/` and the owner's word, then the old site, then the guides' defaults. A brand font on the
  "AI tells" list is still the brand's font.
- **Write guides fresh.** Do not copy text from other skills. Point to them by name instead; step 1 checks
  whether they are installed, and every step works without them.
- **Lessons come from real builds.** When a build goes wrong, add the lesson to the guide for that step, with
  what happened.
- **Plain language** in everything the owner might read, including README, changelog and roadmap.

## Decisions already made

| Decision | Detail |
|---|---|
| Tools | Claude Code first. Gemini and Codex in 1.1. |
| Hosting | Cloudflare Pages only in 1.0. cPanel with PHP forms in 1.1. |
| Content | Files in the repo in 1.x. Headless WordPress and EmDash CMS in 2.0. |
| Speed gate | 98 on all four Lighthouse scores, mobile, every page. A hard stop; only the site's owner can override, and it is recorded. |
| Scorecard | Ten checks: five usability, five marketability. |
| Commands | `installer` (first time: table and setup), `start <address>` (fast), `agency <address>` (guided, agency-level). Setup is never part of a build. |
| Design credits | Before a design is chosen, only five small sketches of the home page's top are made. Nothing else is built until after the pick. |
| Client materials | Asked for in step 1, kept in `resources/`, out of GitHub by default. |
| Online shops | Not built. The site links to the checkout the business already has (asked in the brief). |
| Licence | Skill: GPL-2.0-or-later. `skills/mrk-web/templates/`: MIT, because those files are copied into clients' sites. Keep anything meant to be copied into a site inside `templates/`. |
| Delivery | Private repo. Two ways in, each for one website or for every project: a zip made from `main` (the buyer puts it in a folder and says one sentence to Claude), or `npx skills add mrkdevelopment/mrk-web` (add `-g` for every project) for people with repo access. The plugin manifests still work but are not in the README. |
| What buyers get | Everything except this file and `ROADMAP.md`, which `.gitattributes` leaves out of GitHub's zip downloads. Do not link to either from the README or anything under `skills/`. |
| Site versions | Semantic versioning. Every site starts on `main`, then branches off to `1.0.0`, where the changelog begins. One branch per version after that, merged into `main` when finished. |
| Models | Opus is the first choice for a rebuild. Fable (the highest model) is only suggested for the design step at agency pace when the client supplied inspiration or a brand kit. |

## Changing the skill

1. Add the change under `## Unreleased` in `CHANGELOG.md`.
2. If a script changed, run it against a real site or a built `dist/` and read its output.
3. `claude plugin validate .` must pass.
4. To release: set the version in four places, together: `.claude-plugin/plugin.json`, the README badge,
   the changelog heading, and `metadata.version` at the top of `skills/mrk-web/SKILL.md` (the only one a zip
   install keeps). This shows all four at once:
   `grep -n '"version"\|badge/version\|^## [0-9]\|  version:' .claude-plugin/plugin.json README.md CHANGELOG.md skills/mrk-web/SKILL.md`

To try the skill without installing it: `claude --plugin-dir /path/to/mrk-web` in an empty folder, then say
"start".
