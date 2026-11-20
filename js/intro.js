// Core Closet intro: four still knockout silhouettes, centred, crossfading on a black backdrop.
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

  // Pre-render one silhouette: coloured rim + glow underneath, near-black fill on top.
  function bake(img, color) {
    const w = img.naturalWidth, h = img.naturalHeight, pad = 60;
    const c = document.createElement('canvas');
    c.width = w + pad * 2; c.height = h + pad * 2;
    const x = c.getContext('2d');

    // coloured copy of the silhouette
    const tint = document.createElement('canvas');
    tint.width = w; tint.height = h;
    const tx = tint.getContext('2d');
    tx.drawImage(img, 0, 0);
    tx.globalCompositeOperation = 'source-in';
    const hi = color;
    tx.fillStyle = rgba(hi, 1); tx.fillRect(0, 0, w, h);

    // glow
    x.save();
    x.shadowColor = rgba(color, 0.55); x.shadowBlur = 24;
    x.drawImage(tint, pad, pad);
    x.restore();
    // rim: stamp the tint around the silhouette, then cover the inside with the dark fill
    const r = 2.4;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      x.drawImage(tint, pad + Math.cos(a) * r, pad + Math.sin(a) * r);
    }
    const dark = document.createElement('canvas');
    dark.width = w; dark.height = h;
    const dx = dark.getContext('2d');
    dx.drawImage(img, 0, 0);
    dx.globalCompositeOperation = 'source-in';
    dx.fillStyle = '#040102'; dx.fillRect(0, 0, w, h);
    x.drawImage(dark, pad, pad);
    return { canvas: c, w: w, h: h, pad: pad };
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
    function drawSlide(b, alpha) {
      const sc = (H * 0.56 / b.h);
      const iw = b.w * sc, ih = b.h * sc;
      const ix = (W - iw) / 2, iy = (H - ih) / 2 - H * 0.02;
      ctx.globalAlpha = alpha;
      ctx.drawImage(b.canvas, ix - b.pad * sc, iy - b.pad * sc, b.canvas.width * sc, b.canvas.height * sc);
      ctx.globalAlpha = 1;
    }

    function draw(t) {
      let i = SLIDES.length - 1;
      for (let k = 0; k < SLIDES.length; k++) if (t < STARTS[k] + SLIDES[k].dur) { i = k; break; }
      const s = SLIDES[i], local = t - STARTS[i];
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (!baked[i]) return;
      const FADE = 220;
      if (local < FADE && i > 0 && baked[i - 1]) drawSlide(baked[i - 1], 1 - local / FADE);
      drawSlide(baked[i], clamp(local / FADE));
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
      img.onload = () => { baked[idx] = bake(img, s.color); if (--pending === 0) ready(); };
      img.onerror = () => { if (!finished) { skipped = true; finish(); } };
      img.src = s.src;
    });
    // safety: never hang the page on a slow network
    setTimeout(() => { if (!t0 && !finished && typeof opts.freezeAt !== 'number') { skipped = true; finish(); } }, 6000);

    return { skip() { skipped = true; finish(); } };
  }

  window.CCIntro = { start };
})();
