/* ═══════════════════════════════════════════════════════════
   DULCE ACCESORIO — tweaks.js
   Panel de personalización en vivo. Persiste vía postMessage.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── PALETAS ────────────────────────────────────────────── */
  const PALETTES = {
    rose: {
      label: 'Rosé pastel',
      swatch: ['#e9c5c8', '#f5e9e7', '#4a3a32'],
      vars: {
        '--cream':   '#faf7f4', '--cream-dp': '#ede7e0',
        '--blush':   '#f5e9e7', '--blush-dp': '#e9c5c8',
        '--rose':    '#e9c5c8', '--rose-md':  '#efd4d6',
        '--rose-lt': '#f5e9e7', '--rose-pl':  '#fbf3f2',
        '--mauve':   '#a17d99', '--mauve-dp': '#5a3a52',
        '--sand':    '#c9a89a', '--sand-lt':  '#e2cdc1',
        '--sage-lt': '#dee3cf', '--sage':     '#bfc7a4',
        '--brown-dk':'#4a3a32', '--brown-md': '#6e5a4f',
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
      label: 'Lila suave',
      swatch: ['#cdb7d9', '#efe5f3', '#3c2c45'],
      vars: {
        '--cream':   '#f7f3f8', '--cream-dp': '#ebe2ee',
        '--blush':   '#efe5f3', '--blush-dp': '#cdb7d9',
        '--rose':    '#cdb7d9', '--rose-md':  '#dac8e3',
        '--rose-lt': '#efe5f3', '--rose-pl':  '#f7eff8',
        '--mauve':   '#7a5e8b', '--mauve-dp': '#3c2c45',
        '--sand':    '#a8929e', '--sand-lt':  '#c8b6bf',
        '--sage-lt': '#dee3cf', '--sage':     '#bfc7a4',
        '--brown-dk':'#3c2c45', '--brown-md': '#5a4863',
      },
    },
    sage: {
      label: 'Salvia pastel',
      swatch: ['#bfc7a4', '#e3e7d2', '#3a4530'],
      vars: {
        '--cream':   '#f4f5ec', '--cream-dp': '#e6e9d8',
        '--blush':   '#e3e7d2', '--blush-dp': '#bfc7a4',
        '--rose':    '#bfc7a4', '--rose-md':  '#d2d9bd',
        '--rose-lt': '#e3e7d2', '--rose-pl':  '#eff2e3',
        '--mauve':   '#6c7556', '--mauve-dp': '#2c3520',
        '--sand':    '#a8a584', '--sand-lt':  '#c8c4a8',
        '--sage-lt': '#dee3cf', '--sage':     '#bfc7a4',
        '--brown-dk':'#3a4530', '--brown-md': '#586350',
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
