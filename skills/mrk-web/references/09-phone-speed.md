# Step 9: Phone and speed pass

**Purpose.** Most visitors arrive on a phone, often on a slow connection. A site that looks right on your
screen can still be broken or slow on theirs.

## Look at every screen

For one page of each template, at 390px and 1440px:

- Full-length screenshots, cut into screen-height pieces. Look at every piece.
- Then scroll top to bottom in steps of about 300px, capturing each step. Still screenshots miss what breaks
  in motion: sticky bars covering content, sections cut off mid-band, things that never fade in.
- Check 1920px too, where moving strips and wide bands run out.
- Measure the page width at 390px. It must be exactly 390. Anything wider is sideways scrolling: find the
  element that pokes out.

Save to `_mrk/scores/screens-after/`.

## Phone checklist (390px)

- No sideways scroll.
- Body text 16px or more. Headings do not break one word per line.
- Everything tappable is at least 44px tall, with space between neighbours.
- The main action is in the first screen or pinned in the menu. Phone numbers are tappable.
- Columns collapse to one. Diagrams stack downward. Tables scroll inside their own box.
- The sticky header does not cover headings when jumping to a section.
- The cookie banner (step 17) does not cover the main button.

## Speed

Build the site, serve the built copy locally (`npm run preview`), then point the script at the address it
prints:

```bash
node "$SKILL/scripts/speed.mjs" http://localhost:4321 --label after --gate 98
```

The gate is formally checked on the preview address in step 18, but get to 98 here first: it is far cheaper
to fix now.

Fix in this order. It is the order that paid off most on a real rebuild.

1. **Remove JavaScript.** Anything a framework draws that HTML could.
2. **The first image**: sized for a phone, loaded eagerly at high priority, in a modern format.
3. **Everything below the first screen is lazy**: images, video posters, maps, widgets.
4. **Fonts**: fewer files, fewer weights, preload just the one for the first heading.
5. **Third-party scripts** load on interaction or after consent, never with the page.
6. **Critical CSS** only if still short of 98. Inlining the styles for the first screen helps, but automated
   tools drop rules they cannot see being used, which makes pages jump. Compare screenshots before and after.

Scores move two to five points between runs. The script re-tests doubtful pages three times and takes the
middle result; trust that over a single reading.

## Accessibility

Run an accessibility check (axe, or Lighthouse's own) on one page per template at phone and desktop widths,
with "reduce motion" switched on so hidden-until-animated content is tested as visible. Fix everything serious.
Then tab through each template by keyboard: menu, main button, every form field, with a visible focus ring.

## Skills

Impeccable's audit gives a second opinion on the interface, if installed. The speed and image checks are
in the bundled scripts and need nothing else.

## Models

Running the tests and reading the results is cheap work. Deciding and making the fixes is not.

**Done when:** the checklist passes on every template and `_mrk/scores/speed-after.csv` shows 98 or more
locally.
