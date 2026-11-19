# Changelog

All notable changes to MRK-Web. Versions follow [semantic versioning](https://semver.org).

## Unreleased

## 1.0.1 - 2026-11-19

### Added

- Paste a client's email or message after "start". The skill saves it, takes from it the site address, the
  sites they like, the pages and features they asked for, any deadline and whether they sell online, then
  asks only for what is missing.
- The brief now asks outright for websites the client likes, competitors included, and what they like about
  each one.
- A set way to study a site someone else owns: screenshots, a short written teardown, and two lists of what
  to borrow (structure and patterns) and what to leave (their words, pictures, logo, colours and type).
  Competitors get extra care so the new site can never pass for a rival's.
- The brief asks whether the site sells online. MRK-Web does not build a shopping cart; it builds buy buttons
  that go to the checkout the business already has, and says so at the start.
- If a client's deadline is tighter than the full build allows, the skill says so and offers a staged launch
  instead of skipping steps.
- A site folder can be prepared in advance: put the client's message and files in `resources/` and say
  "start". The skill reads them before asking anything.
- For agencies, what is missing is split into what the agency can answer and what the client must supply,
  with an offer to draft the reply to the client.

- `keys.md`: one guide to every account, API key and paid tool in a build, what works without each one, and
  how to get each key.

### Changed

- Setup now goes free first: free skills and the free Astro docs connector are offered as one set, accounts
  wait until their step, and the paid tools (Mobbin, Higgsfield) are never offered unless asked for.
- No API key is required any more. The contact page can launch with phone and email links, and the form,
  spam check and CRM link are optional levels added when the owner is ready.
- Installing is now one line, with a choice: for one website (the skill lives in that site's folder) or for
  every project on the computer. Each works from the zip, by saying a sentence to Claude, or from the GitHub
  repo with one terminal command. Uninstalling is one line too.
- The skill's version is now written inside `SKILL.md`, so a copy installed from the zip knows which version
  it is.

## 1.0.0 - 2026-11-19

First version.

### Added

- `SKILL.md`: twenty steps from brief to launch, eight fixed rules, the five places it stops for the owner,
  and `start`, `continue`, `status`, `step <n>` and `help`.
- A guide for every step in `references/`, read only when that step begins.
- A two-part scorecard: five usability checks and five marketability checks, each with a test that can be run.
- Model routing: which work belongs on the strongest model, which on cheaper ones, and which on scripts.
- House style: MRK's editable defaults for page order, forms, FAQs, colour and wording.
- Scripts: site crawl with three modes (`homepage`, `single`, `all-pages`), Lighthouse speed test with the
  98 gate, built-site scan, redirect check, version bump, setup check.
- Templates: Cloudflare Pages contact function with spam protection, form component, cookie consent with
  analytics, crawler files, head tags and structured data, headers, privacy and terms drafts, site README and
  changelog.
- A `resources/` folder the client fills during setup: brand kit, photos, documents, links and design
  inspiration. The brand kit overrides the taste rules, the client's inspiration leads the references and at
  least two of the five design directions, and nothing in the folder is published unless the owner says so.
- Three paths: rebuild, new business with no site, and agency work for a client.
- Plugin manifest, so Claude Code can install straight from the repo.
- Install from a downloaded zip by pasting one sentence into Claude Code, with steps by hand for Mac, Linux
  and Windows, and how to update and remove.
- Licence: the skill is GPL version 2 or later; the starter templates are MIT, so sites built with them carry
  no licence terms from MRK-Web.

### Limits in this version

- Cloudflare Pages only. cPanel hosting is planned for 1.1.
- Content is files in the repo. Headless WordPress and EmDash CMS are planned for 2.0.
- Written and tested for Claude Code. Gemini and Codex are untested.
