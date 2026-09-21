// Core Closet homepage — interaction layer.
// Static mockup build: no backend, no persistence.

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================
  // Preloader
  // ==========================================================
  const preloader = document.getElementById('preloader');
  const preloaderCount = document.getElementById('preloaderCount');

  if (preloader && preloaderCount) {
    document.body.classList.add('no-scroll');

    requestAnimationFrame(() => preloader.classList.add('is-visible'));

    const duration = 1900;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      preloaderCount.textContent = String(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        finishPreloader();
      }
    };
    requestAnimationFrame(tick);

    function finishPreloader() {
      setTimeout(() => {
        preloader.classList.add('is-done');
        document.body.classList.remove('no-scroll');
        setTimeout(() => preloader.classList.add('is-removed'), 900);
      }, 250);
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
