// Core Closet intro: four still knockout silhouettes, centred, crossfading on a black backdrop, filling with colour as the count reaches 100.
// Silhouettes are baked from real fight photos into assets/img/ko/*.png (alpha only).
// API: window.CCIntro.start({ canvas, onProgress, onImpact, onDone, freezeAt }) -> { skip }
(function () {
  'use strict';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  const SLIDES = [
    { dur: 700, src: 'assets/img/ko/ko1.png', color: [227, 30, 36], label: '01' },
    { dur: 700, src: 'assets/img/ko/ko2.png', color: [245, 197, 24], label: '02' },
    { dur: 700, src: 'assets/img/ko/ko3.png', color: [255, 255, 255], label: '03' },
    { dur: 950, src: 'assets/img/ko/ko4.png', color: [227, 30, 36], label: '04' },
  ];
  const STARTS = []; let acc = 0;
  SLIDES.forEach((s) => { STARTS.push(acc); acc += s.dur; });
  const T_HIT = acc;

  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  // Pre-render one silhouette in two layers: a defined base (crisp white rim, charcoal body)
  // and a theme-colour fill layer that is revealed bottom-up as the loader counts to 100.
  function bake(img) {
    const w = img.naturalWidth, h = img.naturalHeight, pad = 40;
    const cw = w + pad * 2, ch = h + pad * 2;
    const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };

    // solid single-colour copy of the silhouette
    const solid = (fill) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'source-in';
      x.fillStyle = fill; x.fillRect(0, 0, w, h);
      return c;
    };

    // base: soft glow, crisp white rim, charcoal body
    const base = mk(), bx = base.getContext('2d');
    const white = solid('#ffffff');
    bx.save(); bx.shadowColor = 'rgba(227,30,36,.55)'; bx.shadowBlur = 22; bx.drawImage(white, pad, pad); bx.restore();
    const r = 3.4;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      bx.drawImage(white, pad + Math.cos(a) * r, pad + Math.sin(a) * r);
    }
    bx.drawImage(solid('#1c1c1c'), pad, pad);

    // fill layer: red at the feet to gold at the head, clipped to the silhouette
    const fill = mk(), fx = fill.getContext('2d');
    fx.drawImage(img, pad, pad);
    fx.globalCompositeOperation = 'source-in';
    const g = fx.createLinearGradient(0, ch - pad, 0, pad);
    g.addColorStop(0, '#e31e24'); g.addColorStop(0.55, '#ff5a1f'); g.addColorStop(1, '#f5c518');
    fx.fillStyle = g; fx.fillRect(0, 0, cw, ch);
    return { base: base, fill: fill, w: w, h: h, pad: pad, cw: cw, ch: ch };
  }

  function start(opts) {
    const { canvas, onProgress, onImpact, onDone } = opts;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) { onImpact && onImpact(); onDone && onDone(); return { skip() {} }; }

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0, t0 = 0, finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      onProgress && onProgress(1);
      onImpact && onImpact();
      setTimeout(() => onDone && onDone(), 140);
    }
    function frame(now) {
      if (!t0) t0 = now;
      const t = now - t0;
      draw(Math.min(t, T_HIT));
      onProgress && onProgress(clamp(t / T_HIT));
      if (t >= T_HIT) return finish();
      raf = requestAnimationFrame(frame);
    }

    const baked = [];

    // Calm presentation: black background, one centred silhouette, soft crossfade between frames.
    // `level` (0..1) is how far the colour fill has risen, tied to the loader percentage.
    function drawSlide(b, alpha, level) {
      const sc = (H * 0.6 / b.h);
      const iw = b.cw * sc, ih = b.ch * sc;
      const ix = (W - iw) / 2, iy = (H - ih) / 2 - H * 0.02;
      ctx.globalAlpha = alpha;
      ctx.drawImage(b.base, ix, iy, iw, ih);
      if (level > 0) {
        // reveal the fill from the bottom of the figure upward
        const top = b.pad + b.h * (1 - level);
        ctx.drawImage(b.fill, 0, top, b.cw, b.ch - top, ix, iy + top * sc, iw, (b.ch - top) * sc);
        // bright edge at the fill front
        if (level < 1) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(b.fill, 0, top, b.cw, 3, ix, iy + top * sc, iw, 3 * sc);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.globalAlpha = 1;
    }

    function draw(t) {
      let i = SLIDES.length - 1;
      for (let k = 0; k < SLIDES.length; k++) if (t < STARTS[k] + SLIDES[k].dur) { i = k; break; }
      const s = SLIDES[i], local = t - STARTS[i];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (!baked[i]) return;
      const level = clamp(t / (T_HIT * 0.94));
      const FADE = 220;
      if (local < FADE && i > 0 && baked[i - 1]) drawSlide(baked[i - 1], 1 - local / FADE, level);
      drawSlide(baked[i], clamp(local / FADE), level);
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '400 ' + Math.round(Math.max(11, W * 0.009)) + 'px "Space Mono", ui-monospace, monospace';
      ctx.fillText('FRAME ' + s.label + ' / 0' + SLIDES.length, 34, H - 70);
    }

    // load all stills first, then run
    let skipped = false;
    let pending = SLIDES.length;
    const ready = () => {
      if (skipped || finished) return;
      if (typeof opts.freezeAt === 'number') { draw(opts.freezeAt); return; }
      raf = requestAnimationFrame(frame);
    };
    SLIDES.forEach((s, idx) => {
      const img = new Image();
      img.onload = () => { baked[idx] = bake(img); if (--pending === 0) ready(); };
      img.onerror = () => { if (!finished) { skipped = true; finish(); } };
      img.src = s.src;
    });
    // safety: never hang the page on a slow network
    setTimeout(() => { if (!t0 && !finished && typeof opts.freezeAt !== 'number') { skipped = true; finish(); } }, 6000);

    return { skip() { skipped = true; finish(); } };
  }

  window.CCIntro = { start };
})();
