// Core Closet intro: a rapid loading sequence of still silhouettes of classic MMA finishing moments
// (head-kick KO, flying knee, straight-left KO, ground and pound, victory over a fallen opponent).
// Each frame is two fighters drawn as anatomical silhouettes (variable-width limbs with quad, calf,
// bicep and lat contours, gloved fists, shorts, jaw) with a coloured rim on a dark backdrop. Frames
// hard-cut with a flash and glitch slices. Everything is drawn on <canvas>; no image assets.

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // A pose is in metres, facing +x, y up, ground at y = 0, origin on the pelvis.
  const J = ['head', 'neck', 'chest', 'pelvis', 'shoulder', 'elN', 'haN', 'elF', 'haF', 'knS', 'anS', 'toS', 'knK', 'anK', 'toK'];
  const pose = (o) => Object.assign({
    head: [0.04, 1.66], neck: [0.03, 1.52], chest: [0.02, 1.38], pelvis: [0, 0.95], shoulder: [0.03, 1.46],
    elN: [0.15, 1.25], haN: [0.25, 1.45], elF: [0.1, 1.22], haF: [0.2, 1.4],
    knS: [0.12, 0.5], anS: [0.1, 0.08], toS: [0.24, 0.04], knK: [-0.12, 0.5], anK: [-0.16, 0.08], toK: [-0.04, 0.04],
  }, o);

  // ---- poses
  const KICKER = pose({ head: [-0.3, 1.62], neck: [-0.23, 1.5], chest: [-0.17, 1.37], pelvis: [0, 0.98], shoulder: [-0.2, 1.45],
    elN: [-0.05, 1.28], haN: [0.1, 1.46], elF: [-0.15, 1.22], haF: [0.0, 1.38],
    knS: [0.03, 0.52], anS: [-0.02, 0.08], toS: [0.12, 0.04], knK: [0.5, 1.27], anK: [0.98, 1.6], toK: [1.12, 1.66] });
  const KO_BACK = pose({ head: [-0.42, 1.52], neck: [-0.34, 1.43], chest: [-0.22, 1.3], pelvis: [0, 0.95], shoulder: [-0.25, 1.38],
    elN: [-0.3, 1.62], haN: [-0.18, 1.86], elF: [-0.48, 1.3], haF: [-0.68, 1.42],
    knS: [0.1, 0.5], anS: [0.06, 0.1], toS: [0.2, 0.06], knK: [-0.2, 0.52], anK: [-0.34, 0.12], toK: [-0.22, 0.07] });

  const KNEER = pose({ pelvis: [0, 1.3], chest: [0.02, 1.72], neck: [0.02, 1.86], head: [0.04, 2.0], shoulder: [0.03, 1.8],
    elN: [0.22, 1.85], haN: [0.4, 2.05], elF: [-0.12, 1.75], haF: [-0.02, 1.98],
    knS: [-0.28, 0.95], anS: [-0.55, 0.7], toS: [-0.66, 0.66], knK: [0.52, 1.46], anK: [0.36, 0.95], toK: [0.5, 0.88] });
  const KNEED = pose({ head: [0.4, 1.4], neck: [0.32, 1.38], chest: [0.2, 1.26], pelvis: [0, 0.92], shoulder: [0.26, 1.34],
    elN: [0.42, 1.2], haN: [0.55, 1.4], elF: [0.38, 1.1], haF: [0.5, 1.28],
    knS: [0.1, 0.5], anS: [0.06, 0.08], toS: [0.2, 0.04], knK: [-0.25, 0.5], anK: [-0.4, 0.1], toK: [-0.28, 0.05] });

  const PUNCHER = pose({ head: [0.42, 1.55], neck: [0.34, 1.45], chest: [0.24, 1.32], pelvis: [0, 0.88], shoulder: [0.3, 1.42],
    elN: [0.68, 1.46], haN: [1.1, 1.5], elF: [0.18, 1.22], haF: [0.34, 1.46],
    knS: [0.42, 0.5], anS: [0.46, 0.08], toS: [0.62, 0.04], knK: [-0.36, 0.46], anK: [-0.72, 0.08], toK: [-0.56, 0.04] });

  const MOUNT = pose({ pelvis: [0, 0.68], chest: [0.3, 1.14], neck: [0.4, 1.26], head: [0.5, 1.34], shoulder: [0.34, 1.2],
    elN: [0.12, 1.55], haN: [0.4, 1.72], elF: [0.6, 1.0], haF: [0.74, 0.62],
    knS: [0.4, 0.32], anS: [-0.1, 0.1], toS: [-0.24, 0.06], knK: [0.34, 0.26], anK: [-0.16, 0.12], toK: [-0.3, 0.08] });
  const FALLEN = pose({ pelvis: [0, 0.22], chest: [0.55, 0.26], neck: [0.78, 0.26], head: [0.95, 0.24], shoulder: [0.6, 0.3],
    elN: [0.62, 0.55], haN: [0.74, 0.8], elF: [0.5, 0.18], haF: [0.9, 0.1],
    knS: [-0.3, 0.62], anS: [-0.68, 0.22], toS: [-0.82, 0.16], knK: [-0.15, 0.58], anK: [-0.5, 0.2], toK: [-0.64, 0.14] });

  const VICTOR = pose({ head: [0.03, 1.66], neck: [0.02, 1.53], chest: [0.01, 1.4], pelvis: [0, 0.95], shoulder: [0.02, 1.48],
    elN: [0.28, 1.78], haN: [0.44, 2.04], elF: [-0.26, 1.78], haF: [-0.42, 2.04],
    knS: [0.18, 0.5], anS: [0.3, 0.08], toS: [0.44, 0.04], knK: [-0.18, 0.5], anK: [-0.3, 0.08], toK: [-0.16, 0.04] });

  // ---- slides: each has figures [pose, originX (m), flip], accent colour, contact point for the flash
  const SLIDES = [
    { dur: 600, color: [255, 150, 30], label: '01', figs: [[KICKER, -0.3, 1], [KO_BACK, 0.95, -1]], hit: [0.95, 1.6], cam: [0.5, 0] },
    { dur: 560, color: [255, 70, 70], label: '02', figs: [[KNEER, -0.1, 1], [KNEED, 1.0, -1]], hit: [0.55, 1.45], cam: [0.4, 0] },
    { dur: 560, color: [255, 205, 40], label: '03', figs: [[PUNCHER, -0.5, 1], [KO_BACK, 1.1, -1]], hit: [0.62, 1.52], cam: [0.3, 0] },
    { dur: 560, color: [150, 100, 255], label: '04', figs: [[FALLEN, 1.15, -1], [MOUNT, 0.15, 1]], hit: [0.58, 1.1], cam: [0.5, 0] },
    { dur: 820, color: [60, 170, 255], label: '05', figs: [[FALLEN, 1.25, -1], [VICTOR, -0.15, 1]], hit: null, cam: [0.5, 0] },
  ];
  const STARTS = []; let acc = 0;
  SLIDES.forEach((s) => { STARTS.push(acc); acc += s.dur; });
  const T_HIT = acc;

  // ---- anatomy: variable-width limb profiles (half-widths in metres, sampled along the segment)
  const P_THIGH = [0.112, 0.114, 0.104, 0.088, 0.07];
  const P_CALF = [0.064, 0.074, 0.078, 0.064, 0.044, 0.034];
  const P_FOOT = [0.034, 0.036, 0.03, 0.02];
  const P_UARM = [0.06, 0.07, 0.068, 0.054, 0.042];
  const P_FARM = [0.046, 0.054, 0.05, 0.041, 0.032];

  function start(opts) {
    const { canvas, onProgress, onImpact, onDone } = opts;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) { onImpact && onImpact(); onDone && onDone(); return { skip() {} }; }

    let W = 0, H = 0, dpr = 1, m = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      m = Math.min(H * 0.62 / 1.9, W * 0.86 / 3.1);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0, t0 = 0, finished = false;
    function frame(now) {
      if (!t0) t0 = now;
      const t = now - t0;
      draw(Math.min(t, T_HIT));
      onProgress && onProgress(clamp(t / T_HIT));
      if (t >= T_HIT) return finish();
      raf = requestAnimationFrame(frame);
    }
    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      onProgress && onProgress(1);
      onImpact && onImpact();
      setTimeout(() => onDone && onDone(), 140);
    }

    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    const DARK = '#040102';

    // smooth closed path through points (Catmull-Rom -> bezier)
    function smooth(pts) {
      const n = pts.length, p = new Path2D();
      p.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        p.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
      }
      p.closePath();
      return p;
    }

    // Build the list of silhouette shapes (screen-space Path2D) for one fighter.
    function buildFighter(P, ox, flip, gx, gy) {
      const X = (x) => gx + (ox + flip * x) * m, Y = (y) => gy - y * m;
      const pt = (k) => ({ x: X(P[k][0]), y: Y(P[k][1]) });
      const shapes = [];
      // limb with a width profile
      const limb = (a, b, prof, scale) => {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        const L = [], R = [];
        prof.forEach((w, i) => {
          const f = i / (prof.length - 1), cx = a.x + dx * f, cy = a.y + dy * f, ww = w * m * (scale || 1);
          L.push({ x: cx + nx * ww, y: cy + ny * ww }); R.push({ x: cx - nx * ww, y: cy - ny * ww });
        });
        shapes.push(smooth(L.concat(R.reverse())));
        const r = prof[0] * m * (scale || 1) * 0.98, r2 = prof[prof.length - 1] * m * (scale || 1) * 0.98;
        const c = new Path2D(); c.arc(a.x, a.y, r, 0, Math.PI * 2); c.arc(b.x, b.y, r2, 0, Math.PI * 2); shapes.push(c);
      };
      const blob = (a, rx, ry, rot) => { const c = new Path2D(); c.ellipse(a.x, a.y, rx * m, ry * m, rot || 0, 0, Math.PI * 2); shapes.push(c); };
      const lerpP = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });

      const pel = pt('pelvis'), ch = pt('chest'), nk = pt('neck'), hd = pt('head'), sh = pt('shoulder');
      // legs: thigh + calf + foot with heel, shorts flare on the upper thigh
      [['knK', 'anK', 'toK'], ['knS', 'anS', 'toS']].forEach(([kn, an, to]) => {
        const k = pt(kn), a = pt(an), t = pt(to);
        limb(pel, k, P_THIGH); limb(k, a, P_CALF);
        // foot: ankle to toe with a heel bump
        const hx = a.x - (t.x - a.x) * 0.25, hy = a.y + 0.012 * m;
        limb({ x: hx, y: hy }, t, P_FOOT);
        // shorts: wider fabric over the top of the thigh
        const sEnd = lerpP(pel, k, 0.5);
        limb(pel, sEnd, [0.128, 0.134, 0.14]);
      });
      // torso outline: hips, waist, ribs, lats/chest, shoulders, neck base
      const ax = ch.x - pel.x, ay = ch.y - pel.y, al = Math.hypot(ax, ay) || 1;
      const ux = ax / al, uy = ay / al, nx = -uy, ny = ux; // axis up and normal
      const tp = (f, w) => ({ x: pel.x + ux * al * f + nx * w * m, y: pel.y + uy * al * f + ny * w * m });
      const shw = 0.195;
      const sidePts = (sgn) => [[0.0, 0.15], [0.2, 0.125], [0.5, 0.15], [0.8, 0.19], [1.0, shw]].map(([f, w]) => tp(f, sgn * w));
      const torso = sidePts(1).concat([tp(1.12, 0.07), tp(1.12, -0.07)], sidePts(-1).reverse());
      shapes.push(smooth(torso));
      blob(lerpP(pel, ch, 0.9), 0.17, 0.14, Math.atan2(uy, ux));
      limb(ch, nk, [0.1, 0.08, 0.068]);           // traps and neck
      // head: skull + jaw
      const hdx = hd.x - nk.x, hdy = hd.y - nk.y, hrot = Math.atan2(hdy, hdx) - Math.PI / 2;
      blob(hd, 0.098, 0.122, hrot);
      blob({ x: hd.x + Math.sin(hrot) * -0.02 * m + flip * 0.0, y: hd.y + 0.05 * m }, 0.08, 0.07, hrot);
      // arms
      [['elF', 'haF'], ['elN', 'haN']].forEach(([el, ha]) => {
        const e = pt(el), h = pt(ha);
        limb(sh, e, P_UARM); limb(e, h, P_FARM);
        blob({ x: sh.x, y: sh.y }, 0.098, 0.098, 0);     // deltoid
        const gx2 = h.x + (h.x - e.x) * 0.12, gy2 = h.y + (h.y - e.y) * 0.12;
        blob({ x: gx2, y: gy2 }, 0.082, 0.07, Math.atan2(h.y - e.y, h.x - e.x)); // gloved fist
      });
      return shapes;
    }

    function drawSlide(s, local, u) {
      const col = s.color;
      const gx = W * 0.5 - s.cam[0] * m * 0.0 - 0.5 * m * (s.figs.length ? 0 : 0), gy = H * 0.84;
      // centre the pair: shift so the scene's midpoint is at screen centre
      let minX = 1e9, maxX = -1e9;
      s.figs.forEach(([P, ox, flip]) => J.forEach((k) => { const x = ox + flip * P[k][0]; minX = Math.min(minX, x); maxX = Math.max(maxX, x); }));
      const midX = (minX + maxX) / 2;
      const Gx = W * 0.5 - midX * m;

      ctx.fillStyle = '#030102'; ctx.fillRect(0, 0, W, H);
      const cxg = W / 2, cyg = gy - 0.95 * m;
      const g = ctx.createRadialGradient(cxg, cyg, 0, cxg, cyg, Math.max(W, H) * 0.55);
      g.addColorStop(0, rgba(col, 0.34)); g.addColorStop(0.5, rgba(col, 0.09)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // floor line + glow
      ctx.save(); ctx.translate(W / 2, gy); ctx.scale(1, 0.1);
      const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, m * 2.2);
      fg.addColorStop(0, rgba(col, 0.28)); fg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, m * 2.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      // impact burst behind the fighters
      let hx = 0, hy = 0;
      if (s.hit) {
        hx = Gx + s.hit[0] * m; hy = gy - s.hit[1] * m;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(col, 0.55); ctx.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2 + 0.3, r0 = m * (0.25 + (i % 3) * 0.06), r1 = m * (0.6 + (i % 5) * 0.2 + u * 0.12);
          ctx.lineWidth = 1 + (i % 3);
          ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0); ctx.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1); ctx.stroke();
        }
        const R = m * (0.42 + u * 0.12);
        const bg = ctx.createRadialGradient(hx, hy, 0, hx, hy, R);
        bg.addColorStop(0, 'rgba(255,255,255,.95)'); bg.addColorStop(0.35, rgba(col, 0.7)); bg.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(hx, hy, R, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // fighters: all rims first, then fills, so each frame reads as one merged silhouette
      const shapes = [];
      s.figs.forEach(([P, ox, flip]) => buildFighter(P, ox, flip, Gx - 0 * 0, gy).forEach((p) => shapes.push(p)));
      // buildFighter already offsets by gx passed in (Gx) and ox; compensate: pass Gx as gx above
      const rim = Math.max(1.6, m * 0.012);
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowColor = rgba(col, 0.95); ctx.shadowBlur = 30;
      const rimCol = rgba([Math.min(255, col[0] + 70), Math.min(255, col[1] + 70), Math.min(255, col[2] + 70)], 1);
      ctx.fillStyle = rimCol; ctx.strokeStyle = rimCol; ctx.lineWidth = rim * 2;
      shapes.forEach((p) => { ctx.fill(p); ctx.stroke(p); });
      ctx.restore();
      ctx.fillStyle = DARK;
      shapes.forEach((p) => ctx.fill(p));

      // sweat / impact specks flying off the contact point
      if (s.hit) {
        ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.85)';
        for (let i = 0; i < 14; i++) {
          const a = i * 2.4 + 0.5, d = m * (0.2 + ((i * 37) % 10) / 14 + u * 0.5);
          ctx.beginPath(); ctx.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.8, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    function draw(t) {
      let i = SLIDES.length - 1;
      for (let k = 0; k < SLIDES.length; k++) if (t < STARTS[k] + SLIDES[k].dur) { i = k; break; }
      const s = SLIDES[i], local = t - STARTS[i], u = clamp(local / s.dur);
      ctx.clearRect(0, 0, W, H);
      const z = 1 + 0.06 * u;
      const shake = local < 120 ? (1 - local / 120) * 10 : 0;
      ctx.save();
      ctx.translate(W / 2 + (Math.random() - 0.5) * shake, H / 2 + (Math.random() - 0.5) * shake);
      ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      drawSlide(s, local, u);
      ctx.restore();
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
      if (i === SLIDES.length - 1 && u > 0.88) {
        ctx.fillStyle = 'rgba(255,255,255,' + clamp((u - 0.88) / 0.12) + ')'; ctx.fillRect(0, 0, W, H);
      }
    }

    if (typeof opts.freezeAt === 'number') { draw(opts.freezeAt); return { skip() {} }; }
    raf = requestAnimationFrame(frame);
    return { skip: finish };
  }

  window.CCIntro = { start };
})();
