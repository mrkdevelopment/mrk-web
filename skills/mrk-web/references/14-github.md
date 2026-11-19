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

Every site starts on `main` and then moves to a version branch. Always in this order:

1. **Start `main`.** `git init -b main`. If the folder is already a repo on another branch name, rename that
   branch to `main`. Add `README.md` from `$SKILL/templates/site/README.md` with the placeholders filled: the
   row of badges at the top shows the version, what is live, and the stack at a glance. Commit the site as it
   stands. No changelog yet.
2. **Create the GitHub repo and push `main`** ✋. Ask first: this sends the site's files to GitHub.
   - Signed in with `gh`: `gh repo create <name> --private --source . --remote origin --push`
   - Otherwise the owner creates an empty private repo on github.com and gives you its address.
   - Private by default. For an agency, ask whose GitHub account it belongs in.
3. **Branch off to `1.0.0`.** `git checkout -b 1.0.0`. The changelog starts here, on this branch:
   - `CHANGELOG.md` from the template, with a first entry describing the rebuild;
   - `"version": "1.0.0"` in `package.json`, and the same in the README badge.

   Commit and push the branch.
4. **Work on the version branch from now on.** `main` changes only when a finished version is merged into it,
   and each merge is tagged.

Later versions work the same way: a new branch off `main` named for the version (`1.0.1`, `1.1.0`), changes
noted in the changelog as they are made, merged into `main` when finished.

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

**Done when:** `main` is on GitHub, branch `1.0.0` exists with the changelog started, and nothing secret is in
either.
