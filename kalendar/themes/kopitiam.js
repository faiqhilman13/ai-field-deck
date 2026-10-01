/* Style: Kopitiam Ledger. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  /* kopi cup on a saucer, steam rising, little sunburst behind */
  const CUP = `<svg class="cup" viewBox="0 0 120 100" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g stroke-width="1" opacity=".55">${Array.from({ length: 13 }, (_, i) => { const a = (-160 + i * 11.5) * Math.PI / 180; return `<path d="M${(62 + Math.cos(a) * 24).toFixed(1)} ${(34 + Math.sin(a) * 24).toFixed(1)}L${(62 + Math.cos(a) * 36).toFixed(1)} ${(34 + Math.sin(a) * 36).toFixed(1)}"/>`; }).join('')}</g>
    <path d="M50 22c-3-5 3-8 0-13M60 20c-3-5 3-8 0-13M70 22c-3-5 3-8 0-13" stroke-width="1.6" opacity=".8"/>
    <ellipse cx="58" cy="85" rx="44" ry="10" fill="#f6eedb" stroke-width="2.8"/>
    <ellipse cx="58" cy="84" rx="30" ry="5.5" stroke-width="1.4" opacity=".7"/>
    <path d="M34 34h48l-4 40c-1 6-8 10-20 10s-19-4-20-10Z" fill="#fbf4e2" stroke-width="3"/>
    <ellipse cx="58" cy="34" rx="24" ry="5" fill="#3b2a1c" stroke-width="2.8"/>
    <path d="M80 42c11-3 17 2 16 9-1 8-8 12-17 13" stroke-width="2.6"/>
    <path d="M80 47c7-2 11 1 10 5-1 5-5 7-11 8" stroke-width="1.4"/>
    <path d="M40 44c1 11 2 21 6 30M44 42l1 6" stroke-width="1.3" opacity=".5"/>
    <path d="M37 52h42M38 62h39" stroke-width="1" opacity=".35"/>
  </svg>`;
  /* little bracket flourish for the card corners */
  const CORNER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M2 22V2h20"/><path d="M6 22V6h16"/><path d="M10 10h5v5h-5z"/></svg>';
  const corners = ['tl', 'tr', 'bl', 'br'].map(k => `<span class="kp-corner kp-${k}">${CORNER}</span>`).join('');
  const SHORT = ['AHD', 'ISN', 'SEL', 'RAB', 'KHA', 'JUM', 'SAB'];

  /* rows for the tail of last month, from the Monday of the 1st's week */
  function prevRows(y, m) {
    const w1 = new Date(y, m, 1).getDay();
    const back = (w1 + 6) % 7;
    const last = new Date(y, m, 0).getDate();
    let h = '';
    for (let i = back; i >= 1; i--) {
      const d = last - i + 1, w = new Date(y, m - 1, d).getDay();
      h += `<div class="lrow kp-out${w === 0 ? ' red' : ''}"><span class="lg-n"><span>${d}</span></span><span class="lg-d">${SHORT[w]}</span><span class="lg-a"></span></div>`;
    }
    return h;
  }

  /* The month page is a fixed-height ledger book: keep the selected row in view
     (three rows of context above it, like the shop's own book). */
  const seen = new WeakSet();
  let lastYm = '', lastTop = 0;
  function settle() {
    const pg = document.querySelector('#shell[data-theme="kopitiam"] #pageBase > .mpage');
    if (!pg || seen.has(pg) || !pg.clientHeight) return;
    seen.add(pg);
    pg.addEventListener('scroll', () => { lastTop = pg.scrollTop; }, { passive: true });
    if (pg.dataset.ym === lastYm) { pg.scrollTop = lastTop; return; }
    lastYm = pg.dataset.ym;
    const sel = pg.querySelector('.lrow.sel'), head = pg.querySelector('.kp-head');
    let top = 0;
    if (sel && head) {
      const rows = [...pg.querySelectorAll('.lrow')], anchor = rows[Math.max(0, rows.indexOf(sel) - 3)];
      top = Math.max(0, anchor.getBoundingClientRect().top - head.getBoundingClientRect().bottom);
    }
    pg.scrollTop = top; lastTop = pg.scrollTop;
  }
  /* remember the book's scroll before a tap re-renders it */
  const remember = e => { const pg = e.target.closest && e.target.closest('#shell[data-theme="kopitiam"] #pageBase > .mpage'); if (pg) lastTop = pg.scrollTop; };
  document.addEventListener('pointerdown', remember, true);
  document.addEventListener('click', remember, true);
  const start = () => new MutationObserver(settle).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-theme', 'data-tab'] });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).kopitiam = {
    ledger: true,
    masthead: () => `<div class="mh mh-kopi">${corners}<div class="kp-words"><p class="kp-small">KEDAI KOPI</p><p class="kp-big">SINAR PAGI</p><p class="kp-zh" lang="zh">新早咖啡店</p></div>${CUP}<p class="kp-tag">KOPI · ROTI · KAWAN · JADUAL HIDUP</p></div>`,
    monthTitle: c => `${c.nav(-1)}<h2 class="mt-main"><span class="mt-month"><span class="full">${c.msMonth.toUpperCase()}</span><span class="short">${c.mon3}</span></span> <span class="mt-year">${c.y}</span></h2>${c.nav(1)}`,
    titleArt: c => `<div class="kp-pre" aria-hidden="true"><div class="lg-head kp-head"><span></span><span></span><span></span><span>ACARA</span></div>${prevRows(c.y, c.m)}</div>`,
    summary: () => '',
    sheetHead: c => `<div class="kp-sh">
      ${corners}
      <p class="kp-sh-sign"><span>KEDAI KOPI SINAR PAGI</span><span lang="zh">新早咖啡店</span></p>
      <div class="kp-sh-bar"><span>${c.msMonth.toUpperCase()} ${c.y}</span><span>No. ${c.pad2(c.y % 100)}${String(c.doy).padStart(4, '0')}</span></div>
      <div class="kp-sh-row">
        <div class="kp-sh-n ${c.tone}" aria-label="${c.d} ${c.msMonth} ${c.y}"><span>${c.d}</span><svg class="ring" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path d="M64 9C34 1 7 16 8 40c1 24 30 37 58 32 25-4 31-30 21-47C79 9 58 4 38 12"/></svg></div>
        <div class="kp-sh-names"><b class="${c.tone}">${c.msDay}</b><span>${c.enDay.toUpperCase()} · <span lang="zh">${c.zhDay}</span></span><span lang="ta">${c.taDay}</span></div>
        ${CUP}
      </div>
      ${c.holiday ? `<p class="kp-sh-hol">★ ${c.esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''} <small>${c.esc(c.holiday.en)}</small></p>` : ''}
      <p class="kp-sh-meta">${c.hijri ? `<span>${c.hijri}</span>` : ''}${c.lunar ? `<span lang="zh">${c.lunar}</span>` : ''}</p>
    </div>`,
  };
})();
