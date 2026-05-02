/* ─────────────────────────────────────────────────────────────────────
   Sovereign Credit Rating Explorer — shared client-side helpers
     1. Floating ToC builder (Google-Docs style; fades on scroll)
     2. Endnote back-links
   Drop into any page with: <script defer src="shared.js"></script>
   ───────────────────────────────────────────────────────────────────── */

(function(){
  'use strict';

  // ── Build floating ToC from H2/H3 in <main> ─────────────────────────
  function buildToc() {
    const main = document.querySelector('main');
    if (!main) return null;
    const headings = main.querySelectorAll('h2[id], h3[id]');
    if (headings.length < 3) return null;          // not worth it
    const wrap = document.createElement('nav');
    wrap.id = 'floating-toc';
    wrap.innerHTML = '<div class="toc-title">On this page</div><ul></ul>';
    const ul = wrap.querySelector('ul');
    headings.forEach(h => {
      const li = document.createElement('li');
      li.className = h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.href = '#' + h.id;
      // strip section-num spans, keep textual
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

  // ── Fade in on scroll, fade out after idle ──────────────────────────
  function wireFade(toc) {
    if (!toc) return;
    let lastY = window.scrollY;
    let idleTimer = null;
    function onScroll() {
      if (window.scrollY > 280) toc.classList.add('visible');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // fade out only if user has been still for 2.4 s
        toc.classList.remove('visible');
      }, 2400);
      lastY = window.scrollY;
      updateCurrent();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    // also show briefly on hover
    toc.addEventListener('mouseenter', () => {
      toc.classList.add('visible');
      clearTimeout(idleTimer);
    });
    toc.addEventListener('mouseleave', () => {
      idleTimer = setTimeout(() => toc.classList.remove('visible'), 1500);
    });
  }

  // ── Highlight current heading in ToC based on viewport ─────────────
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
    for (const l of tocLinks) {
      if (l.target.offsetTop <= y) active = l;
    }
    tocLinks.forEach(l => l.a.classList.toggle('current', l === active));
  }

  // ── Endnote back-links: append "↑" link inside each <li id="note-N"> ──
  function wireEndnotes() {
    document.querySelectorAll('.endnotes li[id^="note-"]').forEach(li => {
      const id = li.id;
      const ref = document.querySelector(`sup.note-ref a[href="#${id}"]`);
      if (!ref) return;
      // give the in-text ref an id so we can jump back
      const refId = 'ref-' + id;
      ref.id = refId;
      const back = document.createElement('a');
      back.href = '#' + refId;
      back.textContent = ' ↩';
      back.style.marginLeft = '4px';
      back.style.textDecoration = 'none';
      back.style.color = '#888';
      li.appendChild(back);
    });
  }

  // ── Init on DOM ready ───────────────────────────────────────────────
  function init() {
    const toc = buildToc();
    indexLinks(toc);
    wireFade(toc);
    updateCurrent();
    wireEndnotes();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
