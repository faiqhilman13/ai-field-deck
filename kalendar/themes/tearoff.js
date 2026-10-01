/* Style: Tear-off. Hooks get a context `c` from app.js (see README, 'Styles').
   A red-bound daily pad: huge red numeral, day names, a mini month and an agenda table. */
(() => {
  const T = (window.SEHARI_THEMES = window.SEHARI_THEMES || {});


  T.tearoff = {
    sheetHead: c => {
      const h = c.holiday;
      const two = String(c.d).length > 1 ? ' two' : '';
      return `
      <header class="sh-top to-top"><span class="sh-my">${c.msMonth.toUpperCase()}&nbsp; ${c.y}</span><span class="sh-alt"><span lang="zh">${c.zhMonth}</span><span lang="ta">${c.taMonth}</span></span></header>
      <div class="sh-date to-date">
        <div class="sh-num ${c.tone}${two}" aria-label="${c.d} ${c.msMonth} ${c.y}">${c.d}</div>
        <div class="sh-dayname ${c.tone}">${c.msDay.toUpperCase()}</div>
      </div>
      <div class="to-langs"><span lang="zh">${c.zhDay}</span><span>${c.enDay.toUpperCase()}</span><span lang="ta">${c.taDay}</span></div>
      ${h ? `<p class="sh-hol">${c.esc(h.ms)}${h.approx ? '*' : ''}<small>${c.esc(h.en)}${h.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}
      <div class="sh-mini to-mini">${c.miniMonth()}<div class="sh-mini-side"><span>${c.msMonth.toUpperCase()}</span><span>${c.enMonth.toUpperCase()}</span><span lang="zh">${c.zhMonth}</span></div></div>
      <div class="to-add"><button type="button" class="to-acara"><span aria-hidden="true">+</span> Acara</button></div>
      <p class="sh-meta to-meta">${c.hijri ? `<span class="m-hij" title="Tarikh Hijrah">${c.hijri}</span>` : ''}${c.lunar ? `<span class="m-lun" lang="zh" title="Kalendar lunar Cina">${c.lunar}</span>` : ''}</p>`;
    },
  };

  // the in-sheet "+ Acara" button opens the same dialog as the bottom-bar button
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.to-acara');
    if (!b) return;
    const real = document.getElementById('addEvent');
    if (real && !b.closest('.preview')) real.click();
  });
})();
