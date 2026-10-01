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
    [[66, 72, 22], [58, 96, 13], [47, 112, 8], [38, 128, 5], [32, 140, 5], [27, 146, 6.5]],
    [[134, 82, 15], [138, 100, 10], [147, 119, 7], [154, 134, 5], [158, 142, 5], [162, 147, 6.5]],
  ];
  const LEGS_NEAR = [
    [[74, 74, 24], [80, 96, 14], [77, 116, 8], [86, 132, 5], [93, 142, 5], [98, 147, 6.5]],
    [[142, 80, 17], [148, 96, 11], [164, 101, 7.5], [162, 112, 5.2], [161, 120, 5], [166, 127, 6]],
  ];
  const BODY = [[63, 59], [77, 52], [92, 56], [106, 59], [121, 50], [133, 37], [145, 24], [156, 17], [165, 20], [176, 31], [185, 42], [189, 49], [186, 55], [179, 57], [171, 56], [164, 53], [161, 48], [158, 54], [156, 65], [154, 78], [153, 90], [146, 100], [133, 104], [115, 105], [98, 102], [86, 97], [74, 96], [62, 92], [55, 82], [55, 70]];
  const strand = (pts, w) => limb(pts.map(([x, y], i) => [x, y, w * (1 - i / (pts.length - 1)) + .25]));
  const MANE = [
    [[157, 19], [146, 16], [134, 18], [124, 14]],
    [[153, 22], [142, 22], [130, 26], [118, 24]],
    [[149, 27], [138, 30], [126, 36], [114, 36]],
    [[144, 32], [133, 38], [122, 44], [112, 46]],
    [[139, 38], [129, 45], [119, 50], [108, 52]],
    [[134, 44], [125, 50], [116, 55]],
    [[160, 18], [152, 12], [142, 10], [134, 6]],
  ];
  const TAIL = [
    [[62, 62], [50, 56], [36, 57], [24, 52], [12, 50]],
    [[62, 64], [48, 62], [34, 66], [20, 64], [6, 66]],
    [[61, 66], [48, 68], [36, 74], [24, 76], [12, 82]],
    [[61, 68], [50, 74], [40, 82], [30, 88]],
    [[63, 61], [54, 52], [42, 48], [30, 42]],
  ];
  const DETAIL = [
    'M163 38C170 41 172 47 168 52', 'M181 54L187 53', 'M176 36C178 40 181 43 184 44', // cheek, mouth, nose bone
    'M127 57C135 67 139 79 137 92', // shoulder
    'M78 61C86 69 88 83 82 96', // hip
    'M112 78C116 84 117 90 116 96M120 80C123 85 124 90 123 95', // ribs
  ].join('');
  const horse = id => `<svg class="horse" viewBox="0 -10 200 170" aria-hidden="true" fill="#fbf3e1" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
    <defs>
      <pattern id="${id}h" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="3" height="3" fill="#fbf3e1" stroke="none"/><path d="M0 .6H3" stroke="currentColor" stroke-width="1.2"/></pattern>
      <pattern id="${id}l" width="3.6" height="3.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="4" height="4" fill="#fbf3e1" stroke="none"/><path d="M0 .6H4" stroke="currentColor" stroke-width=".85"/></pattern>
      <clipPath id="${id}c"><path d="${loop(BODY)}"/></clipPath>
    </defs>
    <g fill="none" stroke-width="1.2"><path d="M12 151H54M64 154H120M130 151H192M22 156H46M84 158H116M146 156H180M6 147H22M178 147H196"/></g>
    <g transform="rotate(-10 60 150)">
    <g fill="url(#${id}h)">${LEGS_FAR.map(c => `<path d="${limb(c, 1)}"/>`).join('')}</g>
    <g fill="currentColor" stroke="none">${TAIL.map(c => `<path d="${strand(c, 4.5)}"/>`).join('')}</g>
    <g fill="url(#${id}l)">${LEGS_NEAR.map(c => `<path d="${limb(c, 1)}"/>`).join('')}</g>
    <path d="${loop(BODY)}" fill="url(#${id}l)"/>
    <g clip-path="url(#${id}c)" fill="#fbf3e1" stroke="none"><ellipse cx="104" cy="70" rx="30" ry="11"/><ellipse cx="140" cy="62" rx="9" ry="16" transform="rotate(35 140 62)"/><ellipse cx="172" cy="38" rx="7" ry="12" transform="rotate(-40 172 38)"/><ellipse cx="74" cy="70" rx="9" ry="10"/></g>
    <g clip-path="url(#${id}c)" fill="url(#${id}h)" stroke="none">
      <ellipse cx="112" cy="112" rx="52" ry="15"/><ellipse cx="156" cy="80" rx="6" ry="22"/><ellipse cx="57" cy="80" rx="8" ry="16"/><ellipse cx="166" cy="56" rx="9" ry="5"/><ellipse cx="100" cy="56" rx="26" ry="3.5"/>
    </g>
    <path d="${loop(BODY)}" fill="none"/>
    <path d="M154 19L153 7L160 16Z"/><path d="M159 18L161 8L165 19Z"/>
    <g fill="currentColor" stroke="none">${MANE.map(c => `<path d="${strand(c, 4)}"/>`).join('')}<path d="${strand([[163, 21], [168, 25], [171, 30]], 3)}"/>
    <circle cx="171" cy="30" r="1.7"/><ellipse cx="184.5" cy="47.5" rx="1.4" ry="1"/></g>
    <path fill="none" stroke-width=".9" d="${DETAIL}"/></g></svg>`;

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
    ${horse(id).replace('<svg class="horse"', '<svg class="horse" x="238" y="44" width="152" height="129"')}
  </svg>`;

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).kuda = {
    _horse: horse('kdx'),
    masthead: c => `<div class="mh mh-kuda">${mast('kd' + c.uid())}</div>`,
  };
})();
