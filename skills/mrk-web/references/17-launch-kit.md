# Step 17: Launch kit

**Purpose.** The four things a site needs on day one that are easy to forget until someone complains:
visitor statistics, a cookie banner, the legal pages, and good previews when a link is shared.

## 1. Analytics, behind a cookie banner

Ask: do they use Google Analytics 4 or Google Tag Manager? If so, the ID (it is not a secret). If they use
neither, offer to set up Analytics, or leave it out. A site with no tracking needs no banner.

Copy the consent component and script from `$SKILL/templates/`. They are built so that:

- the banner and Google's code exist only when an ID is set;
- **nothing loads from Google before the visitor accepts**;
- declining removes any analytics cookies already present;
- the choice is remembered, and a "Cookie settings" link in the footer reopens it;
- on a phone the banner is a slim bar that cannot cover the main button. Check this on the preview: on a
  real rebuild the banner hid the hero's call to action.

Set the ID as a variable in Cloudflare for both Production and Preview.

## 2. Privacy policy and website terms

Start from the drafts in `$SKILL/templates/legal/`. Fill them from what the site really does: which form
fields are collected and where they go, whether analytics runs, the spam protection, the email service, the
hosting. Ask the owner for the legal business name, registration number, contact for privacy questions, and
the country and state whose law applies.

- Say only what is true of this site. Do not paste in clauses for things it does not do.
- These are **drafts** (rule 8). Tell the owner plainly that you are not a lawyer, that the pages need their
  review, and that a business handling sensitive information (health, finance, children) should have a
  lawyer read them.
- Link both from the footer of every page. Keep them out of the main menu.
- They must approve the legal pages before step 19. Record it in `_mrk/review.md`.

## 3. Social previews

When someone shares a link, the preview is the ad.

- Every page: its own title, description and preview image (1200 x 630). One designed image per template is
  enough; the home page deserves its own.
- The structured data lists the business's real social profiles (`sameAs`), and the footer links to them.
- A sharp favicon and phone home-screen icon made from the logo.
- Check by pasting the preview address into the platforms' own preview tools (LinkedIn's Post Inspector,
  Facebook's Sharing Debugger) or simply into a private message.

## 4. Re-check speed

Analytics and the banner are the usual cause of lost points. Run the speed test on the preview again. If
scores dropped, make sure nothing from Google loads before consent, and that the banner's own code is tiny.

## Models

Legal drafts and tag set-up suit a mid-sized model working from the templates. The check that the legal pages
match what the site actually does is worth a careful second read.

**Done when:** all four are on the preview, the owner has seen the legal drafts, and speed still holds.
