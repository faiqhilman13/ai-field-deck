/* Style: Kedai Runcit. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const SHELF_EXTRA = [
    '<svg viewBox="0 0 20 50" aria-hidden="true"><rect x="7" y="2" width="6" height="8" fill="#c0392b"/><path d="M7 10C3 16 3 18 3 22v24q0 2 2 2h10q2 0 2-2V22c0-4 0-6-4-12Z" fill="#3b2314"/><rect x="3" y="26" width="14" height="12" fill="#f2c94c"/><text x="10" y="34.4" text-anchor="middle" font-size="5" font-weight="800" fill="#c0392b" font-family="Barlow Condensed,sans-serif">KICAP</text></svg>',
    '<svg viewBox="0 0 44 26" aria-hidden="true"><rect x="2" y="4" width="40" height="20" rx="4" fill="#d0281f"/><rect x="2" y="2" width="40" height="4" rx="2" fill="#c9ccd1"/><text x="22" y="18" text-anchor="middle" font-size="9" font-weight="800" fill="#fff5c8" font-family="Barlow Condensed,sans-serif">SARDIN</text></svg>',
    '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="6" width="36" height="32" rx="2" fill="#1d58a8"/><rect x="2" y="3" width="36" height="6" rx="1" fill="#c9ccd1"/><rect x="6" y="14" width="28" height="16" fill="#fff8e0"/><text x="20" y="25" text-anchor="middle" font-size="7.5" font-weight="800" fill="#d0281f" font-family="Barlow Condensed,sans-serif">BISKUT</text></svg>',
    '<svg viewBox="0 0 32 38" aria-hidden="true"><ellipse cx="16" cy="6" rx="12" ry="3.5" fill="#c9ccd1"/><path d="M4 6v24q12 5 24 0V6q-12 4-24 0Z" fill="#1b6b3a"/><path d="M4 12q12 4 24 0v12q-12 4-24 0Z" fill="#f2c94c"/><text x="16" y="21.6" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="6.4" fill="#1b6b3a">KOKO</text></svg>',
  ];
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).runcit = {
    masthead: c => `<div class="mh mh-runcit"><p class="rc-hari">HARI HARI</p><p class="rc-kedai">KEDAI RUNCIT <span lang="zh">杂货店</span></p><div class="rc-shelf">${c.goods.join('')}${SHELF_EXTRA.join('')}</div><p class="rc-tag">BERAS · GULA · MINYAK MASAK · TEPUNG · MINUMAN · BARANG HARIAN</p></div>`,
  };
})();
