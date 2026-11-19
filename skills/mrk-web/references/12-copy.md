# Step 12: Copy check

**Purpose.** Visitors can tell when words were written by a machine, and it costs trust in everything else
on the page. This step finds those lines and replaces them with something a person at this business would
actually say.

## Find

Go through every page's visible words: headings, body, buttons, form labels, image descriptions, page titles
and descriptions.

With `no-ai-slop` installed, run it in **detect** mode first, so you see what it flags before anything is
rewritten. Without it, use the "how it reads" list in `04-taste.md` and add:

- sentences that could sit on any competitor's site unchanged;
- a claim with no fact behind it ("industry-leading", "unmatched quality");
- a heading that only labels ("Our Process") where it could inform ("Quoted in a day, fitted in a week");
- words the customer would never use (check against "customer, problem, outcome" in the facts sheet);
- long dashes and semicolons doing a full stop's job.

List the flagged lines per page in `_mrk/checks/copy.md`.

## Fix

Rewrite each flagged line so it says one specific, true thing. The usual fix is to swap the general word for
the particular: the suburb, the number, the name, the timeframe, the price.

- If there is nothing specific to say, delete the line. Short pages are fine.
- Keep the owner's voice from the brand kit. Sharper, not different.
- Read headings and the first screen aloud. If you would not say it to a customer across a counter, rewrite it.

## Never change

- Testimonials and reviews. Word for word, always, even with a typo.
- Numbers, names, prices, addresses, qualifications.
- Anything in the legal pages (step 17).
- Meaning. If a rewrite would change what is being promised, ask the owner.

## House style

`house-style.md` asks for business language over technical language. Apply it here unless the brief says the
audience is technical.

## Models

Flagging lines page by page is good work for a mid-sized model in batches. Rewrites of headings and first
screens deserve the strongest model, because those few lines carry the page.

**Done when:** `_mrk/checks/copy.md` shows every flagged line as fixed, deleted, or kept with a reason.
