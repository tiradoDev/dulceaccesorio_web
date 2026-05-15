/* ═══════════════════════════════════════════════════════════
   DULCE ACCESORIO — main.js
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── VIDEO SCROLL SCRUB ─────────────────────────────────── */
  const heroWrapper = document.querySelector('.hero-wrapper');
  const heroVideo   = document.querySelector('.hero-video');
  const isMobile    = window.matchMedia('(max-width: 768px)').matches;

  if (heroVideo) {
    if (isMobile) {
      heroVideo.setAttribute('autoplay', '');
      heroVideo.setAttribute('loop', '');
      heroVideo.muted = true;
      heroVideo.play().catch(() => {});
    } else {
      let isSeeking = false;
      let pendingProgress = null;

      function seekTo(progress) {
        if (!heroVideo || !heroWrapper) return;
        if (!isFinite(heroVideo.duration) || heroVideo.duration <= 0) return;

        const target = progress * heroVideo.duration;

        if (isSeeking) {
          pendingProgress = progress;
          return;
        }

        isSeeking = true;

        if (typeof heroVideo.fastSeek === 'function') {
          heroVideo.fastSeek(target);
        } else {
          heroVideo.currentTime = target;
        }
      }

      heroVideo.addEventListener('seeked', () => {
        isSeeking = false;
        if (pendingProgress !== null) {
          const p = pendingProgress;
          pendingProgress = null;
          seekTo(p);
        }
      });

      function getScrollProgress() {
        if (!heroWrapper) return 0;
        const rect  = heroWrapper.getBoundingClientRect();
        const total = heroWrapper.offsetHeight - window.innerHeight;
        return Math.max(0, Math.min(1, -rect.top / total));
      }

      function updateVideoScrub() {
        seekTo(getScrollProgress());
      }

      const readyEvents = ['loadedmetadata', 'canplay', 'canplaythrough'];
      readyEvents.forEach(evt => {
        heroVideo.addEventListener(evt, updateVideoScrub, { once: true });
      });

      if (heroVideo.readyState >= 1) {
        updateVideoScrub();
      }

      window.addEventListener('scroll', updateVideoScrub, { passive: true });
      window.addEventListener('resize', updateVideoScrub, { passive: true });
    }
  }

  /* ── NAV SCROLL STATE ───────────────────────────────────── */
  const siteNav = document.getElementById('site-nav');

  function updateNav() {
    if (!siteNav) return;
    siteNav.classList.toggle('scrolled', window.scrollY > 80);
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── INTERSECTION OBSERVER — FADE-IN ANIMATIONS ─────────── */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold:  0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    document.querySelectorAll('.animate-in').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.animate-in').forEach((el) => {
      el.classList.add('visible');
    });
  }

  /* ── GALERÍA HORIZONTAL — DRAG TO SCROLL ────────────────── */
  const galTrack = document.querySelector('.galeria-track');

  if (galTrack) {
    let isDown    = false;
    let startX    = 0;
    let scrollLeft = 0;

    galTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      galTrack.style.cursor = 'grabbing';
      startX     = e.pageX - galTrack.offsetLeft;
      scrollLeft = galTrack.scrollLeft;
    });

    galTrack.addEventListener('mouseleave', () => {
      isDown = false;
      galTrack.style.cursor = '';
    });

    galTrack.addEventListener('mouseup', () => {
      isDown = false;
      galTrack.style.cursor = '';
    });

    galTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - galTrack.offsetLeft;
      const walk = (x - startX) * 1.6;
      galTrack.scrollLeft = scrollLeft - walk;
    });
  }

  /* ── SMOOTH ANCHOR SCROLL ───────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      e.preventDefault();

      const heroH = heroWrapper ? heroWrapper.offsetHeight : 0;
      const isInHero = link.getAttribute('href') === '#hero';

      if (isInHero) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const offset    = siteNav ? siteNav.offsetHeight + 16 : 0;

      window.scrollTo({ top: targetTop - offset, behavior: 'smooth' });
    });
  });

})();
