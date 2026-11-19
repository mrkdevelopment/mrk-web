# MRK-Web

[![Version](https://img.shields.io/badge/version-1.0.0-2B59FF)](CHANGELOG.md)
[![Claude Code](https://img.shields.io/badge/Claude_Code-skill-D97757)](skills/mrk-web/SKILL.md)
[![Steps](https://img.shields.io/badge/steps-20-0A1F44)](#the-twenty-steps)
[![Builds with](https://img.shields.io/badge/builds_with-Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Launches on](https://img.shields.io/badge/launches_on-Cloudflare_Pages-F38020?logo=cloudflarepages&logoColor=white)](https://pages.cloudflare.com)

A Claude Code skill that takes a business website from tired to live: it reads the current site, scores it,
designs and builds a fast replacement that does not look or read AI-made, proves the improvement with
numbers, and launches it on Cloudflare Pages.

Made for business owners and marketing agencies who know WordPress, Wix or Squarespace and want
professional results from AI without learning to code.

## Install

You need [Claude Code](https://claude.com/claude-code) and access to this private repo.

**As a plugin (updates itself):** inside Claude Code, type

```
/plugin marketplace add mrkdevelopment/mrk-web
/plugin install mrk-web@mrk-web
```

Claude Code uses your computer's GitHub sign-in to reach the repo. If it cannot, run `gh auth login` and then
`gh auth setup-git` in a terminal and try again.

**Or as a plain skill:** in a terminal

```bash
git clone git@github.com:mrkdevelopment/mrk-web.git
```

```bash
ln -s "$(pwd)/mrk-web/skills/mrk-web" ~/.claude/skills/mrk-web
```

Restart Claude Code after either.

## Use it

1. Make a new, empty folder for the new site and open Claude Code in it.
2. Use the strongest model you have.
3. Say **start**.

It asks a few questions, checks your setup, and begins. Say **continue** in the same folder to pick up later,
**status** to see where you are, or **help** for the step list.

### Bring your own materials

During setup it creates a `resources` folder and asks what you would like to bring:

```
resources/
  brand/         your brand kit: logos, fonts, colours, guidelines
  photos/        real photos and video files
  documents/     brochures, product PDFs, price lists, a brief, text for the site
  links.md       YouTube videos, social profiles, review pages, booking links
  inspiration/   sites you like, screenshots, pieces you want, things to avoid
```

The more that is real and yours, the closer the first design is to what you want. Your brand kit is used as
given, even where the skill's own taste rules would choose differently. Your inspiration shapes at least two
of the five design directions. Nothing in the folder is changed, and nothing is published unless you say so.
Add to it at any time.

It stops for you in five places: installing anything, choosing a design, paying for images (optional), your
review, and going live. Everything else it does and reports.

## The twenty steps

| # | Step | # | Step |
|---|---|---|---|
| 0 | Brief | 11 | Code diet |
| 1 | Setup and your materials | 12 | Copy check |
| 2 | Ingest the current site | 13 | New against old |
| 3 | Score it out of 10 | 14 | GitHub |
| 4 | Taste rules | 15 | Cloudflare prep and preview |
| 5 | Real references | 16 | Your review |
| 6 | Five directions, then a design system | 17 | Analytics, cookies, privacy, terms |
| 7 | Build | 18 | SEO check and the 98 gate |
| 8 | Imagery (optional) | 19 | Go live |
| 9 | Phone and speed pass | 20 | What next |
| 10 | AI visibility | | |

## What it will not do

- Invent testimonials, numbers, logos or photos of your business.
- Touch your live site or domain before you say so.
- Spend money without showing you the price first.
- Launch a page scoring under 98 on any of Lighthouse's four measures, unless you decide otherwise.

## What is in this repo

```
skills/mrk-web/
  SKILL.md        the steps and the rules, kept short
  references/     one guide per step, read only when that step starts
  scripts/        crawl, speed test, site scan, redirect check, version bump, setup check
  templates/      starter files: forms, consent, crawler files, headers, legal drafts, site README
.claude-plugin/   lets Claude Code install the repo as a plugin
CLAUDE.md         notes for anyone (or any AI) working on the skill itself
ROADMAP.md        what is planned for 1.1 and 2.0
```

## Works best with

MRK-Web runs on its own, and does better with these installed. Step 1 checks for them and offers to install
what is missing: `design-taste-frontend`, `impeccable`, `refactoring-ui`, `ui-ux-pro-max`, `emil-design-eng`,
`modern-web-guidance`, `web-design-guidelines`, `ponytail`, `no-ai-slop`, and the `claude-seo` skills.

## Versions

[CHANGELOG.md](CHANGELOG.md) lists what changed. [ROADMAP.md](ROADMAP.md) lists what is coming: cPanel
hosting in 1.1, headless WordPress and EmDash CMS in 2.0.

The version number lives in `.claude-plugin/plugin.json`, the badge above and the changelog. Change all three
together.
