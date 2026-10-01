/* Style: Batik Margin. Hooks get a context `c` from app.js (see README, 'Styles'). */
(function () {
  const NAVY = '#122d52', NAVY_D = '#0b2240', GOLD = '#efab45', GOLD_L = '#f8cc72', GOLD_D = '#c4741f', CREAM = '#f3ead2', LINE = '#e9e2cc';

  /* one broad batik petal with a notched tip, pointing up from the origin */
  const PETAL = 'M0 0C-5-4-10-13-8.5-22C-7-27-3-30 0-32C3-30 7-27 8.5-22C10-13 5-4 0 0Z';
  const SHINE = 'M-1-6C-5-10-7-17-5-23C-4-26-2-27-1-27C-2-20-2-12-1-6Z';
  function flower(x, y, r, rot = 0, n = 8) {
    const s = r / 30;
    let back = '', front = '';
    for (let i = 0; i < n; i++) {
      const a = rot + i * 360 / n;
      back += `<path transform="rotate(${a + 180 / n}) scale(.62)" d="${PETAL}" fill="${GOLD_D}"/>`;
      front += `<g transform="rotate(${a})"><path d="${PETAL}" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/><path d="${SHINE}" fill="${GOLD_L}"/><path d="M0-9V-24M0-14l-3-4M0-14l3-4" stroke="${GOLD_D}" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s})">${back}${front}<circle r="8.5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.6"/><circle r="5" fill="none" stroke="${NAVY_D}" stroke-width="1.3"/><circle r="2" fill="${NAVY_D}"/></g>`;
  }
  /* a leaf, base at the origin, pointing up and then rotated; gold or white line */
  function leaf(x, y, len, rot, white) {
    const w = len * 0.4;
    const d = `M0 0C${-w} ${-len * 0.3} ${-w * 0.7} ${-len * 0.8} 0 ${-len}C${w * 0.7} ${-len * 0.8} ${w} ${-len * 0.3} 0 0Z`;
    return white
      ? `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}" fill="none" stroke="${LINE}" stroke-width="1.2"/><path d="M0 -2V${-len * 0.8}" stroke="${LINE}" stroke-width=".8"/></g>`
      : `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${d}" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/><path d="M${-w * 0.25} ${-len * 0.25}C${-w * 0.35} ${-len * 0.55} ${-w * 0.15} ${-len * 0.75} 0 ${-len * 0.85}" fill="none" stroke="${GOLD_L}" stroke-width="1.6" stroke-linecap="round"/><path d="M0 -2V${-len * 0.8}" stroke="${GOLD_D}" stroke-width=".9" fill="none"/></g>`;
  }
  /* a small white line-drawn blossom */
  function blossom(x, y, r, rot = 0) {
    let p = '';
    for (let i = 0; i < 5; i++) p += `<ellipse transform="rotate(${rot + i * 72}) translate(0 ${-r * 0.62})" rx="${r * 0.36}" ry="${r * 0.5}" fill="${NAVY}" stroke="${LINE}" stroke-width="1.1"/>`;
    return `<g transform="translate(${x} ${y})">${p}<circle r="${r * 0.22}" fill="${LINE}"/></g>`;
  }
  function bud(x, y, rot) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C-7-4-9-13-5-20C-3-16 0-18 0-23C0-18 3-16 5-20C9-13 7-4 0 0Z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1"/><path d="M-2-6C-3-10-3-13-2-15" stroke="${GOLD_L}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M0 0V7" stroke="${GOLD}" stroke-width="1.6"/></g>`;
  }
  const sprig = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})" fill="none" stroke="${LINE}" stroke-width="1" stroke-linecap="round"><path d="M0 0C1-6 0-12-2-17"/><path d="M0-5c-4-1-6-4-6-7c3 0 5 3 6 7ZM0-10c4-1 6-4 6-7c-3 0-5 3-6 7ZM-2-17c-2-3-1-6 1-7c1 2 1 5-1 7Z"/></g>`;
  const curl = (x, y, f = 1) => `<path transform="translate(${x} ${y}) scale(${f} 1)" d="M0 0C6-2 11 2 10 7S3 13 0 9S1 2 5 4" fill="none" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>`;
  const berries = (x, y) => `<g fill="${GOLD}"><circle cx="${x}" cy="${y}" r="1.8"/><circle cx="${x + 4}" cy="${y - 3}" r="1.5"/><circle cx="${x + 4}" cy="${y + 3}" r="1.5"/></g>`;

  /* the repeating border tile: 80 x 400 units, seamless top to bottom */
  function borderTile() {
    const H = 400, step = 12.5;
    // scalloped inner edge with lace
    let edge = 'M11 0';
    for (let y = 0; y < H; y += step) edge += `A${step / 2} ${step / 2} 0 0 0 11 ${y + step}`;
    edge = `<path d="${edge}H80V0Z" fill="${NAVY}"/>`;
    let lace = '';
    for (let y = 0; y < H; y += step) {
      const cy = y + step / 2;
      lace += `<circle cx="7.6" cy="${cy}" r="1.3" fill="${LINE}"/><path d="M11.2 ${cy - 3.6}q3.4 3.6 0 7.2" fill="none" stroke="${LINE}" stroke-width=".9"/>`;
      lace += (y / step) % 2
        ? `<g transform="translate(16.4 ${cy})" fill="${LINE}"><circle cy="-2.2" r="1.1"/><circle cy="2.2" r="1.1"/><circle cx="-2.2" r="1.1"/><circle cx="2.2" r="1.1"/></g>`
        : `<path d="M16.4 ${cy - 2.6}l2 2.6-2 2.6-2-2.6Z" fill="none" stroke="${LINE}" stroke-width=".8"/><circle cx="16.4" cy="${cy}" r=".6" fill="${LINE}"/>`;
    }
    lace += `<path d="M20.5 0V${H}" stroke="${LINE}" stroke-width="1.3" stroke-dasharray="1.6 1.8"/><path d="M23.5 0V${H}" stroke="${GOLD}" stroke-width="1" opacity=".85"/>`;
    // mottled indigo field with fine crackle
    const tex = `<g fill="${NAVY_D}" opacity=".55"><ellipse cx="36" cy="60" rx="9" ry="22"/><ellipse cx="70" cy="180" rx="8" ry="26"/><ellipse cx="34" cy="250" rx="8" ry="18"/><ellipse cx="72" cy="360" rx="7" ry="20"/></g>` +
      `<g stroke="#2d4f80" stroke-width=".7" fill="none" opacity=".75"><path d="M30 12l8 10-3 9M72 60l-6 9 4 12M28 128l9 6 2 11M74 168l-7 8 5 10M30 222l7 9-2 10M72 262l-6 8 3 9M29 330l8 7 1 10M73 384l-6 7"/></g>`;
    // the gold vine, seamless at both ends
    const vine = `<path d="M50 0C38 50 38 150 50 200C62 250 62 350 50 400" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M42 150C34 156 30 166 31 176M58 250C66 244 70 236 71 226M44 40C52 30 60 28 68 32M57 350C48 360 40 362 31 358M47 22C40 14 34 12 30 14M55 382C62 390 66 392 70 391" fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-linecap="round"/>`;
    const art =
      leaf(43, 150, 21, -140) + leaf(45, 52, 18, -35) + leaf(41, 128, 15, 200) + leaf(58, 128, 17, 50, true) +
      blossom(66, 160, 9, 10) + curl(28, 178) + bud(69, 33, 55) + blossom(30, 30, 6.5) + berries(66, 108) + leaf(64, 196, 14, 160, true) +
      leaf(57, 250, 21, 40) + leaf(56, 352, 18, 145) + leaf(59, 328, 15, 20) + leaf(42, 330, 17, -50, true) +
      blossom(34, 238, 9, 30) + curl(72, 370, -1) + bud(31, 358, -120) + blossom(70, 214, 6) + berries(30, 290) + leaf(38, 396, 14, -20, true) + leaf(38, -4, 14, -20, true) +
      sprig(70, 72, 20) + sprig(35, 200, -15) + sprig(35, 276, -10) + sprig(70, 396, 25) + sprig(70, -4, 25) + curl(64, 4) + curl(34, 300, -1) + leaf(66, 268, 13, 70, true) + leaf(35, 112, 13, -70, true) +
      flower(47, 92, 33, 6) + flower(53, 292, 33, -14);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 ${H}" width="80" height="${H}">${edge}${tex}${lace}${vine}${art}</svg>`;
  }
  const url = `url("data:image/svg+xml,${encodeURIComponent(borderTile())}")`;
  try { document.documentElement.style.setProperty('--bk-border', url); } catch (e) { /* no DOM */ }

  /* a small gold flower used as a divider in the day sheet */
  const ornament = () => `<svg class="bk-orn" viewBox="0 0 160 30" aria-hidden="true"><path d="M4 15H58M102 15H156" stroke="${GOLD_D}" stroke-width="1.2"/><circle cx="62" cy="15" r="2" fill="${GOLD_D}"/><circle cx="98" cy="15" r="2" fill="${GOLD_D}"/>${flower(80, 15, 13, 0)}</svg>`;

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).batik = {
    monthTitle: c => `
      <h2 class="mt-main" style="--n:${Math.max(c.msMonth.length, 5)}"><span class="mt-month"><span class="full">${c.msMonth.toUpperCase()}</span><span class="short">${c.mon3}</span></span> <span class="mt-year">${c.y}</span></h2>
      <p class="mt-sub"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></p>
      <div class="bk-nav" style="--n:${Math.max(c.msMonth.length, 5)}">${c.nav(-1)}${c.nav(1)}</div>`,
    summary: c => `<div class="sum-main">
      <h3 class="sum-h">${c.msDay.toUpperCase()}, ${c.d} ${c.msMonth.toUpperCase()} ${c.y}</h3>
      ${c.holiday ? `<p class="sum-hol">${c.esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''}</p>` : ''}
      <div class="sum-events">${c.events()}</div>
    </div>`,
    dateArt: () => ornament(),
  };
})();
