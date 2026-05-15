/* ═══════════════════════════════════════════════════════════
   DULCE ACCESORIO — main.js
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── HERO: VIDEO → FRAME-BY-FRAME SCROLL SCRUBBING ──────── */
  const heroWrapper = document.querySelector('.hero-wrapper');
  const heroVideo   = document.querySelector('.hero-video');
  const heroSticky  = document.querySelector('.hero-sticky');
  const isMobile    = window.matchMedia('(max-width: 768px)').matches;

  if (heroVideo) {
    if (isMobile) {
      // En móvil: reproducción simple en loop (extraer ~240 frames sería pesado)
      heroVideo.setAttribute('autoplay', '');
      heroVideo.setAttribute('loop', '');
      heroVideo.muted = true;
      heroVideo.play().catch(() => {});
    } else {
      /* Pre-extraemos TODOS los frames del video como ImageBitmaps,
         y luego al scroll simplemente dibujamos el frame correspondiente
         en un canvas. Resultado: animación frame-perfect, fluida en ambos
         sentidos, sin re-decodificación. Es la técnica que usa Apple. */

      // Canvas que reemplaza al video una vez listos los frames
      const canvas = document.createElement('canvas');
      canvas.className = 'hero-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;transition:opacity 0.5s ease;';
      heroVideo.parentNode.insertBefore(canvas, heroVideo);
      const ctx = canvas.getContext('2d', { alpha: false });

      const frames    = [];      // ImageBitmap[]
      let framesReady = false;
      let lastDrawn   = -1;
      let rafPending  = false;

      function getProgress() {
        if (!heroWrapper) return 0;
        const rect  = heroWrapper.getBoundingClientRect();
        const total = heroWrapper.offsetHeight - window.innerHeight;
        if (total <= 0) return 0;
        return Math.max(0, Math.min(1, -rect.top / total));
      }

      function draw(idx) {
        const i = Math.max(0, Math.min(frames.length - 1, Math.round(idx)));
        if (i === lastDrawn) return;
        ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
        lastDrawn = i;
      }

      function tick() {
        rafPending = false;
        if (!framesReady) return;
        // Mapeo directo scroll → frame (sin lerp, frame-perfect)
        const idx = getProgress() * (frames.length - 1);
        draw(idx);
      }

      function schedule() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(tick);
      }

      /* Pipeline:
         1. Descargar video como Blob (fuerza seekable + carga completa)
         2. Esperar metadata
         3. Reproducir oculto a 4× y capturar cada frame con rVFC
         4. Mostrar canvas, ocultar <video>, activar scroll-scrub
      */
      async function loadAndExtract() {
        const src = heroVideo.getAttribute('src');
        if (!src) return;

        // 1. Blob
        const blob = await fetch(src).then(r => r.blob());
        heroVideo.src = URL.createObjectURL(blob);
        heroVideo.muted = true;
        heroVideo.load();

        // 2. Metadata
        await new Promise((resolve) => {
          if (heroVideo.readyState >= 2) return resolve();
          heroVideo.addEventListener('loadeddata', resolve, { once: true });
        });

        // Configurar canvas a resolución del video (se escala vía CSS)
        canvas.width  = heroVideo.videoWidth  || 1280;
        canvas.height = heroVideo.videoHeight || 720;

        // Dibujamos el primer frame inmediatamente como poster
        ctx.drawImage(heroVideo, 0, 0, canvas.width, canvas.height);
        canvas.style.opacity = '1';
        heroVideo.style.opacity = '0';

        // 3. Extracción con requestVideoFrameCallback
        const useRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

        if (useRVFC) {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => { if (!done) { done = true; resolve(); } };

            const onFrame = async () => {
              try {
                const bm = await createImageBitmap(heroVideo);
                frames.push(bm);
              } catch (e) { /* ignore */ }

              if (heroVideo.ended || heroVideo.currentTime >= heroVideo.duration - 0.02) {
                return finish();
              }
              heroVideo.requestVideoFrameCallback(onFrame);
            };

            heroVideo.addEventListener('ended', finish, { once: true });
            heroVideo.currentTime = 0;
            heroVideo.playbackRate = 2;
            heroVideo.requestVideoFrameCallback(onFrame);
            heroVideo.play().catch(finish);
          });
        } else {
          // Fallback: 100 frames por seek
          const TOTAL = 100;
          for (let i = 0; i < TOTAL; i++) {
            const t = (i / (TOTAL - 1)) * heroVideo.duration;
            heroVideo.currentTime = t;
            await new Promise(r => heroVideo.addEventListener('seeked', r, { once: true }));
            try {
              const bm = await createImageBitmap(heroVideo);
              frames.push(bm);
            } catch (e) { /* ignore */ }
          }
        }

        heroVideo.pause();
        heroVideo.playbackRate = 1;

        framesReady = true;
        // Posicionar al frame correcto según el scroll actual
        draw(getProgress() * (frames.length - 1));
        schedule();
      }

      loadAndExtract().catch(() => { /* silent */ });

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
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

  /* ── BOTONES: HALO QUE SIGUE AL CURSOR ──────────────────── */
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width)  * 100;
      const my = ((e.clientY - rect.top)  / rect.height) * 100;
      btn.style.setProperty('--mx', mx + '%');
      btn.style.setProperty('--my', my + '%');
    });
  });

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
