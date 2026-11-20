// Core Closet intro: a rapid-fire loading sequence of still silhouette poses, each inspired by an
// iconic anime hero stance (one-punch hero, rubber-arm pirate, ninja run, sorcerer hand sign, then a
// beam-blast finale). Every slide is a flat black silhouette with a coloured rim and glow on a dark
// backdrop, hard-cut with a flash and glitch slices. Drawn on <canvas>, no assets.

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // Joints in metres, facing +x, y up, ground y = 0.
  const base = (o) => Object.assign({
    head: [0.08, 1.68], neck: [0.05, 1.55], chest: [0.03, 1.42], pelvis: [0, 0.95], shoulder: [0.05, 1.5],
    elN: [0.1, 1.2], haN: [0.15, 0.95], elF: [0.1, 1.2], haF: [0.12, 0.95],
    knS: [0.1, 0.5], anS: [0.08, 0.08], toS: [0.22, 0.04], knK: [-0.1, 0.5], anK: [-0.12, 0.08], toK: [0.0, 0.04],
  }, o);

  const SLIDES = [
    { // one-punch hero: lunging straight punch, bald head, flowing cape
      id: 'punch', dur: 560, flip: false, color: [255, 176, 32], dx: -0.15, label: '01',
      pose: base({ head: [0.46, 1.5], neck: [0.37, 1.4], chest: [0.26, 1.27], pelvis: [0, 0.86], shoulder: [0.33, 1.36],
        elN: [0.72, 1.4], haN: [1.14, 1.42], elF: [0.05, 1.12], haF: [-0.12, 0.98],
        knS: [0.5, 0.52], anS: [0.55, 0.08], toS: [0.7, 0.04], knK: [-0.4, 0.5], anK: [-0.82, 0.1], toK: [-0.66, 0.04] }),
      head: 'bald', cape: true, fx: 'impact' },
    { // rubber-arm pirate: stretched pistol punch, straw hat
      id: 'pistol', dur: 520, flip: true, color: [255, 84, 56], dx: -0.55, label: '02',
      pose: base({ head: [0.3, 1.5], neck: [0.2, 1.4], chest: [0.14, 1.3], pelvis: [0, 0.9], shoulder: [0.2, 1.36],
        elN: [1.2, 1.46], haN: [2.35, 1.5], elF: [-0.05, 1.2], haF: [-0.22, 1.08],
        knS: [0.32, 0.5], anS: [0.38, 0.08], toS: [0.54, 0.04], knK: [-0.3, 0.48], anK: [-0.52, 0.08], toK: [-0.36, 0.04] }),
      head: 'hat', stretch: true, fx: 'speed' },
    { // ninja run: forward lean, arms swept back, headband, swept spikes
      id: 'run', dur: 520, flip: false, color: [255, 138, 26], dx: 0.1, label: '03',
      pose: base({ head: [0.62, 1.32], neck: [0.5, 1.28], chest: [0.35, 1.2], pelvis: [0, 0.9], shoulder: [0.45, 1.25],
        elN: [0.1, 1.2], haN: [-0.3, 1.14], elF: [0.15, 1.08], haF: [-0.22, 0.98],
        knS: [0.5, 0.75], anS: [0.42, 0.35], toS: [0.58, 0.3], knK: [-0.2, 0.5], anK: [-0.58, 0.14], toK: [-0.42, 0.05] }),
      head: 'ninja', fx: 'wind' },
    { // sorcerer: hand sign by the face, white spiky hair, blindfold, domain rings
      id: 'sign', dur: 560, flip: false, color: [122, 92, 255], dx: 0.0, label: '04',
      pose: base({ head: [0.08, 1.68], neck: [0.05, 1.55], chest: [0.03, 1.42], shoulder: [0.05, 1.5],
        elN: [0.26, 1.4], haN: [0.3, 1.7], elF: [0.08, 1.2], haF: [0.1, 0.97],
        knS: [0.1, 0.5], anS: [0.08, 0.08], toS: [0.22, 0.04], knK: [-0.1, 0.5], anK: [-0.12, 0.08], toK: [0.0, 0.04] }),
      head: 'white', fx: 'domain' },
    { // beam-blast hero: wide stance, cupped hands at the hip, energy ball, spiky hair; fires at the end
      id: 'beam', dur: 900, flip: false, color: [58, 160, 255], dx: 0.35, label: '05',
      pose: base({ head: [0.12, 1.5], neck: [0.09, 1.38], chest: [0.06, 1.25], pelvis: [0, 0.8], shoulder: [0.08, 1.33],
        elN: [-0.15, 1.15], haN: [-0.42, 1.02], elF: [-0.1, 1.08], haF: [-0.4, 0.97],
        knS: [0.42, 0.45], anS: [0.58, 0.08], toS: [0.74, 0.04], knK: [-0.4, 0.42], anK: [-0.62, 0.08], toK: [-0.46, 0.04] }),
      head: 'spiky', fx: 'beam' },
  ];
  const STARTS = []; let acc = 0;
  SLIDES.forEach((s) => { STARTS.push(acc); acc += s.dur; });
  const T_HIT = acc;

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
      m = Math.min(H * 0.6 / 1.75, W * 0.78 / 2.6);
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

    function drawSlide(s, local, u) {
      const col = s.color, P = s.pose;
      const sgn = s.flip ? -1 : 1;
      const gx = W * 0.5 + s.dx * m * sgn, gy = H * 0.86;
      const X = (x) => gx + x * sgn * m, Y = (y) => gy - y * m;
      const pt = (k) => ({ x: X(P[k][0]), y: Y(P[k][1]) });
      const ang = (deg) => (s.flip ? Math.PI - deg * Math.PI / 180 : deg * Math.PI / 180);

      // ---- backdrop: near-black with a faint coloured glow
      ctx.fillStyle = '#030102'; ctx.fillRect(0, 0, W, H);
      const cxg = W / 2, cyg = gy - 0.9 * m;
      const g = ctx.createRadialGradient(cxg, cyg, 0, cxg, cyg, Math.max(W, H) * 0.55);
      g.addColorStop(0, rgba(col, 0.38)); g.addColorStop(0.5, rgba(col, 0.1)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft floor glow
      ctx.save(); ctx.translate(gx, gy); ctx.scale(1, 0.12);
      const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, m * 1.8);
      fg.addColorStop(0, rgba(col, 0.25)); fg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, m * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      const hand = pt('haN'), head = pt('head');
      // ---- slide-specific backdrop effects (behind the figure)
      ctx.save();
      ctx.lineCap = 'round';
      if (s.fx === 'impact') {
        for (let i = 0; i < 4; i++) {
          const r = (0.25 + i * 0.28 + u * 0.1) * m;
          ctx.strokeStyle = rgba(col, 0.55 - i * 0.12); ctx.lineWidth = Math.max(2, m * 0.03 - i);
          ctx.beginPath(); ctx.ellipse(hand.x + 0.2 * m * sgn, hand.y, r * 0.55, r, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      if (s.fx === 'impact' || s.fx === 'speed' || s.fx === 'wind') {
        ctx.strokeStyle = rgba(col, 0.5);
        for (let i = 0; i < 22; i++) {
          const yy = H * (0.12 + ((i * 53) % 76) / 100), len = W * (0.12 + ((i * 29) % 30) / 100);
          const xx = ((i * 97) % 100) / 100 * W + (s.fx === 'wind' ? -u * 120 : u * 120) * sgn * -1;
          ctx.lineWidth = 1 + (i % 3);
          ctx.globalAlpha = 0.25 + ((i * 7) % 5) / 12;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - len * sgn, yy); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      if (s.fx === 'domain') {
        for (let i = 0; i < 5; i++) {
          const r = (0.5 + i * 0.35 + u * 0.15) * m;
          ctx.strokeStyle = rgba(col, 0.5 - i * 0.08); ctx.lineWidth = 2;
          ctx.setLineDash([m * 0.1, m * 0.06]);
          ctx.beginPath(); ctx.arc(cxg, cyg, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      if (s.fx === 'beam') {
        // radiating rays + the energy ball cupped between the hands
        ctx.strokeStyle = rgba(col, 0.4);
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2 + u * 0.4, bx = X(-0.55), by = Y(1.0);
          ctx.lineWidth = 1 + (i % 3);
          ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * m * 0.5, by + Math.sin(a) * m * 0.5);
          ctx.lineTo(bx + Math.cos(a) * m * (1.2 + (i % 4) * 0.5), by + Math.sin(a) * m * (1.2 + (i % 4) * 0.5)); ctx.stroke();
        }
      }
      ctx.restore();

      // ---- body (anatomical tapered shapes, merged into one silhouette)
      const parts = [];
      const lerpP = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });
      const cap = (a, ra, b, rb) => parts.push({ draw(ex) {
        const r1 = ra * m + ex, r2 = rb * m + ex;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * r1, a.y + ny * r1); ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
        ctx.lineTo(b.x - nx * r2, b.y - ny * r2); ctx.lineTo(a.x - nx * r1, a.y - ny * r1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, r1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, r2, 0, Math.PI * 2); ctx.fill();
      } });
      const blob = (a, rx, ry, rot) => parts.push({ draw(ex) {
        ctx.beginPath(); ctx.ellipse(a.x, a.y, rx * m + ex, ry * m + ex, rot || 0, 0, Math.PI * 2); ctx.fill();
      } });
      const poly = (pts) => parts.push({ draw(ex) {
        ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
        ctx.fill(); ctx.lineWidth = ex * 2; ctx.stroke();
      } });
      const leg = (hip, kn, an, to, th) => {
        const calf = lerpP(kn, an, 0.3);
        cap(hip, th, kn, 0.068); cap(kn, 0.066, calf, 0.072); cap(calf, 0.072, an, 0.036); cap(an, 0.034, to, 0.03);
      };
      const arm = (sh, el, ha, fist, thin) => {
        if (thin) { cap(sh, 0.06, el, 0.05); cap(el, 0.05, ha, 0.045); blob(ha, fist, fist); return; }
        const bi = lerpP(sh, el, 0.4), fa = lerpP(el, ha, 0.3);
        cap(sh, 0.062, bi, 0.066); cap(bi, 0.066, el, 0.045); cap(el, 0.048, fa, 0.054); cap(fa, 0.054, ha, 0.034);
        blob(ha, fist, fist);
      };
      const hip = pt('pelvis'), shd = pt('shoulder'), ch = pt('chest'), nk = pt('neck');

      // cape trailing behind the shoulders
      if (s.cape) {
        const back = -sgn;
        const w = (k) => Math.sin(u * 5 + k) * 0.05;
        poly([
          { x: shd.x - back * 0.02 * m, y: shd.y - 0.04 * m }, { x: nk.x, y: nk.y - 0.02 * m },
          { x: nk.x + back * 0.6 * m, y: nk.y + (0.05 + w(0)) * m }, { x: shd.x + back * 1.1 * m, y: shd.y + (0.3 + w(1)) * m },
          { x: shd.x + back * 0.95 * m, y: shd.y + (0.75 + w(2)) * m }, { x: shd.x + back * 0.55 * m, y: shd.y + (0.62 + w(3)) * m },
          { x: shd.x + back * 0.3 * m, y: shd.y + (0.85 + w(4)) * m }, { x: hip.x + back * 0.1 * m, y: hip.y - 0.1 * m },
        ]);
      }
      leg(hip, pt('knK'), pt('anK'), pt('toK'), 0.092);
      arm(shd, pt('elF'), pt('haF'), 0.058);
      leg(hip, pt('knS'), pt('anS'), pt('toS'), 0.098);
      cap(hip, 0.15, ch, 0.17);
      blob(lerpP(hip, ch, 0.85), 0.18, 0.14, 0);
      blob({ x: hip.x - sgn * 0.03 * m, y: hip.y - 0.02 * m }, 0.13, 0.12, 0);
      blob(shd, 0.095, 0.095);
      cap(ch, 0.09, nk, 0.06);
      const hr = 0.1;
      blob(head, hr, hr * 1.14, 0);
      if (s.stretch) {
        // stretched rubber arm: thin long arm, big fist
        const el = pt('elN'), ha = pt('haN');
        cap(shd, 0.07, el, 0.05); cap(el, 0.05, ha, 0.042); blob(ha, 0.15, 0.15);
      } else arm(shd, pt('elN'), pt('haN'), s.id === 'punch' ? 0.1 : 0.062);

      // hair / headgear
      const spike = (cx, cy, deg, len, wid) => {
        const a = ang(deg), tipx = cx + Math.cos(a) * len * m, tipy = cy - Math.sin(a) * len * m;
        const nx = -Math.sin(a), ny = -Math.cos(a), hw = wid * m;
        poly([{ x: cx + nx * hw, y: cy + ny * hw }, { x: tipx, y: tipy }, { x: cx - nx * hw, y: cy - ny * hw }]);
      };
      const hx = head.x, hy = head.y, hrp = hr * m;
      if (s.head === 'spiky') {
        [[100, 0.42, 0.07], [75, 0.38, 0.075], [125, 0.36, 0.07], [50, 0.3, 0.07], [150, 0.28, 0.065], [20, 0.2, 0.06], [175, 0.22, 0.06]]
          .forEach(([d, l, w]) => spike(hx, hy - hrp * 0.35, d, l + hrp / m * 0.5, w));
        blob({ x: hx, y: hy - hrp * 0.25 }, hr * 1.08, hr * 1.1, 0);
      } else if (s.head === 'white') {
        [[96, 0.34, 0.06], [78, 0.3, 0.06], [114, 0.3, 0.06], [58, 0.24, 0.055], [134, 0.24, 0.055], [30, 0.18, 0.05], [160, 0.18, 0.05]]
          .forEach(([d, l, w]) => spike(hx, hy - hrp * 0.4, d, l + hrp / m * 0.4, w));
        blob({ x: hx, y: hy - hrp * 0.3 }, hr * 1.06, hr * 1.06, 0);
      } else if (s.head === 'ninja') {
        [[125, 0.34, 0.07], [150, 0.3, 0.07], [105, 0.3, 0.07], [175, 0.24, 0.06], [80, 0.24, 0.06], [200, 0.2, 0.05]]
          .forEach(([d, l, w]) => spike(hx, hy - hrp * 0.35, d, l + hrp / m * 0.4, w));
        blob({ x: hx, y: hy - hrp * 0.3 }, hr * 1.08, hr * 1.06, 0);
        // forehead protector tails fluttering behind
        poly([{ x: hx - sgn * hrp * 0.9, y: hy - hrp * 0.15 }, { x: hx - sgn * (hrp * 0.9 + 0.35 * m), y: hy + hrp * 0.2 + Math.sin(u * 14) * 0.05 * m },
          { x: hx - sgn * (hrp * 0.9 + 0.3 * m), y: hy + hrp * 0.45 }, { x: hx - sgn * hrp * 0.9, y: hy + hrp * 0.1 }]);
        poly([{ x: hx - hrp, y: hy - hrp * 0.35 }, { x: hx + hrp, y: hy - hrp * 0.35 }, { x: hx + hrp, y: hy - hrp * 0.05 }, { x: hx - hrp, y: hy - hrp * 0.05 }]);
      } else if (s.head === 'hat') {
        // wide-brim straw hat
        blob({ x: hx, y: hy - hrp * 0.55 }, 0.27, 0.05, sgn * -0.08);
        blob({ x: hx, y: hy - hrp * 0.95 }, 0.14, 0.1, 0);
      }
      parts.forEach((q) => { /* merged pass below */ });

      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const rim = Math.max(1.5, m * 0.011);
      ctx.shadowColor = rgba(col, 0.95); ctx.shadowBlur = 30;
      ctx.fillStyle = rgba([Math.min(255, col[0] + 60), Math.min(255, col[1] + 60), Math.min(255, col[2] + 60)], 1);
      ctx.strokeStyle = ctx.fillStyle;
      parts.forEach((q) => q.draw(rim));
      ctx.restore();
      ctx.fillStyle = DARK; ctx.strokeStyle = DARK;
      parts.forEach((q) => q.draw(0));

      // blindfold + eye glint on the sorcerer, headband plate etc. drawn lightly in rim colour
      if (s.head === 'white') {
        ctx.fillStyle = DARK; ctx.fillRect(hx - hrp * 1.02, hy - hrp * 0.12, hrp * 2.04, hrp * 0.34);
      }
      if (s.head === 'ninja') {
        ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = Math.max(1.5, m * 0.008);
        ctx.strokeRect(hx - hrp * 0.5, hy - hrp * 0.33, hrp, hrp * 0.26);
      }

      // ---- foreground effects
      if (s.fx === 'beam') {
        const bx = X(-0.55), by = Y(1.0);
        const grow = u < 0.7 ? 0.5 + u * 0.5 : 0.85;
        const R = m * 0.34 * grow * (1 + Math.sin(local / 40) * 0.05);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, R * 2.2);
        bg.addColorStop(0, 'rgba(255,255,255,1)'); bg.addColorStop(0.3, rgba(col, 0.95)); bg.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(bx, by, R * 2.2, 0, Math.PI * 2); ctx.fill();
        // the blast: a beam shooting across the screen at the end
        if (u > 0.72) {
          const k = easeOut((u - 0.72) / 0.28);
          const bw = m * (0.3 + k * 1.6);
          const x0 = bx, x1 = bx + (W - bx) * k * 1.3 * sgn * (s.flip ? -1 : 1);
          const grad = ctx.createLinearGradient(0, by - bw, 0, by + bw);
          grad.addColorStop(0, rgba(col, 0)); grad.addColorStop(0.5, 'rgba(255,255,255,1)'); grad.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = grad; ctx.fillRect(Math.min(x0, x1), by - bw, Math.abs(x1 - x0), bw * 2);
          ctx.fillStyle = rgba(col, 0.35 * k); ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
      }
      if (s.fx === 'impact') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const fx = hand.x + 0.1 * m * sgn, fy = hand.y, fr = m * (0.28 + u * 0.1);
        const fg2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fg2.addColorStop(0, 'rgba(255,240,200,.9)'); fg2.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = fg2; ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }

    function draw(t) {
      let i = SLIDES.length - 1;
      for (let k = 0; k < SLIDES.length; k++) if (t < STARTS[k] + SLIDES[k].dur) { i = k; break; }
      const s = SLIDES[i], local = t - STARTS[i], u = clamp(local / s.dur);
      ctx.clearRect(0, 0, W, H);
      // gentle push-in per slide, with a tiny shake on entry
      const z = 1 + 0.07 * u;
      const shake = local < 120 ? (1 - local / 120) * 10 : 0;
      ctx.save();
      ctx.translate(W / 2 + (Math.random() - 0.5) * shake, H / 2 + (Math.random() - 0.5) * shake);
      ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      drawSlide(s, local, u);
      ctx.restore();

      // hard-cut transition: white flash + glitch slices
      if (local < 110 && i > 0) {
        const a = 1 - local / 110;
        for (let k = 0; k < 7; k++) {
          const sy = Math.random() * H, sh = 8 + Math.random() * 40, dx = (Math.random() - 0.5) * 90 * a;
          ctx.drawImage(canvas, 0, sy * dpr, W * dpr, sh * dpr, dx, sy, W, sh);
        }
        ctx.fillStyle = 'rgba(255,255,255,' + (0.75 * a * a) + ')'; ctx.fillRect(0, 0, W, H);
      }
      // slide index, bottom-left, mono
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.font = '500 ' + Math.round(Math.max(11, W * 0.009)) + 'px ui-monospace, monospace';
      ctx.fillText('FRAME ' + s.label + ' / 0' + SLIDES.length, 34, H - 70);
      // final white-out as the blast lands
      if (i === SLIDES.length - 1 && u > 0.9) {
        ctx.fillStyle = 'rgba(255,255,255,' + clamp((u - 0.9) / 0.1) + ')'; ctx.fillRect(0, 0, W, H);
      }
    }

    if (typeof opts.freezeAt === 'number') { draw(opts.freezeAt); return { skip() {} }; }
    raf = requestAnimationFrame(frame);
    return { skip: finish };
  }

  window.CCIntro = { start };
})();
