/* Style: Midnight Almanac. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const MOON = '<svg class="moon" viewBox="0 0 120 90" aria-hidden="true"><path d="M70 8a32 32 0 1 0 26 52A26 26 0 1 1 70 8Z" fill="#e3bd62"/><g fill="none" stroke="#d4a84a" stroke-width="1.6" stroke-linecap="round" opacity=".85"><path d="M4 66c8-6 18-6 24 0 6-6 16-6 22 0M30 80c6-5 14-5 20 0 6-5 14-5 20 0"/><path d="M14 60c3-6 10-7 14-2"/></g><g fill="#e3bd62"><circle cx="104" cy="14" r="1.6"/><circle cx="20" cy="22" r="1.2"/><circle cx="112" cy="44" r="1"/></g></svg>';
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).midnight = {
    titleArt: () => `<div class="t-art">${MOON}</div>`,
    summaryArt: c => `<div class="s-art">${c.hibiscus({ line: '#d4a84a', sw: 1.4 })}</div>`,
    dateArt: c => c.hibiscus({ line: '#d4a84a', sw: 1.4, cls: 'sh-art' }),
  };
})();
