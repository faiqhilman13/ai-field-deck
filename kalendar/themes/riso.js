/* Style: Riso Pop. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const SKYLINE = '<svg class="skyline" viewBox="0 0 160 120" aria-hidden="true"><g fill="#2b55a6"><path d="M22 120V44h16v76Z"/><path d="M24 44V32h12v12Z"/><path d="M26 32V22h8v10Z"/><path d="M29.5 22V4h1v18Z"/><path d="M52 120V44h16v76Z"/><path d="M54 44V32h12v12Z"/><path d="M56 32V22h8v10Z"/><path d="M59.5 22V4h1v18Z"/><rect x="38" y="70" width="14" height="3"/></g><g stroke="#f6f1e7" stroke-width="1" opacity=".55"><path d="M24 56h12M24 64h12M24 80h12M24 88h12M24 96h12M24 104h12M54 56h12M54 64h12M54 80h12M54 88h12M54 96h12M54 104h12"/></g><g fill="none" stroke="#2b55a6" stroke-width="2.4" stroke-linejoin="round"><rect x="74" y="86" width="80" height="26" rx="5" fill="#f6f1e7"/><path d="M80 92h10v8H80zM94 92h10v8H94zM108 92h10v8h-10zM122 92h10v8h-10zM138 92h10v12h-10z"/></g><g fill="#2b55a6"><circle cx="90" cy="113" r="5"/><circle cx="138" cy="113" r="5"/><rect x="0" y="117" width="160" height="3"/></g></svg>';
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).riso = {
    titleArt: c => `<div class="t-art"><span class="riso-sun"></span>${c.hibiscus({ petal: '#2b55a6', centre: '#e2372b' })}</div>`,
    summaryArt: () => `<div class="s-art">${SKYLINE}</div>`,
  };
})();
