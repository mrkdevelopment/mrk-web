# Step 6: Five directions, then a design system ✋

**Purpose.** The owner chooses how their business looks, from real options, before a full site is built.
Then one written system keeps every page consistent with that choice.

## Last call for materials (agency pace only)

In fast, skip this and design from what you have. At agency pace, before drafting, look at `resources/brand/` and `resources/inspiration/`. If both are empty, ask once: "Before
I draft the designs, is there a logo file, brand colours, or a site you like that I should see?" Designing
blind and redoing it costs far more than a minute's wait. Then carry on with whatever you have.

## Five directions

Draft five genuinely different directions. Different ideas, not five tints of one.

**These are sketches of the top of the home page, and nothing more.** The site is built once, in step 7,
after the owner has chosen. Anything built now for the four designs they do not pick is thrown away.

Each direction is **one small HTML file**:

- **Fast:** the home page's first screen only.
- **Agency:** the home page's first screen and one more section.
- Phone and desktop come from the same file (it is responsive). Do not make separate files for each.
- Real logo, real facts and real photos from the brand kit.
- A name of a few words and **one sentence** that says the idea ("the workshop: honest materials, big
  photos of the work, type like a job sheet").

**Never at this stage:**

- Any page other than the home page. No about, services, contact or product pages.
- The whole home page. One screen, or one screen and a section.
- A style guide, a component library, sample pages for each page type, or a design system. The design
  system is written once, after the pick, for the chosen direction only.
- An Astro project, a build step, or shared code between the five. Plain HTML with its own CSS in the file.

If a direction is running past about 200 lines, it is doing too much: stop and cut it back. Draft the five in
parallel if you can; the owner is waiting to see something.

Rules for the set:

- Every direction obeys `04-taste.md` and uses only real material (rule 1).
- **All five use the client's brand kit as given.** Whatever is marked "Client" in `_mrk/brand-kit.md` is
  fixed across the set. With a full brand kit, the directions differ in layout, rhythm, imagery and how the
  brand colour is used, not in typeface or palette.
- **With client inspiration, at least two directions follow it closely**, and each says which sites or
  screenshots it draws on. Build them from each site's teardown: everything on its "borrow" list is
  available, nothing on its "leave" list is. This is what gets the design right first time.
- **No direction may pass for a competitor's site.** Where the inspiration is a rival in the same market,
  follow how it works, not how it looks.
- **Keep at least one that goes somewhere else.** What someone likes on another site and what suits their
  business are sometimes different, and they can only tell by seeing both.
- Nothing from their "avoid" list appears in any direction.
- Without inspiration: at least one quiet and conservative, at least one that takes a real risk.
- All five keep the brand recognisable. A rebrand is a different job; if the brand kit is too thin to
  design from, tell the owner what is missing.
- Anything in the brand kit marked "Chosen by you" is a proposal. Point it out on the index page so they
  can approve or change it with the pick.

## One page that shows all five

Save the five in `_mrk/directions/`, with an `index.html` made for someone who has never done this before:

- A heading at the top: "Five designs for <business>. Pick the one you would be proud to send a customer to."
- Each design under a **big number, 1 to 5**, with a name of a few words and one sentence saying the idea.
- The design itself, large, with its phone view beside or below it. A link opens it full size.
- No jargon, no file names, no notes to yourself.

## Show it to them, in the app ✋

This stop holds at either pace. It is the one design decision only the owner can make, and building the
wrong look wastes everything after it.

People get lost here when the designs are buried under text or left as a file to find. So:

**1. Open the page for them yourself.** Use the first of these you can do:

- Inside the app they are already in: a preview or browser pane beside the chat (serve the folder if the
  pane needs an address), or send the page so it displays.
- If you can show pictures in the chat, also show one picture of each design, numbered 1 to 5.
- Only if neither is possible: open it in their web browser (`open`, `start` or `xdg-open`).

Never just name the file and leave them to find it.

**2. Then say almost nothing.** Your whole message is this, in your own words:

> Your five designs are open on the right. Which one do you like? Reply with a number from 1 to 5.
> You can mix them too: "3, with the colours from 1".

Say where the designs really are ("on the right", "in your browser"). **Nothing else goes in that message:**
no recap of the earlier steps, no scores, no description of each design (the page has it), no file paths, no
list of what comes next. If something from the brand kit is your own proposal, it is flagged on the page, not
in the chat.

If you have a way to show buttons that send a reply, add one per design. Do not use a choice dialog for
this: it holds four answers and there are five designs.

**3. Wait.** Do not build past this point without their answer. If they ask for changes, change the designs,
show the page again, and ask again in the same short way.

Record the pick and their comments in `_mrk/state.json`.

## The design system

After the pick, and only for the chosen direction. It is a written document plus the tokens in CSS. **Do not
build a style-guide page, sample pages or a component gallery to go with it.** The first real page is the
home page in step 7.

Write `DESIGN.md` in the site's root (design skills look for it there):

- **Colour roles**, not just swatches: page background, surface, text, muted text, brand, brand on dark,
  border, focus ring. Each text and background pair with its contrast ratio. All pass WCAG AA.
- **Type**: families, the size scale (as few steps as will do), weights, line heights, and where each is used.
- **Space**: one spacing scale and the section rhythm.
- **Shape**: one radius scale, one or two shadows, border weight.
- **Motion**: durations, easing, and the short list of things allowed to move.
- **Components**: button (primary, secondary, states), link, form field, card, navigation, footer. For each:
  what it is for, and when not to use it.
- **Page-type notes**: what each page type must contain, from `07-build.md`.

Put the tokens into the site's CSS as custom properties (or Tailwind 4's `@theme`), so the document and the
code cannot drift apart.

## Tools

`design-system`, `impeccable` and `ui-ux-pro-max` help write the system if installed. If Claude Design
(Artifacts with a design system type) is available, the directions can be shown there instead of local files.

## Model

All of this step belongs on the strongest model available. It is the one place where a cheaper model costs
the most.

**Done when:** the owner's pick is recorded and `DESIGN.md` exists with tokens in the CSS.
