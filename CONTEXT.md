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
A rapid loading sequence of **four real knockout stills shown as silhouettes**, centred and small (about 56% of viewport height) on a plain black backdrop, with a soft 220 ms crossfade between frames. About 3.05 seconds in total, then the preloader fades out. No flash, glitch, shake, zoom or burst effects.

1. McGregor left on Aldo (red)  2. Silva front kick on Belfort (gold)  3. Edwards head kick (white)  4. Holloway exchange (red)

How it is built:
- Silhouettes are baked from supplied photos into `assets/img/ko/ko1-4.png` (alpha only, edges smoothed, faded where the crop cuts figures off). `intro.js` tints a thin rim and soft glow around each one in a theme colour (site red, gold, white), and fills it near-black on pure black.
- Baking pipeline (not in the repo): `rembg` (isnet-general-use) mask, median filter, fill small holes, 2x upscale, blur and threshold. A fifth photo (tight clinch crop) cut out as a blob and was dropped.
- `SLIDES` in `intro.js` holds `dur`, `src`, theme rim colour and label.
- `start({ canvas, onProgress, onImpact, onDone, freezeAt })` returns `{ skip }`. Images load first; if they fail or take over 6 s the intro is skipped.
- To add or swap a frame: cut out a new photo the same way, save as `assets/img/ko/koN.png`, add a `SLIDES` entry.
- The original photos live only in local `source-photos/` (gitignored, agency photos).

## Owner decisions and history (do not revert without asking)
- Dark background overall, plain black, theme colours only (red, gold, white). **No big bright backdrops.**
- **Calm intro: no bouncing, flashing, shaking, zooming or glitch effects.** Silhouettes stay small and centred. Follow the site theme style everywhere (owner request).
- **No drawn or tube figures.** The owner rejected the drawn pose silhouettes as "horrible". The intro now uses photo-derived silhouettes only.
- **No Dragon Ball or other cartoon characters any more.** Earlier versions (spiky-haired Saiyan style, a hand-drawn front stance, a 3D mocap kick, a still cartoon-hero sequence) were all replaced. The owner wants real-fighter finishing moments as **still silhouettes**, not animation.
- Do not reintroduce Mixamo or other third-party motion assets. A Mixamo FBX and a three.js bundle were used for a short time and then removed (served raw animation files publicly, which their terms discourage).
- Silhouettes are derived from real fight photos supplied by the owner (UFC knockouts). The owner has decided silhouettes carry no copyright concern and accepts the likeness question. No fighter names or logos appear on screen.
- The preloader caption reads "Loading sequence", and the corner label reads "FRAME 0X / 04".

## Known rough edges
- Preview was not rendered before the first push (headless Chrome was blocked), so edge fade and rim thickness at full size are unchecked. Look at it live and tune `bake()` in `intro.js`.
- Only still frames and the code path were checked, never the live animation at full speed.

## Workflow
- Commit and push finished changes straight to `main`, then confirm the Vercel deploy is Ready with `vercel ls webfoo`.
- Keep this file updated after each session.
- Copy style: no em dashes anywhere in written text.
