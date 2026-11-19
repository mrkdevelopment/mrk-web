# Step 19: Go live ✋

**Purpose.** Move the real domain to the new site without losing email, search traffic or enquiries. This is
the only step that touches anything live, so it is slow and deliberate.

## Before asking for the go-ahead

All of these must be true. Show the owner the list.

- [ ] Review approved (step 16), including the legal pages (step 17).
- [ ] Checks clean and the 98 gate passed (step 18).
- [ ] Redirects written and tested on the preview.
- [ ] Contact works on the preview: a test enquiry arrived from every form, or the phone and email links work
      if the site launched without a form.
- [ ] Baseline saved (step 2): old addresses, traffic export, scores.
- [ ] The owner can sign in where the domain's DNS is managed.
- [ ] The old site and its hosting stay untouched and paid for at least two more weeks. That is the way back.

Then ask plainly: **"Ready to switch the domain to the new site?"** Proceed only on a clear yes (rule 2).
A good time is early in a quiet weekday, never a Friday afternoon.

## Switching

1. **Release.** Run `version.mjs` if needed, merge the `1.0.0` branch into `main`. Cloudflare builds
   production.
2. **Add the domain** in the Pages project, under Custom domains: both `example.com` and `www.example.com`,
   with one redirecting to the other.
3. **Point DNS.** Cloudflare shows the records needed.
   - If the domain's DNS is already on Cloudflare, it adds them for you.
   - If DNS stays with the registrar, the owner adds the records there.
   - **Moving the domain's nameservers to Cloudflare moves email too.** Before changing nameservers, check
     that every existing record was copied across, especially mail records (MX, SPF, DKIM, DMARC). Missing
     these stops the business's email. If unsure, do not move nameservers; add the records at the registrar
     instead.
4. **Wait for it to settle.** Usually minutes, sometimes hours. Do not change things again while waiting.

The owner does the sign-ins and clicks. Guide them one screen at a time, and have them read back what they
see before each change is saved.

## Verify, on the real domain

```bash
curl -sI https://<domain>/                       # 200, served by Cloudflare
curl -sI https://<domain>/<an old address>       # 301 to the new page, in one hop
curl -s  https://<domain>/robots.txt             # allows crawlers, lists the sitemap
curl -s  https://<domain>/sitemap.xml | head     # real-domain addresses
curl -A GPTBot -sI https://<domain>/             # 200, not 403
node "$SKILL/scripts/speed.mjs" https://<domain> --label live --gate 98
node "$SKILL/scripts/speed.mjs" https://<domain> --label live-psi --psi --urls /,<one page per template>
```

The last line uses Google's hosted test and needs a free PageSpeed API key (`keys.md`). It is optional: the
line above it runs the same engine locally and is the one the gate uses.

Also: send a real enquiry through each form, check a real page is **not** marked `noindex`, and open the site
on a phone using mobile data.

If something important is broken and cannot be fixed in minutes, go back: point DNS at the old site, or use
"Rollback to this deployment" in Cloudflare. Then fix without pressure.

## Tell the search engines

- Google Search Console: add the domain if it is not there, submit `sitemap.xml`.
- Bing Webmaster Tools: the same, optional but quick.

## Close out

- Tag the release (`v1.0.0`) and update the "production" badge in the README.
- Record the launch date in `_mrk/state.json` and the changelog. Later comparisons depend on it.

**Done when:** the domain serves the new site, every check above passes, and the launch is tagged.
