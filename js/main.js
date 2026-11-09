// Core Closet homepage — interaction layer.
// Static mockup build: no backend, no persistence.

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================
  // Preloader
  // ==========================================================
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');
  const introSkip = document.getElementById('introSkip');

  if (preloader) {
    document.body.classList.add('no-scroll');
    let introHandle = null;
    let closed = false;

    const closeIntro = () => {
      if (closed) return;
      closed = true;
      preloader.classList.add('is-done');
      document.body.classList.remove('no-scroll');
      setTimeout(() => preloader.classList.add('is-removed'), 900);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !window.CCIntro) {
      closeIntro();
    } else {
      introHandle = window.CCIntro.start({
        canvas: document.getElementById('introCanvas'),
        onProgress: (p) => { if (preloaderCount) preloaderCount.textContent = String(Math.round(p * 100)); },
        onImpact: () => preloader.classList.add('is-flash'),
        onDone: closeIntro,
      });
      if (introSkip) introSkip.addEventListener('click', () => {
        preloader.classList.add('is-flash');
        introHandle && introHandle.skip();
      });
    }
  }

  // ==========================================================
  // Header scroll state
  // ==========================================================
  const siteHeader = document.getElementById('siteHeader');
  if (siteHeader) {
    const onScroll = () => {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ==========================================================
  // Mobile nav drawer
  // ==========================================================
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================================
  // Search overlay
  // ==========================================================
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');

  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('is-open');
      const input = searchOverlay.querySelector('input');
      if (input) input.focus();
    });
  }
  if (searchClose && searchOverlay) {
    searchClose.addEventListener('click', () => {
      searchOverlay.classList.remove('is-open');
    });
  }

  // ==========================================================
  // Cart badge (demo only — no persistence)
  // ==========================================================
  let cartCount = 0;
  const cartBadge = document.getElementById('cartBadge');
  document.querySelectorAll('.product-card__img, .product-card .btn').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount += 1;
      if (cartBadge) cartBadge.textContent = String(cartCount);
    });
  });

  // ==========================================================
  // Hero slider — autoplay, progress bars, swipe
  // ==========================================================
  const heroSlider = document.getElementById('heroSlider');
  if (heroSlider) {
    const slides = Array.from(heroSlider.querySelectorAll('.hero-slide'));
    const dots = Array.from(document.querySelectorAll('#heroDots .hero-dot'));
    const SLIDE_MS = 5000;
    let index = 0;
    let timer = null;

    const setDots = (i) => {
      dots.forEach((dot, di) => {
        dot.classList.remove('is-active', 'is-filled', 'is-run');
        if (di < i) dot.classList.add('is-filled');
        if (di === i) {
          dot.style.setProperty('--dur', `${SLIDE_MS}ms`);
          dot.classList.add('is-active');
          // Force reflow so the width transition restarts every time.
          void dot.offsetWidth;
          requestAnimationFrame(() => dot.classList.add('is-run'));
        }
      });
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, si) => s.classList.toggle('is-active', si === index));
      setDots(index);
    };

    const startAutoplay = () => {
      clearInterval(timer);
      timer = setInterval(() => goTo(index + 1), SLIDE_MS);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        goTo(Number(dot.dataset.goto));
        startAutoplay();
      });
    });

    // Touch swipe support
    let touchStartX = null;
    heroSlider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    heroSlider.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        goTo(index + (dx < 0 ? 1 : -1));
        startAutoplay();
      }
      touchStartX = null;
    });

    goTo(0);
    startAutoplay();
  }

  // ==========================================================
  // Scroll-triggered reveals
  // ==========================================================
  const revealTargets = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (revealTargets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  // Brand-statement words: staggered reveal + per-word delay
  const statementWords = document.getElementById('statementWords');
  if (statementWords && 'IntersectionObserver' in window) {
    const words = statementWords.querySelectorAll('.word__in');
    words.forEach((w, i) => { w.style.transitionDelay = `${i * 70}ms`; });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(statementWords);
  } else if (statementWords) {
    statementWords.classList.add('is-visible');
  }
});
