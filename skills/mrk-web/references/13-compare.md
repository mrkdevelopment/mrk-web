# Step 13: New against old

**Purpose.** Show the improvement as measurements, taken the same way as in step 3, so it is proof and not
an opinion.

## Score the new site

Run the whole of `03-scorecard.md` again on the local build: the same ten checks, the same screen sizes, the
same pages where they still exist. Write `_mrk/scores/after.md` in the same format.

Be as hard on the new site as you were on the old one. If a check fails, it fails.

## Check against the references

Put each built section beside the reference it drew from (`_mrk/references.md`). One question: does it hold
up next to it? Fix the ones that do not. Two rounds at most, so the build converges.

## Write `_mrk/scores/compare.md`

| Measure | Old | New |
|---|---|---|
| Scorecard | 4/10 | 10/10 |
| Usability | 2/5 | 5/5 |
| Marketability | 2/5 | 5/5 |
| AI tells | 6 | 0 |
| Performance (mobile, median) | 41 | 99 |
| Accessibility | 78 | 100 |
| Best practices | 83 | 100 |
| SEO | 85 | 100 |
| Home page weight | 3,900 KB | 240 KB |

(Those figures are an example of the layout, not a promise.)

Under the table, one line per scorecard check: what changed and why it passes now. Put the before and after
screenshots side by side.

## If it is not 10/10

Say which check failed and why. Then either fix it, or, when it needs something only the owner has (real
proof, a real photo, a decision), add it to `_mrk/owner-todo.md` and say so plainly. A truthful 9 with a clear
to-do beats a 10 reached by inventing proof.

## New business (no old site)

There is no "old" column. Score the new site alone, and compare it with the two closest competitors from the
facts sheet on the same ten checks.

## Tell the owner

The headline numbers in two sentences, then the table. Suggest this is a good place to pause.

**Done when:** `after.md` and `compare.md` exist and the scores are in `_mrk/state.json`.
