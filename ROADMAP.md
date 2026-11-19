# Roadmap

## Before sharing 1.0 with anyone

These have not been done yet. Tick them off first.

- [ ] Run the whole skill once on a real site, start to finish, and fix what trips.
- [ ] Install as a plugin on a second computer from the private repo (`/plugin marketplace add`), to confirm
      the one-repo plugin layout and the sign-in instructions in the README.
- [x] `/mrk-web status`, `/mrk-web:mrk-web status` and a bare "start" all trigger the skill when loaded with
      `claude --plugin-dir` (checked 19 Nov 2026). Still to confirm after a real marketplace install.
- [ ] Send one real enquiry through each email service (Mailgun, SendGrid, Cloudflare) with live spam
      protection. So far only the stubbed tests have run.
- [ ] Run `speed.mjs --psi` with a PageSpeed API key. Without a key Google refused the request, so a
      successful run is untested.
- [ ] Crawl one live WordPress, one Wix and one Squarespace site. The crawl has only been run on an Astro site.
- [ ] Add the help video links to `skills/mrk-web/references/videos.md` as they are recorded.
- [ ] Re-check the install commands in `references/01-setup.md` against each project's own page.
- [x] Licence: GPL version 2 or later for the skill, MIT for the templates (19 Nov 2026).
- [ ] Decide how it is sold and delivered: the repo is private; buyers would get the zip.
- [ ] Try the paste-to-install sentence from the README on a clean Mac and a clean Windows computer.
- [ ] Have an IP lawyer look over the licence set-up before the first sale.
- [ ] Retire the older `mrk-wp-static`, `mrk-wp-rebuild` and `mrk-wp-headless` skills so they stop competing
      for the same requests.

## 1.1

- **cPanel hosting**: a PHP mail handler in place of the Cloudflare function, `.htaccess` for redirects,
  headers and caching, upload by SFTP or cPanel Git, and the same 98 gate run against the cPanel address.
- **Gemini and Codex**: run the skill in each, note what they ignore, and adjust the guides so the same files
  work in all three. Image generation in step 8 through each tool's own features.
- An evaluation set, so changes to the guides can be checked against saved example sites.
- Anything the first real builds show is missing or too strict.

## 2.0

- **Headless WordPress**: the owner keeps editing in WordPress, and the site is still built as static pages.
  Includes pulling content at build time, copying images into the repo, and getting builds past WordPress
  firewalls.
- **EmDash CMS** as a second content option.
- Rebuilding the site automatically when content changes.

## Ideas, not yet planned

- Online shops.
- Sites in more than one language.
- A scheduled monthly health check that re-runs the scorecard and speed test.
