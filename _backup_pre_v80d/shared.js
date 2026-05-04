/* ─────────────────────────────────────────────────────────────────────
   Sovereign Ratings & Scores — shared client-side helpers
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
    'en': {label:'EN', nav:{}, h1:'Sovereign Ratings & Scores', tagline:null},
    'ar': {label:'AR', nav:{
      'Citations':'المراجع','Glossary':'مسرد المصطلحات','Methodology':'المنهجية',
      'Relative Ratings':'التصنيفات النسبية','Paired, Grouped & Regional Ratings':'تصنيفات مزدوجة ومجموعة وإقليمية',
      'Distance-graded Ratings':'تصنيفات مدرجة بالمسافة','Shadow Ratings':'التصنيفات الظلية','Relative HDI':'مؤشر التنمية البشرية النسبي',
      'Relative Gini':'معامل جيني النسبي','Stories':'قصص','Land Acknowledgement':'إقرار بالأرض'
    }, h1:'مستكشف التصنيف الائتماني السيادي',
       tagline:'151 دولة · ستاندرد آند بورز، موديز، دي بي آر إس مورنينغستار · 2000–2025 · درجات مركبة (0–60) · طرق نسبية M1–M4'},
    'zh': {label:'ZH', nav:{
      'Citations':'引文','Glossary':'术语表','Methodology':'方法论',
      'Relative Ratings':'相对评级','Paired, Grouped & Regional Ratings':'配对、分组与区域评级',
      'Distance-graded Ratings':'按距离分级的评级','Shadow Ratings':'影子评级','Relative HDI':'相对人类发展指数',
      'Relative Gini':'相对基尼系数','Stories':'故事','Land Acknowledgement':'土地致谢'
    }, h1:'主权信用评级浏览器',
       tagline:'151 个国家 · 标普、穆迪、DBRS · 2000–2025 · 综合评分 (0–60) · 相对方法 M1–M4'},
    'fr': {label:'FR', nav:{
      'Citations':'Citations','Glossary':'Glossaire','Methodology':'Méthodologie',
      'Relative Ratings':'Notations relatives','Paired, Grouped & Regional Ratings':'Notations appariées, groupées et régionales',
      'Distance-graded Ratings':'Notations pondérées par distance','Shadow Ratings':'Notations implicites','Relative HDI':'IDH relatif',
      'Relative Gini':'Gini relatif','Stories':'Récits','Land Acknowledgement':'Reconnaissance du territoire'
    }, h1:'Explorateur de notations souveraines de crédit',
       tagline:'151 pays · S&P, Moody’s, DBRS · 2000–2025 · Scores composites (0–60) · Méthodes relatives M1–M4'},
    'hi': {label:'HI', nav:{
      'Citations':'संदर्भ','Glossary':'शब्दावली','Methodology':'पद्धति',
      'Relative Ratings':'सापेक्ष रेटिंग','Paired, Grouped & Regional Ratings':'युग्मित, समूहीकृत एवं क्षेत्रीय रेटिंग',
      'Distance-graded Ratings':'दूरी-श्रेणीबद्ध रेटिंग','Shadow Ratings':'छाया रेटिंग','Relative HDI':'सापेक्ष मानव विकास सूचकांक',
      'Relative Gini':'सापेक्ष जिनी','Stories':'कहानियाँ','Land Acknowledgement':'भूमि स्वीकृति'
    }, h1:'संप्रभु क्रेडिट रेटिंग एक्सप्लोरर',
       tagline:'151 देश · S&P, मूडीज़, DBRS · 2000–2025 · संयुक्त स्कोर (0–60) · सापेक्ष विधियाँ M1–M4'},
    'ru': {label:'RU', nav:{
      'Citations':'Источники','Glossary':'Глоссарий','Methodology':'Методология',
      'Relative Ratings':'Относительные рейтинги','Paired, Grouped & Regional Ratings':'Парные, групповые и региональные рейтинги',
      'Distance-graded Ratings':'Рейтинги с учётом расстояния','Shadow Ratings':'Теневые рейтинги','Relative HDI':'Относительный ИЧР',
      'Relative Gini':'Относительный Джини','Stories':'Истории','Land Acknowledgement':'Признание земли'
    }, h1:'Обозреватель суверенных кредитных рейтингов',
       tagline:'151 страна · S&P, Moody’s, DBRS · 2000–2025 · Сводные оценки (0–60) · Относительные методы M1–M4'},
    'es': {label:'ES', nav:{
      'Citations':'Citas','Glossary':'Glosario','Methodology':'Metodología',
      'Relative Ratings':'Calificaciones relativas','Paired, Grouped & Regional Ratings':'Calificaciones emparejadas, agrupadas y regionales',
      'Distance-graded Ratings':'Calificaciones por distancia','Shadow Ratings':'Calificaciones sombra','Relative HDI':'IDH relativo',
      'Relative Gini':'Gini relativo','Stories':'Relatos','Land Acknowledgement':'Reconocimiento territorial'
    }, h1:'Explorador de calificaciones crediticias soberanas',
       tagline:'151 países · S&P, Moody’s, DBRS · 2000–2025 · Puntuaciones compuestas (0–60) · Métodos relativos M1–M4'}
  };

  function applyLang(code) {
    const lang = I18N[code] || I18N.en;
    document.documentElement.lang = code;
    if (code === 'ar') document.documentElement.dir = 'rtl'; else document.documentElement.dir = 'ltr';
    document.querySelectorAll('nav.site a[data-en]').forEach(a => {
      const en = a.dataset.en;
      a.textContent = lang.nav[en] || en;
    });
    // Header h1 and sub-tagline
    const h1 = document.querySelector('header.site h1');
    if (h1) {
      if (!h1.dataset.en) h1.dataset.en = h1.textContent.trim();
      h1.textContent = lang.h1 || h1.dataset.en;
    }
    const tag = document.querySelector('header.site .sub-tagline');
    if (tag) {
      if (!tag.dataset.en) tag.dataset.en = tag.innerHTML;
      tag.innerHTML = lang.tagline || tag.dataset.en;
    }
    LS.set('lang', code);
    const btn = document.querySelector('[data-pill="lang"]');
    if (btn) btn.firstChild.nodeValue = (lang.label || 'EN') + ' ';
  }
  // Expose so nav.js can re-apply after rendering nav items with data-en
  window.scrReapplyLang = function() {
    applyLang(LS.get('lang', 'en'));
  };

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
      <button class="pill square" data-pill="theme" title="Toggle dark mode">DARK</button>
    `;
    headRow.appendChild(rail);

    // Small advisory note immediately below the controls rail, styled like the
    // sub-tagline so it sits unobtrusively in the top-right corner.
    if (!document.querySelector('.scr-best-note')) {
      const note = document.createElement('div');
      note.className = 'scr-best-note';
      note.textContent = 'For best results, use dark mode, on a computer.';
      headRow.appendChild(note);
    }

    rail.querySelector('[data-pill="theme"]').onclick = toggleTheme;
    rail.querySelector('[data-pill="tooltips"]').onclick = toggleTooltips;
    rail.querySelector('[data-pill="annot"]').onclick = toggleAnnot;
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
          <strong>Sovereign Ratings & Scores</strong> &middot; Yash Moitra,
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
    // Touch support: tap a term to toggle tooltip; tap elsewhere to dismiss
    let _activeTip = null;
    document.body.addEventListener('click', e => {
      const el = e.target.closest('.term, [data-tip]');
      if (el) {
        if (_activeTip === el) { hideTip(); _activeTip = null; }
        else { showTip(el); _activeTip = el; }
        e.stopPropagation();
      } else if (_activeTip) {
        hideTip();
        _activeTip = null;
      }
    });
  }

  // ── Tag every term-decorated element so it shows the dotted line ──
  // (Optional sweep: makes it easy to add data-term without class)
  function decorateTerms() {
    document.querySelectorAll('[data-term]').forEach(el => el.classList.add('term'));
    document.querySelectorAll('[data-tip]').forEach(el => el.classList.add('term'));
  }

  // ── Auto-decorate technical vocabulary across the site ───────────
  // Reads window.TIPS_ALIASES (alias text → tips key) and walks the body
  // for the first occurrence of each alias. Wraps that occurrence with
  // <span class="term" data-term="key">…</span> so the existing hover
  // tooltip system picks it up. First-occurrence-per-page only keeps the
  // page from becoming a forest of dotted underlines.
  //
  // Skip rules (do NOT auto-wrap inside these):
  //   - any <code>, <script>, <style>, <pre>, <a>, <button>, <sup>, <input>, <textarea>
  //   - any element already inside a .term, .copy-png-bar, .controls-rail
  //   - any heading (h1–h6) or table header (th)
  //   - the floating ToC, nav, footer, control rail, and chart modebar
  //   - elements with data-no-autotip attribute (escape hatch)
  function scrAutoDecorateTerms() {
    if (!window.TIPS_ALIASES || !window.TIPS) return;
    const seen = new Set();
    // Sort aliases longest-first so "credit ratings" matches before "rating"
    const aliases = Object.keys(window.TIPS_ALIASES).sort((a, b) => b.length - a.length);
    if (!aliases.length) return;
    // Build one big regex: \b(alias1|alias2|…)\b — case-insensitive
    function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const re = new RegExp('\\b(' + aliases.map(escRe).join('|') + ')\\b', 'i');

    const SKIP_TAGS = new Set(['CODE','SCRIPT','STYLE','PRE','A','BUTTON','SUP','INPUT','TEXTAREA','SELECT','OPTION','LABEL','TH','H1','H2','H3','H4','H5','H6','SVG','CANVAS']);
    function isInsideSkip(node) {
      let p = node.parentNode;
      while (p && p !== document.body) {
        if (p.nodeType === 1) {
          if (SKIP_TAGS.has(p.tagName)) return true;
          if (p.dataset && p.dataset.noAutotip !== undefined) return true;
          const cl = p.classList;
          if (cl && (cl.contains('term') || cl.contains('copy-png-bar') ||
                     cl.contains('controls-rail') || cl.contains('controls') ||
                     cl.contains('lang-menu') || cl.contains('chart-note') ||
                     cl.contains('section-num') || cl.contains('back-ref'))) return true;
          if (p.id === 'floating-toc' || p.id === 'tip-box' || p.id === 'scr-toast') return true;
        }
        p = p.parentNode;
      }
      return false;
    }

    // Containers worth scanning. Restricted to main content + a few callouts;
    // everything else (nav, footer, controls, charts) is ignored.
    const scopes = document.querySelectorAll(
      'main p, main li, main td, main dd, main summary, main figcaption, ' +
      'main .callout, main .ex-body, main .step, main blockquote'
    );
    scopes.forEach(scope => {
      // Walk text nodes inside this scope. We collect them first because
      // mutating the tree inside the walker would invalidate it.
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.nodeValue && n.nodeValue.trim().length > 1 && !isInsideSkip(n))
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      });
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(tn => {
        const txt = tn.nodeValue;
        const m = txt.match(re);
        if (!m) return;
        const surface = m[1];
        const key = window.TIPS_ALIASES[surface.toLowerCase()];
        if (!key || seen.has(key) || !window.TIPS[key]) return;
        const idx = m.index;
        const before = txt.slice(0, idx);
        const after  = txt.slice(idx + surface.length);
        const span = document.createElement('span');
        span.className = 'term';
        span.dataset.term = key;
        span.dataset.autotip = '1'; // tag for debugging / future cleanup
        span.textContent = surface;
        const parent = tn.parentNode;
        if (before) parent.insertBefore(document.createTextNode(before), tn);
        parent.insertBefore(span, tn);
        if (after) parent.insertBefore(document.createTextNode(after), tn);
        parent.removeChild(tn);
        seen.add(key);
      });
    });
  }
  window.scrAutoDecorateTerms = scrAutoDecorateTerms;

  // ── Init ───────────────────────────────────────────────────────────
  function init() {
    buildControls();
    injectImprint();
    injectFooter();
    decorateTerms();
    scrAutoDecorateTerms();
    const toc = buildToc();
    indexLinks(toc);
    wireFade(toc);
    updateCurrent();
    wireEndnotes();
    wireTips();
    applyTheme(LS.get('theme', 'light'));
    applyTooltips(LS.get('tooltips', 'on'));
    applyAnnot(LS.get('annot', 'on'));
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
  // Icons for the modebar buttons (Fullscreen / Download / Copy / Share)
  const COPY_ICON = {
    width: 1000, height: 1000,
    path: 'M666 0H125C56 0 0 56 0 125v541h83V125c0-23 19-42 42-42h541V0zm208 167H291c-69 0-125 56-125 125v541c0 69 56 125 125 125h583c69 0 125-56 125-125V292c0-69-56-125-125-125zm42 666c0 23-19 42-42 42H291c-23 0-42-19-42-42V292c0-23 19-42 42-42h583c23 0 42 19 42 42v541z'
  };
  const DOWNLOAD_ICON = {
    width: 857.1, height: 1000,
    path: 'M857.1 250v607.1q0 14.7-10.7 25.4t-25.4 10.7H35.7Q21 893.2 10.3 882.5t-10.7-25.4V35.7Q-.4 21 10.3 10.3t25.4-10.7h607.1q14.7 0 32.1 6.7t28.6 17.9l138.4 138.4q11.2 11.2 17.9 28.6t6.7 32.1zM214.3 35.7v178.6q0 7.4 5.4 12.8t12.8 5.4h392.9q7.4 0 12.8-5.4t5.4-12.8V35.7q0-7.4-5.4-12.8t-12.8-5.4H232.5q-7.4 0-12.8 5.4t-5.4 12.8zm428.6 535.7q0-37.2-26.4-63.5t-63.5-26.4-63.5 26.4-26.4 63.5 26.4 63.5 63.5 26.4 63.5-26.4 26.4-63.5z'
  };
  const SHARE_ICON = {
    width: 1000, height: 1000,
    path: 'M750 600c-39 0-74 15-100 40L350 470c2-7 4-13 4-20 0-7-2-13-4-20l296-148c27 26 64 42 104 42 83 0 150-67 150-150S833 24 750 24s-150 67-150 150c0 7 2 13 4 20L308 342c-27-26-64-42-104-42-83 0-150 67-150 150s67 150 150 150c40 0 77-16 104-42l300 175c-2 7-4 13-4 20 0 81 66 147 146 147s146-66 146-147-66-153-146-153z'
  };
  const FULLSCREEN_ICON = {
    width: 1000, height: 1000,
    path: 'M0 333V0h333v83H83v250H0zm667 0V83H417V0h333v333h-83zM0 667h83v250h250v83H0V667zm917 0v250H667v83h333V667h-83z'
  };

  // ── Chicago citation auto-embedded on every image export (PNG only).
  //   Plain CSVs / ZIPs / LaTeX are untouched. The strip is appended below
  //   the chart so it never overlaps content; small grey on white.
  const SCR_CITATION = 'Source: Moitra, Yash. 2026. Sovereign Ratings & Scores. sovereignratings.yashmoitra.com';
  function appendCitationToCanvas(srcCanvas) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const fontSize = Math.max(12, Math.round(w / 110));
    const padX = Math.round(fontSize * 1.4);
    const stripH = Math.round(fontSize * 2.2);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h + stripH;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(srcCanvas, 0, 0);
    ctx.fillStyle = '#9a9a9a';
    ctx.font = fontSize + 'px Helvetica Neue, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(SCR_CITATION, w - padX, h + stripH / 2);
    return out;
  }
  function canvasToPngBlob(canvas) {
    return new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob null')), 'image/png'));
  }
  function dataUrlToImg(dataUrl) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('image decode failed'));
      img.src = dataUrl;
    });
  }
  window.scrAppendCitation = appendCitationToCanvas;

  // Force white background + dark text for any export (download/copy/share)
  // so PNGs are legible on Slack dark mode, Notion, email clients, etc.
  function chartLayoutForExport(layoutOrig) {
    const layout = JSON.parse(JSON.stringify(layoutOrig || {}));
    layout.paper_bgcolor = '#ffffff';
    layout.plot_bgcolor = '#ffffff';
    layout.font = layout.font || {};
    layout.font.color = '#1a1a1a';
    ['xaxis','yaxis','xaxis2','yaxis2','xaxis3','yaxis3'].forEach(ax => {
      if (!layout[ax]) return;
      layout[ax].color = '#1a1a1a';
      layout[ax].gridcolor = 'rgba(60,60,60,0.18)';
      layout[ax].linecolor = '#1a1a1a';
      layout[ax].zerolinecolor = '#1a1a1a';
      layout[ax].tickcolor = '#1a1a1a';
      if (layout[ax].minor) layout[ax].minor.gridcolor = 'rgba(60,60,60,0.08)';
      if (layout[ax].title && typeof layout[ax].title === 'object') {
        layout[ax].title.font = layout[ax].title.font || {};
        layout[ax].title.font.color = '#1a1a1a';
      }
    });
    if (layout.legend) {
      layout.legend.font = layout.legend.font || {};
      layout.legend.font.color = '#1a1a1a';
    }
    if (Array.isArray(layout.annotations)) {
      layout.annotations.forEach(a => {
        if (!a) return;
        if (a.font) a.font.color = '#1a1a1a';
        if (a.arrowcolor) a.arrowcolor = '#1a1a1a';
      });
    }
    return layout;
  }
  function chartDataForExport(dataOrig) {
    const data = JSON.parse(JSON.stringify(dataOrig || []));
    function fix(v) {
      if (Array.isArray(v)) return v.map(c => swapColor(c, false));
      return swapColor(v, false);
    }
    data.forEach(t => {
      if (!t) return;
      if (t.line && t.line.color !== undefined) t.line.color = fix(t.line.color);
      if (t.marker && t.marker.color !== undefined) t.marker.color = fix(t.marker.color);
      if (t.fillcolor !== undefined) t.fillcolor = fix(t.fillcolor);
      if (t.textfont && t.textfont.color !== undefined) t.textfont.color = fix(t.textfont.color);
    });
    return data;
  }
  // Render the current chart offscreen with white bg + dark text and return a PNG blob
  // with the Chicago citation strip appended below. The visible chart is never disturbed.
  function chartToWhiteBlob(gd) {
    if (!window.Plotly) return Promise.reject(new Error('Plotly not loaded'));
    const w = (gd && gd.offsetWidth)  || 1100;
    const h = (gd && gd.offsetHeight) || 600;
    const data = chartDataForExport(gd.data || []);
    const layout = chartLayoutForExport(gd.layout || {});
    const off = document.createElement('div');
    off.style.cssText = 'position:fixed;left:-99999px;top:0;width:'+w+'px;height:'+h+'px;background:#ffffff;';
    document.body.appendChild(off);
    return Plotly.newPlot(off, data, layout, { staticPlot: true, displayModeBar: false })
      .then(() => Plotly.toImage(off, { format: 'png', width: w, height: h, scale: 2 }))
      .then(dataUrl => {
        try { Plotly.purge(off); } catch(e){}
        off.remove();
        return dataUrlToImg(dataUrl);
      })
      .then(img => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return canvasToPngBlob(appendCitationToCanvas(c));
      })
      .catch(err => {
        try { Plotly.purge(off); } catch(e){}
        if (off.parentNode) off.remove();
        throw err;
      });
  }

  function downloadChartWhite(gd) {
    chartToWhiteBlob(gd).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sovereignratings_chart.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flashToast('Downloaded PNG');
    }).catch(err => alert('Download failed: ' + err.message));
  }
  function copyChartToClipboard(gd) {
    chartToWhiteBlob(gd).then(blob => {
      if (!navigator.clipboard || !window.ClipboardItem) {
        alert('Your browser does not support copy-image-to-clipboard.');
        return;
      }
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }).then(() => flashToast('Chart copied as PNG'))
      .catch(err => alert('Copy failed: ' + err.message));
  }
  function shareChartAsPng(gd) {
    chartToWhiteBlob(gd).then(blob => {
      const file = new File([blob], 'sovereignratings_chart.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({
          files: [file],
          title: 'Sovereign Credit Rating chart',
          text: 'sovereignratings.yashmoitra.com'
        }).then(() => flashToast('Shared'));
      }
      // Fallback 1: clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          .then(() => flashToast('Share unavailable; copied to clipboard'));
      }
      // Fallback 2: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'sovereignratings_chart.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flashToast('Share unavailable; downloaded');
    }).catch(err => {
      if (err && err.name === 'AbortError') return;
      alert('Share failed: ' + err.message);
    });
  }

  function toggleChartFullscreen(gd) {
    const target = gd.parentElement || gd; // chart-box wrapper if available
    if (!document.fullscreenElement) {
      const req = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
      if (req) req.call(target).then(() => {
        setTimeout(() => window.Plotly && window.Plotly.Plots.resize(gd), 100);
      }).catch(e => alert('Fullscreen failed: ' + e.message));
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit) exit.call(document);
    }
  }
  // When the user exits fullscreen via Esc, force a chart resize
  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      document.querySelectorAll('.js-plotly-plot').forEach(gd => window.Plotly && window.Plotly.Plots.resize(gd));
    }, 100);
  });

  window.scrChartConfig = {
    displayModeBar: true, displaylogo: false, responsive: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'toImage'],
    modeBarButtonsToAdd: [
      { name: 'Fullscreen', title: 'Toggle fullscreen', icon: FULLSCREEN_ICON, click: toggleChartFullscreen },
      { name: 'Download as PNG (white bg)', title: 'Download as PNG (white bg, with citation)', icon: DOWNLOAD_ICON, click: downloadChartWhite },
      { name: 'Copy as PNG', title: 'Copy chart to clipboard (white bg, with citation)', icon: COPY_ICON, click: copyChartToClipboard },
      { name: 'Share as PNG', title: 'Share chart as PNG (white bg, with citation)', icon: SHARE_ICON, click: shareChartAsPng }
    ]
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
        // Handle both string colors and arrays of colors (per-bar coloring)
        function swapMaybeArray(v) {
          if (Array.isArray(v)) return v.map(c => swapColor(c, dark));
          return swapColor(v, dark);
        }
        const newLine   = swapMaybeArray(orig.line);
        const newMarker = swapMaybeArray(orig.marker);
        const newFill   = swapMaybeArray(orig.fill);
        restyleUpdate['line.color'][i]   = newLine   !== undefined ? newLine   : null;
        restyleUpdate['marker.color'][i] = newMarker !== undefined ? newMarker : null;
        restyleUpdate['fillcolor'][i]    = newFill   !== undefined ? newFill   : null;
        needsUpdate = true; // always restyle to be safe (idempotent)
      });
      if (needsUpdate) {
        try { window.Plotly.restyle(div, restyleUpdate); } catch(e) { console.warn('chart theme restyle failed:', e); }
      }
      // Re-apply formatting standard: text colors, grid (major+minor),
      // zero anchor, axis lines + tickmarks, plus directional arrows.
      const fg = dark ? '#ececec' : '#1a1a1a';
      const grid = dark ? 'rgba(220,220,220,0.18)' : 'rgba(60,60,60,0.18)';
      const minorGrid = dark ? 'rgba(220,220,220,0.08)' : 'rgba(60,60,60,0.08)';
      // Guard: don't recurse if we're already mid-relayout for this div
      if (div._scrThemingNow) return;
      div._scrThemingNow = true;
      try {
        window.Plotly.relayout(div, {
          'font.color': fg,
          'xaxis.color': fg, 'xaxis.gridcolor': grid, 'xaxis.linecolor': fg, 'xaxis.tickcolor': fg, 'xaxis.zerolinecolor': fg,
          'yaxis.color': fg, 'yaxis.gridcolor': grid, 'yaxis.linecolor': fg, 'yaxis.tickcolor': fg, 'yaxis.zerolinecolor': fg,
          'yaxis2.color': fg, 'yaxis2.gridcolor': grid,
          'legend.font.color': fg
        });
      } catch(e) {}
      setTimeout(() => { div._scrThemingNow = false; }, 200);
    });
  };

  // Re-apply theme when toggle fires AND when new charts appear
  document.addEventListener('scrThemeChanged', () => window.scrApplyChartTheme());

  // Legend-click fade: clicking a legend item fades all OTHER traces to ~15%
  // opacity so the clicked one stands out; clicking it again restores all.
  // Works for both solid and dashed series independently. Plotly's default
  // legend toggle is preserved via shift-click (handled inline below).
  // Idempotent axis-arrow injector. Re-applies on every Plotly render via
  // plotly_afterplot — pages that call Plotly.newPlot in slider handlers wipe
  // annotations, so we re-add them. Guard against relayout itself triggering
  // afterplot infinitely with _scrInjectingArrows flag.
  function applyAxisArrows(gd) {
    if (!gd || !window.Plotly) return;
    const lo = gd._fullLayout;
    if (!lo) return;
    if (gd._scrInjectingArrows) return;
    const hasOurs = (lo.annotations || []).some(a => a && a._scrAxisArrow);
    if (hasOurs) return; // arrows already present; no-op
    const fg = document.body.classList.contains('dark') ? '#ececec' : '#1a1a1a';
    const titleX = (lo.xaxis && lo.xaxis.title && (lo.xaxis.title.text || '')) || '';
    const titleY = (lo.yaxis && lo.yaxis.title && (lo.yaxis.title.text || '')) || '';
    const existing = (lo.annotations || []).filter(a => !a._scrAxisArrow);
    // Each arrow IS the visual extension of its axis line: ax/ay is the start
    // point right where the axis ends, (x, y) is the tip with a chunky arrowhead.
    // Then a separate text-only annotation sits beside the arrowhead with the unit.
    const arrows = [
      // X-axis line extension — runs along y=0 from inside the chart out past x=1
      { _scrAxisArrow: true, xref: 'paper', yref: 'paper',
        ax: 0.995, ay: 0, axref: 'paper', ayref: 'paper',
        x: 1.04, y: 0,
        showarrow: true, arrowhead: 3, arrowsize: 1.2, arrowwidth: 1.4, arrowcolor: fg,
        text: '', standoff: 0, startstandoff: 0 },
      // X-axis unit label
      { _scrAxisArrow: true, xref: 'paper', yref: 'paper', x: 1.045, y: 0,
        xanchor: 'left', yanchor: 'middle', xshift: 4, yshift: 0,
        showarrow: false, text: titleX || '',
        font: { size: 10, color: fg, family: 'Helvetica Neue, Arial, sans-serif' }, opacity: 0.95 },
      // Y-axis line extension — runs along x=0 from inside the chart up past y=1
      { _scrAxisArrow: true, xref: 'paper', yref: 'paper',
        ax: 0, ay: 0.995, axref: 'paper', ayref: 'paper',
        x: 0, y: 1.05,
        showarrow: true, arrowhead: 3, arrowsize: 1.2, arrowwidth: 1.4, arrowcolor: fg,
        text: '', standoff: 0, startstandoff: 0 },
      // Y-axis unit label
      { _scrAxisArrow: true, xref: 'paper', yref: 'paper', x: 0, y: 1.055,
        xanchor: 'left', yanchor: 'bottom', xshift: 8, yshift: 4,
        showarrow: false, text: titleY || '',
        font: { size: 10, color: fg, family: 'Helvetica Neue, Arial, sans-serif' }, opacity: 0.95 },
      // 0,0 union marker at the chart origin
      { _scrAxisArrow: true, xref: 'paper', yref: 'paper', x: 0, y: 0,
        xanchor: 'right', yanchor: 'top', xshift: -4, yshift: -4,
        showarrow: false, text: '0,0',
        font: { size: 10, color: fg, family: 'Helvetica Neue, Arial, sans-serif' }, opacity: 0.95 }
    ];
    gd._scrInjectingArrows = true;
    try {
      window.Plotly.relayout(gd, { annotations: existing.concat(arrows) });
    } catch(e) { console.warn('axis arrows relayout failed:', e); }
    setTimeout(() => { gd._scrInjectingArrows = false; }, 80);
  }
  window.scrApplyAxisArrows = applyAxisArrows;

  // Force-rewire hover/legend/arrow hooks on a chart div. Needed after every
  // Plotly.newPlot — purge wipes registered listeners but leaves the
  // _scrHooksWired flag stale, so the MutationObserver sees no new node and
  // skips wiring. Pages should call this immediately after each newPlot:
  //   Plotly.newPlot(div, data, layout, cfg).then(() => window.scrWireChart(div))
  window.scrWireChart = function(gd) {
    if (!gd) return;
    gd._scrHooksWired = false;
    gd._scrArrowsApplied = false;
    try { wireChartHooks(gd); } catch(e) { console.warn('scrWireChart wire failed:', e); }
    try { applyAxisArrows(gd); } catch(e) {}
    try { applyMobileMargins(gd); } catch(e) {}
  };

  // ── Mobile-aware margin bump ──────────────────────────────────────
  //   Plotly's default margins assume desktop room. On phones the chart
  //   title gets clipped by the modebar and the legend slams into the
  //   axis. Force generous margins on every chart whenever the viewport
  //   is narrow. Re-applies on every wire.
  function applyMobileMargins(gd) {
    if (!gd || !window.Plotly) return;
    const isMobile = window.innerWidth < 700;
    if (!isMobile) return;
    if (gd._scrMobileMarginsApplied && gd._scrMobileMarginsW === window.innerWidth) return;
    gd._scrMobileMarginsApplied = true;
    gd._scrMobileMarginsW = window.innerWidth;
    try {
      window.Plotly.relayout(gd, {
        'margin.t': 64,       // room for title above the plot area
        'margin.b': 110,      // room for legend + x-axis label
        'margin.l': 60,       // room for y-axis title and tick labels
        'margin.r': 40,       // small right cushion
        'autosize': true,
        'legend.font.size': 9,
        'title.font.size': 12
      });
    } catch(e) {}
  }
  // Re-apply on viewport change (rotate, browser resize)
  window.addEventListener('resize', () => {
    document.querySelectorAll('.js-plotly-plot').forEach(gd => {
      gd._scrMobileMarginsApplied = false;
      try { applyMobileMargins(gd); } catch(e) {}
      try { window.Plotly && window.Plotly.Plots.resize(gd); } catch(e) {}
    });
  });

  // ── Reusable view-switcher used on every "perspective" chart ──────────
  //  Inserts a small pill-button bar above the chart so the user can swap
  //  between Relative / Shadow / Absolute perspectives. Default order is
  //  Rel → Shad → Abs (left-to-right) and Relative is the default-active
  //  button. For HDI / Gini / PPI charts (no shadow data exists) pass
  //  keys: ['relative','absolute'] for a 2-button bar.
  //
  //  Usage:
  //    window.scrMakeViewSwitcher(chartWrapEl, {
  //      keys: ['relative','shadow','absolute'],   // optional, default this
  //      default: 'relative',                       // optional, default 'relative'
  //      onChange: function(activeKey) { ... }
  //    });
  const SCR_VIEW_LABELS = { relative: 'Relative', shadow: 'Shadow', absolute: 'Absolute' };
  window.scrMakeViewSwitcher = function(parentEl, opts) {
    if (!parentEl) return null;
    opts = opts || {};
    const keys = opts.keys || ['relative', 'shadow', 'absolute'];
    const defaultKey = opts.default || 'relative';
    const onChange = opts.onChange || function(){};
    const labels = Object.assign({}, SCR_VIEW_LABELS, opts.labels || {});
    // Remove any existing switcher in parentEl
    const old = parentEl.querySelector('.scr-view-switcher');
    if (old) old.remove();
    const bar = document.createElement('div');
    bar.className = 'scr-view-switcher';
    bar.style.cssText = 'display:flex;gap:6px;margin:0 0 10px 0;flex-wrap:wrap;align-items:center;';
    const tag = document.createElement('span');
    tag.textContent = 'View:';
    tag.style.cssText = 'font-size:0.7rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--muted,#888);margin-right:6px;';
    bar.appendChild(tag);
    const buttons = {};
    keys.forEach(k => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = labels[k] || k;
      b.dataset.viewKey = k;
      b.style.cssText = 'padding:5px 14px;font-size:0.78rem;letter-spacing:0.04em;text-transform:uppercase;font-family:inherit;cursor:pointer;border-radius:3px;border:1px solid var(--rule,#ccc);background:transparent;color:var(--ink,#1a1a1a);transition:background 0.12s,color 0.12s,border-color 0.12s;';
      b.onmouseenter = () => { if (b.dataset.active !== '1') b.style.background = 'rgba(128,128,128,0.12)'; };
      b.onmouseleave = () => { if (b.dataset.active !== '1') b.style.background = 'transparent'; };
      b.onclick = () => {
        Object.values(buttons).forEach(x => {
          x.dataset.active = '0';
          x.style.background = 'transparent';
          x.style.color = 'var(--ink,#1a1a1a)';
          x.style.fontWeight = '400';
          x.style.borderColor = 'var(--rule,#ccc)';
        });
        b.dataset.active = '1';
        b.style.background = 'var(--ink,#1a1a1a)';
        b.style.color = 'var(--bg,#fff)';
        b.style.fontWeight = '600';
        b.style.borderColor = 'var(--ink,#1a1a1a)';
        try { onChange(k); } catch(e) { console.warn('view-switcher onChange failed:', e); }
      };
      buttons[k] = b;
      bar.appendChild(b);
    });
    parentEl.insertBefore(bar, parentEl.firstChild);
    setTimeout(() => { (buttons[defaultKey] || buttons[keys[0]]).click(); }, 0);
    return bar;
  };
  // Cached small loader for shadow data (ols/knn/bayes), reused on any page
  let _shadowPromise = null;
  window.scrLoadShadow = function() {
    if (_shadowPromise) return _shadowPromise;
    const loader = (window.scrLoadExtras ? window.scrLoadExtras() : fetch('extras.json').then(r => r.json()));
    _shadowPromise = loader.then(extras => (extras && extras.shadow) || null).catch(() => null);
    return _shadowPromise;
  };
  // ── Flag-based country color palette ─────────────────────────────────
  //  Lightweight aesthetic touch: when a chart shows N lines for a single
  //  country, draw them in the country's first N flag colors. When a chart
  //  shows one line per country across many countries, give each line that
  //  country's primary flag color. Falls back to a deterministic
  //  hash-derived hue for any country not in the table.
  //
  //  Order within each entry is canonical-flag, but for countries whose
  //  topmost stripe is white we put white last so single-line charts get a
  //  visible primary. Pakistan green-then-white per user spec; Saudi dark
  //  green for single-line use; France blue-white-red for the tricolor.
  window.SCR_COUNTRY_COLORS = {
    // North America
    'United States':       ['#B22234','#3C3B6E','#FFFFFF'],
    'Canada':              ['#FF0000','#FFFFFF'],
    'Mexico':              ['#006847','#CE1126','#FFFFFF'],
    // South America
    'Brazil':              ['#009C3B','#FFDF00','#002776'],
    'Argentina':           ['#74ACDF','#F6B40E','#FFFFFF'],
    'Chile':               ['#0039A6','#D52B1E','#FFFFFF'],
    'Colombia':            ['#FCD116','#003893','#CE1126'],
    'Peru':                ['#D91023','#FFFFFF'],
    'Uruguay':             ['#0038A8','#FCD116','#FFFFFF'],
    'Venezuela':           ['#FCD116','#003893','#CE1126'],
    'Ecuador':             ['#FFD100','#003893','#CE1126'],
    'Bolivia':             ['#D52B1E','#FCD116','#007934'],
    'Paraguay':            ['#D52B1E','#0038A8','#FFFFFF'],
    'Suriname':            ['#377E3F','#B40A2D','#FFFFFF'],
    // Western & Central Europe
    'United Kingdom':      ['#012169','#C8102E','#FFFFFF'],
    'France':              ['#0055A4','#FFFFFF','#EF4135'],
    'Germany':             ['#000000','#DD0000','#FFCE00'],
    'Italy':               ['#009246','#CE2B37','#FFFFFF'],
    'Spain':               ['#AA151B','#F1BF00'],
    'Portugal':            ['#046A38','#DA291C'],
    'Netherlands':         ['#21468B','#AE1C28','#FFFFFF'],
    'Belgium':             ['#000000','#FAE042','#ED2939'],
    'Switzerland':         ['#DA291C','#FFFFFF'],
    'Austria':             ['#ED2939','#FFFFFF'],
    'Ireland':             ['#169B62','#FF883E','#FFFFFF'],
    'Liechtenstein':       ['#002780','#CF1126'],
    'Luxembourg':          ['#ED2939','#00A1DE','#FFFFFF'],
    'Andorra':             ['#10069F','#FCDD09','#D52B1E'],
    'San Marino':          ['#5EB6E4','#FFFFFF'],
    // Nordic
    'Denmark':             ['#C8102E','#FFFFFF'],
    'Norway':              ['#BA0C2F','#00205B','#FFFFFF'],
    'Sweden':              ['#006AA7','#FECC02'],
    'Finland':             ['#003580','#FFFFFF'],
    'Iceland':             ['#02529C','#DC1E35','#FFFFFF'],
    // Eastern Europe
    'Russia':              ['#D52B1E','#0039A6','#FFFFFF'],
    'Ukraine':             ['#0057B7','#FFD500'],
    'Poland':              ['#DC143C','#FFFFFF'],
    'Czech Republic':      ['#D7141A','#11457E','#FFFFFF'],
    'Slovakia':            ['#0B4EA2','#EE1C25','#FFFFFF'],
    'Hungary':             ['#CD2A3E','#436F4D','#FFFFFF'],
    'Romania':             ['#002B7F','#FCD116','#CE1126'],
    'Bulgaria':            ['#00966E','#D62612','#FFFFFF'],
    'Greece':              ['#0D5EAF','#FFFFFF'],
    'Turkey':              ['#E30A17','#FFFFFF'],
    'Serbia':              ['#C6363C','#0C4076','#FFFFFF'],
    'Croatia':             ['#FF0000','#171796','#FFFFFF'],
    'Slovenia':            ['#005DA4','#ED1C24','#FFFFFF'],
    'Bosnia and Herzegovina': ['#002F6C','#FECB00'],
    'Albania':             ['#FF0000','#000000'],
    'Macedonia':           ['#D20000','#FFE600'],
    'Montenegro':          ['#D52B1E','#C9AB59'],
    'Cyprus':              ['#D57800','#FFFFFF'],
    'Estonia':             ['#0072CE','#000000','#FFFFFF'],
    'Latvia':              ['#9E3039','#FFFFFF'],
    'Lithuania':           ['#FDB913','#006A44','#C1272D'],
    'Malta':               ['#CF142B','#FFFFFF'],
    'Moldova':             ['#003DA5','#FFD100','#CC092F'],
    'Belarus':             ['#CE1720','#4AA657','#FFFFFF'],
    // South Asia
    'India':               ['#FF9933','#FFFFFF','#138808'],
    'Pakistan':            ['#01411C','#FFFFFF'],
    'Bangladesh':          ['#006A4E','#F42A41'],
    'Sri Lanka':           ['#FFB100','#8D153A','#00534E','#EB7400'],
    'Nepal':               ['#DC143C','#003893'],
    'Maldives':            ['#D21034','#007E3A','#FFFFFF'],
    // East Asia
    'China':               ['#DE2910','#FFDE00'],
    'Japan':               ['#BC002D','#FFFFFF'],
    'South Korea':         ['#003478','#C60C30','#000000','#FFFFFF'],
    'Mongolia':            ['#C4272F','#015197','#F9CF02'],
    'Hong Kong':           ['#DE2408','#FFFFFF'],
    'Taiwan':              ['#FE0000','#000095','#FFFFFF'],
    // Southeast Asia
    'Indonesia':           ['#FF0000','#FFFFFF'],
    'Malaysia':            ['#CC0001','#010066','#FFCC00','#FFFFFF'],
    'Singapore':           ['#EF3340','#FFFFFF'],
    'Vietnam':             ['#DA251D','#FFFF00'],
    'Thailand':            ['#A51931','#2D2A4A','#FFFFFF'],
    'Philippines':         ['#0038A8','#CE1126','#FCD116','#FFFFFF'],
    'Cambodia':            ['#032EA1','#E00025','#FFFFFF'],
    'Laos':                ['#CE1126','#002868','#FFFFFF'],
    'Myanmar':             ['#FECB00','#34B233','#EA2839'],
    'Brunei':              ['#F7E017','#000000','#CF1126','#FFFFFF'],
    // Central Asia & Caucasus
    'Kazakhstan':          ['#00AFCA','#FEC50C'],
    'Kyrgyzstan':          ['#E8112D','#FFEF00'],
    'Tajikistan':          ['#CC0000','#006600','#FFFFFF'],
    'Uzbekistan':          ['#0099B5','#1EB53A','#CE1126','#FFFFFF'],
    'Turkmenistan':        ['#00853F','#CA0008','#FFFFFF'],
    'Armenia':             ['#D90012','#0033A0','#F2A800'],
    'Azerbaijan':          ['#00B5E2','#EF3340','#509E2F'],
    'Georgia':             ['#FF0000','#FFFFFF'],
    // Middle East / GCC
    'Saudi Arabia':        ['#006C35','#FFFFFF'],
    'United Arab Emirates': ['#00732F','#FF0000','#000000','#FFFFFF'],
    'Qatar':               ['#8A1538','#FFFFFF'],
    'Kuwait':              ['#007A3D','#CE1126','#000000','#FFFFFF'],
    'Bahrain':             ['#CE1126','#FFFFFF'],
    'Oman':                ['#DB161B','#008733','#FFFFFF'],
    'Iran':                ['#239F40','#DA0000','#FFFFFF'],
    'Iraq':                ['#CE1126','#007A3D','#000000','#FFFFFF'],
    'Israel':              ['#0038B8','#FFFFFF'],
    'Jordan':              ['#CE1126','#007A3D','#000000','#FFFFFF'],
    'Lebanon':             ['#ED1C24','#00A651','#FFFFFF'],
    'Syria':               ['#CE1126','#007A3D','#000000','#FFFFFF'],
    'Yemen':               ['#CE1126','#000000','#FFFFFF'],
    // North Africa
    'Egypt':               ['#CE1126','#000000','#FFFFFF'],
    'Morocco':             ['#C1272D','#006233'],
    'Tunisia':             ['#E70013','#FFFFFF'],
    'Algeria':             ['#006233','#D21034','#FFFFFF'],
    'Libya':               ['#E70013','#239E46','#000000'],
    // Sub-Saharan Africa
    'South Africa':        ['#007A4D','#FFB612','#DE3831','#002395','#000000','#FFFFFF'],
    'Nigeria':             ['#008751','#FFFFFF'],
    'Kenya':               ['#000000','#BB0000','#006600','#FFFFFF'],
    'Ethiopia':            ['#078930','#FCDD09','#DA121A'],
    'Ghana':               ['#CE1126','#FCD116','#006B3F'],
    'Senegal':             ['#00853F','#FDEF42','#E31B23'],
    'Zambia':              ['#198A00','#DE2010','#EF7D00','#000000'],
    'Uganda':              ['#FCDC04','#000000','#D90000'],
    'Tanzania':            ['#1EB53A','#FCD116','#00A3DD','#000000'],
    'Mozambique':          ['#007168','#FCE100','#D21034','#000000'],
    'Angola':              ['#CE1126','#FFCB00','#000000'],
    'Cameroon':            ['#007A5E','#CE1126','#FCD116'],
    'Ivory Coast':         ['#F77F00','#009E60','#FFFFFF'],
    'Mali':                ['#14B53A','#FCD116','#CE1126'],
    'Burkina Faso':        ['#EF2B2D','#009E49','#FCD116'],
    'Niger':               ['#E05206','#0DB02B','#FFFFFF'],
    'Madagascar':          ['#FC3D32','#007E3A','#FFFFFF'],
    'Rwanda':              ['#00A1DE','#20603D','#FAD201'],
    'Botswana':            ['#75AADB','#000000','#FFFFFF'],
    'Mauritius':           ['#EA2839','#1A206D','#FFD500','#00A551'],
    'Cape Verde':          ['#003893','#CF2027','#F7D116','#FFFFFF'],
    'Benin':               ['#008751','#FCD116','#E8112D'],
    'Togo':                ['#006A4E','#FFCE00','#D21034','#FFFFFF'],
    'Gabon':               ['#3A75C4','#FFE700','#009E60'],
    'Republic of the Congo': ['#009543','#DC241F','#FBDE4A'],
    'Chad':                ['#002664','#FECB00','#C60C30'],
    'Guinea':              ['#CE1126','#FCD116','#009460'],
    'Swaziland':           ['#3E5EB9','#FFD201','#B10C0C','#000000'],
    // Oceania
    'Australia':           ['#012169','#E4002B','#FFFFFF'],
    'New Zealand':         ['#012169','#C8102E','#FFFFFF'],
    'Papua New Guinea':    ['#000000','#CE1126','#FCD117'],
    'Fiji':                ['#68BFE5','#012169','#CE1126','#FFFFFF'],
    'Solomon Islands':     ['#0051BA','#215B33','#FCD116','#FFFFFF'],
    // Caribbean / Central America
    'Cuba':                ['#002A8F','#CF142B','#FFFFFF'],
    'Dominican Republic':  ['#002D62','#CE1126','#FFFFFF'],
    'Bahamas':             ['#00778B','#FFC72C','#000000'],
    'Jamaica':             ['#009B3A','#FED100','#000000'],
    'Trinidad and Tobago': ['#CE1126','#000000','#FFFFFF'],
    'Barbados':            ['#00267F','#FFC726'],
    'Belize':              ['#003F87','#CE1126','#FFFFFF'],
    'Honduras':            ['#0073CE','#FFFFFF'],
    'Guatemala':           ['#4997D0','#FFFFFF'],
    'El Salvador':         ['#0047AB','#FFFFFF'],
    'Nicaragua':           ['#0067C6','#FFFFFF'],
    'Costa Rica':          ['#CE1126','#002B7F','#FFFFFF'],
    'Panama':              ['#005AA7','#D21034','#FFFFFF'],
    'St Vincent and The Grenadines': ['#002F87','#FCD116','#007A33']
  };
  // Returns N color hex strings for the given country, derived from its flag.
  // Falls back to a deterministic hash-based HSL when the country isn't in the
  // table (so the same unmapped country always gets the same color).
  window.scrCountryColors = function(country, n) {
    n = Math.max(1, n || 1);
    const arr = (window.SCR_COUNTRY_COLORS && window.SCR_COUNTRY_COLORS[country]) || null;
    if (arr && arr.length) {
      const out = [];
      for (let i = 0; i < n; i++) out.push(arr[i % arr.length]);
      return out;
    }
    // Hash-based fallback
    let h = 0;
    for (let i = 0; i < (country || '').length; i++) h = (h * 31 + country.charCodeAt(i)) | 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      const hue = (((h * (i + 1)) % 360) + 360) % 360;
      out.push('hsl(' + Math.round(hue) + ', 60%, 52%)');
    }
    return out;
  };
  window.scrCountryColor = function(country) {
    return window.scrCountryColors(country, 1)[0];
  };

  // Cached compute of M4 percentile per (country,year) from EXTRAS.score_matrix.
  //   M4 = within-year fractional rank against ALL countries that have a score.
  //   Used by pages that don't bundle a relative panel.
  let _m4Cache = null;
  window.scrComputeCreditM4 = function(scoreMatrix) {
    if (_m4Cache && _m4Cache.src === scoreMatrix) return _m4Cache.data;
    const out = {}; // out[year][country] = percentile (0,1]
    if (!scoreMatrix) return out;
    Object.keys(scoreMatrix).forEach(y => {
      const m = scoreMatrix[y];
      const entries = Object.entries(m).filter(([c,v]) => v != null);
      const sorted = entries.slice().sort((a,b) => a[1] - b[1]);
      const N = sorted.length;
      const yr = {};
      sorted.forEach(([c,v], i) => { yr[c] = (i + 1) / N; });
      out[y] = yr;
    });
    _m4Cache = { src: scoreMatrix, data: out };
    return out;
  };

  function wireChartHooks(gd) {
    if (!gd || gd._scrHooksWired) return;
    // CRITICAL: only set _scrHooksWired AFTER confirming gd.on exists.
    // Otherwise an early call (before Plotly attaches) marks the chart wired
    // forever and the hover glow never gets attached.
    if (!window.Plotly || !gd.on) return;
    gd._scrHooksWired = true;
    // Bake arrows in once
    setTimeout(() => applyAxisArrows(gd), 50);
    // After every Plotly redraw (newPlot/restyle/relayout), re-check arrows.
    // Page-specific code (e.g. distance_graded slider) wipes annotations on
    // every Plotly.newPlot — afterplot fires, applyAxisArrows is idempotent
    // and re-injects only when needed.
    gd.on('plotly_afterplot', function() { applyAxisArrows(gd); });
    let isolated = -1;
    gd.on('plotly_legendclick', function(e) {
      if (e && e.event && e.event.shiftKey) return true; // Shift-click → default toggle
      const i = e.curveNumber;
      if (isolated === i) {
        const op = gd.data.map(() => 1);
        window.Plotly.restyle(gd, { 'opacity': op });
        isolated = -1;
      } else {
        const op = gd.data.map((_, k) => k === i ? 1 : 0.18);
        window.Plotly.restyle(gd, { 'opacity': op });
        isolated = i;
      }
      return false;
    });
    // Hover glow: triggered via plotly_hover event because Plotly's own hover
    // capture overlay blocks CSS :hover from firing on the trace SVG group.
    gd.on('plotly_hover', function(ev) {
      if (!ev || !ev.points || !ev.points.length) return;
      const i = ev.points[0].curveNumber;
      // Mark all traces — set the glow class on the hovered one
      const traces = gd.querySelectorAll('.scatterlayer .trace, .barlayer .trace');
      traces.forEach((t, k) => t.classList.toggle('scr-trace-glow', k === i));
      // Belt-and-suspenders: also bump the line width via restyle so the
      // hovered series visibly thickens even if the CSS filter can't paint
      try {
        const widths = gd.data.map((t, k) => {
          if (!t._scrOrigWidth) t._scrOrigWidth = (t.line && t.line.width) || 2;
          return k === i ? Math.max(3.5, t._scrOrigWidth + 1.5) : t._scrOrigWidth;
        });
        window.Plotly.restyle(gd, { 'line.width': widths });
      } catch(e) {}
    });
    gd.on('plotly_unhover', function() {
      gd.querySelectorAll('.scr-trace-glow').forEach(el => el.classList.remove('scr-trace-glow'));
      try {
        const widths = gd.data.map(t => t._scrOrigWidth || 2);
        window.Plotly.restyle(gd, { 'line.width': widths });
      } catch(e) {}
    });
    // Touch / tap support: on mobile, plotly_hover doesn't fire reliably.
    // plotly_click fires on tap and we use it to toggle the glow. Tapping
    // the same trace twice (or empty space) clears the glow.
    let _lastTapped = -1;
    gd.on('plotly_click', function(ev) {
      if (!ev || !ev.points || !ev.points.length) return;
      const i = ev.points[0].curveNumber;
      const traces = gd.querySelectorAll('.scatterlayer .trace, .barlayer .trace');
      if (_lastTapped === i) {
        traces.forEach(t => t.classList.remove('scr-trace-glow'));
        try {
          const widths = gd.data.map(t => t._scrOrigWidth || 2);
          window.Plotly.restyle(gd, { 'line.width': widths });
        } catch(e) {}
        _lastTapped = -1;
      } else {
        traces.forEach((t, k) => t.classList.toggle('scr-trace-glow', k === i));
        try {
          const widths = gd.data.map((t, k) => {
            if (!t._scrOrigWidth) t._scrOrigWidth = (t.line && t.line.width) || 2;
            return k === i ? Math.max(3.5, t._scrOrigWidth + 1.5) : t._scrOrigWidth;
          });
          window.Plotly.restyle(gd, { 'line.width': widths });
        } catch(e) {}
        _lastTapped = i;
      }
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
      document.querySelectorAll('.js-plotly-plot').forEach(el => {
        wireChartHooks(el);
        applyAxisArrows(el);
      });
    }, 50);
  });
  document.addEventListener('DOMContentLoaded', () => {
    chartObserver.observe(document.body, { childList: true, subtree: true });
    // Multiple delayed retries — first 200ms catches early-rendered charts,
    // 1500ms catches charts that wait for fetch('extras.json'),
    // 4000ms is a final safety net for slow loaders.
    [200, 1500, 4000].forEach(d => setTimeout(() => {
      window.scrApplyChartTheme();
      document.querySelectorAll('.js-plotly-plot').forEach(el => {
        wireChartHooks(el);
        applyAxisArrows(el);
      });
    }, d));
  });

  // Cached fetch of extras.json (multiple consumers share one network call).
  // Per-section optimization: if `section` is passed, fetches the smaller
  // extras_{section}.json bundle (split by Diego's T3 in v6X) instead of the
  // full 2.5 MB bundle. Sections: score, hdi, gini, ppi, shadow, stories, meta.
  // Falls back transparently to full extras.json if the per-section file 404s.
  const _extrasPromises = {};
  let _fullExtrasPromise = null;
  window.scrLoadExtras = function(section) {
    if (section) {
      if (_extrasPromises[section]) return _extrasPromises[section];
      _extrasPromises[section] = fetch('extras_' + section + '.json')
        .then(r => {
          if (!r.ok) throw new Error('extras_' + section + ' HTTP ' + r.status);
          return r.json();
        })
        .catch(err => {
          console.warn('per-section extras load failed, falling back to full:', err);
          return window.scrLoadExtras();
        });
      return _extrasPromises[section];
    }
    if (_fullExtrasPromise) return _fullExtrasPromise;
    _fullExtrasPromise = fetch('extras.json').then(r => {
      if (!r.ok) throw new Error('extras.json HTTP ' + r.status);
      return r.json();
    });
    return _fullExtrasPromise;
  };

  // ── Country → continent map (for peer-set selectors on Relative HDI / Gini) ─
  // Six UN-style continents; mutually exclusive and collectively exhaustive
  // across the 142 countries that appear in the HDI ∪ Gini panels.
  window.SCR_REGIONS = ['Africa','Asia','Europe','North America','Oceania','South America'];
  window.SCR_REGION_OF = (function(){
    const groups = {
      'Africa': ['Angola','Benin','Botswana','Burkina Faso','Cameroon','Cape Verde','Chad','Egypt','Ethiopia','Gabon','Ghana','Guinea','Ivory Coast','Kenya','Madagascar','Mali','Mauritius','Morocco','Mozambique','Niger','Nigeria','Republic of the Congo','Rwanda','Senegal','South Africa','Swaziland','Tanzania','Togo','Tunisia','Uganda','Zambia'],
      'Asia': ['Armenia','Azerbaijan','Bahrain','Bangladesh','Cambodia','China','Georgia','Hong Kong','India','Indonesia','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Malaysia','Maldives','Mongolia','Oman','Pakistan','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Tajikistan','Thailand','Turkey','United Arab Emirates','Uzbekistan','Vietnam'],
      'Europe': ['Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herzegovina','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Latvia','Liechtenstein','Lithuania','Luxembourg','Macedonia','Malta','Moldova','Montenegro','Netherlands','Norway','Poland','Portugal','Romania','Russia','San Marino','Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland','Ukraine','United Kingdom'],
      'North America': ['Bahamas','Barbados','Belize','Canada','Costa Rica','Cuba','Dominican Republic','El Salvador','Guatemala','Honduras','Jamaica','Mexico','Nicaragua','Panama','St Vincent and The Grenadines','Trinidad and Tobago','United States'],
      'Oceania': ['Australia','Fiji','New Zealand','Papua New Guinea','Solomon Islands'],
      'South America': ['Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Paraguay','Peru','Suriname','Uruguay','Venezuela']
    };
    const flat = {};
    for (const r in groups) groups[r].forEach(c => flat[c] = r);
    return flat;
  })();
  // Convenience: list of countries in a region
  window.SCR_COUNTRIES_IN = function(region) {
    return Object.keys(window.SCR_REGION_OF).filter(c => window.SCR_REGION_OF[c] === region);
  };

  // ── Preset peer groups (multilateral / political / economic groupings) ───
  // Lists are intersected at render time with whichever indicator panel is
  // active (HDI ∪ Gini countries), so a country in the official membership
  // list that doesn't appear in the data is silently dropped.
  // Order in SCR_PRESET_ORDER controls the order options appear in the
  // "Compare against" dropdown.
  window.SCR_PRESET_GROUPS = {
    'OECD': ['Australia','Austria','Belgium','Canada','Chile','Colombia','Costa Rica','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Israel','Italy','Japan','Latvia','Lithuania','Luxembourg','Mexico','Netherlands','New Zealand','Norway','Poland','Portugal','Slovakia','Slovenia','South Korea','Spain','Sweden','Switzerland','Turkey','United Kingdom','United States'],
    'BRICS+': ['Brazil','Russia','India','China','South Africa','Iran','Egypt','United Arab Emirates','Ethiopia','Saudi Arabia','Indonesia'],
    'EU (27)': ['Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden'],
    'Eurozone': ['Austria','Belgium','Croatia','Cyprus','Estonia','Finland','France','Germany','Greece','Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Portugal','Slovakia','Slovenia','Spain'],
    'ASEAN': ['Indonesia','Malaysia','Philippines','Singapore','Thailand','Vietnam','Cambodia','Laos','Myanmar','Brunei'],
    'G7': ['Canada','France','Germany','Italy','Japan','United Kingdom','United States'],
    'G20': ['Argentina','Australia','Brazil','Canada','China','France','Germany','India','Indonesia','Italy','Japan','Mexico','Russia','Saudi Arabia','South Africa','South Korea','Turkey','United Kingdom','United States'],
    'GCC': ['Bahrain','Kuwait','Oman','Qatar','Saudi Arabia','United Arab Emirates'],
    'NATO': ['Albania','Belgium','Bulgaria','Canada','Croatia','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Italy','Latvia','Lithuania','Luxembourg','Montenegro','Netherlands','Norway','Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Turkey','United Kingdom','United States'],
    'SIDS': ['Bahamas','Barbados','Belize','Cape Verde','Cuba','Dominican Republic','Fiji','Jamaica','Maldives','Mauritius','Papua New Guinea','Singapore','Solomon Islands','St Vincent and The Grenadines','Suriname','Trinidad and Tobago'],
    'LDCs (UN)': ['Bangladesh','Benin','Burkina Faso','Cambodia','Chad','Ethiopia','Guinea','Laos','Madagascar','Mali','Mozambique','Niger','Rwanda','Senegal','Solomon Islands','Tanzania','Togo','Uganda','Zambia'],
    'Visegrád Four': ['Czech Republic','Hungary','Poland','Slovakia'],
    'MERCOSUR': ['Argentina','Bolivia','Brazil','Paraguay','Uruguay','Venezuela'],
    'Pacific Alliance': ['Chile','Colombia','Mexico','Peru'],
    'Nordic': ['Denmark','Finland','Iceland','Norway','Sweden'],
    'CIS': ['Armenia','Azerbaijan','Belarus','Kazakhstan','Kyrgyzstan','Moldova','Russia','Tajikistan','Uzbekistan']
  };
  window.SCR_PRESET_ORDER = ['OECD','BRICS+','EU (27)','Eurozone','G7','G20','ASEAN','GCC','NATO','Nordic','SIDS','LDCs (UN)','Visegrád Four','MERCOSUR','Pacific Alliance','CIS'];

  // Compute leave-one-out mean + M1/M2/M4 for a country in a year, restricted
  // to a peerSet (Set<string> of country names). Used by relative_hdi/gini.html
  // when the user picks a non-world comparison set.
  // rows: array of {Country, Year, Value} for one indicator
  // Returns array enriched with {LOO, M1, M2, M4, peerN}
  window.scrRecomputeRelative = function(rows, peerSet) {
    // Group by year
    const byYear = {};
    rows.forEach(r => {
      if (!peerSet.has(r.Country)) return;
      (byYear[r.Year] ||= []).push(r);
    });
    const out = [];
    for (const yrStr in byYear) {
      const yr = parseInt(yrStr);
      const arr = byYear[yrStr];
      const n = arr.length;
      if (n < 2) continue;
      const sum = arr.reduce((s,r) => s + r.Value, 0);
      // For each country in the peer subset for this year, compute LOO + M1/M2/M4
      // Sort once for ranks
      const sorted = arr.slice().sort((a,b) => a.Value - b.Value);
      const rankOf = {};
      sorted.forEach((r,i) => { rankOf[r.Country] = i + 1; }); // 1-based
      arr.forEach(r => {
        const loo = (sum - r.Value) / (n - 1);
        const m1  = (r.Value * r.Value) / loo;
        const m2  = rankOf[r.Country];           // raw rank within peer set
        const m4  = m2 / n;                      // percentile (0,1]
        out.push({Country: r.Country, Year: yr, Value: r.Value, LOO: loo, M1: m1, M2: m2, M4: m4, peerN: n});
      });
    }
    return out;
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
    // Toolbar with Copy PNG, Download PNG, Fullscreen — matches the Plotly modebar
    const bar = document.createElement('div');
    bar.className = 'copy-png-bar';
    function makeBtn(label, title, glyph, handler) {
      const b = document.createElement('button');
      b.className = 'copy-png-btn';
      b.type = 'button';
      b.title = title;
      b.innerHTML = '<span aria-hidden="true">' + glyph + '</span> ' + label;
      b.onclick = handler;
      return b;
    }
    // Force white bg + light theme during capture so dark-mode text doesn't
    // come out white-on-white. After capture, append the Chicago citation strip.
    function renderToCanvas() {
      return loadHtml2Canvas().then(h2c => {
        const wasDark = document.body.classList.contains('dark');
        if (wasDark) document.body.classList.remove('dark');
        return h2c(target, {
          backgroundColor: '#ffffff',
          scale: 2, logging: false, useCORS: true
        }).then(canvas => {
          if (wasDark) document.body.classList.add('dark');
          return appendCitationToCanvas(canvas);
        }, err => {
          if (wasDark) document.body.classList.add('dark');
          throw err;
        });
      });
    }
    const btnCopy = makeBtn('Copy', 'Copy as PNG (with citation)', '&#x29C9;', function(ev) {
      ev.preventDefault(); btnCopy.disabled = true; btnCopy.innerHTML = 'Rendering…';
      renderToCanvas()
        .then(c => canvasToPngBlob(c))
        .then(blob => {
          if (!navigator.clipboard || !window.ClipboardItem) throw new Error('clipboard API unavailable');
          return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        })
        .then(() => { flashToast('Copied as PNG'); btnCopy.innerHTML = '<span>&#x2713;</span> Copied'; setTimeout(() => { btnCopy.innerHTML = '<span>&#x29C9;</span> Copy'; btnCopy.disabled = false; }, 1500); })
        .catch(err => { btnCopy.innerHTML = '<span>&#x29C9;</span> Copy'; btnCopy.disabled = false; alert('Copy failed: ' + err.message); });
    });
    const btnDl = makeBtn('PNG', 'Download as PNG (white bg, with citation)', '&#x21E9;', function(ev) {
      ev.preventDefault(); btnDl.disabled = true; btnDl.innerHTML = 'Rendering…';
      renderToCanvas().then(c => {
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = 'sovereignratings_' + (target.id || 'figure') + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        flashToast('Downloaded PNG');
        btnDl.innerHTML = '<span>&#x2713;</span> Saved'; setTimeout(() => { btnDl.innerHTML = '<span>&#x21E9;</span> PNG'; btnDl.disabled = false; }, 1500);
      }).catch(err => { btnDl.innerHTML = '<span>&#x21E9;</span> PNG'; btnDl.disabled = false; alert('Download failed: ' + err.message); });
    });
    const btnShare = makeBtn('Share', 'Share as PNG (with citation)', '&#x2197;', function(ev) {
      ev.preventDefault(); btnShare.disabled = true; btnShare.innerHTML = 'Rendering…';
      renderToCanvas()
        .then(c => canvasToPngBlob(c))
        .then(blob => {
          const file = new File([blob], 'sovereignratings_' + (target.id || 'figure') + '.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            return navigator.share({ files: [file], title: 'Sovereign Credit Rating', text: 'sovereignratings.yashmoitra.com' })
              .then(() => flashToast('Shared'));
          }
          if (navigator.clipboard && window.ClipboardItem) {
            return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
              .then(() => flashToast('Share unavailable; copied to clipboard'));
          }
          throw new Error('No share or clipboard support');
        })
        .then(() => { btnShare.innerHTML = '<span>&#x2713;</span> Shared'; setTimeout(() => { btnShare.innerHTML = '<span>&#x2197;</span> Share'; btnShare.disabled = false; }, 1500); })
        .catch(err => {
          btnShare.innerHTML = '<span>&#x2197;</span> Share'; btnShare.disabled = false;
          if (err && err.name !== 'AbortError') alert('Share failed: ' + err.message);
        });
    });
    const btnFs = makeBtn('Full', 'Toggle fullscreen', '&#x26F6;', function(ev) {
      ev.preventDefault();
      if (!document.fullscreenElement) {
        const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.mozRequestFullScreen;
        if (req) req.call(wrap).catch(e => alert('Fullscreen failed: ' + e.message));
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    });
    bar.appendChild(btnFs); bar.appendChild(btnDl); bar.appendChild(btnCopy); bar.appendChild(btnShare);
    wrap.appendChild(bar);
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
