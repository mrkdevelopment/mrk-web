# {{BUSINESS_NAME}} website

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)
[![Production](https://img.shields.io/badge/production-{{PRODUCTION_VERSION}}-green)]({{SITE_URL}})
[![Astro](https://img.shields.io/badge/Astro-{{ASTRO_MAJOR}}-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Node](https://img.shields.io/badge/node-%E2%89%A5{{NODE_MIN}}-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Hosted on Cloudflare Pages](https://img.shields.io/badge/hosted_on-Cloudflare_Pages-F38020?logo=cloudflarepages&logoColor=white)](https://pages.cloudflare.com)

The source for [{{SITE_DOMAIN}}]({{SITE_URL}}): a static website built with [Astro](https://astro.build) and hosted on Cloudflare Pages. Every page is plain HTML made at build time; the only code that runs on a server is the contact form (`functions/api/contact.ts`).

**Version 1.0.0** is the current version. **Production is {{PRODUCTION_VERSION}}** (see the [changelog](CHANGELOG.md)).

## Running it on your computer

Needs Node {{NODE_MIN}} or later.

```bash
npm install
npm run dev        # http://localhost:4321, updates as you edit
```

| Command | What it does |
|---|---|
| `npm run dev` | Local preview while editing |
| `npm run build` | Builds the site into `dist/`, including sitemap.xml, llms.txt and robots.txt |
| `npm run preview` | Serves the built `dist/` |
| `npm test` | Tests for the contact form (`node --test functions/api/contact.test.ts`) |
| `npx wrangler pages dev dist` | Runs the built site with the contact form, using `.dev.vars` |

## Where things are

| Path | What it is |
|---|---|
| `src/data/site.ts` | Business name, contact details, address, social links. Change facts here once. |
| `src/pages/` | One file per page |
| `src/components/SeoHead.astro` | Page titles, descriptions, share previews and structured data |
| `src/components/ContactForm.astro` | The enquiry form |
| `functions/api/contact.ts` | Sends enquiries by email |
| `public/_headers`, `public/_redirects` | Security headers and old-URL redirects on Cloudflare |

## Settings (environment variables)

Set in Cloudflare: the Pages project > Settings > Variables and Secrets, for **both** Production and Preview. Locally, build settings go in `.env` and contact form settings in `.dev.vars` (copy the `.example` files). Neither file is committed.

| Name | When | Required | What it does |
|---|---|---|---|
| `NODE_VERSION` | build | yes | Node version Cloudflare builds with |
| `SITE_URL` | build | no | Overrides the site address, e.g. for a staging copy |
| `PUBLIC_TURNSTILE_SITE_KEY` | build | no | Turns on the Turnstile spam check in the form |
| `PUBLIC_GA_ID` / `PUBLIC_GTM_ID` | build | no | Google Analytics or Tag Manager, loaded only after cookie consent |
| `EMAIL_PROVIDER` | runtime | yes | `mailgun`, `sendgrid` or `cloudflare` |
| `CONTACT_TO` | runtime | yes | Inbox that receives enquiries |
| `CONTACT_FROM` | runtime | yes | Sender address on a verified domain |
| `CONTACT_FALLBACK_EMAIL` | runtime | no | Address shown to visitors if sending fails |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_REGION` | runtime | for Mailgun | Secret key, sending domain, `eu` for the EU region |
| `SENDGRID_API_KEY`, `SENDGRID_REGION` | runtime | for SendGrid | Secret key, `eu` for an EU subuser |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN` | runtime | for Cloudflare | Account and secret token for Email Service |
| `TURNSTILE_SECRET_KEY` | runtime | with the site key | Secret half of Turnstile |
| `FORM_WEBHOOK_URL`, `FORM_WEBHOOK_<FORM>` | runtime | no | Also send each enquiry to a CRM or automation tool |

Mark every key, token and webhook URL as a **Secret** in Cloudflare.

## Deploying

- Every branch pushed to GitHub gets its own preview address on Cloudflare (`<branch>.{{PAGES_PROJECT}}.pages.dev`). Check it there before merging.
- Merging into `main` publishes {{SITE_DOMAIN}}.
- **To roll back:** in Cloudflare, open the Pages project > Deployments, pick the last good deployment and choose **Rollback to this deployment**. It takes effect in seconds. Then revert the bad change in GitHub so the next deploy doesn't bring it back.

## Versions

The site uses [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

| Bump | When | Example |
|---|---|---|
| **MAJOR** (2.0.0) | A redesign, or a change that breaks existing URLs or hosting | New page structure across the site |
| **MINOR** (1.1.0) | New pages, sections or features | Adding a services page |
| **PATCH** (1.0.1) | Fixes, wording and small styling changes | Fixing a typo or a mobile layout |

### Releasing a version

1. The repo starts on `main`. Each version gets its own branch off `main`, named after the version. The first is `1.0.0`, where the changelog begins; the next might be `1.1.0`.
2. As you work, add each change under **## Unreleased** at the top of `CHANGELOG.md`.
3. When it's ready, rename **Unreleased** to the version and today's date (`## 1.1.0 - 2026-01-31`), and add a new empty **## Unreleased** above it.
4. Set the same number in `package.json` (`"version"`), the "Version" line and the version badge at the top of this file.
5. Run `npm test && npm run build` and fix anything that fails. Check the branch preview on a phone.
6. Merge the branch into `main`, then tag the merge and push the tag:
   ```bash
   git tag -a v1.1.0 -m "v1.1.0"
   git push origin v1.1.0
   ```
7. Once it is live, update the "Production" line and the production badge.
