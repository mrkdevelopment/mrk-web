# Step 8: Imagery (optional) ✋

**Purpose.** Some physical businesses have no usable photos, and their site looks empty without them.
Generated imagery can help in a narrow way. Everywhere else it hurts, so the default is to skip this step.

**In fast, skip this step** unless the owner asked for generated images. Record it as skipped and go on.

## First choice: real photos

If `resources/photos/` and the old site's own pictures cover what the pages need, this step is done. Record
it as skipped. Stock pictures carried over from the old site are fine to launch with.

Otherwise, before generating anything, offer the owner a short shot list they can take on a phone: the team
at work, the premises from the street, three finished jobs, the tools or product up close. Real and imperfect
beats generated and perfect. They drop the photos into `resources/photos/` and this step is done.

## When generated imagery helps

All three must be true:

- The business is physical and visual (trades, clinics, venues, food, vehicles, property).
- It has no good photos and cannot get them in time.
- The image is atmosphere: a texture, a material, a setting, a background, an illustration in the brand's
  style.

## Never

- People presented as staff or customers, or faces beside testimonials.
- The business's own premises, vehicles, products or finished work. That misleads customers (rule 1).
- Product screens, dashboards or app interfaces.
- Anything with readable text, logos or brand marks in it.
- Abstract "technology" art: glowing lines, floating shapes, brains.

## How ✋

1. Write the shot list in `_mrk/imagery.md`: what each image is for, where it sits, its shape, and the prompt.
   Tie every prompt to the brand kit's colours and light.
2. Price it: tool, model, size, cost per image, total. Show the owner. **Wait for a yes** (rule 3).
3. Draft small and cheap. Review against the design direction. Finalise only the keepers.
4. Export at the size the slot needs, through Astro's image tools like any other picture.
5. Record in `_mrk/imagery.md` which images on the site are generated, so the owner always knows.

## Tools

- **Claude:** Higgsfield, if it is already connected. It is a paid plan, and each image uses credits on
  top. Do not suggest signing up unless the owner asks for generated imagery.
- **Gemini or Codex:** their own built-in image tools.
- **None available:** use drawn visuals instead: diagrams, icon flows, the real logo wall, type as the image.

If the result does not beat a drawn alternative, do not use it. Saying so is a valid outcome.

**Done when:** the owner approved and the images are in, or the step is recorded as skipped with the reason.
