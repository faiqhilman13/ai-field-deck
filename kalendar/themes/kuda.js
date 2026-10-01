/* Style: Kalendar Kuda. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  /* ---------- horse: original line art built from smooth outlines (Catmull-Rom curves) */
  const r1 = n => Math.round(n * 10) / 10;
  // closed smooth path through points
  const loop = P => {
    const n = P.length, at = i => P[(i + n) % n];
    let d = `M${r1(P[0][0])} ${r1(P[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d + 'Z';
  };
  // a limb / strand: centre line [[x, y, width], ...] turned into a closed outline
  const limb = (C, hoof) => {
    const L = [], R = [];
    C.forEach(([x, y, w], i) => {
      const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      L.push([x - dy * w / 2, y + dx * w / 2]); R.push([x + dy * w / 2, y - dx * w / 2]);
    });
    if (hoof) { const [x, y, w] = C[C.length - 1]; return loop([...L, [x - w * .7, y + 3], [x + w * .8, y + 3], ...R.reverse()]); }
    return loop([...L, ...R.reverse()]);
  };
  const LEGS_FAR = [
    [[86, 98, 26], [94, 118, 14], [90, 134, 9], [99, 147, 6.5], [103, 154, 6], [107, 159, 7.5]], // hind, under the body
    [[140, 100, 18], [150, 118, 11], [160, 128, 8.5], [174, 140, 6.5], [180, 148, 6], [187, 153, 7.5]], // fore, reaching
  ];
  const LEGS_NEAR = [
    [[70, 90, 30], [60, 115, 16], [50, 130, 9.5], [43, 145, 6.5], [39, 153, 6], [35, 159, 7.5]], // hind, pushing off
    [[148, 98, 20], [163, 111, 12], [181, 112, 9], [177, 125, 6.5], [173, 134, 6], [177, 140, 7.5]], // fore, folded high
  ];
  const BODY = [[64, 73], [77, 67], [92, 70], [106, 64], [114, 50], [124, 34], [137, 21], [152, 12], [166, 10], [178, 19], [186, 31], [193, 44], [196, 52], [192, 58], [185, 59], [178, 60], [172, 56], [168, 62], [166, 74], [164, 88], [160, 100], [153, 110], [139, 114], [118, 116], [98, 114], [86, 110], [74, 108], [62, 104], [57, 92], [58, 80]];
  const strand = (pts, w) => limb(pts.map(([x, y], i) => [x, y, w * (1 - i / (pts.length - 1)) + .25]));
  const MANE = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
    const t = i / 8, x = 164 - 54 * t - 6 * Math.sin(Math.PI * t), y = 12 + 44 * t - 8 * Math.sin(Math.PI * t), L = 34 - 10 * t + (i % 2) * 6;
    return [[x, y], [x - L * .3, y - 4], [x - L * .6, y - 3 + (i % 3)], [x - L, y - 8 + 3 * t]];
  });
  const TAIL = [
    [[62, 74], [48, 68], [30, 66], [14, 61], [3, 58]],
    [[62, 76], [46, 74], [28, 75], [12, 72], [1, 74]],
    [[62, 78], [46, 80], [30, 85], [15, 87], [4, 92]],
    [[61, 80], [48, 87], [35, 95], [24, 100]],
    [[63, 72], [52, 64], [38, 59], [25, 52]],
    [[61, 77], [44, 79], [26, 81], [8, 82]],
  ];
  const DETAIL = [
    'M175 35C183 39 186 49 181 56', 'M186 58L192 57', 'M183 36C186 41 190 45 194 47', // cheek, mouth, nose bone
    'M124 66C134 78 140 92 138 106', 'M78 76C88 86 90 100 84 110', // shoulder, hip
    'M112 92C116 98 117 104 116 110M120 92C123 98 124 104 123 110', // ribs
  ].join('');
  const horse = id => `<svg class="horse" viewBox="0 0 200 166" aria-hidden="true" fill="#fbf3e1" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
    <defs>
      <pattern id="${id}h" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="3" height="3" fill="#fbf3e1" stroke="none"/><path d="M0 .6H3" stroke="currentColor" stroke-width="1.2"/></pattern>
      <pattern id="${id}l" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="4" height="4" fill="#fbf3e1" stroke="none"/><path d="M0 .6H4" stroke="currentColor" stroke-width=".85"/></pattern>
      <clipPath id="${id}c"><path d="${loop(BODY)}"/></clipPath>
    </defs>
    <g fill="none" stroke-width="1.3"><path d="M24 162H60M70 164H128M136 161H196M34 156H52M112 158H134M150 156H170M8 160H18M60 158H80"/></g>
    <g fill="url(#${id}h)">${LEGS_FAR.map(c => `<path d="${limb(c, 1)}"/>`).join('')}</g>
    <g fill="currentColor" stroke="none">${TAIL.map(c => `<path d="${strand(c, 5)}"/>`).join('')}</g>
    <g fill="url(#${id}l)">${LEGS_NEAR.map(c => `<path d="${limb(c, 1)}"/>`).join('')}</g>
    <path d="${loop(BODY)}" fill="url(#${id}l)"/>
    <g clip-path="url(#${id}c)" stroke="none">
      <g fill="#fbf3e1"><ellipse cx="108" cy="84" rx="30" ry="12"/><ellipse cx="146" cy="72" rx="9" ry="20" transform="rotate(35 146 72)"/><ellipse cx="181" cy="32" rx="6" ry="14" transform="rotate(-35 181 32)"/><ellipse cx="80" cy="84" rx="11" ry="11"/></g>
      <g fill="url(#${id}h)"><ellipse cx="116" cy="124" rx="56" ry="15"/><ellipse cx="167" cy="88" rx="7" ry="26"/><ellipse cx="57" cy="92" rx="9" ry="18"/><ellipse cx="178" cy="63" rx="10" ry="5"/></g>
    </g>
    <path d="${loop(BODY)}" fill="none"/>
    <path d="M165 15L164 3L171 12Z"/><path d="M172 15L178 4L178 18Z"/>
    <g fill="currentColor" stroke="none">${MANE.map(c => `<path d="${strand(c, 4.2)}"/>`).join('')}<path d="${strand([[172, 15], [177, 20], [180, 26]], 3)}"/>
    <circle cx="181" cy="27" r="1.8"/><ellipse cx="192" cy="49" rx="1.4" ry="1.1"/></g>
    <path fill="none" stroke-width=".9" d="${DETAIL}"/></svg>`;

  /* ---------- the arched "KALENDAR" word: each letter squeezed and stretched so the
     baseline bows upward in the middle, like the old printed calendar heading */
  const ADV = { K: 77.8, A: 72.2, L: 66.7, E: 66.7, N: 72.2, D: 72.2, R: 72.2 };
  const WORD = [['K', 97, 30, 68], ['A', 124, 31, 59], ['L', 153, 23, 49], ['E', 174, 25, 43], ['N', 197, 28, 41], ['D', 223, 27, 44], ['A', 248, 31, 51], ['R', 274, 28, 58]];
  const letters = dx => WORD.map(([ch, x, w, h], i) => {
    const top = 34 - Math.sin(Math.PI * i / 7) * 2;
    return `<text transform="translate(${x + dx} ${r1(top + dx)}) scale(${(w / ADV[ch]).toFixed(3)} ${(h / 65).toFixed(3)})" y="65">${ch}</text>`;
  }).join('');
  const mast = id => `<svg class="kd-art" viewBox="13 13 374 162" role="img" aria-label="Kalendar Kuda">
    <g font-family="Playfair Display, Georgia, serif" font-weight="900" font-size="100"><g fill="#8e1612">${letters(1)}</g><g fill="#d0262a">${letters(0)}</g></g>
    <g fill="#163e70" font-family="Noto Serif SC, Songti SC, serif" font-weight="900">
      <g font-size="17" letter-spacing="2"><text x="30" y="97">耐用</text><text x="30" y="123">實用</text><text x="30" y="150">天天進步</text></g>
      <text x="184" y="115" font-size="18.5" letter-spacing="3" text-anchor="middle">馬牌日曆</text>
      <text x="194" y="159" font-size="14" letter-spacing="2.5" text-anchor="middle">馬牌日曆</text>
      <text x="193" y="141" font-size="10.5" letter-spacing=".6" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700">KALENDAR KUDA</text>
    </g>
    ${horse(id).replace('<svg class="horse"', '<svg class="horse" x="244" y="52" width="140" height="116"')}
  </svg>`;

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).kuda = {
    _horse: horse('kdx'),
    masthead: c => `<div class="mh mh-kuda">${mast('kd' + c.uid())}</div>`,
  };
})();
