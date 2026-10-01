/* Style: Rubber Stamp. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  let uid;
  function stampSeal() {
    const id = uid();
    return `<svg class="seal" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="${id}" d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0"/></defs><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="60" cy="60" r="30" fill="none" stroke="currentColor" stroke-width="1.6"/><text font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="15" letter-spacing="3" fill="currentColor"><textPath href="#${id}" startOffset="2%">JADUAL ★ HARIAN ★ JADUAL ★</textPath></text><path d="M60 42l5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1Z" fill="currentColor"/></svg>`;
  }

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).stamp = {
    miniArt: c => { uid = c.uid; return stampSeal(); },
  };
})();
