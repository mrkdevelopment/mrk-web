# Accounts, keys and what costs money

Everything in a build that needs a sign-up, a key or a payment, in one place. Read this before suggesting any
tool, and when a step reaches one of these.

## The order to offer things

1. **Free, no account.** Set these up first, without fuss.
2. **Free account, sign in with a browser.** Only when the step that needs it arrives.
3. **Needs an API key.** Always optional. Say what works without it, then offer help getting it.
4. **Paid.** Last, only if the owner asks or the free route has clearly fallen short, and never without
   saying it costs money.

An API key is the hardest thing in this build for most people. Never make one a condition of moving on. For
each key: say what it is for in one sentence, offer the route without it, and if they want it, walk them
through one screen at a time using the notes below. Offer the video from `videos.md` if there is one.

## Everything at a glance

| What | Used in | Cost | Sign-up | Key | Without it |
|---|---|---|---|---|---|
| Node, git, Chrome | Whole build | Free | None | No | Cannot build (required) |
| The four helper skills (design-taste-frontend, impeccable, ponytail, no-ai-slop) | Steps 6, 11, 12 | Free | None | No | The guides' own rules apply |
| Astro docs connector | Step 7 | Free | None | No | Look the docs up on the web |
| GitHub | Step 14 | Free | Account, browser sign-in | No | No history or backup; cannot use Cloudflare's automatic builds |
| Cloudflare Pages | Step 15 | Free for most small sites | Account, browser sign-in | No | No preview and no launch (required to go live in 1.0) |
| Google Analytics or Tag Manager | Step 17 | Free | Google account | No (an ID, which is not secret) | No visitor numbers, and no cookie banner needed |
| Google Search Console | Steps 2, 19 | Free | Google account | No | No traffic baseline; slower to notice lost pages |
| **Email service for forms** | Step 15 | Free tiers exist | Account | **Yes** | Contact page shows phone and an email link instead of a form |
| **Turnstile spam check** | Step 15 | Free | Cloudflare account | **Yes** (two) | The hidden trap field still stops simple bots |
| **CRM or automation webhook** | Step 15 | Depends on the tool | Their existing tool | **A secret address** | Enquiries arrive by email only |
| **PageSpeed API key** | Steps 18, 19 | Free | Google account | **Yes** | The local speed test is used instead (same engine) |
| Mobbin | Step 5 | **Paid** | Account | No | Free galleries and the client's own inspiration |
| Higgsfield | Step 8 | **Paid** | Account | No | Real photos, or drawn visuals |

## Rules for every key

- **Keys never go in the chat** (rule 4). The owner pastes them into Cloudflare, or into a local file that is
  never uploaded. If one lands in the chat, do not repeat it, and suggest they replace it.
- **One at a time.** Finish and test one before starting the next.
- **Screens change.** The notes below describe the shape of each job. Before walking someone through, open the
  provider's current help page and follow what it shows today. Ask the owner to tell you what they see.
- **Where a key goes:** Cloudflare, the Pages project, Settings, Variables and Secrets. Add it as a "Secret",
  for **both** Production and Preview. The names are in `$SKILL/templates/env/.dev.vars.example`.
- **Test straight away.** Send a real enquiry from the preview and confirm it arrives.

## Email service for forms

A form on a static site cannot send email by itself. A sending service does it. The owner needs **one**:

| Service | Good fit when | Hardest part |
|---|---|---|
| Cloudflare Email Service | The domain's DNS is already on Cloudflare | Creating an API token with the right permission |
| Mailgun | They already have an account, or want detailed logs | Proving they own the domain (adding DNS records) |
| SendGrid | They already have an account | The same, plus account approval can take time |

Every service asks the owner to prove they own the address emails are sent from. That means adding a few
records where the domain's DNS is managed. This is the step people get stuck on: do it with them, one record
at a time, and have them read each value back before saving.

What to collect, in the owner's own dashboard:

- **Mailgun:** an API key (account menu, API Security or API keys, create a new key), the sending domain
  they verified (often `mg.` followed by their domain), and whether the account is in the EU region.
  Help: help.mailgun.com
- **SendGrid:** an API key (Settings, API Keys, Create API Key) with only the "Mail Send" permission.
  Help: twilio.com/docs/sendgrid
- **Cloudflare Email Service:** the account ID (shown on the Cloudflare dashboard) and an API token allowed
  to send email (My Profile, API Tokens, Create Token). Help: developers.cloudflare.com/email-service

Then two settings that are not secret: the address enquiries go **to**, and the address they are sent
**from** (it must be on the verified domain).

**Without a key:** the contact page shows the phone number, a tappable email link, the address and hours. That
is a complete, honest contact page. The form can be added later without redesigning anything.

## Turnstile spam check

Cloudflare's free replacement for "click all the traffic lights". Optional: add it if spam becomes a problem,
or from the start for a busy site.

In the Cloudflare dashboard, open Turnstile, add a widget, and enter the site's domain (and the preview
address while testing). It gives two values:

- a **site key**, which is public and goes in the build settings;
- a **secret key**, which goes in as a Secret.

Help: developers.cloudflare.com/turnstile

**Without it:** the form still has a hidden field that catches simple bots.

## CRM or automation webhook

Optional. If the owner already uses a CRM or an automation tool, it can receive each enquiry as well as the
email. In that tool, look for "incoming webhook" or "catch hook", copy the address it gives, and add it as a
Secret. Treat the address like a password: anyone who has it can add entries.

**Without it:** enquiries arrive by email, which is enough for most small businesses.

## PageSpeed API key

Optional. Only needed to run Google's hosted PageSpeed test from the script (`speed.mjs --psi`). The local
speed test uses the same engine and needs nothing. If they want it: Google Cloud console, create a project,
enable "PageSpeed Insights API", create an API key. It goes in a local setting named `PSI_API_KEY`, never in
the site.

## The paid ones

- **Mobbin** (design references). Paid subscription. Suggest it only to someone who builds sites regularly.
  The free route is the client's own inspiration plus free galleries, and it is enough.
- **Higgsfield** (generated images and video). Paid plan, and each image also uses credits. Step 8 prices any
  job before a cent is spent. The free route, real photos or drawn visuals, is usually the better one.

Neither is ever needed to finish a build.
