// Core Closet intro: a hand-drawn, silhouetted Saiyan-style fighter.
// The figure is vector artwork (bezier/polygon outlines) in a 1034 x 2048
// design space: a wide hands-on-hips stance, a half-turn spin, then a back kick
// whose boot the camera dives into before we cut to the site.

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIn = (t) => t * t * t;

  // ---------- path builders ----------
  const polyPath = (pts) => {
    const p = new Path2D();
    pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
    p.closePath();
    return p;
  };
  const smoothPath = (pts) => {
    const n = pts.length, p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      p.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]);
    }
    p.closePath();
    return p;
  };
  const S = (pts) => smoothPath(pts);
  const P = (pts) => polyPath(pts);

  // ---------- artwork (design space 1034 x 2048) ----------
  // Hair: big swept spikes, sharp edges.
  const scaleAbout = (pts, c, f) => pts.map((q) => [c[0] + (q[0] - c[0]) * f, c[1] + (q[1] - c[1]) * f]);
  const HAIR = P(scaleAbout([
    [462, 60], [515, 205], [560, 250], [830, 288], [640, 325], [700, 362], [838, 378], [650, 412], [690, 438],
    [745, 458], [590, 470], [560, 520], [440, 520], [330, 470], [268, 464], [360, 420], [310, 392], [196, 396],
    [352, 345], [240, 300], [340, 290], [228, 150], [420, 235],
  ], [520, 430], 1.22));
  const WISPS = [[[462, 60], [545, 120]], [[560, 250], [780, 240]], [[330, 262], [172, 215]]];
  const HEAD = S([[410, 395], [450, 330], [540, 325], [610, 380], [602, 470], [560, 548], [510, 578], [455, 548], [420, 480]]);
  const NECK = S([[462, 540], [575, 540], [600, 620], [440, 620]]);

  const TORSO = S([[425, 545], [300, 585], [232, 628], [272, 692], [330, 760], [392, 868], [640, 880], [700, 790], [742, 702], [790, 622], [700, 580], [606, 545]]);
  const ARM_L = S([[230, 635], [160, 700], [105, 790], [112, 880], [170, 960], [250, 1000], [330, 992], [385, 942], [380, 882], [330, 872], [262, 902], [215, 862], [250, 762], [320, 700]]);
  const ARM_R = S([[742, 640], [800, 690], [845, 780], [830, 862], [770, 932], [700, 978], [650, 952], [690, 900], [735, 860], [722, 780], [690, 720]]);
  const PANTS = S([[330, 880], [312, 1050], [272, 1300], [205, 1500], [190, 1690], [270, 1722], [350, 1682], [420, 1530], [520, 1385], [545, 1292], [562, 1400], [640, 1540], [690, 1650], [760, 1692], [830, 1652], [842, 1560], [800, 1400], [760, 1200], [702, 1050], [690, 880]]);
  const BOOT_L = S([[205, 1690], [355, 1652], [345, 1810], [300, 1870], [330, 1930], [250, 2005], [110, 2042], [90, 1992], [190, 1930], [200, 1860]]);
  const BOOT_R = S([[668, 1650], [810, 1625], [862, 1780], [955, 1852], [932, 1932], [820, 1928], [715, 1870], [716, 1790]]);
  const FRONT = [HAIR, HEAD, NECK, TORSO, ARM_L, ARM_R, PANTS, BOOT_L, BOOT_R];

  // interior detail lines (polylines drawn faintly inside the silhouette)
  const FRONT_LINES = [
    [[430, 552], [500, 706], [586, 792]], [[610, 548], [592, 782]],
    [[336, 882], [580, 908], [692, 886]], [[334, 926], [582, 948], [704, 928]],
    [[572, 944], [548, 1252], [598, 1284], [614, 952]], [[622, 944], [704, 1232], [724, 1200], [652, 932]],
    [[236, 640], [336, 748]], [[742, 640], [690, 732]],
    [[300, 900], [352, 962]], [[660, 902], [702, 964]],
    [[152, 762], [204, 862]], [[250, 822], [162, 932]], [[800, 722], [790, 822]],
    [[545, 1292], [480, 1450], [430, 1565]], [[545, 1292], [610, 1400], [700, 1565]],
    [[332, 1230], [432, 1400]], [[690, 1250], [642, 1372]], [[470, 1000], [490, 1080]],
    [[200, 1690], [352, 1654]], [[682, 1652], [828, 1626]], [[190, 1870], [336, 1832]], [[722, 1800], [858, 1776]],
  ];
  const BACK_LINES = [[[517, 590], [517, 880]], [[330, 640], [420, 720], [517, 740]], [[705, 640], [615, 720], [517, 740]]]
    .concat(FRONT_LINES.slice(2));

  // Kick pose (viewed from the side/back): standing leg, leaning torso, kicking leg out to the right.
  const K_TORSO = S([[225, 590], [330, 515], [455, 540], [505, 640], [605, 800], [695, 950], [655, 1078], [480, 1055], [360, 905], [255, 780]]);
  const K_ARM_F = S([[250, 615], [165, 722], [95, 862], [62, 990], [130, 1030], [200, 890], [285, 770]]);
  const K_FIST = S([[40, 950], [112, 925], [160, 985], [135, 1060], [60, 1050]]);
  const K_ARM_B = S([[430, 590], [560, 570], [700, 535], [790, 490], [812, 560], [710, 670], [560, 710]]);
  const K_STAND = S([[415, 1020], [655, 1050], [645, 1300], [604, 1560], [594, 1704], [418, 1724], [378, 1500], [368, 1250]]);
  const K_BOOT = S([[392, 1700], [598, 1690], [600, 1850], [670, 1934], [585, 2016], [370, 1996], [350, 1852]]);
  const K_SASH = P([[470, 1020], [300, 1100], [236, 1180], [336, 1196], [480, 1100]]);
  const K_LEG = S([[540, 925], [700, 895], [840, 885], [920, 920], [975, 885], [1030, 925], [1026, 1075], [912, 1108], [800, 1145], [690, 1175], [575, 1145]]);
  const K_SOLE = S([[975, 820], [1100, 790], [1150, 960], [1126, 1120], [1004, 1135], [955, 985]]);
  const KICK_BODY = [K_TORSO, K_ARM_F, K_FIST, K_ARM_B, K_STAND, K_BOOT, K_SASH];
  const KICK_HIP = [585, 1030];
  const BOOT_C = [1040, 960];
  const KICK_LINES = [
    [[300, 640], [400, 760]], [[480, 700], [590, 960]], [[430, 1060], [480, 1300]], [[400, 1700], [570, 1690]], [[380, 1850], [566, 1840]],
    [[620, 1000], [880, 960]], [[700, 1120], [900, 1085]],
  ];

  const T_SPIN = 800, T_KICK = 1650, T_DIVE = 2050, T_HIT = 2700;

  function start(opts) {
    const { canvas, onProgress, onImpact, onDone } = opts;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx || typeof Path2D === 'undefined') { onImpact && onImpact(); onDone && onDone(); return { skip() {} }; }

    let W = 0, H = 0, dpr = 1, sc = 1, y0 = 0;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sc = Math.min(H * 0.8 / 2048, W * 0.9 / 1200);
      y0 = H * 0.1;
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

    const RIM = 'rgba(255,205,90,1)', DARK = '#050203', LINE = 'rgba(255,170,60,.42)';

    function strokeLines(lines, w) {
      ctx.strokeStyle = LINE; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      lines.forEach((l) => {
        ctx.beginPath(); l.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      });
    }
    function eyes(front, glare) {
      ctx.save();
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 14;
      if (front) {
        [[478, 408], [566, 404]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 24, 30, 0, 0, Math.PI * 2); ctx.fill(); });
        ctx.shadowBlur = 0; ctx.fillStyle = DARK;
        [[482, 412], [562, 408]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); });
        // grin
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(488, 500); ctx.quadraticCurveTo(540, 528, 592, 480); ctx.lineTo(588, 500); ctx.quadraticCurveTo(540, 548, 494, 520); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = DARK; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(436, 372); ctx.lineTo(505, 360); ctx.moveTo(612, 352); ctx.lineTo(545, 360); ctx.stroke();
      }
      if (glare) {
        [[462, 410, -0.2], [556, 398, 0.2]].forEach(([x, y, r]) => {
          ctx.beginPath(); ctx.moveTo(x - 34, y - 8 * Math.sign(r)); ctx.lineTo(x + 34, y + 10 * Math.sign(r)); ctx.lineTo(x + 26, y + 24); ctx.lineTo(x - 30, y + 14); ctx.closePath(); ctx.fill();
        });
      }
      ctx.restore();
    }

    // draws one group of paths with a gold rim, dark fill, then faint detail lines
    function figure(paths, lines, lw) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255,140,20,1)'; ctx.shadowBlur = 40;
      ctx.strokeStyle = RIM; ctx.lineWidth = lw;
      paths.forEach((p) => ctx.stroke(p));
      ctx.shadowBlur = 0;
      ctx.fillStyle = DARK;
      paths.forEach((p) => ctx.fill(p));
      strokeLines(lines, lw * 0.55);
      ctx.restore();
    }
    function wisps() {
      ctx.save(); ctx.strokeStyle = RIM; ctx.lineWidth = 4; ctx.lineCap = 'round';
      WISPS.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); });
      ctx.restore();
    }

    function draw(t) {
      const cx = W / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#030102'; ctx.fillRect(0, 0, W, H);

      const spin = t >= T_SPIN && t < T_KICK;
      const kicking = t >= T_KICK;
      const dive = t >= T_DIVE ? easeIn(clamp((t - T_DIVE) / (T_HIT - T_DIVE))) : 0;
      const aim = t >= T_DIVE ? easeOut(clamp((t - T_DIVE) / (T_HIT - T_DIVE))) : 0;
      const ext = kicking ? easeOut(clamp((t - T_KICK) / 380)) : 0;

      // subtle warm glow right behind the character
      const gy = y0 + 1000 * sc;
      const pulse = 1 + Math.sin(t / 120) * 0.04;
      const gl = ctx.createRadialGradient(cx, gy, 0, cx, gy, H * 0.55 * pulse);
      gl.addColorStop(0, 'rgba(255,110,20,' + (0.45 + dive * 0.25) + ')');
      gl.addColorStop(0.45, 'rgba(150,45,5,.24)');
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);

      // camera: base placement + dive onto the kicking boot
      const baseCx = kicking ? 600 : 517;
      const bootX = cx + (BOOT_C[0] - baseCx) * sc, bootY = y0 + BOOT_C[1] * sc;
      const Z = lerp(1, 20, dive);
      const fx = lerp(cx, bootX, aim), fy = lerp(H / 2, bootY, aim);
      ctx.save();
      ctx.translate(cx, H / 2); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
      ctx.translate(cx, y0); ctx.scale(sc, sc); ctx.translate(-baseCx, 0);

      const lw = 15;
      if (!kicking) {
        // front stance -> half-turn spin
        let sx = 1, back = false;
        if (spin) {
          const u = easeInOut((t - T_SPIN) / (T_KICK - T_SPIN));
          const c = Math.cos(u * Math.PI * 3);
          sx = Math.max(0.04, Math.abs(c)); back = c < 0;
        }
        const bob = !spin ? Math.sin(t / 220) * 6 : 0;
        const render = (alpha, dx) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(517 + dx, bob); ctx.scale(sx, 1); ctx.translate(-517, 0);
          figure(FRONT, back ? BACK_LINES : FRONT_LINES, lw);
          wisps();
          if (!back) eyes(true, false);
          ctx.restore();
        };
        if (spin) { render(0.18, -70 * (1 - sx)); render(0.18, 70 * (1 - sx)); }
        render(1, 0);
      } else {
        // back kick: body, head glaring over the shoulder, leg thrusting out
        figure(KICK_BODY, KICK_LINES, lw);
        ctx.save();
        ctx.translate(330, 600); ctx.rotate(-0.3); ctx.translate(-520, -420);
        figure([HAIR, HEAD, NECK], [], lw);
        wisps(); eyes(false, true);
        ctx.restore();
        ctx.save();
        const k = lerp(0.35, 1, ext);
        ctx.translate(KICK_HIP[0], KICK_HIP[1]); ctx.scale(k, lerp(0.8, 1, ext)); ctx.translate(-KICK_HIP[0], -KICK_HIP[1]);
        figure([K_LEG, K_SOLE], KICK_LINES.slice(5), lw);
        // tread on the sole
        ctx.strokeStyle = 'rgba(255,200,90,.5)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(990 + i * 3, 880 + i * 36); ctx.lineTo(1110 - i * 2, 868 + i * 38); ctx.stroke(); }
        ctx.restore();
      }
      ctx.restore();

      // speed lines on the dive
      if (dive > 0.05) {
        ctx.save();
        ctx.translate(cx, H / 2);
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
