# Step 14: GitHub ✋

**Purpose.** Put the site somewhere safe with its full history, so every change can be traced and undone, and
so Cloudflare can publish from it.

For the owner: **GitHub** stores the site's files and remembers every version. A **repo** is the site's
folder there. A **branch** is a working copy where changes are made before they go live.

## Before the first save

- Copy `$SKILL/templates/env/gitignore.txt` to `.gitignore`.
- Search the whole folder for anything secret: API keys, passwords, tokens, `.env` files with real values.
  None of it may be committed (rule 4).
- Decide what of `_mrk/` is kept. Keep: the brief, facts, brand kit, site map, redirects, scores, design
  notes, roadmap. Ignore: `_mrk/ingest/pages/` and raw screenshots, which are bulky and can be remade.
- **`resources/` stays out of GitHub by default** (the gitignore template excludes it). It holds the client's
  originals, which can be large, and may include briefs or price lists that are private. Everything the site
  uses was copied into the site already. Tell the owner to keep their own copy of the folder, and ask if they
  would rather store it in the repo.

## Set up the repo

1. `README.md` from `$SKILL/templates/site/README.md`: fill in the placeholders. The row of badges at the top
   shows the version, what is live, and the stack at a glance.
2. `CHANGELOG.md` from the template, with a first entry describing the rebuild.
3. `"version": "1.0.0"` in `package.json`.
4. Create the repo and the first branch ✋. Ask first: this sends the site's files to GitHub.
   - Signed in with `gh`: `gh repo create <name> --private --source . --remote origin`
   - Otherwise the owner creates an empty private repo on github.com and gives you its address.
   - Private by default. For an agency, ask whose GitHub account it belongs in.
5. Work on a branch named for the version: **`1.0.0`** for the first release. `main` only ever holds what is
   live.

## Version numbers

`MAJOR.MINOR.PATCH`:

| Change | Bump | Example |
|---|---|---|
| Redesign, or anything that changes addresses or hosting | Major | 2.0.0 |
| A new page type, section or feature | Minor | 1.1.0 |
| Fixes, wording, styling | Patch | 1.0.1 |

As you work, add each change under `## Unreleased` in the changelog. To release:

```bash
node "$SKILL/scripts/version.mjs" <patch|minor|major>
```

That updates `package.json`, the README badge and the changelog together. Do not edit the version by hand in
one place: on a real project it drifted until the README named two different live versions.

Each release: a branch named for the version, a pull request into `main`, a tag on the merge.

**Done when:** the repo exists, branch `1.0.0` holds the site, and nothing secret is in it.
