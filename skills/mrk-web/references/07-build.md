# Step 7: Build

**Purpose.** Turn the facts, the design system and the references into a static site that people act on.

## The stack

- **Astro, static output.** Every page is plain HTML built ahead of time. No server, no adapter.
- Check current Astro docs before scaffolding (the Astro docs connector, or the web): versions move fast and
  remembered commands go stale. `modern-web-guidance`, if installed, does the same job for HTML and CSS.
- **Content lives in content collections** (markdown files with typed fields), one collection per page type
  that repeats: services, articles, case studies, locations. The owner can edit a text file, and a content
  system can replace the files later without touching the design.
- **Styling** is whatever the design system chose: plain CSS with custom properties, or Tailwind 4.
- **Starter files**: `$SKILL/templates/README.md` lists them. Copy `SeoHead.astro` and `site.ts` now.

## Build order

1. **Shell first**: layout, navigation, footer, design tokens, the head tags.
2. **One template per page type**, with real content, finished properly on phone and desktop. Do these on the
   strongest model: every other page inherits their quality.
3. **Then fill the rest** from the site map, a page type at a time. With templates done this is careful
   copying of content into structure, and suits a mid-sized model in batches.
4. **Keep every old address** the site map marked "keep", exactly, including its trailing slash.

`single` mode: one page with a section per topic and a menu that jumps between them. `homepage` mode: the
home page and the pages its main buttons need (usually contact).

## What each page type needs

Guidance to design from, not a fixed order. The references and the business decide the shape.

| Page | Must have |
|---|---|
| **Home** | What, for whom and where, plus the main action, in the first screen. Proof within two screens. A way into each service. How it works, shown. Named results or reviews. Real FAQs. The main action again at the end. |
| **Service** | The outcome as the heading. Who it is for. What is included. Proof for *this* service. The process. Price or "from" price if public. FAQs for this service. The enquiry form. |
| **About** | Real people, real photos, how it started, what they are qualified to do. |
| **Contact** | The form is the page. Phone, hours, address, a map that loads on tap, and what happens after they send. |
| **Article** | Comfortable reading width, author, date, and a next step that fits the topic. |
| **Location** | Only where there is something real and specific to say about that place. |

### When the site sells online

Only if the brief says so (`sells`). The site shows the products and sends buyers to the checkout the
business already has. There is no cart and no payment code in the site.

- A product page, or one clear section per product: what it is, the price, the options (sizes, packs).
- One "Buy" button per option, each going to that exact product and option at the checkout. The addresses
  are in `_mrk/functions.md`. A button with no known address gets a visible `TODO`, never a guessed link.
- Buying is the page's main action, so it is in the first screen and repeated.
- Test every buy button by hand before review: right product, right size, right price at the other end.
- For a regulated product, ask the owner now what their licence or regulator requires on the site (an age
  check, a licence number, a warning line) and build exactly that. Do not guess the law. In fast, do not
  ask: add it to `_mrk/owner-todo.md` and leave a visible `TODO` where it will go.

Across every page type:

- **Every page the client listed is there.** The brief's `mustHavePages` are requirements, under the names
  the client used unless they agree to a change.
- **Build the patterns the client asked for** (the list at the end of `_mrk/references.md`), on the pages
  they belong to, in the design system's own style.
- **Their photos first.** Use what is in `resources/photos/`, then the old site's own pictures, stock
  included. No empty picture slots and no "photo here" boxes: use a picture, or design
  the section without one.
- **Their videos** from `resources/links.md` go where they help, each behind a poster image.
- **Only publish what is meant to be public.** A document becomes a download only if the owner said so.
  Copy that file into the site; never link to or expose the `resources/` folder itself.
- One main action per page, and no page ends in a dead end.
- Proof is real and named (rule 1). If a section needs proof the business lacks, cut it and add the gap to
  `_mrk/owner-todo.md`.
- Show before telling: photos of the work, diagrams, real logos, the product in use.
- Copy is written from `_mrk/facts.md`, in the voice recorded in the brand kit.
- `house-style.md` adds MRK's defaults (form before links out, two-column FAQs and others).

## Build it light

Each of these was learned the hard way on a real rebuild.

- **Ship HTML, not an app.** Wrapping pages in a JavaScript framework cost about 100 KB a page. Use Astro
  components that render to HTML, one small script for the menu and forms, and the browser's own
  `<details>`, `popover` and `<dialog>` for things that open and close. Add a framework component only for a
  widget that truly needs it, loaded when scrolled to.
- **Images through Astro's image tools**: several widths, modern formats, width and height always set. The
  first image on a page is sized for a phone, loaded eagerly with high priority; everything below is lazy.
- **Copy every image into the repo.** The old host will be switched off. Nothing may load from it.
- **Fonts are self-hosted.** Preload only the one that draws the first heading.
- **Video sits behind a poster image** and loads on tap. So do maps, booking widgets and chat.
- **Spam protection loads when the form is first touched**, not with the page.

## Sitemap

Add the `crawler-files` integration from the templates now (the wiring is in `$SKILL/templates/README.md`).
After every build it writes `sitemap.xml` from the pages that were actually built, leaving out anything
marked `noindex`, anything whose canonical link points elsewhere, and paginated lists. Step 10 covers the
other crawler files.

## Check as you go

```bash
npm run build
node "$SKILL/scripts/check-site.mjs" dist
```

Fix every error it reports. Then run the site locally and open it for the owner, inside the app if you can
(a preview or browser pane), otherwise in their web browser. One line is enough: "Your site is open on the
right. I am carrying on with the checks." This is a look, not a stop.

## Skills

`design-taste-frontend`, `refactoring-ui` and `web-design-guidelines` while building; `emil-design-eng` for
anything that moves.

**Done when:** every page in the site map is built, `npm run build` passes, and the site check reports no
errors.
