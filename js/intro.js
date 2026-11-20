// Core Closet — intro: a golden-haired Super Saiyan style fighter throws a spinning back kick at the viewer.
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
      pelvis: [0, 1, 0], chest: [0, 1.45, 0.05], head: [0, 1.74, 0.08],
      shL: [-0.2, 1.53, 0], shR: [0.2, 1.53, 0],
      elL: [-0.3, 1.32, 0.22], elR: [0.26, 1.36, 0.2],
      haL: [-0.14, 1.55, 0.42], haR: [0.1, 1.6, 0.44],
      hiL: [-0.1, 1, 0], hiR: [0.1, 1, 0],
      knL: [-0.16, 0.52, 0.2], knR: [0.18, 0.52, -0.08],
      foL: [-0.2, 0.05, 0.38], foR: [0.24, 0.05, -0.34],
    },
    chamber: {
      pelvis: [0, 1, 0], chest: [0, 1.42, 0.12], head: [0, 1.7, 0.2],
      shL: [-0.2, 1.5, 0.05], shR: [0.2, 1.5, 0.05],
      elL: [-0.25, 1.3, 0.2], elR: [0.22, 1.3, 0.2],
      haL: [-0.1, 1.45, 0.35], haR: [0.08, 1.48, 0.36],
      hiL: [-0.1, 1, 0], hiR: [0.1, 1, 0],
      knL: [-0.1, 0.52, 0.08], knR: [0.14, 0.95, 0.3],
      foL: [-0.1, 0.05, 0.1], foR: [0.1, 0.55, -0.05],
    },
    strike: {
      pelvis: [0, 1, 0], chest: [0, 1.22, 0.5], head: [0.05, 1.28, 0.74],
      shL: [-0.2, 1.28, 0.4], shR: [0.2, 1.28, 0.4],
      elL: [-0.3, 1.15, 0.6], elR: [0.3, 1.15, 0.6],
      haL: [-0.18, 1.25, 0.8], haR: [0.18, 1.25, 0.8],
      hiL: [-0.1, 1, 0], hiR: [0.1, 1, 0],
      knL: [-0.1, 0.52, 0.1], knR: [0.1, 1.2, -0.55],
      foL: [-0.1, 0.05, 0.1], foR: [0.1, 1.48, -1.2],
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

      // ---- background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(227,30,36,' + (0.28 + dive * 0.3) + ')');
      g.addColorStop(0.6, 'rgba(60,0,2,.25)');
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
        ctx.strokeStyle = 'rgba(255,255,255,' + (dive * 0.5) + ')';
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

      // ---- body parts, painter-sorted far -> near
      const rgb = (c, z) => {
        const v = lerp(0.5, 1, clamp((z + 1.3) / 2.6));
        return 'rgb(' + Math.round(c[0] * v) + ',' + Math.round(c[1] * v) + ',' + Math.round(c[2] * v) + ')';
      };
      const SKIN = [243, 192, 152], GI = [247, 122, 18], BLUE = [34, 64, 168], GOLD = [255, 214, 40];
      const mid = (a, b, f) => ({
        x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), k: lerp(a.k, b.k, f), z: lerp(a.z, b.z, f), d: lerp(a.d, b.d, f),
      });
      const parts = [];
      const limb = (a, b, w, color) => parts.push({ type: 'limb', a, b, w, color, z: (a.z + b.z) / 2 });
      const ball = (a, r, color, ring, tall, dz) => parts.push({ type: 'ball', a, r, color, ring, tall: tall || 1, z: a.z + (dz || 0) });

      // legs: orange gi trousers, blue boots with gold trim
      [['hiL', 'knL', 'foL'], ['hiR', 'knR', 'foR']].forEach(([hi, kn, fo]) => {
        limb(P[hi], P[kn], 0.19, rgb(GI, P[kn].z));
        limb(P[kn], P[fo], 0.15, rgb(GI, P[fo].z));
        limb(mid(P[kn], P[fo], 0.55), P[fo], 0.17, rgb(BLUE, P[fo].z));
        ball(P[fo], 0.115, rgb(BLUE, P[fo].z), rgb(GOLD, P[fo].z), fo === 'foR' && p > 1 ? 1.55 : 1.1);
      });
      // torso: orange gi, blue undershirt collar, blue sash
      limb(P.pelvis, P.chest, 0.34, rgb(GI, P.chest.z));
      limb(P.chest, mid(P.chest, P.head, 0.4), 0.22, rgb(BLUE, P.chest.z));
      limb(P.pelvis, mid(P.pelvis, P.chest, 0.22), 0.38, rgb(BLUE, P.pelvis.z));
      limb(P.chest, P.head, 0.1, rgb(SKIN, P.head.z));

      // arms: bare arms, blue wristbands, skin fists
      [['shL', 'elL', 'haL'], ['shR', 'elR', 'haR']].forEach(([sh, el, ha]) => {
        limb(P[sh], P[el], 0.1, rgb(SKIN, P[el].z));
        limb(P[el], P[ha], 0.09, rgb(SKIN, P[ha].z));
        limb(mid(P[el], P[ha], 0.55), mid(P[el], P[ha], 0.9), 0.115, rgb(BLUE, P[ha].z));
        ball(P[ha], 0.085, rgb(SKIN, P[ha].z), null);
      });

      // head: skin, golden spiky hair, sharp saiyan face
      const HW = toWorld(pose.head);
      const faceDir = toWorld([0, 0, 1]);
      const fz = faceDir[2];
      const HR = 0.15;
      ball(P.head, HR, rgb(SKIN, P.head.z), null);
      ball({ x: P.head.x, y: P.head.y - HR * 0.3 * P.head.k, k: P.head.k, z: P.head.z, d: P.head.d }, HR * 1.06, rgb(GOLD, P.head.z), null, 1, -fz * 0.12 - 0.002);
      // spikes: [direction on skull, tip offset] in body space
      const SPIKES = [
        [[0, 1, 0], [0, 0.36, 0], 0.075], [[-0.5, 0.85, -0.1], [-0.2, 0.32, -0.04], 0.07], [[0.5, 0.85, -0.1], [0.2, 0.32, -0.04], 0.07],
        [[-0.9, 0.4, 0], [-0.32, 0.16, -0.05], 0.065], [[0.9, 0.4, 0], [0.32, 0.16, -0.05], 0.065],
        [[-0.4, 0.6, -0.7], [-0.12, 0.12, -0.3], 0.07], [[0.4, 0.6, -0.7], [0.12, 0.12, -0.3], 0.07],
        [[0, 0.5, -0.85], [0, 0.06, -0.34], 0.08],
        [[0, 0.62, 0.78], [0.02, -0.04, 0.15], 0.045], [[-0.38, 0.62, 0.68], [-0.1, -0.05, 0.13], 0.04], [[0.38, 0.62, 0.68], [0.1, -0.05, 0.13], 0.04],
      ];
      SPIKES.forEach(([d, off, w]) => {
        const bb = proj(toWorld([pose.head[0] + d[0] * HR * 0.9, pose.head[1] + d[1] * HR * 0.9 - 0.02, pose.head[2] + d[2] * HR * 0.9]));
        const tt = proj(toWorld([pose.head[0] + d[0] * HR + off[0], pose.head[1] + d[1] * HR + off[1], pose.head[2] + d[2] * HR + off[2]]));
        if (bb && tt) parts.push({ type: 'spike', a: bb, b: tt, w, z: bb.z + 0.004 });
      });
      // face (only when turned toward the camera)
      if (fz > 0.12) {
        const hx = pose.head[0], hy = pose.head[1], hz = pose.head[2];
        const fp = (x, y, z) => proj(toWorld([hx + x, hy + y, hz + z]));
        const face = {
          eL: fp(-0.05, 0.012, 0.112), eR: fp(0.05, 0.012, 0.112),
          bL1: fp(-0.085, 0.048, 0.1), bL2: fp(-0.02, 0.026, 0.115),
          bR1: fp(0.085, 0.048, 0.1), bR2: fp(0.02, 0.026, 0.115),
          m1: fp(-0.03, -0.055, 0.11), m2: fp(0.03, -0.055, 0.11),
        };
        if (face.eL && face.eR) parts.push({ type: 'face', f: face, k: P.head.k, a: P.head, a2: face.eL, z: P.head.z + 0.2, vis: clamp(fz * 1.6) });
      }
      parts.sort((a, b) => a.z - b.z);

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,200,40,.5)';
      ctx.shadowBlur = 14;
      parts.forEach((q) => {
        if (q.type === 'limb') {
          ctx.strokeStyle = q.color;
          ctx.lineWidth = q.w * ((q.a.k + q.b.k) / 2);
          ctx.beginPath(); ctx.moveTo(q.a.x, q.a.y); ctx.lineTo(q.b.x, q.b.y); ctx.stroke();
        } else if (q.type === 'ball') {
          const r = q.r * q.a.k;
          ctx.fillStyle = q.color;
          ctx.beginPath(); ctx.ellipse(q.a.x, q.a.y, r, r * q.tall, 0, 0, Math.PI * 2); ctx.fill();
          if (q.ring) { ctx.lineWidth = r * 0.22; ctx.strokeStyle = q.ring; ctx.stroke(); }
        } else if (q.type === 'spike') {
          const dx = q.b.x - q.a.x, dy = q.b.y - q.a.y, len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len, ny = dx / len, hw = q.w * ((q.a.k + q.b.k) / 2);
          const sg = ctx.createLinearGradient(q.a.x, q.a.y, q.b.x, q.b.y);
          sg.addColorStop(0, '#e8a200'); sg.addColorStop(0.55, '#ffd21f'); sg.addColorStop(1, '#fff6a8');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.moveTo(q.a.x + nx * hw, q.a.y + ny * hw);
          ctx.quadraticCurveTo(q.a.x + dx * 0.6 + nx * hw * 0.55, q.a.y + dy * 0.6 + ny * hw * 0.55, q.b.x, q.b.y);
          ctx.quadraticCurveTo(q.a.x + dx * 0.55 - nx * hw * 0.5, q.a.y + dy * 0.55 - ny * hw * 0.5, q.a.x - nx * hw, q.a.y - ny * hw);
          ctx.closePath(); ctx.fill();
          ctx.lineWidth = Math.max(1, hw * 0.12); ctx.strokeStyle = 'rgba(150,90,0,.55)'; ctx.stroke();
        } else if (q.type === 'face') {
          const f = q.f, u = q.k * 0.016;
          ctx.shadowBlur = 0;
          ctx.globalAlpha = q.vis;
          // eyes: sharp, teal, with dark outline
          [[f.eL, -1], [f.eR, 1]].forEach(([e, sd]) => {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(e.x, e.y, u * 1.7, u * 1.0, sd * -0.18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#19c5b4';
            ctx.beginPath(); ctx.ellipse(e.x, e.y, u * 0.95, u * 0.95, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#052a30';
            ctx.beginPath(); ctx.arc(e.x, e.y, u * 0.45, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = u * 0.4; ctx.strokeStyle = '#1b0f00';
            ctx.beginPath(); ctx.ellipse(e.x, e.y, u * 1.7, u * 1.0, sd * -0.18, Math.PI, Math.PI * 2); ctx.stroke();
          });
          // furrowed gold brows
          ctx.strokeStyle = '#c98400'; ctx.lineWidth = u * 0.95;
          [[f.bL1, f.bL2], [f.bR1, f.bR2]].forEach(([a, b]) => {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          });
          // gritted mouth
          ctx.strokeStyle = '#6b2a14'; ctx.lineWidth = u * 0.5;
          ctx.beginPath(); ctx.moveTo(f.m1.x, f.m1.y); ctx.lineTo(f.m2.x, f.m2.y); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });
      ctx.restore();

      // sole tread lines on the striking foot as it fills the frame
      if (dive > 0.35) {
        const f = P.foR, r = 0.105 * f.k * 1.55 * 0.62;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,10,40,.4)';
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
