// Core Closet intro: a motion-captured fighter throws a capoeira spinning kick (meia lua de compasso).
// The skinned human mesh and its mocap clip are rendered with three.js (js/vendor/fighter3d.js) as a
// black silhouette with a gold rim on a dark backdrop. The camera then dives onto the kicking foot
// until it fills the screen and we cut to the site. If WebGL or the assets fail, we just skip ahead.

(function () {
  const T_HIT = 2700;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  function start(opts) {
    const { canvas, onProgress, onImpact, onDone } = opts;
    let raf = 0, finished = false, fighter = null, t0 = 0;

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (fighter) { try { fighter.dispose(); } catch (e) {} }
      onProgress && onProgress(1);
      onImpact && onImpact();
      setTimeout(() => onDone && onDone(), 140);
    }
    function onResize() { if (fighter) fighter.resize(); }
    function fail(e) {
      if (canvas) canvas.setAttribute('data-intro', 'error: ' + (e && e.message ? e.message : e));
      finish();
    }

    onProgress && onProgress(0);
    window.addEventListener('resize', onResize);
    const bail = setTimeout(() => { if (!fighter) fail(new Error('load timeout')); }, 9000);

    import('./vendor/fighter3d.js')
      .then((mod) => mod.createFighter(canvas, 'assets/fighter/kick.fbx'))
      .then((f) => {
        clearTimeout(bail);
        if (finished) { f.dispose(); return; }
        fighter = f;
        canvas.setAttribute('data-intro', 'playing');
        if (typeof opts.freezeAt === 'number') { f.render(opts.freezeAt); return; }
        const frame = (now) => {
          if (!t0) t0 = now;
          const t = now - t0;
          f.render(Math.min(t, T_HIT));
          onProgress && onProgress(clamp(t / T_HIT));
          if (t >= T_HIT) return finish();
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      })
      .catch((e) => { clearTimeout(bail); fail(e); });

    return { skip: finish };
  }

  window.CCIntro = { start };
})();
