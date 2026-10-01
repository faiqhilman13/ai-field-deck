/* Style: Riso Pop. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const RED = '#e8403a', BLUE = '#2450a6', PAPER = '#f6efe0';

  /* a broad serrated hibiscus leaf, base at 0,0 pointing along +x */
  function leaf(len, wid, teeth) {
    const top = [], bot = [];
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth;
      const lobe = 1 + .18 * Math.sin(t * Math.PI * 3);
      const w = Math.pow(Math.sin(Math.PI * Math.min(t * 1.02, 1)), .7) * wid * (t < .5 ? 1 : 1 - (t - .5) * .5) * lobe;
      const j = i % 2 ? 3.4 : 0;
      top.push(`${(t * len + (i % 2 ? 2 : 0)).toFixed(1)} ${(-w - j).toFixed(1)}`);
      bot.unshift(`${(t * len + (i % 2 ? 2 : 0)).toFixed(1)} ${(w + j).toFixed(1)}`);
    }
    const veins = [.16, .34, .52, .7].map(t => {
      const x = t * len, w = Math.sin(Math.PI * t) * wid * .78;
      return `M${x.toFixed(1)} 0Q${(x + len * .08).toFixed(1)} ${(-w * .5).toFixed(1)} ${(x + len * .17).toFixed(1)} ${(-w).toFixed(1)}M${x.toFixed(1)} 0Q${(x + len * .08).toFixed(1)} ${(w * .5).toFixed(1)} ${(x + len * .17).toFixed(1)} ${w.toFixed(1)}`;
    }).join('');
    return `<path d="M0 0L${top.join('L')}L${bot.join('L')}Z" fill="${BLUE}"/><path d="M0 0H${(len * .9).toFixed(1)}${veins}" stroke="${PAPER}" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".85"/>`;
  }
  const L = (x, y, r, len, wid, teeth = 14) => `<g transform="translate(${x} ${y}) rotate(${r})">${leaf(len, wid, teeth)}</g>`;

  /* a ruffled hibiscus petal, from the centre (0,0) out towards -y */
  const PETAL = 'M0 0C-24-8-46-30-42-54C-40-66-28-70-21-64C-16-75-3-77 3-70C10-78 24-75 28-64C38-66 48-52 42-38C35-20 16-6 0 0Z';
  const petals = [0, 72, 144, 216, 288].map((r, i) => `<g transform="rotate(${r + (i % 2 ? 5 : -4)}) scale(.88 1)"><path d="${PETAL}" fill="${RED}" stroke="${PAPER}" stroke-width="2.6" stroke-linejoin="round"/><path d="M0-6L-16-50M0-6L-3-60M0-6L12-54M0-8L-28-38M0-8L26-40M-8-30L-20-58M6-30L20-60" stroke="#c42a24" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-6-14L-12-40M4-14L6-44" stroke="${PAPER}" stroke-width="1.6" fill="none" opacity=".75" stroke-linecap="round"/></g>`).join('');

  const SPECK = id => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.2 0 0 0 2.75" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`;

  function titleArt(c) {
    const f = c.uid();
    return `<div class="t-art"><svg class="riso-hib" viewBox="0 0 236 290" aria-hidden="true">${SPECK(f)}
      <g filter="url(#${f})">
        <circle cx="156" cy="56" r="41" fill="${RED}" opacity=".9"/>
        ${L(200, 172, -102, 112, 36, 18)}
        ${L(196, 210, -14, 60, 26, 10)}
        ${L(178, 262, -52, 80, 28, 14)}
        ${L(176, 270, -4, 66, 24, 12)}
        ${L(84, 196, 194, 82, 27, 14)}
        ${L(100, 238, 150, 72, 24, 12)}
        <path d="M170 290C172 270 178 250 196 236" stroke="${BLUE}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g transform="translate(144 186) rotate(4) scale(1.08)">${petals}
          <path d="M0 0C-8-14-16-28-26-40" stroke="${PAPER}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
          <g fill="${PAPER}" opacity=".85"><circle cx="-28" cy="-42" r="2.6"/><circle cx="-23" cy="-45" r="2"/><circle cx="-32" cy="-38" r="2"/></g>
          <circle r="6" fill="#c42a24"/>
        </g>
      </g></svg></div>`;
  }

  /* KL skyline, a bus and a few blocks, blue ink */
  function tower(cx, s = 1) {
    const tiers = [[10, 62], [9, 16], [7.5, 12], [6, 10], [4.5, 8], [3, 8]].map(([w, h]) => [w * s, h * s]);
    let y = 150, out = '';
    tiers.forEach(([hw, h]) => { out += `<rect x="${cx - hw}" y="${y - h}" width="${hw * 2}" height="${h}"/>`; y -= h; });
    return `<g fill="${BLUE}" stroke="none">${out}<path d="M${cx - 1} ${y}L${cx} ${y - 20 * s}L${cx + 1} ${y}Z"/></g><path d="M${cx - 5 * s} 148V${150 - 76 * s}M${cx} 148V${y + 2}M${cx + 5 * s} 148V${150 - 76 * s}" stroke="${PAPER}" stroke-width=".9" opacity=".8"/>`;
  }
  const BLD = (x, w, top) => `<rect x="${x}" y="${top}" width="${w}" height="${184 - top}" fill="${BLUE}" stroke="none"/><path d="${Array.from({ length: Math.floor((184 - top - 4) / 6) }, (_, i) => `M${x + 2} ${top + 4 + i * 6}h${w - 4}`).join('')}" stroke="${PAPER}" stroke-width="1.2"/>`;
  const SKYLINE = `<svg class="skyline" viewBox="0 0 240 190" aria-hidden="true"><g stroke="${BLUE}" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round">
    ${BLD(0, 12, 88)}${BLD(46, 12, 104)}${BLD(134, 10, 110)}
    <g fill="${BLUE}" stroke="none"><path d="M64 150V96h4V84h3V74l3-12 3 12v10h3v12h4v54Z"/></g><path d="M68 100h12M68 108h12M68 116h12M68 124h12M68 132h12" stroke="${PAPER}" stroke-width="1"/>
    ${tower(30, 1.08)}${tower(112, 1.04)}
    <path d="M40 96h62" stroke-width="2.6"/>
    ${BLD(152, 12, 156)}${BLD(166, 10, 164)}${BLD(178, 14, 150)}${BLD(194, 10, 166)}${BLD(206, 12, 158)}${BLD(220, 9, 168)}
    <path d="M10 106h122c8 0 13 5 14 12l3 50c0 7-4 11-10 11H14c-7 0-11-4-11-11v-50c0-7 3-12 7-12Z" fill="${PAPER}" stroke-width="2.6"/>
    <path d="M6 118h140" stroke-width="1.4"/>
    <g fill="${BLUE}" stroke="none"><path d="M12 121h22v20H12zM38 121h22v20H38zM64 121h22v20H64zM90 121h22v20H90zM116 121h18v20h-18z"/><path d="M137 121h6c2 0 3 2 3 4l1 16h-10z"/></g>
    <path d="M14 125h18M40 125h18M66 125h18M92 125h18M118 125h14" stroke="${PAPER}" stroke-width="1.6"/>
    <path d="M4 150h144M4 160h145" stroke-width="1.4"/>
    <path d="M122 145v30M126 145v30" stroke-width="1.2"/>
    <path d="M0 184h240" stroke-width="2.4"/>
    <g fill="${PAPER}" stroke-width="2.6"><circle cx="34" cy="178" r="9"/><circle cx="108" cy="178" r="9"/></g>
    <g fill="${BLUE}" stroke="none"><circle cx="34" cy="178" r="3.5"/><circle cx="108" cy="178" r="3.5"/><path d="M3 166h6v6H3zM140 166h7v6h-7z"/></g>
  </g></svg>`;

  const SMALL_HIB = `<svg class="riso-mini" viewBox="-80 -80 160 160" aria-hidden="true"><g style="mix-blend-mode:multiply">${L(10, 10, 35, 70, 18, 12)}${L(-10, 10, 140, 64, 17, 12)}</g><g style="mix-blend-mode:multiply" transform="scale(.9)">${petals}<circle r="7" fill="#b3221d"/></g></svg>`;

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).riso = {
    titleArt,
    summary: c => `<div class="sum-main">
      <h3 class="sum-h"><span>${c.msDay.toUpperCase()}</span><span>${c.d} ${c.msMonth.toUpperCase()} ${c.y}</span></h3>
      ${c.holiday ? `<p class="sum-hol">★ ${c.esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''}</p>` : ''}
      <div class="sum-events">${c.events()}</div>
      <button type="button" class="sum-more" data-goto="day">Fakta &amp; peribahasa <span aria-hidden="true">›</span></button>
    </div><div class="s-art">${SKYLINE}</div>`,
    dateArt: () => `<div class="riso-dart">${SMALL_HIB}</div>`,
  };
})();
