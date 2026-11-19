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

Pick one. Each is a single line. You need [Claude Code](https://claude.com/claude-code) and nothing else.

### For one website

The skill lives inside that site's folder and nowhere else on your computer. Best if you are building a
single site.

Put the zip in the site's folder, open Claude Code in that folder, and say:

```text
You will find the MRK-Web zip inside this project folder. Install it for this project.
```

### For every project on this computer

Best if you build sites often. Put the zip in any folder, open Claude Code there, and say:

```text
You will find the MRK-Web zip inside this folder. Install it for all my projects.
```

### With access to the GitHub repo

No zip needed. In a terminal:

| To install for | Run |
|---|---|
| One website (run it in the site's folder) | `npx skills add mrkdevelopment/mrk-web` |
| Every project | `npx skills add mrkdevelopment/mrk-web -g` |

### Uninstall

| Installed for | Say to Claude | Or run |
|---|---|---|
| One website | "Remove the MRK-Web skill from this project." | `npx skills remove mrk-web` |
| Every project | "Remove the MRK-Web skill from all my projects." | `npx skills remove mrk-web -g` |

Removing the skill never removes a website. The site's own files, and its progress in `_mrk`, stay where
they are.

To update, install the newer version the same way. It replaces the old copy.

### What installing does

For anyone doing it by hand, and for Claude when asked to install from the zip:

1. Unzip. Inside is a folder named `skills/mrk-web`. That folder is the whole skill.
2. Copy it to one of these, replacing any older copy:
   - one website: `.claude/skills/mrk-web` inside the site's folder;
   - every project: `.claude/skills/mrk-web` inside your home folder (`~/.claude/skills/mrk-web` on Mac
     and Linux, `C:\Users\<you>\.claude\skills\mrk-web` on Windows).
3. Run the setup check, `scripts/setup-check.sh` in the copied folder, and show the result. Offer to install
   anything missing, asking before each one.
4. The zip and the unzipped copy can be deleted.

To uninstall by hand, delete that `mrk-web` folder (and `.agents/skills/mrk-web` beside it, if the terminal
command was used).

If the person says "start" straight after installing and the skill is not recognised yet, read `SKILL.md` in
the copied folder and follow it, or restart Claude Code in that folder.

## Use it

1. Open Claude Code in the site's folder. A new, empty folder for a new site.
2. Use the strongest model you have.
3. Type `/mrk-web start`. If you have an email or message from a client describing what they want, paste
   it in after that. It reads the message first and only asks what it leaves out.

It asks four quick questions, then shows a table of every tool, skill and connector it uses: what each is
for, what it costs, and whether you have it. Then it begins. After that, plain words work: say **continue** in
the same folder to pick up later, **status** to see where you are, **tools** to see that table again, or
**help** for the step list.

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

## What it costs to run

MRK-Web sets up the free things first and never needs a paid tool.

| | What | Cost |
|---|---|---|
| Set up first | Other free skills it works with: `design-taste-frontend`, `impeccable`, `refactoring-ui`, `ui-ux-pro-max`, `emil-design-eng`, `modern-web-guidance`, `web-design-guidelines`, `ponytail`, `no-ai-slop`, the `claude-seo` skills, and the Astro docs connector | Free. No account, no key. |
| When you reach them | A GitHub account and a Cloudflare account | Free. Sign in with your browser. |
| Optional | A contact form that sends email, a spam check, a link to your CRM | Mostly free, but each needs an API key. The skill walks you through them, and your site can launch without any. |
| Optional, paid | Mobbin (design references) and Higgsfield (generated images) | Paid. Never needed. |

Step 1 checks what you have and offers to install the free set in one go.

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
