/* Style: Kopitiam Ledger. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const CUP = '<svg class="cup" viewBox="0 0 90 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M34 6c-4 6 4 9 0 15M46 3c-4 6 4 9 0 15M58 6c-4 6 4 9 0 15"/><path d="M18 28h54v10c0 16-12 26-27 26S18 54 18 38Z" fill="currentColor" fill-opacity=".12"/><path d="M72 33c8 0 12 4 12 9s-5 9-13 8"/><path d="M6 68c12 8 66 8 78 0M3 67h84"/><path d="M27 41c3 9 9 13 17 14" opacity=".5"/></svg>';;
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).kopitiam = {
    ledger: true,
    masthead: () => `<div class="mh mh-kopi"><div class="kp-words"><p class="kp-small">KEDAI KOPI</p><p class="kp-big">SINAR PAGI</p><p class="kp-zh" lang="zh">新早咖啡店</p></div>${CUP}<p class="kp-tag">KOPI · ROTI · KAWAN · JADUAL HIDUP</p></div>`,
  };
})();
