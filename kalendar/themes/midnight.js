/* Style: Midnight Almanac. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const GOLD = '#c9a24e';
  let n = 0;
  /* swirling Chinese-style cloud (xiangyun): a lobed ribbon ending in spiral curls */
  const curl = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 1 ${r} ${r}a${r / 2} ${r / 2} 0 1 1 ${-r / 2} ${-r / 2}`;
  const cloud = (tf, fill) => `<g transform="${tf}">
    <path d="M-6 26H2C6 26 8 21 13 20C9 14 17 6 25 10C29 1 45 2 46 11C53 9 58 16 53 21C59 22 63 26 72 26H80Z" fill="${fill}" stroke="none"/>
    <path d="M-6 26H2C6 26 8 21 13 20C9 14 17 6 25 10C29 1 45 2 46 11C53 9 58 16 53 21C59 22 63 26 72 26H80"/>
    <path d="${curl(24, 17, 4.5)}M${38} 12c-3 0-4 4-1 5"/><path d="${curl(48, 18, 3)}" stroke-width=".8"/>
  </g>`;
  function moon() {
    const id = 'mnm' + (++n);
    return `<svg class="mn-moon" viewBox="0 0 130 104" aria-hidden="true">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d995"/><stop offset=".5" stop-color="#ddb867"/><stop offset="1" stop-color="#b08638"/></linearGradient>
        <mask id="${id}m"><rect width="130" height="104" fill="#fff"/><circle cx="69" cy="40" r="31" fill="#000"/></mask>
      </defs>
      <g mask="url(#${id}m)">
        <circle cx="84" cy="47" r="34" fill="url(#${id}g)"/>
        <g fill="#8a6526" opacity=".35"><circle cx="110" cy="40" r="3"/><circle cx="104" cy="66" r="2.2"/><circle cx="113" cy="54" r="1.4"/><ellipse cx="96" cy="76" rx="4" ry="1.6"/><circle cx="106" cy="24" r="1.6"/></g>
        <g fill="#fff4cf" opacity=".25"><circle cx="113" cy="33" r="1.2"/><circle cx="108" cy="58" r="1"/></g>
      </g>
      <g fill="#c9a24e" opacity=".9"><circle cx="30" cy="16" r="1"/><circle cx="50" cy="6" r=".7"/><circle cx="125" cy="10" r=".8"/></g>
      <g stroke="#c9a24e" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${cloud('translate(8 62) scale(.78)', '#1b1a18')}
        ${cloud('translate(132 64) scale(-.86 .86)', '#1b1a18')}
        <path d="M2 88H62M40 94h48M74 86h50M96 96h30" stroke-width=".9"/>
        ${cloud('translate(36 72) scale(.62)', '#1b1a18')}
      </g>
    </svg>`;
  }
  /* line-art hibiscus with serrated leaves, a bud and a long stamen, drawn in gold */
  const f1 = v => Math.round(v * 10) / 10;
  function leaf(x, y, ang, L, W) {
    const up = [], lo = [], N = 12;
    for (let i = 0; i <= N; i++) {
      const t = i / N, w = W * Math.pow(Math.sin(Math.PI * Math.min(t * 1.08, 1)), .75) * (1 - .25 * t) + (i % 2 && i < N ? 1.4 : 0);
      up.push(`${f1(t * L)} ${f1(-w)}`); lo.unshift(`${f1(t * L)} ${f1(w)}`);
    }
    const veins = [.25, .45, .65].map(t => `M${f1(t * L)} 0l${f1(L * .14)} ${f1(-W * .6)}M${f1(t * L)} 0l${f1(L * .14)} ${f1(W * .6)}`).join('');
    return `<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0L${up.join('L')}L${lo.join('L')}Z" fill="#1b1a18"/><path d="M0 0H${f1(L * .92)}${veins}" stroke-width=".55"/></g>`;
  }
  function hibiscus() {
    const petal = 'M0 0C-6-6-15-14-17-25c-1-4 2-7 5-6 1-4 5-5 7-3 2-3 6-3 8 0 3-1 6 1 5 5-2 10-6 19-8 29Z';
    const pet = (r, k) => `<g transform="rotate(${r}) scale(${k})"><path d="${petal}" fill="#1b1a18"/><path d="M0-3C-1-10-1-17-2-25M-1-6C-4-12-7-16-11-21M0-6C2-12 4-17 6-22" stroke-width=".45"/></g>`;
    return `<svg class="mn-hib" viewBox="0 0 100 106" aria-hidden="true"><g fill="none" stroke="#c19d58" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round">
      <path d="M52 64C51 80 54 94 51 106"/>
      ${leaf(46, 78, 160, 44, 12)}${leaf(58, 78, 22, 42, 12)}${leaf(52, 84, 105, 28, 9)}${leaf(62, 58, -22, 36, 10)}
      <g transform="translate(32 34) rotate(-32)"><path d="M0 0C-5-6-5-15 0-24 5-15 5-6 0 0Z" fill="#1b1a18"/><path d="M0-2C-2-8-2-14 0-20M0 0c-6 1-10-3-11-7M0 0c6 1 9-3 10-7"/><path d="M0 0C1 6 6 12 14 18"/></g>
      <g transform="translate(52 60) scale(1.08 .96)">
        ${pet(-145, 1)}${pet(145, .95)}${pet(-72, .9)}${pet(-10, 1.05)}${pet(62, 1.05)}
        <path d="M0 0C3-10 8-20 15-30" stroke-width="1.2"/><g fill="#c9a24e" stroke="none"><circle cx="15.5" cy="-31" r="1.8"/><circle cx="12" cy="-29" r=".9"/><circle cx="18" cy="-27.5" r=".9"/><circle cx="13.5" cy="-25" r=".8"/></g>
        <path d="M-3 0l-4-6M3 0l5-5M0 3v-8" stroke-width=".6"/>
      </g></g></svg>`;
  }

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).midnight = {
    monthTitle: c => `
      <h2 class="mt-main"><span class="mt-month">${c.msMonth.toUpperCase()}</span> <span class="mt-year">${c.y}</span></h2>
      <p class="mt-sub"><span lang="zh">${c.zhMonth}</span><span class="mn-en">${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span><span class="mn-nav">${c.nav(-1)}${c.nav(1)}</span></p>`,
    titleArt: () => `<div class="t-art">${moon()}</div>`,
    summary: c => `<div class="mn-panel">
        <div class="mn-big" aria-hidden="true">${c.d}</div>
        <div class="mn-names"><b>${c.msDay.toUpperCase()}</b><span>${c.enDay.toUpperCase()}</span><span lang="zh">${c.zhDay}</span></div>
        <div class="mn-art">${hibiscus()}</div>
      </div>
      ${c.holiday ? `<p class="sum-hol">★ ${c.esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''}</p>` : ''}
      <div class="sum-events">${c.events()}</div>
      <button type="button" class="sum-more" data-goto="day">Fakta &amp; peribahasa <span aria-hidden="true">›</span></button>`,
    sheetHead: c => `
      <header class="sh-top mn-top"><div><span class="sh-my">${c.msMonth.toUpperCase()} ${c.y}</span>
        <span class="sh-alt"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></span></div>
        <div class="mn-tart">${moon()}</div></header>
      <div class="sh-date">
        <div class="sh-num ${c.tone}" aria-label="${c.d} ${c.msMonth} ${c.y}">${c.d}</div>
        <div class="sh-dayname ${c.tone}">${c.msDay.toUpperCase()}</div>
        <div class="sh-langs"><span>${c.enDay.toUpperCase()}</span><span lang="zh">${c.zhDay}</span><span lang="ta">${c.taDay}</span></div>
        <div class="sh-art">${hibiscus()}</div>
      </div>
      <p class="sh-meta">${c.hijri ? `<span class="m-hij" title="Tarikh Hijrah">${c.hijri}</span>` : ''}${c.lunar ? `<span class="m-lun" lang="zh" title="Kalendar lunar Cina">${c.lunar}</span>` : ''}</p>
      ${c.holiday ? `<p class="sh-hol">${c.esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''}<small>${c.esc(c.holiday.en)}${c.holiday.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}`,
  };
})();
