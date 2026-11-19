# Step 11: Code diet

**Purpose.** Builds accumulate leftovers: components nobody uses, styles for things that were removed, images
far larger than their slot. Less code loads faster and gives the next person less to break.

## Measure first

Record in `_mrk/checks/diet.md`: total size of `dist/`, the home page's HTML, CSS and JavaScript sizes, the
number of source files, and the ten largest files in the build. Measure again at the end.

## Cut, in this order

1. **Run the audit.** With `ponytail-audit` installed, run it on the repo: it reports what to delete, merge
   or simplify, ranked, and changes nothing. Without it, do the same pass by hand: for each component, style
   file, script and dependency, ask what breaks if it goes.
2. **Unused files**: components, pages, scripts and images nothing references. Unused dependencies in
   `package.json`.
3. **Unused CSS**: Tailwind only ships the classes in use, so look at hand-written CSS. For each selector,
   search the source for anything that could match it. Browser coverage tools show what a page used, but a
   rule unused on one page may serve another, so check before deleting.
4. **Images**: `check-site.mjs` lists every image over 200 KB and every image without set dimensions. Each
   photo goes through Astro's image tools at the widths its slot needs. Logos that are huge PNGs become SVGs
   or small PNGs. Originals stay in `_mrk/brand/`, not in the build.
5. **Duplicates**: two components doing one job, the same value written in three places instead of a token,
   two font files where one would do.
6. **JavaScript**: anything shipped to the browser that the page works without.

## Rules

- Delete only what you have shown is unused. "Probably unused" stays.
- Small, separate changes: cut one kind of thing, build, check, move on.
- Do not restructure working code for neatness. The aim is less, not different.
- If something stays for a reason that is not obvious, leave a one-line comment saying why.

## After each round

```bash
npm run build && node "$SKILL/scripts/check-site.mjs" dist
```

Then re-run the speed test from step 9 and compare screenshots of each template with the ones in
`_mrk/scores/screens-after/`. A diet that changes how a page looks has cut too much.

## Skills and models

`ponytail-audit` to find, `ponytail-review` to check each change, `seo-images` for image detail. This is
careful code work: a strong coding model, not the cheapest.

**Done when:** the before and after sizes are in `_mrk/checks/diet.md`, the build and site check pass, speed
is still 98 or more, and the screenshots match.
