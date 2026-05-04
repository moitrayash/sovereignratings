/* ─────────────────────────────────────────────────────────────────────
   v80d: Drag-to-compute %-change feature for Plotly charts.

   Desktop: horizontal box-select; on selection, floating tooltip shows
            start/end values + delta + % change for every trace.
   Mobile:  drag interactions disabled (so page scroll/touch is not
            captured by the chart). Plotly's tap-to-tooltip still works.
   Fullscreen on mobile: re-enables desktop interactivity.

   Drag-to-zoom is removed everywhere - the modebar zoom buttons remain
   for users who want to zoom.
   ───────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  if (window.__scrPctChangeInstalled) return;
  window.__scrPctChangeInstalled = true;

  // --- Mobile / fullscreen detection -------------------------------------
  function isCoarsePointer(){
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }
  function isNarrowViewport(){
    return window.innerWidth <= 768;
  }
  function isMobileLike(){
    return isCoarsePointer() || isNarrowViewport();
  }
  function isInFullscreen(el){
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    return !!(fs && (fs === el || fs.contains(el)));
  }

  // --- Floating tooltip (singleton) --------------------------------------
  let floatBox = null;
  function ensureFloatBox(){
    if (floatBox) return floatBox;
    floatBox = document.createElement('div');
    floatBox.id = 'scr-pct-tooltip';
    Object.assign(floatBox.style, {
      position: 'fixed',
      pointerEvents: 'none',
      background: 'var(--tooltip-bg, #1a1a1a)',
      color: 'var(--tooltip-fg, #fff)',
      padding: '6px 10px',
      borderRadius: '4px',
      font: "12px 'Helvetica Neue', Arial, sans-serif",
      lineHeight: '1.4',
      zIndex: '99999',
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      display: 'none',
      maxWidth: '320px'
    });
    document.body.appendChild(floatBox);
    return floatBox;
  }
  function hideFloatBox(){ if (floatBox) floatBox.style.display = 'none'; }

  function nearestIdx(xs, target){
    if (!xs || !xs.length) return -1;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < xs.length; i++){
      const xv = (typeof xs[i] === 'string') ? Date.parse(xs[i]) : Number(xs[i]);
      const tv = (typeof target === 'string') ? Date.parse(target) : Number(target);
      const d = Math.abs(xv - tv);
      if (d < bestDist){ bestDist = d; best = i; }
    }
    return best;
  }
  function fmtNum(v){
    if (v == null || Number.isNaN(v)) return '—';
    if (Math.abs(v) >= 100) return v.toFixed(1);
    if (Math.abs(v) >= 1)   return v.toFixed(2);
    return v.toFixed(3);
  }
  function fmtX(v){
    if (typeof v === 'string') return v.slice(0, 10);
    if (Number.isInteger(v))   return String(v);
    return String(v).slice(0, 10);
  }

  function showPctChange(plotDiv, x1, x2, evt){
    if (x2 < x1){ const t = x1; x1 = x2; x2 = t; }
    const lines = [];
    const traces = plotDiv.data || [];
    for (let i = 0; i < traces.length; i++){
      const tr = traces[i];
      if (!tr.x || !tr.y || !tr.x.length) continue;
      const i1 = nearestIdx(tr.x, x1);
      const i2 = nearestIdx(tr.x, x2);
      if (i1 < 0 || i2 < 0) continue;
      const y1 = Number(tr.y[i1]);
      const y2 = Number(tr.y[i2]);
      if (Number.isNaN(y1) || Number.isNaN(y2)) continue;
      const delta = y2 - y1;
      const sign  = delta >= 0 ? '+' : '';
      let pctStr = '';
      if (y1 !== 0){
        const pct = (delta / Math.abs(y1)) * 100;
        pctStr = ' (' + sign + pct.toFixed(2) + '%)';
      }
      const name = tr.name || ('series ' + (i+1));
      lines.push('<b>' + name + '</b>: ' + fmtNum(y1) + ' → ' + fmtNum(y2) +
                 ' = ' + sign + fmtNum(delta) + pctStr);
    }
    if (!lines.length) return;
    const header = '<div style="opacity:0.75;font-size:11px;margin-bottom:3px">' +
                   fmtX(x1) + ' → ' + fmtX(x2) + '</div>';
    const box = ensureFloatBox();
    box.innerHTML = header + lines.join('<br>');
    box.style.display = 'block';
    const pad = 14;
    const w = box.offsetWidth, h = box.offsetHeight;
    let lx = (evt ? evt.clientX : 0) + pad;
    let ly = (evt ? evt.clientY : 0) + pad;
    if (lx + w > window.innerWidth - 4)  lx = window.innerWidth - w - 4;
    if (ly + h > window.innerHeight - 4) ly = (evt ? evt.clientY : 0) - h - pad;
    if (ly < 4) ly = 4;
    box.style.left = lx + 'px';
    box.style.top  = ly + 'px';
  }

  function setMode(plotDiv, mode){
    // mode: 'select' for desktop / fullscreen, 'pan' OR false for mobile
    try {
      if (mode === 'select'){
        Plotly.relayout(plotDiv, { dragmode: 'select', selectdirection: 'h' });
      } else if (mode === false){
        Plotly.relayout(plotDiv, { dragmode: false });
      } else {
        Plotly.relayout(plotDiv, { dragmode: mode });
      }
    } catch(e){}
  }

  function attachToPlot(plotDiv){
    if (!plotDiv || plotDiv._scrPctAttached) return;
    if (!plotDiv._fullLayout || !plotDiv.data) return;
    plotDiv._scrPctAttached = true;

    function applyMode(){
      if (isMobileLike() && !isInFullscreen(plotDiv)){
        setMode(plotDiv, false);
      } else {
        setMode(plotDiv, 'select');
      }
    }
    applyMode();

    plotDiv.on && plotDiv.on('plotly_selected', function(eventData){
      if (!eventData || !eventData.range) return;
      const xR = eventData.range.x;
      if (!xR || xR.length !== 2) return;
      const evt = (window.event && window.event.clientX != null) ? window.event : null;
      showPctChange(plotDiv, xR[0], xR[1], evt);
      setTimeout(function(){
        try { Plotly.relayout(plotDiv, { selections: [] }); } catch(e){}
      }, 60);
    });
    plotDiv.on && plotDiv.on('plotly_doubleclick', function(){ hideFloatBox(); });

    document.addEventListener('fullscreenchange', applyMode);
    document.addEventListener('webkitfullscreenchange', applyMode);
    window.addEventListener('resize', applyMode);
  }

  function scanAndAttach(){
    document.querySelectorAll('.js-plotly-plot').forEach(attachToPlot);
  }

  function init(){
    scanAndAttach();
    const obs = new MutationObserver(function(){ scanAndAttach(); });
    obs.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('mousedown', function(e){
      if (!floatBox || floatBox.style.display === 'none') return;
      if (e.target.closest && e.target.closest('.js-plotly-plot')) return;
      hideFloatBox();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') hideFloatBox();
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
