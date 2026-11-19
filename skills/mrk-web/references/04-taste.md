# Step 4: Taste rules

**Purpose.** AI-built sites share a look and a voice that visitors now recognise, and distrust. These rules
are the floor for everything built from here on. Installed design skills can raise it. Nothing lowers it.

## The brand kit outranks these rules

These rules guard against defaults nobody chose. A brand kit is a choice somebody made.

Anything marked "Client" in `_mrk/brand-kit.md` (a typeface, a colour, a logo treatment, a tone of voice) is
used as given, **even when it appears in the lists below**. If the brand's font is Inter, the site is set in
Inter. If their colour is purple, the site is purple. Do not count it as a tell, do not swap it for something
you prefer, and do not argue.

What you can do is make the choice look deliberate: a common font used with care (considered sizes, weights
and spacing, a layout with its own character) reads as a brand, not a template.

Two limits:

- **The fixed rules still stand.** If a brand colour pair fails contrast, keep the colours and change how they
  are paired (the brand colour as a band behind white text, a darker text colour on the tint), then tell the
  owner what you did and why.
- **If a brand choice will cost them** (a font with no web licence, a colour unreadable as text), say so once,
  plainly, with the alternative. Then do what they decide.

Inspiration in `resources/inspiration/` is taste too. If they love something on these lists, show them one
direction that does it well in step 6 and let them judge.

## AI tells: how it looks

Count these when scoring (M4). Do not ship any, unless the brand kit asks for it.

1. A purple-to-blue gradient hero, glowing blobs, or a glow behind the headline.
2. Gradient-filled headline text.
3. One default typeface used everywhere with no thought (Inter, Roboto, Arial, system font).
4. Every section centred, the same width, with the same heading, subheading and grid.
5. Three identical cards in a row, icon on top, as the main feature section.
6. Emoji or sparkle icons standing in for real icons.
7. A small pill badge sitting above the headline ("New", "AI-powered").
8. Frosted-glass cards floating over a blurry background.
9. Everything with the same large rounded corners and the same soft shadow.
10. Invented dashboards, fake app screens or abstract 3D shapes where the real product or work should be.
11. Stock photos of strangers smiling at laptops, or generated people.
12. Initials in circles, or grey silhouettes, where real faces should be.
13. A "trusted by" strip of logos the business never worked with.
14. Pure black backgrounds with pure white text, or mid-grey body text on white.

## AI tells: how it reads

15. Filler verbs and adjectives: elevate, unlock, seamless, cutting-edge, tailored, robust, empower,
    transform, streamline, leverage.
16. "Not just X, but Y." "Whether you're A or B." "In today's fast-paced world."
17. Everything in threes: three adjectives, three benefits, three short sentences in a row.
18. Headings that say nothing: "Our Services", "Why Choose Us", "Welcome to Our Website".
19. Round numbers nobody published: 10x, 99%, 500+ happy customers.
20. Every section ending on the same button ("Get Started").

## What to do instead

**Type.** If the brand kit names typefaces, use them. Otherwise choose on purpose and be able to say why it
suits this business: shortlist three, check each licence allows web use, and self-host the winner. Two
families at most. Body text 16 to 18px, lines of about 65 characters, headings tight and confident.

**Colour.** If the brand kit gives colours, use them. Otherwise start from the logo. One brand colour used
with intent across the page (bands, accents, key numbers), a dark and a light neutral that lean slightly
toward it, and nothing else unless the brand already has it. Check every text and background pair for
contrast before building.

**Layout.** Let the content decide the shape. Vary the rhythm: a full-width band, then a narrow column, then
something off-centre. Where three things are equal, three cards are fine; they just cannot be the whole idea.

**Pictures.** Real photos of the real business beat everything, even imperfect ones. After that: the product
or work itself, diagrams, real logos of real clients and partners. Step 8 covers generated imagery and its
narrow uses.

**Motion.** Little, and with a reason: feedback on a press, a menu opening, one reveal that explains
something. Nothing that delays reading. Honour "reduce motion" settings. Never hide content until a scroll
effect fires.

**Words.** Written from `_mrk/facts.md` in the customer's language. Say the specific thing: the suburb, the
turnaround time, the price, the name. Headings carry information. Step 12 checks the result.

## Skills to load if installed

- `design-taste-frontend`: art direction and its own inspector. Follow it while designing and building.
- `impeccable`: set it up once with the facts and brand kit so its critique knows the audience.
- `refactoring-ui`: spacing, hierarchy and colour scales.
- `ui-ux-pro-max`: type, palette and pattern suggestions by industry.
- `emil-design-eng`: anything that moves.

Where two of them disagree, the brand kit and the owner's pick in step 6 decide.

## House style

`house-style.md` holds MRK's own defaults for page order, forms and wording. Read it now. It is editable, and
the brief overrides it.

**Done when:** you have read this and the house style, and noted in `_mrk/state.json` which design skills are
available.
