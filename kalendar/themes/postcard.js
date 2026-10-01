/* Style: Postcard Month. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  let uid;
  function postcardScene() {
    const id = uid();
    const shops = ['#e9b4a0', '#f1d38e', '#a9cbb7', '#f0c9a8', '#b9c7e0', '#e7a98f'].map((c, i) => {
      const x = 34 + i * 46, h = [70, 78, 72, 80, 74, 68][i], top = 150 - h;
      const win = [0, 1, 2].map(j => `<path d="M${x + 6 + j * 13} ${top + 34}v-10a5 5 0 0 1 10 0v10Z" fill="#fff6e2" stroke="#6d5a46" stroke-width=".8"/><rect x="${x + 5 + j * 13}" y="${top + 24}" width="2.4" height="10" fill="#4e7a62"/>`).join('');
      const arch = [0, 1].map(j => `<path d="M${x + 6 + j * 20} 150v-16a8 8 0 0 1 16 0v16Z" fill="#5a4636" opacity=".75"/>`).join('');
      return `<rect x="${x}" y="${top}" width="46" height="${h}" fill="${c}" stroke="#7a6550" stroke-width=".8"/><rect x="${x - 1}" y="${top}" width="48" height="6" fill="#fff4dd" stroke="#7a6550" stroke-width=".6"/><path d="M${x} ${top + 44}h46" stroke="#7a6550" stroke-width="1.4"/>${win}${arch}`;
    }).join('');
    const palm = (x, s) => `<g transform="translate(${x} 0) scale(${s} 1)" fill="none" stroke="#2f5a34" stroke-linecap="round"><path d="M0 182C2 150 -2 118 8 92" stroke-width="4" stroke="#7a5a3a"/><path d="M8 92c-14-8-28-4-36 6M8 92c-6-14-20-18-32-16M8 92c6-14 20-18 32-12M8 92c16-4 26 4 30 14M8 92c2-14-2-24-12-28" stroke-width="3.4"/></g>`;
    return `<svg class="pc-scene" viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc6dc"/><stop offset=".7" stop-color="#f4e7c8"/></linearGradient><pattern id="${id}h" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#3b2a12"/></pattern></defs><rect width="400" height="190" fill="url(#${id})"/><g fill="#fff" opacity=".8"><ellipse cx="70" cy="34" rx="34" ry="9"/><ellipse cx="96" cy="28" rx="22" ry="8"/><ellipse cx="230" cy="22" rx="30" ry="7"/></g><path d="M338 30v120" stroke="#8a7f6a" stroke-width="7"/><path d="M338 6v26" stroke="#8a7f6a" stroke-width="2"/><ellipse cx="338" cy="42" rx="15" ry="8" fill="#e8e1cf" stroke="#8a7f6a" stroke-width="1.5"/><ellipse cx="338" cy="36" rx="10" ry="4" fill="#cfc6b0"/>${shops}<path d="M0 190L150 150h100l150 40Z" fill="#cdbfa1"/><path d="M200 156v8M200 172v10" stroke="#fff6e2" stroke-width="2"/><path d="M0 150h400" stroke="#7a6550" stroke-width="1"/>${palm(10, 1)}${palm(386, -1)}<rect width="400" height="190" fill="url(#${id}h)" opacity=".07"/></svg>`;
  }
  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).postcard = {
    masthead: c => { uid = c.uid; return `<div class="mh mh-post">${postcardScene()}<p class="pc-hello"><span>Selamat Datang</span><span>ke</span><b>MALAYSIA</b></p></div>`; },
    summaryArt: c => `<div class="s-art">${c.hibiscus({ petal: '#e5604d', centre: '#f2c94c' })}</div>`,
  };
})();
