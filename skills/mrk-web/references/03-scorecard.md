# Step 3: Score the site

**Purpose.** Put a number on the current site so the rebuild has something to beat. The same scorecard is
used again in step 13, the same way.

Ten checks, one point each: five for **usability** (can people use it?) and five for **marketability** (does
it win work?). A check passes only when its test passes. No half points.

## Before scoring

- Screenshot the home page and one page of each main type at 390px (phone) and 1440px (desktop), full length.
  Save in `_mrk/scores/screens-before/`.
- Run the speed test on up to 20 pages:
  ```bash
  node "$SKILL/scripts/speed.mjs" <url> --label before --max 20
  ```

## Usability

**U1. Clear in five seconds.** Looking only at the first screen, on phone and desktop, a stranger can say
what the business does, who for, and what to do next.
*Fails:* a slogan with no service in it, jargon, or the "what" appearing only further down.

**U2. Works on a phone.** At 390px: no sideways scrolling, body text at least 16px, buttons and links at
least 44px tall, nothing overlapping, the menu opens and closes.
*Fails:* any one of those.

**U3. Fast.** Median mobile Lighthouse performance of 90 or more across the pages tested.
*Fails:* below 90. Record the figure either way.

**U4. Easy to get around.** Seven or fewer items in the main menu, every page reachable within three clicks
of the home page, no broken links, no page that ends without a next step, and a wrong address shows a real
"not found" page.
*Fails:* dead ends, broken links, or a menu nobody could scan.

**U5. Usable by everyone.** Median Lighthouse accessibility of 95 or more, and by keyboard alone you can
reach the menu, the main button and every form field, always seeing where you are.
*Fails:* either half.

## Marketability

**M1. One clear action.** One main call to action, visible in the first screen on phone and desktop, worded
as what happens ("Book a free quote", not "Submit"), and repeated further down.
*Fails:* several competing main buttons, or none in the first phone screen.

**M2. Proof, early and named.** Within the first two screens there is real proof: a named client, a specific
number, a review with a name. Testimonials carry a name and a role, company or suburb.
*Fails:* proof only far down the page, anonymous quotes, or vague claims ("trusted by many").
If the business has no proof yet, this fails honestly and goes on the owner's to-do list.

**M3. Shown, not told.** What they do and how it works is shown: real photos of the work, a diagram, the
product in use. Someone who skips every paragraph still understands the offer.
*Fails:* the offer exists only as paragraphs, or the pictures are generic stock.

**M4. Looks like the brand, not like a template.** The brand's colour and type are used consistently, the
logo is sharp, and fewer than two of the tells in `04-taste.md` appear.
*Fails:* two or more tells, mismatched styles, or a blurry logo.
A font or colour that comes from the client's brand kit is never counted as a tell, on the old site or the
new one. A tell is a default nobody chose.

**M5. Findable.** Each page has its own title and description, the main content is in the page's HTML without
needing JavaScript, there is a sitemap, structured data describing the business, and `robots.txt` does not
block search or AI crawlers.
*Fails:* any one of those.

## Also record (not points, but compared in step 13)

- Median of each of the four Lighthouse scores, mobile.
- Number of AI tells from `04-taste.md`, with examples.
- Weight of the home page in kilobytes.

## Write `_mrk/scores/before.md`

```
# Example Plumbing: 4/10 (usability 2/5, marketability 2/5)

| Check | | Evidence |
|---|---|---|
| U1 Clear in five seconds | pass | "Emergency plumber, Inner West, here in 60 minutes" in the first screen |
| U2 Works on a phone | fail | Page is 468px wide at 390px; menu button is 28px tall |
```

Evidence is something a reader can check: words quoted from the page, a measurement, a named screenshot.
Never "looks good" or "feels dated".

Score honestly. A site that earns 7 gets 7, and the rebuild must earn its own points.

## Tell the owner

The score, the three changes that would help most, and anything the site already does well that the rebuild
must keep. Plain words, no lecture.

## Tools

`seo-unlighthouse`, `seo-audit` and Impeccable's critique add depth if installed. Running the tests suits a
smaller model; the pass or fail judgement on U1, M1 to M4 belongs on the strongest one.

**Done when:** `_mrk/scores/before.md` exists and the scores are in `_mrk/state.json`.
