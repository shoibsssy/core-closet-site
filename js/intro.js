// Core Closet intro: an anonymous silhouette fighter throws a spinning back kick.
// Side-on 2D skeleton posed with keyframes that follow the mechanics of a real
// spinning back kick (stance -> turn and fold -> knee chamber -> full extension
// at head height). Anatomical limb shapes are drawn on <canvas>; the camera then
// dives onto the kicking foot until it fills the screen and we cut to the site.

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // Joints in metres, facing +x, y up, ground at y = 0. Target is behind the fighter (-x).
  const J = ['head', 'neck', 'chest', 'pelvis', 'shoulder', 'elN', 'haN', 'elF', 'haF',
             'knS', 'anS', 'toS', 'knK', 'anK', 'toK'];

  const POSES = {
    stance: { head: [0.09, 1.68], neck: [0.06, 1.54], chest: [0.04, 1.4], pelvis: [0, 0.98], shoulder: [0.05, 1.5],
      elN: [0.22, 1.32], haN: [0.3, 1.54], elF: [0.27, 1.28], haF: [0.4, 1.5],
      knS: [0.2, 0.55], anS: [0.3, 0.1], toS: [0.45, 0.04], knK: [-0.15, 0.52], anK: [-0.28, 0.1], toK: [-0.12, 0.04] },
    fold: { head: [0.36, 1.42], neck: [0.26, 1.4], chest: [0.15, 1.3], pelvis: [0, 0.95], shoulder: [0.22, 1.36],
      elN: [0.3, 1.12], haN: [0.32, 0.92], elF: [0.34, 1.24], haF: [0.4, 1.08],
      knS: [0.06, 0.5], anS: [0.02, 0.1], toS: [0.16, 0.04], knK: [-0.25, 0.82], anK: [-0.32, 0.36], toK: [-0.38, 0.3] },
    chamber: { head: [0.7, 1.15], neck: [0.56, 1.17], chest: [0.4, 1.17], pelvis: [0, 0.95], shoulder: [0.5, 1.16],
      elN: [0.54, 0.88], haN: [0.5, 0.62], elF: [0.62, 0.98], haF: [0.68, 0.8],
      knS: [0.04, 0.5], anS: [0, 0.08], toS: [0.14, 0.03], knK: [-0.32, 1.1], anK: [-0.52, 0.78], toK: [-0.62, 0.72] },
    kick: { head: [0.78, 1.02], neck: [0.62, 1.05], chest: [0.46, 1.07], pelvis: [0, 0.95], shoulder: [0.55, 1.05],
      elN: [0.62, 0.8], haN: [0.62, 0.55], elF: [0.72, 0.9], haF: [0.8, 0.72],
      knS: [0.03, 0.5], anS: [0.02, 0.08], toS: [0.15, 0.03], knK: [-0.47, 1.2], anK: [-0.92, 1.45], toK: [-1.04, 1.5] },
    hit: { head: [0.8, 1.0], neck: [0.64, 1.03], chest: [0.48, 1.03], pelvis: [0, 0.95], shoulder: [0.57, 1.02],
      elN: [0.64, 0.78], haN: [0.64, 0.53], elF: [0.74, 0.88], haF: [0.82, 0.7],
      knS: [0.03, 0.5], anS: [0.02, 0.08], toS: [0.15, 0.03], knK: [-0.48, 1.22], anK: [-0.95, 1.5], toK: [-1.07, 1.56] },
  };
  // [time ms, pose]
  const KEYS = [[0, 'stance'], [560, 'stance'], [860, 'fold'], [1120, 'chamber'], [1340, 'kick'], [1500, 'hit']];
  const T_FLIP0 = 560, T_FLIP1 = 1000, T_DIVE = 1550, T_HIT = 2700;

  function poseAt(t) {
    if (t <= KEYS[0][0]) return POSES[KEYS[0][1]];
    for (let i = 1; i < KEYS.length; i++) {
      if (t <= KEYS[i][0]) {
        const [t0, a] = KEYS[i - 1], [t1, b] = KEYS[i];
        const u = easeInOut((t - t0) / (t1 - t0));
        const out = {};
        J.forEach((k) => { out[k] = [lerp(POSES[a][k][0], POSES[b][k][0], u), lerp(POSES[a][k][1], POSES[b][k][1], u)]; });
        return out;
      }
    }
    return POSES[KEYS[KEYS.length - 1][1]];
  }

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
      m = Math.min(H * 0.66 / 1.75, W * 0.92 / 2.1); // pixels per metre
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0, t0 = 0, finished = false;
    function frame(now) {
      if (!t0) t0 = now;
      const t = now - t0;
      draw(t);
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

    const RIM = 'rgba(255,205,95,.95)', DARK = '#040102';

    function draw(t) {
      const pose = poseAt(t);
      const dive = t >= T_DIVE ? easeIn(clamp((t - T_DIVE) / (T_HIT - T_DIVE))) : 0;
      const aim = t >= T_DIVE ? easeOut(clamp((t - T_DIVE) / (T_HIT - T_DIVE))) : 0;

      // facing: starts toward the target (left), turns through a squash, ends back to it
      let sx = -1;
      if (t >= T_FLIP0) sx = t >= T_FLIP1 ? 1 : -Math.cos(Math.PI * easeInOut((t - T_FLIP0) / (T_FLIP1 - T_FLIP0)));
      const sxc = Math.abs(sx) < 0.06 ? 0.06 * (sx < 0 ? -1 : 1) : sx;

      // placement: ground line low, figure centred a little right of the pelvis
      const gx = W * 0.5 + 0.18 * m, gy = H * 0.84;
      const wx = (x) => gx + x * sxc * m;       // world -> screen x (flip about the pelvis)
      const wy = (y) => gy - y * m;
      const pt = (k) => ({ x: wx(pose[k][0]), y: wy(pose[k][1]) });

      // ---- background: near-black, faint warm glow behind the fighter
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#030102'; ctx.fillRect(0, 0, W, H);
      const bgx = gx, bgy = gy - 0.9 * m;
      const gl = ctx.createRadialGradient(bgx, bgy, 0, bgx, bgy, Math.max(W, H) * (0.46 + dive * 0.4));
      gl.addColorStop(0, 'rgba(255,115,25,' + (0.3 + dive * 0.3) + ')');
      gl.addColorStop(0.5, 'rgba(120,30,5,.15)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
      // floor line + soft floor glow
      ctx.save();
      ctx.translate(gx, gy); ctx.scale(1, 0.12);
      const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, m * 1.7);
      fg.addColorStop(0, 'rgba(255,170,50,.22)'); fg.addColorStop(1, 'rgba(255,170,50,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 0, m * 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // ---- camera dive onto the kicking foot
      const foot = pt('toK');
      const cx = W / 2, cy = H / 2;
      const Z = lerp(1, 26, dive);
      const fx = lerp(cx, foot.x, aim), fy = lerp(cy, foot.y, aim);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(Z, Z); ctx.translate(-fx, -fy);

      // ---- body parts (anatomical tapered shapes), drawn far -> near
      const parts = []; let farMode = false;
      const lerpP = (a, b, f) => ({ x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });
      const cap = (a, ra, b, rb) => parts.push({ far: farMode, draw(ex) {
        const r1 = ra * m + ex, r2 = rb * m + ex;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * r1, a.y + ny * r1); ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
        ctx.lineTo(b.x - nx * r2, b.y - ny * r2); ctx.lineTo(a.x - nx * r1, a.y - ny * r1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, r1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, r2, 0, Math.PI * 2); ctx.fill();
      } });
      const blob = (a, rx, ry, rot) => parts.push({ far: farMode, draw(ex) {
        ctx.beginPath(); ctx.ellipse(a.x, a.y, rx * m + ex, ry * m + ex, rot || 0, 0, Math.PI * 2); ctx.fill();
      } });
      const leg = (hip, kn, an, to, thigh) => {
        const calf = lerpP(kn, an, 0.3);
        cap(hip, thigh, kn, 0.068);            // thigh tapering to the knee
        cap(kn, 0.066, calf, 0.072);           // calf muscle bulge
        cap(calf, 0.072, an, 0.036);           // shin down to the ankle
        cap(an, 0.034, to, 0.03);              // foot
      };
      const arm = (sh, el, ha) => {
        const bi = lerpP(sh, el, 0.4), fa = lerpP(el, ha, 0.3);
        cap(sh, 0.058, bi, 0.062); cap(bi, 0.062, el, 0.042);
        cap(el, 0.045, fa, 0.05); cap(fa, 0.05, ha, 0.032);
        blob(ha, 0.05, 0.05);
      };
      const hip = pt('pelvis'), shd = pt('shoulder'), ch = pt('chest'), nk = pt('neck'), hd = pt('head');

      farMode = true;
      leg(hip, pt('knK'), pt('anK'), pt('toK'), 0.092);                 // kicking leg (behind)
      arm(shd, pt('elF'), pt('haF'));                                    // far arm
      farMode = false;
      leg(hip, pt('knS'), pt('anS'), pt('toS'), 0.098);                  // standing leg
      cap(hip, 0.15, ch, 0.17);                                          // torso
      blob(lerpP(hip, ch, 0.85), 0.17, 0.14, 0);                          // chest / lats
      blob({ x: hip.x - 0.03 * sxc * m, y: hip.y - 0.02 * m }, 0.13, 0.12, 0); // glutes
      blob(shd, 0.09, 0.09);                                             // deltoid
      cap(ch, 0.09, nk, 0.06);                                           // neck / traps
      blob(hd, 0.098, 0.118, Math.atan2(hd.y - nk.y, hd.x - nk.x) - Math.PI / 2 + 0.3);
      arm(shd, pt('elN'), pt('haN'));                                    // near arm

      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const rim = Math.max(1.5, m * 0.011);
      // one merged silhouette: all rims first, then fills (far limbs a hair lighter for depth)
      ctx.save();
      ctx.shadowColor = 'rgba(255,150,30,.95)'; ctx.shadowBlur = 30;
      ctx.fillStyle = RIM;
      parts.forEach((q) => q.draw(rim));
      ctx.restore();
      parts.forEach((q) => { ctx.fillStyle = q.far ? '#150906' : DARK; q.draw(0); });

      // motion smear behind the kicking leg as it fires
      if (t > 1120 && t < 1700) {
        const a = clamp((t - 1120) / 220) * (1 - clamp((t - 1500) / 200));
        const k0 = pt('knK'), k1 = pt('toK');
        ctx.save();
        ctx.globalAlpha = a * 0.5; ctx.lineCap = 'round';
        const sg = ctx.createLinearGradient(hip.x, hip.y, k1.x, k1.y);
        sg.addColorStop(0, 'rgba(255,200,80,0)'); sg.addColorStop(1, 'rgba(255,230,150,.9)');
        ctx.strokeStyle = sg; ctx.lineWidth = m * 0.07;
        ctx.beginPath(); ctx.moveTo(hip.x + 0.05 * m, hip.y + 0.15 * m); ctx.quadraticCurveTo(k0.x, k0.y + 0.35 * m, k1.x, k1.y + 0.12 * m); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // speed lines on the dive
      if (dive > 0.05) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = 'rgba(255,150,40,' + (dive * 0.5) + ')';
        const R = Math.hypot(W, H);
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * Math.PI * 2 + i * 1.7;
          const r0 = R * (0.14 + ((i * 37) % 10) / 40) * (1 - dive * 0.5);
          ctx.lineWidth = 1 + ((i * 13) % 3);
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (typeof opts.freezeAt === 'number') { draw(opts.freezeAt); return { skip() {} }; }
    raf = requestAnimationFrame(frame);
    return { skip: finish };
  }

  window.CCIntro = { start };
})();
