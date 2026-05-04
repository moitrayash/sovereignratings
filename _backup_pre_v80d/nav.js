/* ─────────────────────────────────────────────────────────────────────
   Canonical navigation. Every page calls renderNav('<active-key>').
   Active key is the page filename (e.g. 'methodology.html').
   ───────────────────────────────────────────────────────────────────── */

(function(){
  const NAV = [
    {href:'citations.html',                   label:'Citations',                     side:'left'},
    {href:'glossary.html',                    label:'Glossary',                      side:'left'},
    {href:'methodology.html',                 label:'Methodology',                   side:'left'},
    {sep:true},
    {href:'index.html',                       label:'Relative Ratings',              side:'right'},
    {href:'paired_grouped_regional.html',     label:'Paired, Grouped & Regional Ratings', side:'right'},
    {href:'distance_graded.html',             label:'Distance-graded Ratings',       side:'right'},
    {href:'shadow.html',                      label:'Shadow Ratings',                side:'right'},
    {href:'relative_hdi.html',                label:'Relative HDI',                  side:'right'},
    {href:'relative_gini.html',               label:'Relative Gini',                 side:'right'},
    {href:'relative_ppi.html',                label:'Relative PPI',                  side:'right'},
    {href:'stories.html',                     label:'Stories',                       side:'right'},
    {href:'verra.html',                       label:'Verra (carbon)',                side:'right'},
    {spacer:true},
    {href:'land_acknowledgement.html',        label:'Land Acknowledgement',          side:'right'}
  ];
  window.renderNav = function(activeHref) {
    const nav = document.querySelector('nav.site');
    if (!nav) return;
    nav.innerHTML = '';
    NAV.forEach(item => {
      if (item.sep)    { const s = document.createElement('span'); s.className = 'nav-sep'; nav.appendChild(s); return; }
      if (item.spacer) { const s = document.createElement('span'); s.className = 'nav-spacer'; nav.appendChild(s); return; }
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.dataset.en = item.label;
      if (item.href === activeHref) a.classList.add('active');
      nav.appendChild(a);
    });
    // Re-apply persisted language now that nav items exist with data-en attrs
    if (window.scrReapplyLang) window.scrReapplyLang();
  };
})();
