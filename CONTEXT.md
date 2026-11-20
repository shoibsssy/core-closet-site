# Core Closet · Project Context

## What This Is
Static homepage mockup for **Core Closet**, a combat-inspired streetwear brand (sportswear, casuals, everyday essentials). Single page, no backend, no persistence.

- **Repo:** https://github.com/shoibsssy/core-closet-site (public, branch `main`)
- **Vercel project:** `webfoo` under `smshoaib3875-2608s-projects`. Every push to `main` auto-deploys to production. The vercel.app URLs sit behind a Vercel login, so they cannot be fetched without auth.
- **Check a deploy:** `vercel ls webfoo` (latest row should say Ready).

## Stack and Files
Plain HTML, CSS and vanilla JS. No framework, no build step, no dependencies.

```
index.html     Whole page. Sections in order: preloader (intro), header, hero slider, statement,
               products (#shop), lineup (#lineup), collab, about (#about), mosaic, closer,
               social strip, footer (#contact)
css/style.css  All styles. The intro styles are under "Intro" (.preloader*)
js/main.js     Interaction layer. Preloader wiring: starts CCIntro, updates the % counter,
               flashes on impact, skip button, closes the intro
js/intro.js    The intro animation (canvas 2D, no assets). Exposes window.CCIntro.start()
assets/img/    Logos and product photography
```

## Intro (js/intro.js): current design
A rapid loading sequence of **five still silhouettes of classic MMA finishing moments**, two fighters per frame, hard-cut with a white flash, glitch slices and a small shake. About 3.1 seconds in total, then a white-out into the site.

1. Head-kick KO (orange)  2. Flying knee (red)  3. Straight-punch KO (gold)  4. Ground and pound (purple)  5. Victory over a fallen opponent (blue, then white-out)

How it is built:
- Poses are plain objects (15 joints, metres, ground at y = 0) at the top of the file. Slides list the fighters `[pose, originX, flip]`, an accent colour and a contact point for the impact flash.
- Anatomy comes from **variable-width limb profiles** (quad, calf, bicep contours), a shaped torso, a jaw, shorts and gloved fists, not constant-width capsules. All rims are drawn first, then dark fills, so each frame reads as one merged silhouette with a coloured rim.
- Near-black backdrop with only a faint coloured glow behind the figures.
- `start({ canvas, onProgress, onImpact, onDone, freezeAt })` returns `{ skip }`. `freezeAt` (ms) renders one frame, which is how previews are made.
- Timings: slide `dur` values in `SLIDES` (sum = `T_HIT`).

Preview a frame without a browser session: load `js/intro.js` in a page, call `CCIntro.start({ canvas, freezeAt: ms })`, then read `canvas.toDataURL()`. Headless Chrome with `--dump-dom` works (screenshots of canvases come out blank).

## Owner decisions and history (do not revert without asking)
- Dark background overall, with only a subtle colour glow behind the figures. **No big bright backdrops.**
- **No tube or capsule figures.** The owner rejected them several times ("looks like a doll"). Keep the anatomical profile approach.
- **No Dragon Ball or other cartoon characters any more.** Earlier versions (spiky-haired Saiyan style, a hand-drawn front stance, a 3D mocap kick, a still cartoon-hero sequence) were all replaced. The owner wants real-fighter finishing moments as **still silhouettes**, not animation.
- Do not reintroduce Mixamo or other third-party motion assets. A Mixamo FBX and a three.js bundle were used for a short time and then removed (served raw animation files publicly, which their terms discourage).
- Silhouettes are original drawings of poses, not traced from photos. No fighter names or logos appear on screen. Real-person likeness on a commercial brand is a publicity-rights question the owner has decided to accept.
- The preloader caption reads "Loading sequence", and the corner label reads "FRAME 0X / 05".

## Known rough edges
- Frame 1: the head kick reaches the opponent's chest and neck, not clearly the head.
- Frame 2: reads more as a clash than a clean knee strike.
- Only still frames were checked, never the live animation at full speed.

## Workflow
- Commit and push finished changes straight to `main`, then confirm the Vercel deploy is Ready with `vercel ls webfoo`.
- Keep this file updated after each session.
- Copy style: no em dashes anywhere in written text.
