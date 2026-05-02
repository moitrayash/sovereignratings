/* ─────────────────────────────────────────────────────────────────────
   Sovereign Credit Rating Explorer — shared client-side helpers
     1. Floating ToC builder (Google-Docs style; fades on scroll)
     2. Endnote ↔ in-text bidirectional links
     3. Dark-mode toggle (persisted)
     4. Hover tooltip system + toggle (persisted)
     5. Chart-annotation toggle (persisted)
     6. Language picker (persisted; nav-only translation for now)
     7. Footer + control rail injection (so each page only writes nav)
   ───────────────────────────────────────────────────────────────────── */

(function(){
  'use strict';

  // ── Persistence helpers ────────────────────────────────────────────
  const LS = {
    get(k, def) { try { const v = localStorage.getItem('scr_'+k); return v===null?def:v; } catch(e){return def;} },
    set(k, v)   { try { localStorage.setItem('scr_'+k, v); } catch(e){} }
  };

  // ── Theme (dark / light) ──────────────────────────────────────────
  function applyTheme(t) {
    document.body.classList.toggle('dark', t === 'dark');
    LS.set('theme', t);
    const btn = document.querySelector('[data-pill="theme"]');
    if (btn) btn.classList.toggle('on', t === 'dark');
    // Notify charts to re-skin
    document.dispatchEvent(new CustomEvent('scrThemeChanged'));
  }
  function toggleTheme() { applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark'); }

  // ── Tooltips toggle ────────────────────────────────────────────────
  function applyTooltips(state) {
    document.body.classList.toggle('no-tooltips', state === 'off');
    LS.set('tooltips', state);
    const btn = document.querySelector('[data-pill="tooltips"]');
    if (btn) btn.classList.toggle('on', state === 'on');
  }
  function toggleTooltips() {
    applyTooltips(document.body.classList.contains('no-tooltips') ? 'on' : 'off');
  }

  // ── NOTES toggle: hides every secondary annotation layer on the page ─
  //   .meta            citation meta text, chart captions / "what to look for"
  //   .endnotes        endnote block at bottom of long-form pages
  //   sup.note-ref     in-text footnote superscripts
  //   .chart-note      per-chart highlighted-event callouts
  // Pages may also define window.applyChartAnnotations(on) for extras.
  function applyAnnot(state) {
    const off = state === 'off';
    document.body.classList.toggle('no-chart-annot', off);
    document.body.classList.toggle('no-notes', off);
    LS.set('annot', state);
    const btn = document.querySelector('[data-pill="annot"]');
    if (btn) btn.classList.toggle('on', state === 'on');
    if (window.applyChartAnnotations) window.applyChartAnnotations(state === 'on');
  }
  function toggleAnnot() {
    applyAnnot(document.body.classList.contains('no-notes') ? 'on' : 'off');
  }

  // ── Language picker ────────────────────────────────────────────────
  const I18N = {
    'en': {label:'EN', nav:{}},
    'ar': {label:'AR', nav:{
      'Citations':'المراجع','Glossary':'مسرد المصطلحات','Methodology':'المنهجية',
      'Relative Ratings':'التصنيفات النسبية','Paired, Grouped & Regional Ratings':'تصنيفات مزدوجة ومجموعة وإقليمية',
      'Distance-graded Ratings':'تصنيفات مدرجة بالمسافة','Relative HDI':'مؤشر التنمية البشرية النسبي',
      'Relative Gini':'معامل جيني النسبي','Stories':'قصص','Land Acknowledgement':'إقرار بالأرض'
    }},
    'zh': {label:'ZH', nav:{
      'Citations':'引文','Glossary':'术语表','Methodology':'方法论',
      'Relative Ratings':'相对评级','Paired, Grouped & Regional Ratings':'配对、分组与区域评级',
      'Distance-graded Ratings':'按距离分级的评级','Relative HDI':'相对人类发展指数',
      'Relative Gini':'相对基尼系数','Stories':'故事','Land Acknowledgement':'土地致谢'
    }},
    'fr': {label:'FR', nav:{
      'Citations':'Citations','Glossary':'Glossaire','Methodology':'Méthodologie',
      'Relative Ratings':'Notations relatives','Paired, Grouped & Regional Ratings':'Notations appariées, groupées et régionales',
      'Distance-graded Ratings':'Notations pondérées par distance','Relative HDI':'IDH relatif',
      'Relative Gini':'Gini relatif','Stories':'Récits','Land Acknowledgement':'Reconnaissance du territoire'
    }},
    'hi': {label:'HI', nav:{
      'Citations':'संदर्भ','Glossary':'शब्दावली','Methodology':'पद्धति',
      'Relative Ratings':'सापेक्ष रेटिंग','Paired, Grouped & Regional Ratings':'युग्मित, समूहीकृत एवं क्षेत्रीय रेटिंग',
      'Distance-graded Ratings':'दूरी-श्रेणीबद्ध रेटिंग','Relative HDI':'सापेक्ष मानव विकास सूचकांक',
      'Relative Gini':'सापेक्ष जिनी','Stories':'कहानियाँ','Land Acknowledgement':'भूमि स्वीकृति'
    }},
    'ru': {label:'RU', nav:{
      'Citations':'Источники','Glossary':'Глоссарий','Methodology':'Методология',
      'Relative Ratings':'Относительные рейтинги','Paired, Grouped & Regional Ratings':'Парные, групповые и региональные рейтинги',
      'Distance-graded Ratings':'Рейтинги с учётом расстояния','Relative HDI':'Относительный ИЧР',
      'Relative Gini':'Относительный Джини','Stories':'Истории','Land Acknowledgement':'Признание земли'
    }},
    'es': {label:'ES', nav:{
      'Citations':'Citas','Glossary':'Glosario','Methodology':'Metodología',
      'Relative Ratings':'Calificaciones relativas','Paired, Grouped & Regional Ratings':'Calificaciones emparejadas, agrupadas y regionales',
      'Distance-graded Ratings':'Calificaciones por distancia','Relative HDI':'IDH relativo',
      'Relative Gini':'Gini relativo','Stories':'Relatos','Land Acknowledgement':'Reconocimiento territorial'
    }}
  };

  function applyLang(code) {
    const lang = I18N[code] || I18N.en;
    document.documentElement.lang = code;
    if (code === 'ar') document.documentElement.dir = 'rtl'; else document.documentElement.dir = 'ltr';
    document.querySelectorAll('nav.site a[data-en]').forEach(a => {
      const en = a.dataset.en;
      a.textContent = lang.nav[en] || en;
    });
    LS.set('lang', code);
    const btn = document.querySelector('[data-pill="lang"]');
    if (btn) btn.firstChild.nodeValue = (lang.label || 'EN') + ' ';
  }

  // ── Build the top-right control rail ──────────────────────────────
  function buildControls() {
    const headRow = document.querySelector('header.site .head-row');
    if (!headRow) return;
    if (headRow.querySelector('.controls-rail')) return; // already there
    const rail = document.createElement('div');
    rail.className = 'controls-rail';
    rail.innerHTML = `
      <button class="pill" data-pill="tooltips" title="Toggle hover explanations">
        <span class="dot"></span>HINTS
      </button>
      <button class="pill" data-pill="annot" title="Toggle chart annotations">
        <span class="dot"></span>NOTES
      </button>
      <div class="lang-wrap">
        <button class="pill square" data-pill="lang" title="Language">EN ▾</button>
        <div class="lang-menu" data-menu="lang">
          <button data-lang="en">English</button>
          <button data-lang="ar">العربية</button>
          <button data-lang="zh">中文</button>
          <button data-lang="fr">Français</button>
          <button data-lang="hi">हिन्दी</button>
          <button data-lang="ru">Русский</button>
          <button data-lang="es">Español</button>
        </div>
      </div>
      <button class="pill square" data-pill="theme" title="Toggle dark mode">DARK</button>
    `;
    headRow.appendChild(rail);

    rail.querySelector('[data-pill="theme"]').onclick = toggleTheme;
    rail.querySelector('[data-pill="tooltips"]').onclick = toggleTooltips;
    rail.querySelector('[data-pill="annot"]').onclick = toggleAnnot;
    const langBtn = rail.querySelector('[data-pill="lang"]');
    const langMenu = rail.querySelector('[data-menu="lang"]');
    langBtn.onclick = e => { e.stopPropagation(); langMenu.classList.toggle('open'); };
    document.addEventListener('click', () => langMenu.classList.remove('open'));
    langMenu.querySelectorAll('button').forEach(b => {
      b.onclick = () => { applyLang(b.dataset.lang); langMenu.classList.remove('open'); };
    });
  }

  // ── Inject the bottom-left attribution imprint ────────────────────
  function injectImprint() {
    if (document.querySelector('.imprint')) return;
    const im = document.createElement('div');
    im.className = 'imprint';
    im.innerHTML = '<a href="mailto:ym522@cornell.edu" title="Yash Moitra · Department of Applied Economics and Management · Cornell University">Y. Moitra · DAEM, Cornell</a>';
    document.body.appendChild(im);
  }

  // ── Inject a standard footer if page didn't include one ───────────
  function injectFooter() {
    if (document.querySelector('footer.site')) return;
    const f = document.createElement('footer');
    f.className = 'site';
    f.innerHTML = `
      <div class="row">
        <div>
          <strong>Sovereign Credit Rating Explorer</strong> &middot; Yash Moitra,
          Department of Applied Economics and Management, Cornell University.
          <div class="copyright">&copy; 2026 Yash Moitra. All rights reserved. Site, methodology, and code released under MIT; data subject to source-provider terms.</div>
        </div>
        <div class="links">
          <a href="data_acknowledgement.html">Data acknowledgement</a>
          <a href="terms.html">Terms of use</a>
          <a href="land_acknowledgement.html">Land acknowledgement</a>
          <a href="mailto:ym522@cornell.edu">ym522@cornell.edu</a>
        </div>
      </div>`;
    document.body.appendChild(f);
  }

  // ── Floating ToC ───────────────────────────────────────────────────
  function buildToc() {
    const main = document.querySelector('main');
    if (!main) return null;
    const headings = main.querySelectorAll('h2[id], h3[id]');
    if (headings.length < 3) return null;
    const wrap = document.createElement('nav');
    wrap.id = 'floating-toc';
    wrap.innerHTML = '<div class="toc-title">On this page</div><ul></ul>';
    const ul = wrap.querySelector('ul');
    headings.forEach(h => {
      const li = document.createElement('li');
      li.className = h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.href = '#' + h.id;
      const clone = h.cloneNode(true);
      clone.querySelectorAll('.section-num').forEach(s => s.remove());
      a.textContent = clone.textContent.trim();
      a.dataset.target = h.id;
      li.appendChild(a);
      ul.appendChild(li);
    });
    document.body.appendChild(wrap);
    return wrap;
  }
  let tocLinks = [];
  function indexLinks(toc) {
    if (!toc) return;
    tocLinks = Array.from(toc.querySelectorAll('a')).map(a => ({
      a, target: document.getElementById(a.dataset.target)
    })).filter(x => x.target);
  }
  function updateCurrent() {
    if (!tocLinks.length) return;
    const y = window.scrollY + 120;
    let active = tocLinks[0];
    for (const l of tocLinks) { if (l.target.offsetTop <= y) active = l; }
    tocLinks.forEach(l => l.a.classList.toggle('current', l === active));
  }
  function wireFade(toc) {
    if (!toc) return;
    let idleTimer = null;
    function onScroll() {
      if (window.scrollY > 280) toc.classList.add('visible');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => toc.classList.remove('visible'), 2400);
      updateCurrent();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    toc.addEventListener('mouseenter', () => { toc.classList.add('visible'); clearTimeout(idleTimer); });
    toc.addEventListener('mouseleave', () => { idleTimer = setTimeout(() => toc.classList.remove('visible'), 1500); });
  }

  // ── Endnote bidirectional links ────────────────────────────────────
  function wireEndnotes() {
    document.querySelectorAll('.endnotes li[id^="note-"]').forEach(li => {
      const id = li.id;
      const ref = document.querySelector(`sup.note-ref a[href="#${id}"]`);
      if (!ref) return;
      const refId = 'ref-' + id;
      ref.id = refId;
      // Avoid duplicating back-arrows on rebuilds
      if (!li.querySelector('.back-ref')) {
        const back = document.createElement('a');
        back.className = 'back-ref';
        back.href = '#' + refId;
        back.textContent = ' ↩';
        back.style.marginLeft = '4px';
        back.style.textDecoration = 'none';
        back.style.color = 'var(--muted)';
        li.appendChild(back);
      }
    });
  }

  // ── Hover-tooltip system ──────────────────────────────────────────
  // Reads window.TIPS dictionary (defined in tips.js) and any data-tip attrs.
  // Auto-decorates by class "term": uses data-term as key into TIPS; or
  // falls back to data-tip (literal text) on the element.
  let tipBox = null;
  function ensureTipBox() {
    if (tipBox) return tipBox;
    tipBox = document.createElement('div');
    tipBox.id = 'tip-box';
    document.body.appendChild(tipBox);
    return tipBox;
  }
  function lookupTip(el) {
    const dataTip = el.dataset.tip;
    if (dataTip) return { text: dataTip, source: el.dataset.tipSource || '' };
    const key = el.dataset.term;
    if (key && window.TIPS && window.TIPS[key]) return window.TIPS[key];
    return null;
  }
  function showTip(el) {
    if (document.body.classList.contains('no-tooltips')) return;
    const tip = lookupTip(el);
    if (!tip) return;
    const box = ensureTipBox();
    box.innerHTML = '';
    const p = document.createElement('div');
    p.textContent = tip.text;
    box.appendChild(p);
    if (tip.source) {
      const s = document.createElement('span');
      s.className = 'tip-source';
      s.textContent = tip.source;
      box.appendChild(s);
    }
    const r = el.getBoundingClientRect();
    const W = box.offsetWidth || 260;
    const H = box.offsetHeight || 60;
    let left = r.left + r.width / 2 - W / 2;
    let top  = r.bottom + 8;
    if (left < 8) left = 8;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (top + H > window.innerHeight - 8) top = r.top - H - 8;
    box.style.left = left + 'px';
    box.style.top = top + 'px';
    box.classList.add('visible');
  }
  function hideTip() {
    if (tipBox) tipBox.classList.remove('visible');
  }
  function wireTips() {
    document.body.addEventListener('mouseover', e => {
      const el = e.target.closest('.term, [data-tip]');
      if (el) showTip(el);
    });
    document.body.addEventListener('mouseout', e => {
      const el = e.target.closest('.term, [data-tip]');
      if (el) hideTip();
    });
    document.body.addEventListener('focusin', e => {
      const el = e.target.closest('.term, [data-tip]');
      if (el) showTip(el);
    });
    document.body.addEventListener('focusout', hideTip);
  }

  // ── Tag every term-decorated element so it shows the dotted line ──
  // (Optional sweep: makes it easy to add data-term without class)
  function decorateTerms() {
    document.querySelectorAll('[data-term]').forEach(el => el.classList.add('term'));
    document.querySelectorAll('[data-tip]').forEach(el => el.classList.add('term'));
  }

  // ── Init ───────────────────────────────────────────────────────────
  function init() {
    buildControls();
    injectImprint();
    injectFooter();
    decorateTerms();
    const toc = buildToc();
    indexLinks(toc);
    wireFade(toc);
    updateCurrent();
    wireEndnotes();
    wireTips();
    applyTheme(LS.get('theme', 'light'));
    applyTooltips(LS.get('tooltips', 'on'));
    applyAnnot(LS.get('annot', 'on'));
    applyLang(LS.get('lang', 'en'));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Centralised Plotly chart helpers (formatting standard) ────────
  // Apply the project's chart formatting requirements consistently:
  //   transparent background (so dark-mode shines through), axis lines
  //   meeting at the origin, major + minor gridlines, full modebar
  //   visible (camera/zoom/pan/home), theme-aware colors.
  // Plus a custom "Copy as PNG" modebar button that writes the chart
  // image to the system clipboard (paste into Word, Slack, email, etc).
  const COPY_ICON = {
    width: 1000, height: 1000,
    path: 'M666 0H125C56 0 0 56 0 125v541h83V125c0-23 19-42 42-42h541V0zm208 167H291c-69 0-125 56-125 125v541c0 69 56 125 125 125h583c69 0 125-56 125-125V292c0-69-56-125-125-125zm42 666c0 23-19 42-42 42H291c-23 0-42-19-42-42V292c0-23 19-42 42-42h583c23 0 42 19 42 42v541z'
  };
  function copyChartToClipboard(gd) {
    if (!window.Plotly) return;
    // Use chart's CURRENT rendered size + zoom state — captures the viewfinder
    // window the user is looking at right now, not the default extent.
    const w = (gd && gd.offsetWidth)  || 1100;
    const h = (gd && gd.offsetHeight) || 600;
    Plotly.toImage(gd, { format: 'png', width: w, height: h, scale: 2 })
      .then(dataUrl => fetch(dataUrl).then(r => r.blob()))
      .then(blob => {
        if (!navigator.clipboard || !window.ClipboardItem) {
          alert('Your browser does not support copy-image-to-clipboard. Use the camera (download) button instead.');
          return;
        }
        return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      })
      .then(() => flashToast('Chart copied as PNG (current view)'))
      .catch(err => alert('Copy failed: ' + err.message));
  }
  window.scrChartConfig = {
    displayModeBar: true, displaylogo: false, responsive: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    modeBarButtonsToAdd: [{
      name: 'Copy as PNG',
      title: 'Copy chart to clipboard',
      icon: COPY_ICON,
      click: copyChartToClipboard
    }],
    toImageButtonOptions: { format: 'png', filename: 'sovereignratings_chart', scale: 2 }
  };
  window.scrBaseLayout = function(extra) {
    const dark = document.body.classList.contains('dark');
    const fg = dark ? '#e8e8e8' : '#1a1a1a';
    const grid = dark ? 'rgba(220,220,220,0.16)' : 'rgba(60,60,60,0.16)';
    const minor = dark ? 'rgba(220,220,220,0.08)' : 'rgba(60,60,60,0.08)';
    const axisDef = {
      gridcolor: grid, gridwidth: 1,
      zeroline: true, zerolinecolor: fg, zerolinewidth: 1.2,
      showline: true, linecolor: fg, linewidth: 1,
      ticks: 'outside', tickcolor: fg, ticklen: 5,
      minor: { showgrid: true, gridcolor: minor, ticks: 'outside', ticklen: 3 }
    };
    return Object.assign({
      plot_bgcolor: 'rgba(0,0,0,0)', paper_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Helvetica Neue, Arial, sans-serif', size: 11, color: fg },
      margin: { l: 64, r: 60, t: 50, b: 92 },
      legend: { orientation: 'h', y: -0.32, x: 0.5, xanchor: 'center', font: {color: fg} },
      xaxis: Object.assign({}, axisDef),
      yaxis: Object.assign({}, axisDef)
    }, extra || {});
  };
  // ── Dark-mode chart palette: every dark/saturated trace color maps to
  //    a clean pastel that pops against the dark background.
  //    Sky blues, soft pinks, mint, lavender, peach. Light mode = unchanged.
  const DARK_SWAPS = {
    // Hero "main" dark line → bright clean sky blue
    '#1a1a1a':'#a9d6f1', '#1A1A1A':'#a9d6f1',
    '#000':'#a9d6f1',    '#000000':'#a9d6f1',
    // Secondary greys → soft pastel greys (preserve subtlety)
    '#222':'#dadada', '#222222':'#dadada',
    '#333':'#d0d0d0', '#333333':'#d0d0d0',
    '#444':'#c4c4c4', '#444444':'#c4c4c4',
    '#555':'#b8b8b8', '#555555':'#b8b8b8',
    '#666':'#acacac', '#666666':'#acacac',
    '#777':'#a0a0a0', '#777777':'#a0a0a0',
    '#888':'#dceaf3', '#888888':'#dceaf3',  // light powder-blue (was secondary line)
    // Series brand colors → pastel twins
    '#1B4F8A':'#88c4ee', '#1b4f8a':'#88c4ee',  // navy → sky blue
    '#C0392B':'#f5b3b8', '#c0392b':'#f5b3b8',  // maroon → blush pink
    '#2E7D32':'#a8e6c1', '#2e7d32':'#a8e6c1',  // forest → mint green
    '#7B3F8F':'#dbb8f0', '#7b3f8f':'#dbb8f0',  // purple → lavender
    '#B7642E':'#f8d29f', '#b7642e':'#f8d29f'   // brown → peach
  };
  const LIGHT_SWAPS = {};
  Object.keys(DARK_SWAPS).forEach(k => { LIGHT_SWAPS[DARK_SWAPS[k].toLowerCase()] = k; });

  function swapColor(c, dark) {
    if (typeof c !== 'string') return c;
    const norm = c.toLowerCase();
    if (dark)  return DARK_SWAPS[c] || DARK_SWAPS[norm] || c;
    else       return LIGHT_SWAPS[norm] || c;
  }

  // Apply dark/light theme to every Plotly chart on the page
  window.scrApplyChartTheme = function() {
    if (!window.Plotly) return;
    const dark = document.body.classList.contains('dark');
    document.querySelectorAll('.js-plotly-plot').forEach(div => {
      if (!div.data) return;
      const restyleUpdate = {};
      const keys = ['line.color', 'marker.color', 'fillcolor'];
      keys.forEach(k => restyleUpdate[k] = []);
      let needsUpdate = false;
      div.data.forEach((trace, i) => {
        // Cache original colors on first encounter
        if (!trace._scrOrig) {
          trace._scrOrig = {
            line: trace.line && trace.line.color,
            marker: trace.marker && trace.marker.color,
            fill: trace.fillcolor
          };
        }
        const orig = trace._scrOrig;
        const newLine   = swapColor(orig.line, dark);
        const newMarker = swapColor(orig.marker, dark);
        const newFill   = swapColor(orig.fill, dark);
        restyleUpdate['line.color'][i]   = newLine !== undefined ? newLine : null;
        restyleUpdate['marker.color'][i] = newMarker !== undefined ? newMarker : null;
        restyleUpdate['fillcolor'][i]    = newFill !== undefined ? newFill : null;
        if (newLine !== orig.line || newMarker !== orig.marker || newFill !== orig.fill) needsUpdate = true;
      });
      if (needsUpdate) {
        try { window.Plotly.restyle(div, restyleUpdate); } catch(e) { console.warn('chart theme restyle failed:', e); }
      }
      // Also relayout font/axis colors
      const fg = dark ? '#ececec' : '#1a1a1a';
      const grid = dark ? 'rgba(220,220,220,0.18)' : 'rgba(60,60,60,0.18)';
      try {
        window.Plotly.relayout(div, {
          'font.color': fg,
          'xaxis.color': fg, 'xaxis.gridcolor': grid, 'xaxis.linecolor': fg, 'xaxis.tickcolor': fg, 'xaxis.zerolinecolor': fg,
          'yaxis.color': fg, 'yaxis.gridcolor': grid, 'yaxis.linecolor': fg, 'yaxis.tickcolor': fg, 'yaxis.zerolinecolor': fg,
          'yaxis2.color': fg, 'yaxis2.gridcolor': grid,
          'legend.font.color': fg
        });
      } catch(e) {}
    });
  };

  // Re-apply theme when toggle fires AND when new charts appear
  document.addEventListener('scrThemeChanged', () => window.scrApplyChartTheme());

  // Legend-click fade: clicking a legend item fades all OTHER traces to ~15%
  // opacity so the clicked one stands out; clicking it again restores all.
  // Works for both solid and dashed series independently. Plotly's default
  // legend toggle is preserved via shift-click (handled inline below).
  function wireChartHooks(gd) {
    if (!gd || gd._scrHooksWired) return;
    gd._scrHooksWired = true;
    if (!window.Plotly || !gd.on) return;
    let isolated = -1;
    gd.on('plotly_legendclick', function(e) {
      if (e && e.event && e.event.shiftKey) return true; // Shift-click → default toggle
      const i = e.curveNumber;
      if (isolated === i) {
        // Restore: all opaque
        const op = gd.data.map(() => 1);
        window.Plotly.restyle(gd, { 'opacity': op });
        isolated = -1;
      } else {
        const op = gd.data.map((_, k) => k === i ? 1 : 0.18);
        window.Plotly.restyle(gd, { 'opacity': op });
        isolated = i;
      }
      return false; // suppress default toggle
    });
    // Optional: zoom event — adjust glow scale via CSS variable
    gd.on('plotly_relayout', function(ev) {
      if (!ev) return;
      const xa = gd._fullLayout && gd._fullLayout.xaxis;
      if (!xa || !xa._rl || !xa._rl.length) return;
      const fullSpan = xa._rl[1] - xa._rl[0];
      const curRange = (xa.range && (xa.range[1] - xa.range[0])) || fullSpan;
      const zoom = Math.max(0.6, Math.min(3, fullSpan / curRange));
      gd.style.setProperty('--scr-zoom', zoom.toFixed(2));
    });
  }

  // Watch for new chart-divs (charts get inserted asynchronously after page load)
  const chartObserver = new MutationObserver(muts => {
    let any = false;
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType === 1 && (n.classList && n.classList.contains('js-plotly-plot'))) any = true;
      else if (n.nodeType === 1 && n.querySelector && n.querySelector('.js-plotly-plot')) any = true;
    }));
    if (any) setTimeout(() => {
      window.scrApplyChartTheme();
      document.querySelectorAll('.js-plotly-plot').forEach(wireChartHooks);
    }, 50);
  });
  document.addEventListener('DOMContentLoaded', () => {
    chartObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      window.scrApplyChartTheme();
      document.querySelectorAll('.js-plotly-plot').forEach(wireChartHooks);
    }, 200);
  });

  // Cached fetch of extras.json (multiple consumers share one network call)
  let _extrasPromise = null;
  window.scrLoadExtras = function() {
    if (_extrasPromise) return _extrasPromise;
    _extrasPromise = fetch('extras.json').then(r => {
      if (!r.ok) throw new Error('extras.json HTTP ' + r.status);
      return r.json();
    });
    return _extrasPromise;
  };

  // ── Toast (small transient confirmation, e.g. "Copied") ───────────
  let toastEl = null, toastTimer = null;
  function flashToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'scr-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 1800);
  }
  window.flashToast = flashToast;

  // ── html2canvas loader (one-shot, cached) ─────────────────────────
  let _h2cPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (_h2cPromise) return _h2cPromise;
    _h2cPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error('html2canvas CDN failed'));
      document.head.appendChild(s);
    });
    return _h2cPromise;
  }

  // ── Generic Copy-PNG overlay button for tables, examples, figures ─
  function attachCopyButton(target) {
    if (!target || target.dataset.copyAttached === '1') return;
    target.dataset.copyAttached = '1';
    // Wrap in a positioned container so the absolute button anchors right
    let wrap;
    if (target.parentNode && target.parentNode.classList.contains('copyable-wrap')) {
      wrap = target.parentNode;
    } else {
      wrap = document.createElement('div');
      wrap.className = 'copyable-wrap';
      target.parentNode.insertBefore(wrap, target);
      wrap.appendChild(target);
    }
    const btn = document.createElement('button');
    btn.className = 'copy-png-btn';
    btn.type = 'button';
    btn.title = 'Copy as PNG';
    btn.innerHTML = '<span aria-hidden="true">&#x29C9;</span> Copy PNG';
    btn.onclick = function(ev) {
      ev.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Rendering…';
      loadHtml2Canvas()
        .then(h2c => h2c(target, { backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff', scale: 2, logging: false, useCORS: true }))
        .then(canvas => new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob returned null')), 'image/png')))
        .then(blob => {
          if (!navigator.clipboard || !window.ClipboardItem) throw new Error('clipboard API unavailable');
          return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        })
        .then(() => { flashToast('Copied as PNG'); btn.innerHTML = '<span>&#x2713;</span> Copied'; setTimeout(() => { btn.innerHTML = '<span>&#x29C9;</span> Copy PNG'; btn.disabled = false; }, 1500); })
        .catch(err => { btn.innerHTML = '<span>&#x29C9;</span> Copy PNG'; btn.disabled = false; alert('Copy failed: ' + err.message); });
    };
    wrap.appendChild(btn);
  }

  // Sweep DOM for things worth a Copy-PNG button.
  // Plotly chart-boxes already get a custom modebar button via scrChartConfig,
  // so we skip them here. We attach overlays to standalone tables, the
  // expandable worked-example blocks, and any explicitly-tagged .copyable.
  function injectCopyButtons() {
    document.querySelectorAll('main table').forEach(t => {
      if (t.closest('.copyable-wrap, .controls, .controls-rail')) return;
      attachCopyButton(t);
    });
    document.querySelectorAll('main details.example').forEach(d => attachCopyButton(d));
    document.querySelectorAll('main .copyable').forEach(d => attachCopyButton(d));
  }
  // Wait for layout, then attach. Defers until after init() has built the page.
  setTimeout(injectCopyButtons, 0);
})();
