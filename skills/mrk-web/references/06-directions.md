# Step 6: Five directions, then a design system ✋

**Purpose.** The owner chooses how their business looks, from real options, before a full site is built.
Then one written system keeps every page consistent with that choice.

## Last call for materials (agency pace only)

In fast, skip this and design from what you have. At agency pace, before drafting, look at `resources/brand/` and `resources/inspiration/`. If both are empty, ask once: "Before
I draft the designs, is there a logo file, brand colours, or a site you like that I should see?" Designing
blind and redoing it costs far more than a minute's wait. Then carry on with whatever you have.

## Before you draft

- Read `04-taste.md` again, the part headed "What to do instead".
- Put the design skills to work, as that guide says. With `design-taste-frontend` installed, have it deal
  directions for this business and build from those.
- Have the pictures ready: the three to six strongest from `_mrk/brand/photos/` and `resources/photos/`.
- Use the strongest model you have for this step. If the session is on a small one, say so once in a line
  ("These designs will be better on a stronger model: `/model`") and carry on.

### Lay the foundations first

Five drafts made from nothing each look half-finished. Five drafts that share one set of foundations all
look finished, and still differ where it matters. Before drafting, write `_mrk/directions/tokens.css`:

- **Colour roles** from the brand: the brand colour, a deeper shade, a soft tint, a dark ground, a light
  ground tinted slightly toward the brand, ink for text, a muted text colour, a hairline colour. Check the
  text pairs for contrast now.
- **A type scale**: seven or eight sizes, from small labels to a very large heading.
- **A spacing scale**, two or three corner radii, one shadow.
- **One icon set**: line icons, one stroke width, drawn inline so nothing has to load. Pick the icons the
  facts call for (phone, map pin, clock, the services) once, and reuse them.
- **A face for figures**: phone numbers, times, prices and codes are set in a fixed-width or tabular face,
  so they line up and read as data.

Every draft links this file. Each one then sets its own ground, its own type families and its own picture
treatment on top.

## Five directions

Draft five genuinely different directions. Different ideas, not five tints of one.

**A direction is a visual idea, not a layout variation.** Each one has:

- **A ground.** What the page sits on: a dark field, the brand colour edge to edge, a photo across the
  screen, warm paper. **At least three of the five are not a white page.**
- **A type voice.** A typeface and a scale chosen for this business, with a heading big enough to be felt.
  Not the same family in all five.
- **A way with pictures.** The business's pictures, used large and treated to belong: cropped with intent,
  toned toward the brand colour, set in a firm shape.
- **A name and one sentence** that says the idea in words the owner would use ("the workshop: black like a
  shed floor, hi-vis yellow, type you can read from across the yard").

A white page with a headline, a paragraph and a button is a wireframe, not a direction. Do not show one.

**How much to build.** The top of the home page: the first screen and one more section, at either pace. One
HTML file per direction, responsive.

### What every draft contains

A draft with a big heading, a paragraph, a button and a photo is a poster. It says nothing about the
business. Each of the five has all of these, made from `_mrk/facts.md`:

**In the first screen**

1. **A heading that names the outcome** the customer wants, in their words, in eight words or fewer. Under
   it, one sentence: who it is for, where, and how.
2. **Two actions, side by side.** The main one says what happens ("Book a free consultation"). If the
   business takes calls, the phone number is a second button with a phone icon, never small text.
3. **A working panel.** Something you design from the facts that shows the service actually happening. It
   sits where a stock photo would. For example:
   - a day or a visit laid out as a timeline, with real services at real times;
   - a small picker ("What would help?") with the real services as choices;
   - a job sheet, a quote, a booking card, a price or menu card;
   - opening hours with "open now", or the areas served.

   Real details only. It should look usable, not decorative. A strong real photo can sit behind or beside
   it, but does not replace it.
4. **Three proof points in a row**, each with an icon: where they are, what is free, what they are
   registered or qualified as. Facts only. One that still needs the owner's word gets a small "to confirm"
   note beside it, never an invented claim.

**In the second section**, one of these, properly built:

- the services as a list: an icon, the name, a line of real detail, and any real code or price;
- the process as three or four steps joined by a line, each with an icon and a sentence;
- real results or reviews as cards, if the business has them.

**Use the facts.** Each draft shows at least six real facts about this business. If you could swap in a
competitor's name and nothing would look wrong, it is not done.

### Finish the details

These are what make a draft look designed and not typed:

- An icon on every item someone would scan: steps, services, proof points, actions.
- Figures in the figure face: phone numbers, times, codes, prices.
- Hairlines between list rows, in place of boxes around everything.
- Small labels and chips for categories. An arrow on the main action.
- States where they would exist: a chosen option, a current step.
- Corners, spacing and sizes taken from the foundations, never invented per draft.

**Pictures.** Every picture slot holds a real picture from the brand kit. **Never an empty box or "your
photo here".** If there is truly nothing usable for a slot, design that
direction without the slot. Copy the pictures you use into `_mrk/directions/assets/` so the page finds them.

**Never at this stage** (this is what keeps the cost down):

- Any page other than the home page. No about, services, contact or product pages.
- The whole home page.
- A style guide, a component library or sample pages. The design system is written once, after the pick,
  for the chosen direction only.
- An Astro project, a build step, or shared code between the five.

Draft the five in parallel if you can. Each helper needs the whole picture: the facts, the brand kit, the
pictures, the taste rules and this guide. A helper given only a one-line idea returns a generic page.

Rules for the set:

- Every direction obeys `04-taste.md` and uses only real material (rule 1).
- **What the client supplied is fixed.** Anything marked "Client" in `_mrk/brand-kit.md` is the same across
  the set. With a full client brand kit, the directions differ in ground, layout, imagery and how the brand
  colour is used, not in typeface or palette.
- **What was only sampled from the old site is a starting point.** A colour lifted from an old logo or a
  theme can be used boldly, given a ground colour to sit on, or replaced with a stronger proposal. Say which
  on the page, in a few words.
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

## Check your own work before anyone sees it

Take a screenshot of every draft at 1440px and at 390px, and look at each one the way the owner will. Redraw
any draft that:

- has no working panel in the first screen, or an unstructured second section;
- shows fewer than six real facts, or could be for any business in any town;
- has an empty, broken or missing picture;
- is mostly white with small type;
- has anything cut off or running off the side: measure the page width at both sizes, it must equal the
  screen width, and no heading or number may be clipped;
- has bare text where an icon, a figure face or a hairline should be;
- looks like one of the other four;
- falls apart on the phone.

With `impeccable` or the Taste inspector installed, run their critique as well. Two rounds at most. Then put
each draft beside the reference it drew on and ask one question: does it hold up next to it? Redraw the
weakest rather than show it.

## One page that shows all five

Save the five in `_mrk/directions/`, with an `index.html` made for someone who has never done this before:

- A heading at the top: "Five designs for <business>. Pick the one you would be proud to send a customer to."
- Each design under a **big number, 1 to 5**, with a name of a few words and one sentence saying the idea.
- The design itself, large, with its phone view beside or below it. A link opens it full size.
- No jargon, no file names, no notes to yourself, and no block of caveats. If stock pictures are standing
  in, one short line under the heading says so: "Photos are from your current site. Send better ones any
  time."

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

`impeccable` helps write the system if installed. If Claude Design
(Artifacts with a design system type) is available, the directions can be shown there instead of local files.

## Model

All of this step belongs on the strongest model available. It is the one place where a cheaper model costs
the most.

**Done when:** the owner's pick is recorded and `DESIGN.md` exists with tokens in the CSS.
