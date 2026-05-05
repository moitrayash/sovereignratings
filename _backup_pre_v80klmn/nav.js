/* ─────────────────────────────────────────────────────────────────────
   Canonical navigation. Every page calls renderNav('<active-key>').
   Active key is the page filename (e.g. 'methodology.html').

   v80d: Macro-relatives dropdown (HDI / Gini / PPI / Verra)
         + vertical separator before Stories.
   ───────────────────────────────────────────────────────────────────── */

(function(){
  const MACRO_RELATIVES = [
    {href:'relative_hdi.html',  label:'Relative HDI'},
    {href:'relative_gini.html', label:'Relative Gini'},
    {href:'relative_ppi.html',  label:'Relative PPI'},
    {href:'verra.html',         label:'Verra (carbon)'}
  ];

  const NAV = [
    {href:'citations.html',                   label:'Citations',                          side:'left'},
    {href:'glossary.html',                    label:'Glossary',                           side:'left'},
    {href:'methodology.html',                 label:'Methodology',                        side:'left'},
    {sep:true},
    {href:'index.html',                       label:'Relative Ratings',                   side:'right'},
    {href:'paired_grouped_regional.html',     label:'Paired, Grouped & Regional Ratings', side:'right'},
    {href:'distance_graded.html',             label:'Distance-graded Ratings',            side:'right'},
    {href:'shadow.html',                      label:'Shadow Ratings',                     side:'right'},
    {sep:true},
    {dropdown:'Macro Relatives', items: MACRO_RELATIVES},
    {sep:true},
    {href:'stories.html',                     label:'Stories',                            side:'right'},
    {spacer:true},
    {href:'land_acknowledgement.html',        label:'Land Acknowledgement',               side:'right'}
  ];

  function macroRelativesContains(activeHref){
    return MACRO_RELATIVES.some(it => it.href === activeHref);
  }

  window.renderNav = function(activeHref) {
    const nav = document.querySelector('nav.site');
    if (!nav) return;
    nav.innerHTML = '';
    NAV.forEach(item => {
      if (item.sep)    { const s = document.createElement('span'); s.className = 'nav-sep'; nav.appendChild(s); return; }
      if (item.spacer) { const s = document.createElement('span'); s.className = 'nav-spacer'; nav.appendChild(s); return; }

      if (item.dropdown){
        const wrap = document.createElement('span');
        wrap.className = 'nav-dropdown';
        const lbl = document.createElement('span');
        lbl.className = 'nav-dropdown-label';
        lbl.textContent = item.dropdown + ' ▾';
        lbl.dataset.en = item.dropdown;
        lbl.tabIndex = 0;
        if (macroRelativesContains(activeHref)) lbl.classList.add('active');
        wrap.appendChild(lbl);

        const menu = document.createElement('div');
        menu.className = 'nav-dropdown-menu';
        item.items.forEach(sub => {
          const sa = document.createElement('a');
          sa.href = sub.href;
          sa.textContent = sub.label;
          sa.dataset.en = sub.label;
          if (sub.href === activeHref) sa.classList.add('active');
          menu.appendChild(sa);
        });
        wrap.appendChild(menu);

        // Toggle on click; close on outside-click. Menu is appended to <body>
        // and positioned with position:fixed so it escapes nav.site overflow-x clipping.
        document.body.appendChild(menu);
        menu.style.position = 'fixed';
        menu.style.display = 'none';
        function positionMenu(){
          const r = lbl.getBoundingClientRect();
          menu.style.top  = r.bottom + 'px';
          menu.style.left = r.left + 'px';
        }
        function openMenu(){ wrap.classList.add('open'); positionMenu(); menu.style.display = 'block'; }
        function closeMenu(){ wrap.classList.remove('open'); menu.style.display = 'none'; }
        function toggleMenu(){ if (wrap.classList.contains('open')) closeMenu(); else openMenu(); }
        lbl.addEventListener('click', function(e){ e.stopPropagation(); toggleMenu(); });
        lbl.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
          else if (e.key === 'Escape') { closeMenu(); }
        });
        document.addEventListener('click', function(e){
          if (!menu.contains(e.target) && !lbl.contains(e.target)) closeMenu();
        });
        window.addEventListener('scroll', function(){ if (wrap.classList.contains('open')) positionMenu(); }, { passive: true });
        window.addEventListener('resize', function(){ if (wrap.classList.contains('open')) positionMenu(); });
        nav.appendChild(wrap);
        return;
      }

      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.dataset.en = item.label;
      if (item.href === activeHref) a.classList.add('active');
      nav.appendChild(a);
    });
    if (window.scrReapplyLang) window.scrReapplyLang();
  };
})();
