# Step 15: Cloudflare prep

**Purpose.** Make everything work that a static page cannot do alone (forms, email, spam protection), carry
over every old address, and get a private preview link the owner can review.

For the owner: **Cloudflare Pages** hosts the site. Every branch on GitHub gets its own preview address
(`<branch>.<project>.pages.dev`), separate from the real domain.

MRK-Web 1.0 launches on Cloudflare Pages only. cPanel hosting arrives in 1.1.

## 1. Carry over what the old site did

Go through `_mrk/functions.md` from step 2. Each item is rebuilt, replaced or retired on purpose, and the
owner is told which. Nothing disappears by accident.

## 2. Contact and forms

API keys are the hardest part of a build for most people, so none is required. Offer the three levels in
this order and let the owner choose. `keys.md` has the walkthrough for every key.

| Level | What visitors get | What the owner must set up |
|---|---|---|
| **1. No keys** | Phone, a tappable email link, address, hours | Nothing |
| **2. A working form** | The enquiry form emails the business | One email service: an account, one API key, and proving they own the domain |
| **3. Form with extras** | The same, plus a spam check and a copy to their CRM | Two free Turnstile keys, and a webhook address from the CRM |

Level 1 is a complete, honest contact page and can launch today. Levels 2 and 3 can be added later without
redesigning anything. If the deadline is tight or the owner is unsure, launch at level 1 and add the form
after.

**For level 2 or 3**, ask:

- Which address receives enquiries?
- Which service sends the email? The contact function supports the ones in `$SKILL/templates/README.md`. If
  they have none, `keys.md` says which suits whom.
- Should enquiries also go to a CRM or automation tool?

Then:

- Copy the contact function, the form component and its script from `$SKILL/templates/`. Pages stay static;
  the one function runs on Cloudflare when a form is sent.
- **Spam protection**: the hidden trap field in the template works with no set-up. Turnstile is the optional
  extra.
- **Secrets** (rule 4): the owner enters them in Cloudflare Pages, Settings, Variables and Secrets, for
  **both** Production and Preview. Forgetting Preview is the usual reason forms fail in review. Names are in
  `$SKILL/templates/env/`.
- Run the function's own tests: `node --test functions/api/contact.test.ts`.
- Test locally first: `npx wrangler pages dev dist` with a `.dev.vars` file. Astro's own preview does not run
  functions. If wrangler objects to the compatibility date, add `--compatibility-date` with a date a few
  months back.

If a key cannot be sorted out in one sitting, do not wait on it. The form template already falls back to
showing the business's email address until sending is set up. Record what is outstanding in
`_mrk/owner-todo.md` and carry on.

## 3. Redirects

```bash
node "$SKILL/scripts/redirects.mjs" --old _mrk/ingest/urls.csv --dist dist --map _mrk/redirects.csv
```

It lists every old address with no home in the new site. Fill in `_mrk/redirects.csv` for each (the site map
from step 2 has the decisions), then run it again with `--write public/_redirects`.

- **Permanent (301) from day one.** On a real rebuild, temporary redirects "while reviewing" left 96% of
  search impressions pointing at old addresses.
- Send each old page to its closest replacement, never everything to the home page.
- No broad wildcard patterns for old blog addresses: one of those swallowed live pages.
- Where the right target is unclear, ask the owner, with the page's traffic beside it.

The script must exit clean before launch (rule 6).

## 4. Headers

Copy `public/_headers` from the templates and remove the lines for services this site does not use.

## 5. Connect and preview

1. In Cloudflare: Workers & Pages, create a Pages project, connect the GitHub repo. Build command
   `npm run build`, output folder `dist`. Set `NODE_VERSION` to what Astro needs (step 1 shows it).
   The owner does the sign-in and clicks; guide them screen by screen.
2. Push the `1.0.0` branch. Cloudflare builds it and gives the preview address.
3. Set the site's address variable to the **real** domain, not the preview one, so page links and the sitemap
   are right at launch.

## 6. Prove it works

- Open the preview on a phone and a desktop.
- Send a real test enquiry through every form (levels 2 and 3). Confirm the email arrives, and the CRM entry
  if there is one. At level 1, tap the phone and email links on a phone.
- Try five old addresses and confirm each redirects in one hop.
- `curl -I <preview address>`: preview deployments should send `X-Robots-Tag: noindex` so they stay out of
  search results. If that header is missing, tell the owner before sharing the link around.

## Skills and models

Cloudflare's own `wrangler` and `cloudflare` skills, if installed, keep the commands current. Forms and
redirect decisions need care: a strong coding model, and the owner for anything about their business.

**Done when:** the preview loads, contact works at the level the owner chose, and `redirects.mjs` exits
clean.
