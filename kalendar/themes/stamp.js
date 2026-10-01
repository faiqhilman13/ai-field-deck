/* Style: Rubber Stamp. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  /* rough, inked edge for anything drawn with a rubber stamp */
  const inkFilter = (id, seed = 3) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 7.1" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="s"/><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${seed + 4}" result="w"/><feDisplacementMap in="s" in2="w" scale="2.2"/></filter>`;

  /* the circular "JADUAL HARIAN" office seal */
  function seal(c, top = 'JADUAL', bottom = 'HARIAN') {
    const f = c.uid(), a = c.uid(), b = c.uid();
    const star = (cx, cy, r) => {
      let p = '';
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r;
        p += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(ang)).toFixed(2)} ${(cy + rr * Math.sin(ang)).toFixed(2)}`;
      }
      return `<path d="${p}Z"/>`;
    };
    return `<svg class="st-seal" viewBox="0 0 140 140" aria-hidden="true"><defs>${inkFilter(f, 7)}
      <path id="${a}" d="M33 70a37 37 0 0 1 74 0"/><path id="${b}" d="M14 70a56 56 0 0 0 112 0"/></defs>
      <g filter="url(#${f})" fill="currentColor" stroke="currentColor">
        <circle cx="70" cy="70" r="66" fill="none" stroke-width="5"/>
        <circle cx="70" cy="70" r="59.5" fill="none" stroke-width="1.6"/>
        <g stroke="none">
          <text font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="24" letter-spacing="5" text-anchor="middle"><textPath href="#${a}" startOffset="50%">${top}</textPath></text>
          <text font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="24" letter-spacing="5" text-anchor="middle"><textPath href="#${b}" startOffset="50%">${bottom}</textPath></text>
          ${star(70, 72, 21)}${star(22, 72, 4)}${star(118, 72, 4)}
        </g>
      </g></svg>`;
  }

  /* the KHAMIS-style day stamp: an inked, double-ruled box */
  const dayStamp = (txt, cls = '') => `<span class="st-stamp ${cls}"><span>${txt}</span></span>`;

  const formNo = c => `${String(c.y % 100).padStart(2, '0')}${String(c.doy).padStart(4, '0')}`;

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).stamp = {
    sheetHead: c => {
      const h = c.holiday;
      return `
      <div class="sh-form"><span class="st-form-name">PELAN<br>JADUAL<br>HARIAN</span><span class="sh-no">No. <b>${formNo(c)}</b></span></div>
      <div class="sh-date">
        ${dayStamp(c.msDay.toUpperCase(), c.tone)}
        <div class="sh-dmy" aria-label="${c.d} ${c.msMonth} ${c.y}">${c.pad2(c.d)}<i>/</i>${c.pad2(c.m + 1)}<i>/</i>${c.y}</div>
      </div>
      <header class="sh-top"><span class="sh-my">${c.msMonth.toUpperCase()} ${c.y}</span><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span></header>
      ${h ? `<p class="sh-hol">${c.esc(h.ms)}${h.approx ? '*' : ''}<small>${c.esc(h.en)}${h.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}
      <p class="sh-meta">${c.hijri ? `<span class="m-hij" title="Tarikh Hijrah">${c.hijri}</span>` : ''}${c.lunar ? `<span class="m-lun" lang="zh" title="Kalendar lunar Cina">${c.lunar}</span>` : ''}<span lang="ta">${c.taDay}</span></p>
      <div class="sh-mini"><div class="st-mm"><b class="st-mm-h">${c.msMonth.toUpperCase()} ${c.y}</b>${c.miniMonth()}</div>${seal(c)}</div>`;
    },
    masthead: c => `
      <div class="st-mast"><span class="st-form-name">PELAN<br>JADUAL<br>BULANAN</span><span class="sh-no">No. <b>${c.y}${String(c.m + 1).padStart(2, '0')}</b></span></div>`,
    monthTitle: c => `
      ${c.nav(-1)}
      <h2 class="mt-main"><span class="mt-month"><span class="full">${c.msMonth.toUpperCase()}</span><span class="short">${c.mon3}</span></span> <span class="mt-year">${c.y}</span></h2>
      ${c.nav(1)}
      <p class="mt-sub"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></p>`,
    titleArt: c => dayStamp('BULANAN', 'st-mstamp'),
    summaryArt: c => seal(c),
  };
})();
