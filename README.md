# MRK-Web

[![Version](https://img.shields.io/badge/version-1.0.1-2B59FF)](CHANGELOG.md)
[![Licence](https://img.shields.io/badge/licence-GPL--2.0--or--later-0A1F44)](LICENSE)
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

You need [Claude Code](https://claude.com/claude-code). Nothing else has to be set up first.

### The quick way: paste one sentence

1. Download the MRK-Web zip and leave it in your Downloads folder. Do not unzip it.
2. Open Claude Code in any folder and paste this:

```text
Install the MRK-Web skill for me. The zip is in my Downloads folder and its name starts with "mrk-web". Unzip it, copy the "skills/mrk-web" folder from inside it to my Claude skills folder at ~/.claude/skills/mrk-web (replace any older copy), then run the setup check in its scripts folder and show me the result. Offer to install anything that is missing, and ask me before each one.
```

3. Say yes when Claude asks permission for each step.
4. Restart Claude Code when it finishes.

It works the same on Mac, Windows and Linux. Claude finds the right folders for your computer.

### By hand

**Mac or Linux**, in a terminal:

```bash
unzip ~/Downloads/mrk-web-*.zip -d ~/Downloads/mrk-web-unzipped
```

```bash
mkdir -p ~/.claude/skills && cp -R ~/Downloads/mrk-web-unzipped/*/skills/mrk-web ~/.claude/skills/
```

**Windows:** unzip the download, open it until you see a `skills` folder, and copy the `mrk-web` folder inside
it into `C:\Users\<your name>\.claude\skills\`. Create the `skills` folder if it is not there.

Restart Claude Code afterwards.

### From GitHub

For people who have been given access to the repo. Inside Claude Code, type:

```
/plugin marketplace add mrkdevelopment/mrk-web
/plugin install mrk-web@mrk-web
```

Claude Code uses your computer's GitHub sign-in to reach the repo. If it cannot, run `gh auth login` and then
`gh auth setup-git` in a terminal and try again.

### Updating and removing

| Installed from | Update | Remove |
|---|---|---|
| The zip | Download the new zip and paste the same sentence again | Delete the `mrk-web` folder from your Claude skills folder |
| GitHub | `claude plugin update mrk-web@mrk-web` in a terminal | `claude plugin uninstall mrk-web@mrk-web` |

Your site folders are never touched by an update: each site's progress lives in that site's own `_mrk` folder.

## Use it

1. Make a new, empty folder for the new site and open Claude Code in it.
2. Use the strongest model you have.
3. Say **start**. If you have an email or message from a client describing what they want, paste it in
   after the word start. It reads that first and only asks what the message leaves out.

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

## What is in the package

```
skills/mrk-web/
  SKILL.md        the steps and the rules, kept short
  references/     one guide per step, read only when that step starts
  scripts/        crawl, speed test, site scan, redirect check, version bump, setup check
  templates/      starter files: forms, consent, crawler files, headers, legal drafts, site README
.claude-plugin/   lets Claude Code install the repo as a plugin
```

## Works best with

MRK-Web runs on its own, and does better with these installed. Step 1 checks for them and offers to install
what is missing: `design-taste-frontend`, `impeccable`, `refactoring-ui`, `ui-ux-pro-max`, `emil-design-eng`,
`modern-web-guidance`, `web-design-guidelines`, `ponytail`, `no-ai-slop`, and the `claude-seo` skills.

## Versions

[CHANGELOG.md](CHANGELOG.md) lists what changed. Coming next: cPanel hosting in 1.1, then headless WordPress
and EmDash CMS in 2.0.

## Licence

Copyright (C) 2026 MRK Development Pty Ltd.

**The skill is GPL, version 2 or later.** MRK-Web is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, either
version 2 of the License, or (at your option) any later version. It is distributed in the hope that it will
be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. The full text is in [LICENSE](LICENSE).

**The starter templates are MIT.** Everything in `skills/mrk-web/templates/` is copied into the websites you
build, so it carries the permissive [MIT licence](skills/mrk-web/templates/LICENSE) instead. The sites you
build with MRK-Web are yours, under whatever terms you choose.

The other skills MRK-Web can install for you belong to their own authors and keep their own licences.
