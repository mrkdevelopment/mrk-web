# Step 6: Five directions, then a design system ✋

**Purpose.** The owner chooses how their business looks, from real options, before a full site is built.
Then one written system keeps every page consistent with that choice.

## Last call for materials

Before drafting, look at `resources/brand/` and `resources/inspiration/`. If both are empty, ask once: "Before
I draft the designs, is there a logo file, brand colours, or a site you like that I should see?" Designing
blind and redoing it costs far more than a minute's wait. Then carry on with whatever you have.

## Five directions

Draft five genuinely different directions. Different ideas, not five tints of one.

Each direction is:

- **One sentence** that names the idea ("the workshop: honest materials, big photos of the work, type like a
  job sheet").
- A typeface choice, a way of using the brand colour, a layout approach, and an approach to pictures.
- **The first screen and one more section** of the home page, built as a plain HTML file using the real logo,
  real facts and real photos from the brand kit. Phone and desktop.

Rules for the set:

- Every direction obeys `04-taste.md` and uses only real material (rule 1).
- **All five use the client's brand kit as given.** Whatever is marked "Client" in `_mrk/brand-kit.md` is
  fixed across the set. With a full brand kit, the directions differ in layout, rhythm, imagery and how the
  brand colour is used, not in typeface or palette.
- **With client inspiration, at least two directions follow it closely**, and each says which sites or
  screenshots it draws on. This is what gets the design right first time.
- **Keep at least one that goes somewhere else.** What someone likes on another site and what suits their
  business are sometimes different, and they can only tell by seeing both.
- Nothing from their "avoid" list appears in any direction.
- Without inspiration: at least one quiet and conservative, at least one that takes a real risk.
- All five keep the brand recognisable. A rebrand is a different job; if the brand kit is too thin to
  design from, tell the owner what is missing.
- Anything in the brand kit marked "Chosen by you" is a proposal. Point it out on the index page so they
  can approve or change it with the pick.

Save them in `_mrk/directions/` with an `index.html` that shows all five side by side and links to each.

## The pick ✋

Show the owner the index page. Ask which they would be proud to send a customer to, and what they would
change. They can pick one, or combine parts of two. Do not build past this point without their answer.

Record the pick and their comments in `_mrk/state.json`.

## The design system

Write `DESIGN.md` in the site's root (design skills look for it there), from the chosen direction:

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
