// Core Closet intro: four still knockout silhouettes, hard-cut with flash, glitch and shake.
// Silhouettes are baked from real fight photos into assets/img/ko/*.png (alpha only).
// API: window.CCIntro.start({ canvas, onProgress, onImpact, onDone, freezeAt }) -> { skip }
(function () {
  'use strict';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // hit = contact point as a fraction of the image (x, y), used for the impact burst
  const SLIDES = [
    { dur: 700, src: 'assets/img/ko/ko1.png', color: [70, 150, 255], label: '01', hit: [0.52, 0.46] },
    { dur: 700, src: 'assets/img/ko/ko2.png', color: [255, 195, 40], label: '02', hit: [0.27, 0.3] },
    { dur: 700, src: 'assets/img/ko/ko3.png', color: [255, 110, 30], label: '03', hit: [0.63, 0.4] },
    { dur: 950, src: 'assets/img/ko/ko4.png', color: [235, 55, 55], label: '04', hit: [0.6, 0.27] },
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
    const hi = [Math.min(255, color[0] + 70), Math.min(255, color[1] + 70), Math.min(255, color[2] + 70)];
    tx.fillStyle = rgba(hi, 1); tx.fillRect(0, 0, w, h);

    // glow
    x.save();
    x.shadowColor = rgba(color, 0.95); x.shadowBlur = 46;
    x.drawImage(tint, pad, pad);
    x.restore();
    // rim: stamp the tint around the silhouette, then cover the inside with the dark fill
    const r = 3.2;
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

    function drawSlide(s, b, local, u) {
      const col = s.color;
      // faint coloured glow behind the figures on a near-black backdrop
      const g = ctx.createRadialGradient(W * 0.5, H * 0.55, 0, W * 0.5, H * 0.55, Math.max(W, H) * 0.6);
      g.addColorStop(0, rgba(col, 0.16)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = '#070709'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // fit the still to the viewport height, centred, with a slow push-in
      const sc = (H * 1.02 / b.h);
      const iw = b.w * sc, ih = b.h * sc;
      const ix = (W - iw) / 2, iy = (H - ih) / 2;
      ctx.drawImage(b.canvas, ix - b.pad * sc, iy - b.pad * sc, b.canvas.width * sc, b.canvas.height * sc);

      // impact burst at the contact point
      const hx = ix + s.hit[0] * iw, hy = iy + s.hit[1] * ih;
      const k = Math.min(W, H);
      if (local < 260) {
        const q = local / 260;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(col, 0.55 * (1 - q)); ctx.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2 + 0.3;
          const r0 = k * (0.06 + (i % 3) * 0.015), r1 = k * (0.14 + (i % 5) * 0.05 + q * 0.18);
          ctx.lineWidth = 1 + (i % 3);
          ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0); ctx.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1); ctx.stroke();
        }
        const R = k * (0.1 + q * 0.12);
        const bg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
        bg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * (1 - q)) + ')'); bg.addColorStop(0.4, rgba(col, 0.6 * (1 - q))); bg.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(hx, hy, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      // sweat specks
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4 + 0.5, d = k * (0.05 + ((i * 37) % 10) / 40 + u * 0.14);
        ctx.beginPath(); ctx.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function draw(t) {
      let i = SLIDES.length - 1;
      for (let k = 0; k < SLIDES.length; k++) if (t < STARTS[k] + SLIDES[k].dur) { i = k; break; }
      const s = SLIDES[i], b = baked[i], local = t - STARTS[i], u = clamp(local / s.dur);
      ctx.clearRect(0, 0, W, H);
      if (!b) return;
      const z = 1 + 0.07 * u;
      const shake = local < 120 ? (1 - local / 120) * 10 : 0;
      ctx.save();
      ctx.translate(W / 2 + (Math.random() - 0.5) * shake, H / 2 + (Math.random() - 0.5) * shake);
      ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      drawSlide(s, b, local, u);
      ctx.restore();

      // hard cut: glitch slices plus a white flash
      if (local < 110 && i > 0) {
        const a = 1 - local / 110;
        for (let k = 0; k < 7; k++) {
          const sy = Math.random() * H, sh = 8 + Math.random() * 40, dx = (Math.random() - 0.5) * 90 * a;
          ctx.drawImage(canvas, 0, sy * dpr, W * dpr, sh * dpr, dx, sy, W, sh);
        }
        ctx.fillStyle = 'rgba(255,255,255,' + (0.75 * a * a) + ')'; ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.font = '500 ' + Math.round(Math.max(11, W * 0.009)) + 'px ui-monospace, monospace';
      ctx.fillText('FRAME ' + s.label + ' / 0' + SLIDES.length, 34, H - 70);
      // final white-out into the site
      if (i === SLIDES.length - 1 && u > 0.86) {
        ctx.fillStyle = 'rgba(255,255,255,' + clamp((u - 0.86) / 0.14) + ')'; ctx.fillRect(0, 0, W, H);
      }
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
