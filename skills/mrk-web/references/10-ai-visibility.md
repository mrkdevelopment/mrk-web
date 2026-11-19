# Step 10: AI visibility

**Purpose.** People now ask ChatGPT, Claude, Perplexity and Google's AI "who is the best plumber near me?".
The site needs to be readable, understandable and quotable by those systems, as well as by Google.

A static Astro site already does the hardest part: the content is in the HTML, with no JavaScript needed to
read it.

## Ship these

Templates for all of them are in `$SKILL/templates/` (`robots.txt.ts`, the `crawler-files` integration for
the sitemap and `llms.txt`, and `SeoHead.astro` for structured data). They are generated at build time from
the same data as the pages, so they cannot drift out of date.

| File | What matters |
|---|---|
| `robots.txt` | Allows search and AI crawlers, and points to the sitemap. A crawler that matches its own named section ignores the general `*` section, so any block must be repeated in each. To hide a page, use `noindex` on the page, not a block here. |
| `sitemap.xml` | Every page that should be found, nothing else. A "last changed" date only when it is true. |
| `llms.txt` | A plain summary for language models: a heading, one paragraph on who the business is, then links to the key pages by section. Keep it short; put the long tail under `## Optional`. |
| Structured data | One connected block per page describing the business (as a local business where it is one), the site and the page. Real details only, matching the page. |
| A real "not found" page | Unknown addresses must answer 404. A site that answers 200 for everything fails several checks. |

Do not add FAQ, how-to or self-written review markup by default. Google no longer shows rich results for most
FAQ and how-to markup, and marking up reviews a business wrote about itself breaks its rules.

## Lighthouse's agent check

Lighthouse has a newer category, "Agentic Browsing", which reports how well AI agents can use a page. It is
still marked as under development, so read what it actually reports rather than trusting this list:

```bash
npx lighthouse@latest <url> --only-categories=agentic-browsing --output=json --output-path=_mrk/scores/agentic.json
```

At the time of writing it looks at:

- whether buttons, links and form fields all have proper names (the same things screen readers need);
- whether the page jumps around as it loads;
- `llms.txt`;
- **ARD** (Agentic Resource Discovery): a catalogue file, `ai-catalog.json`, for sites that offer tools or
  data for agents to use. **Most business sites have nothing to list and should not have this file.** Never
  create one just to tick the box;
- forms described for agents (WebMCP). Experimental. Leave it out.

## Check from outside

Once there is a preview address (after step 15), and again when live:

```bash
curl -s <url> | grep -c "<a phrase from the first screen>"     # 1 or more: content is in the HTML
curl -A GPTBot -I <url>                                        # 200, not 403
```

A 403 for `GPTBot` usually means a Cloudflare setting ("block AI bots", bot protection) is contradicting
`robots.txt`. Tell the owner which setting, and let them choose.

## Off the site

AI answers lean heavily on other people's pages: Google Business Profile, review sites, industry directories,
"best of" lists. List the gaps in `_mrk/owner-todo.md` with draft wording. The owner submits them; you do not.

**Done when:** the files are in the build, the structured data parses, and `check-site.mjs` reports no errors
for them.
