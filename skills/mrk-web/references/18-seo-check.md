# Step 18: SEO check and the 98 gate

**Purpose.** The last look at what search engines and visitors will get, on the preview, while it is still
cheap to fix. Then the gate that decides whether the site may launch.

## Part 1: the checks

```bash
npm run build
node "$SKILL/scripts/check-site.mjs" dist --old-host <old domain> --site-url <real domain>
node "$SKILL/scripts/redirects.mjs" --old _mrk/ingest/urls.csv --dist dist --map _mrk/redirects.csv
```

Both must finish with no errors.

If the scan flags something that is genuinely fine (an article that really is about a shortcode, say), accept
it in `_mrk/checks/allow.txt`, one line each: `rule /path/ # reason`. The scan then lists it as waived. A
line with no reason is ignored. Never waive something just to get through; the reasons are read at review.

Then confirm by hand, because scripts cannot judge these:

- **Titles and descriptions** are unique, say what the page is, and read like something a person would click.
- **One main heading per page**, and it matches what the page is about.
- **Canonical links and the sitemap use the real domain**, not the preview address. This is the most common
  launch mistake.
- **Structured data** describes the real business and matches the visible page.
- **Internal links**: important pages are linked from the menu, footer or body, not only the sitemap.
- **Images** have descriptions that say what is shown.
- **Local businesses**: name, address and phone are identical everywhere on the site and match the Google
  Business Profile, character for character.
- **Nothing important was lost**: every page marked important in `_mrk/important-pages.md` exists at its old
  address, or redirects to a proper replacement that the owner agreed to. Run the redirect check with
  `--traffic _mrk/baseline/Pages.csv` when there is a report.
- **Preview-only settings are not baked in**: no `noindex` on real pages, no preview addresses in the build.

With the SEO skills installed, run `seo-audit` or `seo-technical` against the preview for a second opinion,
and `seo-local` for a local business. Read their findings as advice: fix what is real, note what you declined
and why.

## Part 2: the gate

```bash
node "$SKILL/scripts/speed.mjs" <preview address> --label preview --gate 98
```

**Every page must score 98 or more on all four Lighthouse measures (performance, accessibility, best
practices, SEO) on mobile.** Scores wobble between runs, so the script re-tests any page that falls short
three times and uses the middle result.

If pages fail, `_mrk/scores/gate-preview.json` names each one and the things costing it the most. Fix, push,
and run the gate again.

### When a page will not reach 98

After three honest rounds of fixes on the same page, stop and show the owner:

- which page, which score, and by how much;
- what is costing the points, in plain words (usually something from outside: a map, a video, a chat widget,
  a tracking tag);
- the options: load it only when tapped, replace it with something lighter, or remove it.

Then they choose. **Do not launch below 98** (rule 7). Do not quietly lower the bar, and do not remove
something they asked for without asking. If the owner decides to launch a page below 98, that is their call
to make: record their words, the page and the score under `decisions` in `_mrk/state.json`.

## Models

Running both parts is script work. Reading the results and making fixes needs a strong coding model.

**Done when:** both checks are clean and the gate passes (or the owner's override is recorded).
