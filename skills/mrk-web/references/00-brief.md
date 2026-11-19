# Step 0: Brief ✋

**Purpose.** Get the handful of answers that change everything downstream. Nothing else yet: details are
asked at the step that needs them, when the owner can see why they matter.

## Ask now

Two short rounds, plain words, your recommendation first. Skip anything they already told you.

**Round 1**

1. **Is there a website now?** The address, or "no site yet".
2. **How much should be rebuilt?** (only if there is a site)
   - `all-pages`: every page, up to 100 (they can raise the cap). Best for search traffic. Recommended.
   - `homepage`: just the home page, as a first look.
   - `single`: the whole site condensed into one page.
3. **Whose site is it?** Their own business, or a client's (agency).
4. **What is the one thing a visitor should do?** Call, send an enquiry, book, buy, visit.

**Round 2**

5. **Domain.** Do they have one, where was it bought, and is the current site live on it?
6. **Likes and limits.** Anything they dislike about the current site, pages that must stay, a date they are
   working to. Sites they like can be named now or added to `resources/inspiration/` in step 1.

## Hosting

Version 1 launches on **Cloudflare Pages**: free for most small sites, fast, and it gives a preview address
before any domain is involved. If they have no domain yet, this is the only sensible choice.

If they must stay on cPanel hosting, say so plainly: that route arrives in MRK-Web 1.1. They can still build
now and review on the Cloudflare preview address.

## Ask later, not now

| Question | Asked at |
|---|---|
| Logo, brand kit, photos, documents, inspiration to bring | Step 1 |
| Search Console access for a traffic baseline | Step 2 |
| Budget for generated images | Step 8 |
| GitHub account | Step 14 |
| Where enquiries go, email service, spam protection, CRM | Step 15 |
| Analytics ID, legal details for privacy and terms | Step 17 |
| Access to the domain's DNS | Step 19 |

## Three paths

- **Rebuild** (a site exists): all twenty steps.
- **New business** (no site): step 2 becomes an interview plus whatever exists (Google Business Profile,
  social pages, brochures, price lists). Skip step 3, and step 13 scores the new site alone. No redirects.
- **Agency**: the same steps, but the client confirms facts and gives the approvals at steps 6, 16 and 19.
  Collect questions for the client in `_mrk/owner-todo.md` so they can be sent in one go.

## Write

`_mrk/brief.md`: the answers in plain sentences, readable by the owner.

`_mrk/state.json`:

```json
{
  "skill": "mrk-web",
  "skillVersion": "1.0.0",
  "brief": {
    "url": "https://www.example.com",
    "path": "rebuild",
    "mode": "all-pages",
    "maxPages": 100,
    "builtFor": "own-business",
    "goal": "enquiry form",
    "domain": { "name": "example.com", "registrar": "", "liveSiteOnIt": true },
    "hosting": "cloudflare-pages"
  },
  "step": 1,
  "steps": { "0": { "status": "done", "date": "2026-01-31", "note": "" } },
  "scores": {},
  "decisions": []
}
```

`decisions` is where you record any time you departed from a guide, and why.

## Before moving on

Tell them, in five lines or fewer: what happens next, roughly how long, and the five places you will stop for
them (setup installs, picking a design, paid images if any, their review, going live). Mention that step 1
will ask for anything they want to bring: logo, photos, brochures, sites they like. They can start gathering.

**Done when:** both files exist and the owner has confirmed the brief reads right.
