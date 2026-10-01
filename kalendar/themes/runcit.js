/* Style: Kedai Runcit. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const OL = '#1f3b26';            // print outline
  const F = 'font-family="Barlow Condensed,sans-serif" font-weight="800" text-anchor="middle"';
  const t = (x, y, s, fill, txt, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" fill="${fill}" ${F} ${extra}>${txt}</text>`;

  /* a lidded tin can: x,base = bottom-left; label band with a word */
  function tin(x, base, w, h, body, band, ink, word, o = {}) {
    const top = base - h, cx = x + w / 2, ry = Math.max(2, w * 0.12);
    const bt = top + h * (o.bt ?? 0.3), bh = h * (o.bh ?? 0.42);
    return `<g stroke="${OL}" stroke-width=".8">
      <path d="M${x} ${top}v${h}q${w / 2} ${ry * 1.6} ${w} 0v-${h}Z" fill="${body}"/>
      <path d="M${x} ${bt}q${w / 2} ${ry * 1.4} ${w} 0v${bh}q-${w / 2} ${ry * 1.4} -${w} 0Z" fill="${band}"/>
      <ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="${ry}" fill="${o.lid || '#d7d2bd'}"/>
      ${o.rings !== false ? `<path d="M${x} ${top + 3}q${w / 2} ${ry * 1.4} ${w} 0M${x} ${base - 3}q${w / 2} ${ry * 1.4} ${w} 0" fill="none" stroke-width=".6" opacity=".7"/>` : ''}
      </g>
      <rect x="${x + w * 0.1}" y="${top + 2}" width="${w * 0.08}" height="${h - 4}" fill="#fff" opacity=".28"/>
      ${o.emblem ? `<ellipse cx="${cx}" cy="${bt + bh * 0.36}" rx="${w * 0.24}" ry="${bh * 0.2}" fill="${o.emblem}" stroke="${OL}" stroke-width=".5"/>` : ''}
      ${word ? t(cx, bt + bh * (o.emblem ? 0.86 : 0.66), Math.min(w * 0.3, bh * 0.5), ink, word) : ''}`;
  }
  /* a glass jar with a screw cap */
  function jar(x, base, w, h, fill, cap, label, ink, word) {
    const top = base - h, cx = x + w / 2;
    return `<g stroke="${OL}" stroke-width=".8">
      <path d="M${x + 1} ${top + 7}q0-3 3-3h${w - 8}q3 0 3 3v${h - 9}q0 2-2 2h-${w - 4}q-2 0-2-2Z" fill="${fill}"/>
      <rect x="${x + 2}" y="${top}" width="${w - 4}" height="5" rx="1" fill="${cap}"/>
      <rect x="${x + 1}" y="${top + h * 0.38}" width="${w - 2}" height="${h * 0.38}" fill="${label}"/></g>
      <rect x="${x + 3}" y="${top + 7}" width="1.6" height="${h - 11}" fill="#fff" opacity=".35"/>
      ${word ? t(cx, top + h * 0.66, Math.min(w * 0.32, h * 0.2), ink, word) : ''}`;
  }
  /* a tall bottle */
  function bottle(x, base, w, h, fill, cap, label, ink, word) {
    const top = base - h, cx = x + w / 2, nw = w * 0.32;
    return `<g stroke="${OL}" stroke-width=".8">
      <path d="M${cx - nw / 2} ${top + 4}v${h * 0.16}q-${w / 2 - nw / 2} ${h * 0.06} -${w / 2 - nw / 2} ${h * 0.2}V${base - 1}q0 1 1 1h${w - 2}q1 0 1-1V${top + 4 + h * 0.36}q0-${h * 0.14} -${w / 2 - nw / 2} -${h * 0.2}V${top + 4}Z" fill="${fill}"/>
      <rect x="${cx - nw / 2 - .5}" y="${top}" width="${nw + 1}" height="5" fill="${cap}"/>
      <rect x="${x}" y="${top + h * 0.52}" width="${w}" height="${h * 0.3}" fill="${label}"/></g>
      ${word ? t(cx, top + h * 0.72, Math.min(w * 0.34, h * 0.14), ink, word) : ''}`;
  }
  /* a pillow packet */
  function packet(x, base, w, h, fill, ink, word, stripe) {
    const top = base - h;
    return `<g stroke="${OL}" stroke-width=".8"><path d="M${x} ${top + 3}l${w * 0.12} -3h${w * 0.76}l${w * 0.12} 3v${h - 6}l-${w * 0.12} 3h-${w * 0.76}l-${w * 0.12} -3Z" fill="${fill}"/>
      <path d="M${x + 1} ${top + h * 0.3}h${w - 2}" stroke="${stripe}" stroke-width="2.4"/></g>
      ${t(x + w / 2, top + h * 0.68, Math.min(w * 0.26, h * 0.3), ink, word)}`;
  }
  const leaf = (x, y, r, s = 1) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0q6-10 16-12-2 10-16 12Z" fill="#2f7d3c" stroke="${OL}" stroke-width=".6"/>`;

  /* the shelf illustration: back row on the shelf line, front row standing forward */
  const SHELF = (() => {
    const line = 50;
    const back = [
      tin(98, line, 25, 34, '#2f7d3c', '#c9302a', '#fff3c4', 'KARI', { emblem: '#f3d36b' }),
      jar(125, line, 23, 38, '#e9a23b', '#c9302a', '#fbe8b0', '#b8261f', 'JEM'),
      bottle(150, line, 13, 47, '#2f7d3c', '#c9302a', '#f6e7b8', '#1f5c35', 'SOS'),
      jar(165, line, 24, 40, '#d84a2a', '#2f7d3c', '#f6e7b8', '#1f5c35', 'SAMBAL'),
      bottle(191, line, 12, 44, '#8c5a24', '#2f7d3c', '#f3d36b', '#b8261f', 'KICAP'),
      tin(205, line, 27, 33, '#2a6fb5', '#f6efd8', '#c9302a', 'SUSU', { lid: '#cfd3d8' }),
      tin(234, line, 25, 36, '#c9302a', '#f6efd8', '#c9302a', 'TEH', { emblem: '#2f7d3c' }),
    ].join('');
    const front = [
      leaf(4, 96, -150, 1.1), leaf(2, 88, -120, 1), leaf(8, 99, -100, .9),
      tin(8, 98, 42, 82, '#2f7d3c', '#f6efd8', '#1f5c35', '', { bt: 0.1, bh: 0.8 }),
      `<rect x="13" y="38" width="32" height="32" fill="#c9302a" stroke="${OL}" stroke-width=".7"/>`,
      `<ellipse cx="29" cy="29" rx="9" ry="5.5" fill="#f3d36b" stroke="${OL}" stroke-width=".6"/><path d="M24 29h10" stroke="#c9302a" stroke-width="1.6"/>`,
      t(29, 54, 9.6, '#fff3c4', 'MINYAK'), t(29, 64, 6.6, '#f3d36b', 'MASAK'),
      `<path d="M13 77h32M16 82h26" stroke="#1f5c35" stroke-width="1.6"/>`,
      tin(52, 100, 46, 56, '#e9dfb4', '#2f7d3c', '#f6efd8', '', { bt: 0.2, bh: 0.6, lid: '#cbc5a8' }),
      `<ellipse cx="75" cy="68" rx="17" ry="9" fill="#e9dfb4" stroke="${OL}" stroke-width=".6"/>`,
      t(75, 71, 8.6, '#1f5c35', 'BISKUT'), t(75, 86, 5.6, '#f3d36b', 'KERING · RANGUP'),
      jar(100, 99, 18, 38, '#f1e1a8', '#2f7d3c', '#2f7d3c', '#fff3c4', 'GULA'),
      bottle(119, 99, 15, 50, '#f3cf5a', '#c9302a', '#c9302a', '#fff3c4', 'MINYAK'),
      leaf(132, 98, -40, .7), leaf(134, 96, -75, .6),
    ].join('');
    return `<svg class="rc-art" viewBox="0 0 345 98" preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <path d="M90 ${line + 1.5}H360" stroke="#1f5c35" stroke-width="2"/>
      ${back}${front}</svg>`;
  })();

  /* a tiny "ad copy" block in the corner, like the small print on old shop calendars */
  const SMALLPRINT = '<svg class="rc-small" viewBox="0 0 40 16" aria-hidden="true"><g fill="#c9302a"><rect x="0" y="0" width="22" height="2.2"/><rect x="0" y="4" width="34" height="1.4"/><rect x="0" y="7" width="28" height="1.4"/><rect x="0" y="10" width="36" height="1.4"/><rect x="0" y="13" width="18" height="1.4"/></g></svg>';

  const hari = 'HARI HARI'.split('').map((ch, i, a) => {
    const k = Math.abs(i - (a.length - 1) / 2) / ((a.length - 1) / 2); // 0 middle .. 1 edges
    return ch === ' ' ? '<span class="sp"> </span>' : `<span style="--k:${k.toFixed(2)}">${ch}</span>`;
  }).join('');

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).runcit = {
    masthead: () => `<div class="mh mh-runcit">
      ${SMALLPRINT}
      <p class="rc-hari" aria-label="Hari Hari">${hari}</p>
      <p class="rc-kedai">KEDAI RUNCIT</p>
      <div class="rc-shelf">${SHELF}
        <span class="rc-zh" lang="zh"><span>杂</span><span>货</span></span>
        <p class="rc-tag"><span>BERAS · GULA · MINYAK MASAK</span><span>TEPUNG · MINUMAN · BARANG HARIAN</span></p>
      </div></div>`,
    monthTitle: c => `${c.nav(-1)}
      <h2 class="mt-main"><span class="rc-m">${c.msMonth.toUpperCase()}</span> <span class="rc-y">${c.y}</span></h2>
      ${c.nav(1)}
      <p class="mt-sub"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></p>`,
    sheetHead: c => {
      const h = c.holiday;
      return `<div class="rc-dhead">
        <div class="rc-dtop"><span class="rc-dmy">${c.msMonth.toUpperCase()} ${c.y}</span><span class="rc-dbrand">KEDAI RUNCIT <span lang="zh">杂货</span></span></div>
        <div class="rc-dnum ${c.tone}" aria-label="${c.d} ${c.msMonth} ${c.y}">${c.d}</div>
        <div class="rc-dday ${c.tone}">${c.msDay.toUpperCase()}</div>
        <div class="sh-langs"><span lang="zh">${c.zhDay}</span><span>${c.enDay.toUpperCase()}</span><span lang="ta">${c.taDay}</span></div>
        <p class="sh-meta">${c.hijri ? `<span class="m-hij" title="Tarikh Hijrah">${c.hijri}</span>` : ''}${c.lunar ? `<span class="m-lun" lang="zh" title="Kalendar lunar Cina">${c.lunar}</span>` : ''}</p>
        ${h ? `<p class="sh-hol">${c.esc(h.ms)}${h.approx ? '*' : ''}<small>${c.esc(h.en)}${h.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}
        <div class="rc-shelf rc-dshelf">${SHELF}<p class="rc-tag"><span>BERAS · GULA · MINYAK MASAK</span><span>TEPUNG · MINUMAN · BARANG HARIAN</span></p></div>
      </div>`;
    },
  };
})();
