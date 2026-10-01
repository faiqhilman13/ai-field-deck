/* Style: Kalendar Kuda. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const HORSE = '<svg class="horse" viewBox="0 0 140 100" aria-hidden="true"><path fill="currentColor" d="M116 14l-2-10 6 7c6 7 12 17 16 27 1 4-2 8-6 8-6-1-12-3-16 0-4 4-6 10-8 16 2 4 6 6 12 2l8-6 4 2-10 10c-6 4-14 4-18 0l2 12 8 12-4 2-10-12-4-12c-10 2-24 2-34 0l-8 8-12 10-4-2 10-12 2-10-4 10 2 18-4 2-4-18 2-16c-4-6-4-12-2-16-8 0-18 6-28 18 4-14 14-24 28-26 16-2 38 2 52-2 6-4 10-12 14-18 4-4 8-6 12-4Z"/><path d="M104 19c-7 2-11 7-13 13M109 15c-7 1-11 5-14 10M100 25c-6 3-9 7-10 12" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="125" cy="25" r="1.8" fill="#fffdf7"/></svg>';;
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).kuda = {
    masthead: () => `<div class="mh mh-kuda"><p class="kd-side" lang="zh">耐用<br>實用<br>天天進步</p><p class="kd-word">KALENDAR</p><div class="kd-horse">${HORSE}</div><p class="kd-sub"><span>KALENDAR KUDA</span><b lang="zh">馬牌日曆</b></p></div>`,
  };
})();
