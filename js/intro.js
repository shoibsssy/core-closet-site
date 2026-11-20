// Core Closet — intro: a silhouetted Super Saiyan style fighter throws a spinning back kick at the viewer.
// A small 3D skeleton is posed with keyframes, spun around its vertical axis,
// projected with a real perspective camera and drawn on <canvas>. The camera
// dives at the kicking foot until it fills the screen, then we cut to the site.

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // Joints in body space: x = right, y = up, z = the way the fighter faces.
  const J = ['pelvis', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR',
             'hiL', 'hiR', 'knL', 'knR', 'foL', 'foR'];

  const POSES = {
    guard: {
      pelvis: [0, 0.95, 0], chest: [0, 1.42, 0.05], head: [0, 1.72, 0.1],
      shL: [-0.2, 1.5, 0], shR: [0.2, 1.5, 0],
      elL: [-0.32, 1.28, 0.3], elR: [0.3, 1.3, 0.24],
      haL: [-0.16, 1.56, 0.5], haR: [0.14, 1.56, 0.42],
      hiL: [-0.12, 0.95, 0], hiR: [0.12, 0.95, 0],
      knL: [-0.3, 0.5, 0.3], knR: [0.32, 0.5, -0.22],
      foL: [-0.32, 0.05, 0.58], foR: [0.38, 0.05, -0.5],
    },
    chamber: {
      pelvis: [0, 0.95, 0], chest: [0, 1.4, 0.14], head: [0, 1.7, 0.22],
      shL: [-0.2, 1.48, 0.06], shR: [0.2, 1.48, 0.06],
      elL: [-0.3, 1.28, 0.3], elR: [0.3, 1.26, 0.2],
      haL: [-0.14, 1.5, 0.5], haR: [0.24, 1.46, 0.36],
      hiL: [-0.12, 0.95, 0], hiR: [0.12, 0.95, 0],
      knL: [-0.14, 0.5, 0.1], knR: [0.2, 0.92, 0.32],
      foL: [-0.14, 0.05, 0.12], foR: [0.12, 0.5, -0.1],
    },
    strike: {
      pelvis: [0, 1, 0], chest: [0, 1.2, 0.58], head: [0, 1.24, 0.9],
      shL: [-0.2, 1.24, 0.54], shR: [0.2, 1.24, 0.54],
      elL: [-0.3, 1.0, 0.86], elR: [0.32, 1.36, 0.3],
      haL: [-0.2, 0.8, 1.08], haR: [0.36, 1.52, 0.06],
      hiL: [-0.12, 1, 0], hiR: [0.12, 1, 0],
      knL: [-0.1, 0.55, 0.12], knR: [0.12, 1.2, -0.55],
      foL: [-0.1, 0.05, 0.22], foR: [0.12, 1.4, -1.1],
    },
  };

  function samplePose(p) {
    const [a, b, t] = p < 1 ? [POSES.guard, POSES.chamber, p] : [POSES.chamber, POSES.strike, p - 1];
    const out = {};
    J.forEach((k) => {
      out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t), lerp(a[k][2], b[k][2], t)];
    });
    return out;
  }

  // Timeline (ms)
  const T_SPIN = 800, T_KICK = 1650, T_DIVE = 2050, T_HIT = 2700;

  function start(opts) {
    const { canvas, onProgress, onImpact, onDone } = opts;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) { onImpact && onImpact(); onDone && onDone(); return { skip() {} }; }

    let W = 0, H = 0, dpr = 1, F = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      F = Math.min(H * 1.25, W * 2.2);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0, t0 = 0, finished = false;
    const trail = [];

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

    function draw(t) {
      // ---- timeline -> parameters
      let theta, p, camZ, camY = 1.1, camX = 0, dive = 0;
      const sway = Math.sin(t / 260) * 0.03;
      if (t < T_SPIN) {
        theta = 25 * Math.PI / 180 + sway; p = 0;
        camZ = lerp(4.9, 4.5, t / T_SPIN);
      } else if (t < T_KICK) {
        const u = easeInOut((t - T_SPIN) / (T_KICK - T_SPIN));
        theta = lerp(25, -155, u) * Math.PI / 180;
        p = clamp(u * 1.08);
        camZ = lerp(4.5, 4.3, u);
      } else {
        const k = clamp((t - T_KICK) / (T_DIVE - T_KICK));
        theta = lerp(-155, -150, easeOut(k)) * Math.PI / 180;
        p = 1 + easeOut(k);
        camZ = 4.3;
      }
      const pose = samplePose(p);
      if (t >= T_DIVE) {
        dive = easeIn(clamp((t - T_DIVE) / (T_HIT - T_DIVE)));
      }

      // Camera dives onto the kicking foot.
      const c = Math.cos(theta), s = Math.sin(theta);
      const toWorld = (v) => [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
      const footW = toWorld(pose.foR);
      if (dive > 0) {
        const aim = easeOut(clamp((t - T_DIVE) / (T_HIT - T_DIVE)));
        camZ = lerp(4.3, footW[2] + 0.08, dive);
        camY = lerp(1.1, footW[1], aim);
        camX = lerp(0, footW[0], aim);
      }
      const shake = dive * 0.02 * F / 1000;
      camX += (Math.random() - 0.5) * shake;
      camY += (Math.random() - 0.5) * shake;

      const cx = W / 2, cy = H * 0.54;
      const proj = (w) => {
        const d = camZ - w[2];
        if (d < 0.04) return null;
        const k = F / d;
        return { x: cx + (w[0] - camX) * k, y: cy - (w[1] - camY) * k, k, d, z: w[2] };
      };
      const P = {};
      let ok = true;
      J.forEach((j) => { P[j] = proj(toWorld(pose[j])); if (!P[j]) ok = false; });

      // ---- background: near-black, only a faint warm glow behind the fighter
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#040102'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy * 0.95, 0, cx, cy * 0.95, Math.max(W, H) * (0.5 + dive * 0.4));
      g.addColorStop(0, 'rgba(255,120,25,' + (0.34 + dive * 0.3) + ')');
      g.addColorStop(0.5, 'rgba(120,30,5,.18)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // floor glow under the fighter
      const floor = proj([0, 0, 0]);
      if (floor && dive < 0.6) {
        ctx.save();
        ctx.globalAlpha = 1 - dive * 1.6;
        ctx.translate(floor.x, floor.y);
        ctx.scale(1, 0.18);
        const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, floor.k * 1.5);
        fg.addColorStop(0, 'rgba(245,197,24,.35)');
        fg.addColorStop(1, 'rgba(245,197,24,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(0, 0, floor.k * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // speed lines during the dive
      if (dive > 0.05) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = 'rgba(90,20,0,' + (dive * 0.55) + ')';
        const R = Math.hypot(W, H);
        for (let i = 0; i < 46; i++) {
          const a = (i / 46) * Math.PI * 2 + i * 1.7;
          const r0 = R * (0.12 + ((i * 37) % 10) / 40) * (1 - dive * 0.5);
          ctx.lineWidth = 1 + ((i * 13) % 3);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (!ok) return;

      // ---- super saiyan aura (gold flame behind the fighter)
      if (dive < 0.7) {
        const a = P.chest, ak = a.k, fade = clamp(1 - dive * 1.5);
        const pulse = 1 + Math.sin(t / 70) * 0.06;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.globalCompositeOperation = 'lighter';
        const ag = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, ak * 1.7 * pulse);
        ag.addColorStop(0, 'rgba(255,240,150,.55)');
        ag.addColorStop(0.45, 'rgba(255,190,30,.28)');
        ag.addColorStop(1, 'rgba(255,150,0,0)');
        ctx.fillStyle = ag;
        ctx.beginPath(); ctx.arc(a.x, a.y, ak * 1.7 * pulse, 0, Math.PI * 2); ctx.fill();
        // flame tongues rising off the body
        const N = 13;
        for (let i = 0; i < N; i++) {
          const f = i / (N - 1) * 2 - 1;
          const flick = 0.55 + 0.45 * Math.sin(t / 85 + i * 2.3);
          const bx = a.x + f * ak * 0.62;
          const by = a.y + ak * (0.62 - Math.abs(f) * 0.12);
          const hgt = ak * (0.95 + 0.7 * (1 - Math.abs(f))) * (0.6 + 0.5 * flick);
          const tx = bx + f * ak * 0.12 + Math.sin(t / 110 + i) * ak * 0.05;
          const ty = by - hgt;
          const w = ak * 0.2;
          const fg = ctx.createLinearGradient(0, by, 0, ty);
          fg.addColorStop(0, 'rgba(255,170,0,.0)');
          fg.addColorStop(0.35, 'rgba(255,205,40,.45)');
          fg.addColorStop(1, 'rgba(255,250,200,.05)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(bx - w, by);
          ctx.quadraticCurveTo(bx - w * 0.9, by - hgt * 0.55, tx, ty);
          ctx.quadraticCurveTo(bx + w * 0.9, by - hgt * 0.5, bx + w, by);
          ctx.closePath(); ctx.fill();
        }
        // crackling electricity
        ctx.strokeStyle = 'rgba(190,230,255,.9)';
        ctx.lineWidth = Math.max(1, ak * 0.012);
        ctx.shadowColor = 'rgba(120,200,255,.9)'; ctx.shadowBlur = 8;
        for (let i = 0; i < 5; i++) {
          if (Math.sin(t / 55 + i * 4.1) < 0.2) continue;
          let x = a.x + Math.cos(i * 1.9 + t / 400) * ak * 0.7;
          let y = a.y + Math.sin(i * 2.7 + t / 330) * ak * 0.8;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let j = 0; j < 4; j++) {
            x += (Math.sin(t / 30 + i * 7 + j * 3) * 0.5) * ak * 0.16;
            y += (Math.cos(t / 37 + i * 5 + j * 2) * 0.5 + 0.2) * ak * 0.16;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // ---- kick trail (gold arc following the foot)
      if (p > 1.0 && t < T_DIVE + 200) {
        trail.push({ x: P.foR.x, y: P.foR.y });
        if (trail.length > 14) trail.shift();
      }
      if (trail.length > 2 && dive < 0.5) {
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 1; i < trail.length; i++) {
          ctx.strokeStyle = 'rgba(245,197,24,' + (i / trail.length) * 0.7 + ')';
          ctx.lineWidth = (i / trail.length) * 0.12 * P.foR.k;
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
        }
        ctx.restore();
      }

      // ---- silhouette fighter: tapered black shapes with gold rim light
      const mid = (a, b, f) => ({
        x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), k: lerp(a.k, b.k, f), z: lerp(a.z, b.z, f), d: lerp(a.d, b.d, f),
      });
      const ext = (m, a, f) => ({ x: m.x + (a.x - m.x) * f, y: m.y + (a.y - m.y) * f, k: a.k, z: a.z, d: a.d });
      const parts = [];
      // tapered capsule between two projected points, radii in body units
      const cap = (a, ra, b, rb, z) => parts.push({ z: z === undefined ? (a.z + b.z) / 2 : z, draw(ex) {
        const r1 = ra * a.k + ex, r2 = rb * b.k + ex;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * r1, a.y + ny * r1); ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
        ctx.lineTo(b.x - nx * r2, b.y - ny * r2); ctx.lineTo(a.x - nx * r1, a.y - ny * r1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, r1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, r2, 0, Math.PI * 2); ctx.fill();
      } });
      const blob = (a, rx, ry, rot, z) => parts.push({ z: z === undefined ? a.z : z, draw(ex) {
        ctx.beginPath(); ctx.ellipse(a.x, a.y, rx * a.k + ex, ry * a.k + ex, rot || 0, 0, Math.PI * 2); ctx.fill();
      } });
      const poly = (pts, z, grow) => parts.push({ z, draw(ex) {
        ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
        ctx.fill(); ctx.lineWidth = (grow || 0) + ex * 2; ctx.stroke();
      } });

      // broad anime shoulders and a V-shaped torso
      const M = mid(P.shL, P.shR, 0.5);
      const SL = ext(M, P.shL, 1.4), SR = ext(M, P.shR, 1.4);
      const WL = ext(P.pelvis, P.hiL, 1.25), WR = ext(P.pelvis, P.hiR, 1.25);
      poly([SL, SR, WR, WL], P.chest.z, P.chest.k * 0.05);
      blob(mid(P.pelvis, P.chest, 0.78), 0.2, 0.15, 0, P.chest.z);
      blob(SL, 0.105, 0.105, 0, P.chest.z); blob(SR, 0.105, 0.105, 0, P.chest.z);
      blob(P.pelvis, 0.19, 0.12, 0, P.pelvis.z);
      cap(P.chest, 0.08, P.head, 0.065, P.head.z - 0.02);   // neck

      // legs: thick gi trousers tapering into boots
      [['hiL', 'knL', 'foL'], ['hiR', 'knR', 'foR']].forEach(([hi, kn, fo]) => {
        const cv = mid(P[kn], P[fo], 0.3);
        cap(P[hi], 0.15, P[kn], 0.095);
        cap(P[kn], 0.095, cv, 0.108);
        cap(cv, 0.108, P[fo], 0.055);
        const cuff = mid(P[kn], P[fo], 0.62);
        cap(cuff, 0.085, P[fo], 0.08, P[fo].z + 0.001);
        const kicking = fo === 'foR' && p > 1;
        if (kicking) blob(P[fo], 0.1, 0.17, 0, P[fo].z + 0.002);
        else {
          const toe = proj(toWorld([pose[fo][0], pose[fo][1] - 0.01, pose[fo][2] + (fo === 'foR' ? -0.2 : 0.2)]));
          if (toe) cap(P[fo], 0.085, toe, 0.06, P[fo].z + 0.002);
        }
      });

      // arms: bulky shoulders, tapered forearms, wristbands, fists
      [[SL, 'elL', 'haL'], [SR, 'elR', 'haR']].forEach(([sh, el, ha]) => {
        const bi = mid(sh, P[el], 0.4), fa = mid(P[el], P[ha], 0.3);
        cap(sh, 0.1, bi, 0.105);
        cap(bi, 0.105, P[el], 0.07);
        cap(P[el], 0.078, fa, 0.085);
        cap(fa, 0.085, P[ha], 0.052);
        cap(mid(P[el], P[ha], 0.58), 0.08, mid(P[el], P[ha], 0.82), 0.082, P[ha].z + 0.001);
        blob(P[ha], 0.085, 0.085, 0, P[ha].z + 0.002);
      });

      // head with iconic spiky hair
      const faceDir = toWorld([0, 0, 1]);
      const fz = faceDir[2];
      const HR = 0.14;
      blob(P.head, HR, HR * 1.12, 0, P.head.z);
      cap(proj(toWorld([pose.head[0], pose.head[1] - 0.08, pose.head[2] + 0.03])) || P.head, 0.09, proj(toWorld([pose.head[0], pose.head[1] - 0.15, pose.head[2] + 0.06])) || P.head, 0.06, P.head.z); // jaw
      const SPIKES = [
        [[0, 1, 0], [0.01, 0.5, 0], 0.095], [[-0.5, 0.85, -0.1], [-0.3, 0.42, -0.05], 0.09], [[0.5, 0.85, -0.1], [0.3, 0.42, -0.05], 0.09],
        [[-0.9, 0.45, 0], [-0.46, 0.2, -0.05], 0.085], [[0.9, 0.45, 0], [0.46, 0.2, -0.05], 0.085],
        [[-0.4, 0.6, -0.7], [-0.18, 0.2, -0.42], 0.09], [[0.4, 0.6, -0.7], [0.18, 0.2, -0.42], 0.09],
        [[0, 0.5, -0.85], [0, 0.12, -0.5], 0.1],
        [[0, 0.62, 0.78], [0.03, -0.04, 0.2], 0.06], [[-0.38, 0.62, 0.68], [-0.14, -0.08, 0.16], 0.055], [[0.38, 0.62, 0.68], [0.14, -0.08, 0.16], 0.055],
      ];
      SPIKES.forEach(([d, off, w]) => {
        const bb = proj(toWorld([pose.head[0] + d[0] * HR * 0.85, pose.head[1] + d[1] * HR * 0.85 - 0.02, pose.head[2] + d[2] * HR * 0.85]));
        const tt = proj(toWorld([pose.head[0] + d[0] * HR + off[0], pose.head[1] + d[1] * HR + off[1], pose.head[2] + d[2] * HR + off[2]]));
        if (!bb || !tt) return;
        const dx = tt.x - bb.x, dy = tt.y - bb.y, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, hw = w * ((bb.k + tt.k) / 2);
        const c1 = { x: bb.x + dx * 0.55 + nx * hw * 0.55, y: bb.y + dy * 0.55 + ny * hw * 0.55 };
        const c2 = { x: bb.x + dx * 0.5 - nx * hw * 0.5, y: bb.y + dy * 0.5 - ny * hw * 0.5 };
        parts.push({ z: bb.z + 0.004, draw(ex) {
          const e = ex * 0.9;
          ctx.beginPath();
          ctx.moveTo(bb.x + nx * (hw + e), bb.y + ny * (hw + e));
          ctx.quadraticCurveTo(c1.x + nx * e, c1.y + ny * e, tt.x + dx / len * e * 1.4, tt.y + dy / len * e * 1.4);
          ctx.quadraticCurveTo(c2.x - nx * e, c2.y - ny * e, bb.x - nx * (hw + e), bb.y - ny * (hw + e));
          ctx.closePath(); ctx.fill();
        } });
      });
      // glowing eyes + angry brow when turned toward the camera
      let eyes = null;
      if (fz > 0.15) {
        const fp = (x, y, z) => proj(toWorld([pose.head[0] + x, pose.head[1] + y, pose.head[2] + z]));
        const eL = fp(-0.055, 0.0, 0.125), eR = fp(0.055, 0.0, 0.125);
        if (eL && eR) eyes = { eL, eR, u: P.head.k * 0.016, vis: clamp(fz * 1.8) };
      }
      parts.sort((a, b) => a.z - b.z);

      ctx.save();
      ctx.shadowColor = 'rgba(255,170,0,.75)';
      ctx.shadowBlur = 20;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const rim = Math.max(1.5, P.chest.k * 0.012);
      parts.forEach((q) => {
        ctx.fillStyle = 'rgba(255,230,120,.95)'; ctx.strokeStyle = 'rgba(255,230,120,.95)';
        q.draw(rim);
      });
      ctx.shadowBlur = 0;
      parts.forEach((q) => {
        ctx.fillStyle = '#050200'; ctx.strokeStyle = '#050200';
        q.draw(0);
      });
      if (eyes) {
        const { eL, eR, u, vis } = eyes;
        ctx.globalAlpha = vis; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        [[eL, 1], [eR, -1]].forEach(([e, sd]) => {
          ctx.beginPath();
          ctx.moveTo(e.x - u * 2.2, e.y - u * 0.2 * sd); ctx.lineTo(e.x + u * 2.2, e.y + u * 0.9 * sd);
          ctx.lineTo(e.x + u * 1.6, e.y + u * 1.5); ctx.lineTo(e.x - u * 2.0, e.y + u * 0.9); ctx.closePath(); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // sole tread lines on the striking foot as it fills the frame
      if (dive > 0.35) {
        const f = P.foR, r = 0.105 * f.k * 1.55 * 0.62;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,215,90,.45)';
        ctx.lineWidth = Math.max(2, r * 0.05);
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(f.x - r * 0.8, f.y + i * r * 0.22);
          ctx.lineTo(f.x + r * 0.8, f.y + i * r * 0.22);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // freezeAt: render a single frame at that time (used for previews/tests).
    if (typeof opts.freezeAt === 'number') { draw(opts.freezeAt); return { skip() {} }; }
    raf = requestAnimationFrame(frame);
    return { skip: finish };
  }

  window.CCIntro = { start };
})();
