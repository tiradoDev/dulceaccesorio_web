/* ═══════════════════════════════════════════════════════════
   DULCE ACCESORIO — tweaks.js
   Panel de personalización en vivo. Persiste vía postMessage.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── PALETAS ────────────────────────────────────────────── */
  const PALETTES = {
    rose: {
      label: 'Rosé clásico',
      swatch: ['#cf8f93', '#f6e6df', '#5c3f24'],
      vars: {
        '--cream':   '#f3ede2', '--cream-dp': '#e8dfd0',
        '--blush':   '#f6e6df', '--blush-dp': '#ecd2c8',
        '--rose':    '#cf8f93', '--rose-md':  '#e0adb0',
        '--rose-lt': '#f4d9d8', '--rose-pl':  '#faeae8',
        '--mauve':   '#82515a', '--mauve-dp': '#4a2932',
        '--sand':    '#b09373', '--sand-lt':  '#d6c0a3',
        '--brown-dk':'#5c3f24', '--brown-md': '#7d6044',
      },
    },
    peach: {
      label: 'Durazno cálido',
      swatch: ['#e4a08a', '#fbe4d6', '#5e3b25'],
      vars: {
        '--cream':   '#f7ece0', '--cream-dp': '#ecdcc8',
        '--blush':   '#fbe4d6', '--blush-dp': '#f3cdb6',
        '--rose':    '#e4a08a', '--rose-md':  '#eebca8',
        '--rose-lt': '#f7d8c6', '--rose-pl':  '#fceee5',
        '--mauve':   '#9a5a47', '--mauve-dp': '#4d2a1c',
        '--sand':    '#b6896a', '--sand-lt':  '#dabb98',
        '--brown-dk':'#5e3b25', '--brown-md': '#82593a',
      },
    },
    lavender: {
      label: 'Lavanda suave',
      swatch: ['#b18ec4', '#ece0ee', '#3c2c45'],
      vars: {
        '--cream':   '#efe9ee', '--cream-dp': '#e0d6df',
        '--blush':   '#ece0ee', '--blush-dp': '#d8c7da',
        '--rose':    '#b18ec4', '--rose-md':  '#c9aedb',
        '--rose-lt': '#e2d0ec', '--rose-pl':  '#f1e5f3',
        '--mauve':   '#6f567f', '--mauve-dp': '#2f2238',
        '--sand':    '#a094a7', '--sand-lt':  '#c0b6c7',
        '--brown-dk':'#3c2c45', '--brown-md': '#5a4863',
      },
    },
    sage: {
      label: 'Sage botánico',
      swatch: ['#8aa48a', '#dde6dd', '#2c3a2c'],
      vars: {
        '--cream':   '#ebeee5', '--cream-dp': '#dadfd0',
        '--blush':   '#dde6dd', '--blush-dp': '#c2d2c2',
        '--rose':    '#a0b5a0', '--rose-md':  '#bccfbc',
        '--rose-lt': '#d6e1d6', '--rose-pl':  '#e6ede6',
        '--mauve':   '#5a7156', '--mauve-dp': '#1f2c1c',
        '--sand':    '#9aa482', '--sand-lt':  '#bbc2a4',
        '--brown-dk':'#2c3a2c', '--brown-md': '#4a5a48',
      },
    },
  };

  /* ── FUENTES ───────────────────────────────────────────── */
  const FONTS = {
    fraunces:  { label: 'Fraunces',  stack: "'Fraunces', Georgia, serif",            varSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 0" },
    cormorant: { label: 'Cormorant', stack: "'Cormorant Garamond', Georgia, serif",  varSettings: "normal" },
    playfair:  { label: 'Playfair',  stack: "'Playfair Display', Georgia, serif",    varSettings: "normal" },
    dmserif:   { label: 'DM Serif',  stack: "'DM Serif Display', Georgia, serif",    varSettings: "normal" },
  };

  /* ── ESTADO ────────────────────────────────────────────── */
  function getDefaults() {
    return (window.__tweakDefaults && typeof window.__tweakDefaults === 'object')
      ? window.__tweakDefaults
      : {};
  }

  let state = Object.assign({
    palette: 'rose',
    font: 'fraunces',
    cardShape: 'arch',
    ctaTone: 'mauve',
    hoverIntensity: 'soft',
    petals: true,
    stitchOpacity: 0.85,
  }, getDefaults());

  /* ── APLICAR ESTADO ────────────────────────────────────── */
  function apply() {
    const root = document.documentElement;
    const body = document.body;

    // Paleta
    const pal = PALETTES[state.palette] || PALETTES.rose;
    Object.entries(pal.vars).forEach(([k, v]) => root.style.setProperty(k, v));

    // Tipografía
    const f = FONTS[state.font] || FONTS.fraunces;
    root.style.setProperty('--font-display', f.stack);
    root.style.setProperty('--font-display-settings', f.varSettings);

    // Decoraciones / variantes
    body.classList.toggle('no-petals', !state.petals);
    body.dataset.cardShape = state.cardShape;
    body.dataset.ctaTone   = state.ctaTone;
    body.dataset.hover     = state.hoverIntensity;
    root.style.setProperty('--stitch-opacity', state.stitchOpacity);
  }

  function persist() {
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: state }, '*');
    } catch (e) {}
  }

  function setKey(key, val) {
    state[key] = val;
    apply();
    persist();
    syncUI();
  }

  /* ── UI ────────────────────────────────────────────────── */
  let panel = null;

  function syncUI() {
    if (!panel) return;
    panel.querySelectorAll('[data-val]').forEach((el) => {
      const cur = state[el.dataset.key];
      el.classList.toggle('active', String(cur) === String(el.dataset.val));
    });
    const petalsCb = panel.querySelector('#tk-petals');
    if (petalsCb) petalsCb.checked = !!state.petals;
    const stitch = panel.querySelector('#tk-stitch');
    const stitchVal = panel.querySelector('#tk-stitch-val');
    if (stitch) {
      stitch.value = state.stitchOpacity;
      stitchVal.textContent = parseFloat(state.stitchOpacity).toFixed(2);
    }
  }

  function buildPanel() {
    panel = document.createElement('aside');
    panel.id = 'tweaks-panel';
    panel.setAttribute('aria-label', 'Panel de personalización');
    panel.innerHTML = `
      <header class="tk-head">
        <div>
          <span class="tk-eyebrow">Personalización</span>
          <h3>Tweaks</h3>
        </div>
        <button class="tk-close" aria-label="Cerrar panel">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </header>

      <div class="tk-body">
        <section class="tk-section">
          <label class="tk-label">Paleta</label>
          <div class="tk-grid tk-grid--swatch">
            ${Object.entries(PALETTES).map(([k, v]) => `
              <button class="tk-swatch" data-key="palette" data-val="${k}" title="${v.label}">
                <span class="tk-swatch-cols">
                  <span style="background:${v.swatch[0]}"></span>
                  <span style="background:${v.swatch[1]}"></span>
                  <span style="background:${v.swatch[2]}"></span>
                </span>
                <span class="tk-swatch-label">${v.label}</span>
              </button>`).join('')}
          </div>
        </section>

        <section class="tk-section">
          <label class="tk-label">Tipografía display</label>
          <div class="tk-grid tk-grid--font">
            ${Object.entries(FONTS).map(([k, v]) => `
              <button class="tk-font" data-key="font" data-val="${k}" style="font-family:${v.stack}">
                <span class="tk-font-name">${v.label}</span>
                <span class="tk-font-sample" style="font-style:italic">Aa</span>
              </button>`).join('')}
          </div>
        </section>

        <section class="tk-section">
          <label class="tk-label">Forma de tarjeta · galería</label>
          <div class="tk-row">
            <button class="tk-pill" data-key="cardShape" data-val="arch">Arco</button>
            <button class="tk-pill" data-key="cardShape" data-val="rounded">Redondeada</button>
            <button class="tk-pill" data-key="cardShape" data-val="scalloped">Festoneada</button>
          </div>
        </section>

        <section class="tk-section">
          <label class="tk-label">Tono del CTA final</label>
          <div class="tk-row">
            <button class="tk-pill" data-key="ctaTone" data-val="mauve">Mauve</button>
            <button class="tk-pill" data-key="ctaTone" data-val="brown">Marrón</button>
            <button class="tk-pill" data-key="ctaTone" data-val="forest">Bosque</button>
          </div>
        </section>

        <section class="tk-section">
          <label class="tk-label">Hover de las piezas</label>
          <div class="tk-row">
            <button class="tk-pill" data-key="hoverIntensity" data-val="soft">Sutil</button>
            <button class="tk-pill" data-key="hoverIntensity" data-val="playful">Juguetón</button>
          </div>
        </section>

        <section class="tk-section tk-section--inline">
          <label class="tk-label" for="tk-petals">Pétalos flotantes</label>
          <label class="tk-toggle">
            <input type="checkbox" id="tk-petals" />
            <span class="tk-toggle-track"><span class="tk-toggle-dot"></span></span>
          </label>
        </section>

        <section class="tk-section">
          <label class="tk-label" for="tk-stitch">
            Textura de puntadas
            <span class="tk-val" id="tk-stitch-val">0.85</span>
          </label>
          <input type="range" min="0" max="1" step="0.05" id="tk-stitch" class="tk-range" />
        </section>
      </div>

      <footer class="tk-foot">
        <span>Tus cambios se guardan automáticamente.</span>
      </footer>
    `;
    document.body.appendChild(panel);

    panel.querySelectorAll('[data-val]').forEach((btn) => {
      btn.addEventListener('click', () => setKey(btn.dataset.key, btn.dataset.val));
    });

    panel.querySelector('#tk-petals').addEventListener('change', (e) => {
      setKey('petals', e.target.checked);
    });

    const stitch = panel.querySelector('#tk-stitch');
    const stitchVal = panel.querySelector('#tk-stitch-val');
    stitch.addEventListener('input', () => {
      const v = parseFloat(stitch.value);
      stitchVal.textContent = v.toFixed(2);
      setKey('stitchOpacity', v);
    });

    panel.querySelector('.tk-close').addEventListener('click', () => {
      hidePanel();
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
    });

    syncUI();
  }

  function showPanel() {
    if (!panel) buildPanel();
    requestAnimationFrame(() => panel.classList.add('open'));
  }
  function hidePanel() {
    if (panel) panel.classList.remove('open');
  }

  /* ── PROTOCOLO HOST ────────────────────────────────────── */
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || !d.type) return;
    if (d.type === '__activate_edit_mode')   showPanel();
    if (d.type === '__deactivate_edit_mode') hidePanel();
  });

  // Aplicar estado inicial ANTES de anunciar
  apply();

  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
