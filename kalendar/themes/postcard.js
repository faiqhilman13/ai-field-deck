/* Style: Postcard Month. Hooks get a context `c` from app.js (see README, 'Styles'). */
(() => {
  const r1 = n => Math.round(n * 10) / 10;
  const pt = p => `${r1(p[0])} ${r1(p[1])}`;
  const poly = (pts, fill, extra = '') => `<path d="M${pts.map(pt).join('L')}Z" fill="${fill}"${extra}/>`;
  // tiny seeded random so the scene is identical on every render
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* ---------- perspective helpers: a street receding to a vanishing point */
  const W = 384, Hh = 242;
  const VP = [312, 193]; // where the road ends
  // facades of a row of shophouses recede toward their own vanishing point (a gently bending street)
  let S = { vp: [620, 206], x0: -8, y0: 238, h: 152 };
  const P = (d, v, hf = 1) => {
    const s = 1 / (1 + d);
    return [S.vp[0] + (S.x0 - S.vp[0]) * s, S.vp[1] + (S.y0 - S.vp[1]) * s - v * S.h * hf * s];
  };
  const quad = (d0, d1, v0, v1, hf, fill, extra) => poly([P(d0, v0, hf), P(d1, v0, hf), P(d1, v1, hf), P(d0, v1, hf)], fill, extra);
  const arch = (d0, d1, v0, v1, rise, hf, fill, extra = '') => {
    const pts = [P(d0, v0, hf)];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(P(d0 + (d1 - d0) * t, v1 + rise * Math.sin(Math.PI * t), hf)); }
    pts.push(P(d1, v0, hf));
    return poly(pts, fill, extra);
  };

  const SHOPS = [
    { w: .13, hf: 1, c: '#efe3c6', trim: '#c9b48a', roof: 0, sign: '#4f7f86', aw: 0 },
    { w: .1, hf: .9, c: '#e9b36b', trim: '#fbf0d6', roof: 1, sign: '#3f6f73', aw: 0 },
    { w: .15, hf: 1.02, c: '#f0dcc0', trim: '#fff6e4', roof: 1, sign: '#5d8a7a', aw: '#c4573f', tower: 1 },
    { w: .1, hf: .92, c: '#d98a6a', trim: '#f8e6c8', roof: 1, sign: '#3f6f73', aw: '#e07a52' },
    { w: .12, hf: .98, c: '#f2d7a2', trim: '#fff3dc', roof: 1, sign: '#4f7f86', aw: 0 },
    { w: .1, hf: .9, c: '#e6a77a', trim: '#f8e6c8', roof: 1, sign: '#46746c', aw: '#c4573f' },
    { w: .1, hf: .96, c: '#efe1bf', trim: '#fff6e4', roof: 1, sign: '#5d8a7a', aw: 0 },
  ];
  const SHOPS2 = [
    { w: .5, hf: .9, c: '#d77f5f', trim: '#f8e6c8', roof: 1, sign: '#3f6f73', aw: '#e8a24a' },
    { w: .6, hf: .95, c: '#f1cf8f', trim: '#fff3dc', roof: 1, sign: '#4f7f86', aw: 0 },
    { w: .8, hf: .9, c: '#e8b49a', trim: '#f8e6c8', roof: 1, sign: '#46746c', aw: '#c4573f' },
    { w: 1.2, hf: .95, c: '#efe1bf', trim: '#fff6e4', roof: 1, sign: '#5d8a7a', aw: 0 },
    { w: 2, hf: .9, c: '#e2a07c', trim: '#f8e6c8', roof: 1, sign: '#3f6f73', aw: 0 },
    { w: 4, hf: .95, c: '#ead6b0', trim: '#fff3dc', roof: 1, sign: '#4f7f86', aw: 0 },
    { w: 12, hf: .9, c: '#d9a184', trim: '#f2e0c4', roof: 1, sign: '#46746c', aw: 0 },
  ];

  function shophouses(list, street) {
    S = street;
    let out = '', d = 0;
    list.forEach((b, i) => {
      const d0 = d, d1 = d + b.w, hf = b.hf, far = S.h * hf / (1 + d0) < 34;
      d = d1;
      const dm = (d0 + d1) / 2;
      // terracotta roof peeking over the parapet, raked back (to the left)
      if (b.roof) {
        const a = P(d0, 1, hf), z = P(d1, 1, hf), s0 = 1 / (1 + d0), s1 = 1 / (1 + d1);
        out += poly([a, z, [z[0] - 10 * s1, z[1] - 16 * s1], [a[0] - 10 * s0, a[1] - 16 * s0]], i % 2 ? '#b65a3c' : '#a94f35');
        out += `<path d="M${pt([a[0] - 5 * s0, a[1] - 8 * s0])}L${pt([z[0] - 5 * s1, z[1] - 8 * s1])}" stroke="#d47a52" stroke-width="${r1(1.6 * s0)}" opacity=".7"/>`;
      }
      out += quad(d0, d1, 0, 1, hf, b.c, ' stroke="#6b4a32" stroke-width=".5" stroke-opacity=".6"');
      // shade on the far half, light on the near half: painterly modelling
      out += quad(d0 + b.w * .55, d1, 0, 1, hf, '#6b4a2e', ' opacity=".12"');
      // parapet + cornice
      out += quad(d0, d1, .88, 1, hf, b.trim);
      out += quad(d0, d1, .855, .88, hf, '#7d5a3e', ' opacity=".55"');
      if (!far) {
        // little pediment in the middle of the parapet
        out += poly([P(dm - b.w * .22, 1, hf), P(dm, 1.09, hf), P(dm + b.w * .22, 1, hf)], b.trim, ' stroke="#8a6a4a" stroke-width=".5"');
      }
      // string course above the five-foot way
      out += quad(d0, d1, .34, .39, hf, b.trim);
      out += quad(d0, d1, .335, .345, hf, '#6b4a2e', ' opacity=".5"');
      // signboard band
      out += quad(d0 + b.w * .06, d1 - b.w * .06, .27, .335, hf, b.sign);
      if (!far) out += quad(d0 + b.w * .12, d1 - b.w * .12, .29, .315, hf, '#f6e9c8', ' opacity=".55"');
      // five-foot way: dark arcade arches with pale columns
      const bays = far ? 1 : 2;
      for (let j = 0; j < bays; j++) {
        const a0 = d0 + (b.w / bays) * j, a1 = a0 + b.w / bays, inset = (a1 - a0) * .14;
        out += arch(a0 + inset, a1 - inset, 0, .2, .06, hf, '#3d2e26', ' opacity=".82"');
        if (!far) {
          // goods / shopfront glow inside the arcade
          out += quad(a0 + inset * 1.6, a1 - inset * 1.6, 0, .12, hf, j ? '#c98a4a' : '#8aa59a', ' opacity=".55"');
        }
      }
      if (b.aw && !far) {
        // striped canvas awning under the signboard
        const a = P(d0 + b.w * .1, .25, hf), z = P(d1 - b.w * .1, .25, hf), s0 = 1 / (1 + d0), s1 = 1 / (1 + d1);
        out += poly([a, z, [z[0] + 7 * s1, z[1] + 9 * s1], [a[0] + 7 * s0, a[1] + 9 * s0]], b.aw);
        out += poly([[a[0] + 7 * s0, a[1] + 9 * s0], [z[0] + 7 * s1, z[1] + 9 * s1], [z[0] + 7 * s1, z[1] + 11 * s1], [a[0] + 7 * s0, a[1] + 11 * s0]], '#fbeedd', ' opacity=".8"');
      }
      // upper storey: tall arched shuttered windows
      const wins = far ? 2 : 3;
      for (let j = 0; j < wins; j++) {
        const u0 = d0 + b.w * (.12 + j * (.76 / wins)), u1 = u0 + b.w * (.76 / wins) * .62;
        out += arch(u0, u1, .46, .7, .05, hf, '#33454a');
        if (!far) {
          out += quad(u0, u0 + (u1 - u0) * .28, .46, .7, hf, '#4f7f6c');
          out += quad(u1 - (u1 - u0) * .28, u1, .46, .7, hf, '#4f7f6c');
          out += quad(u0 - (u1 - u0) * .12, u1 + (u1 - u0) * .12, .44, .46, hf, b.trim);
        }
      }
      // pilasters between shophouses
      out += quad(d0, d0 + b.w * .045, .39, .855, hf, b.trim, ' opacity=".9"');
      out += quad(d0, d0 + b.w * .07, 0, .27, hf, '#f3e4c6');
      if (b.tower) {
        // a small corner turret with a red cupola, like the old Straits shophouses
        const base = P(dm, 1, hf), s = 1 / (1 + dm), tw = 22 * s, th = 34 * s;
        const x = base[0] - tw / 2, y = base[1];
        out += `<rect x="${r1(x)}" y="${r1(y - th)}" width="${r1(tw)}" height="${r1(th)}" fill="#e9c9a0"/>`;
        out += `<rect x="${r1(x + tw * .55)}" y="${r1(y - th)}" width="${r1(tw * .45)}" height="${r1(th)}" fill="#6b4a2e" opacity=".18"/>`;
        out += `<path d="M${r1(x + tw * .3)} ${r1(y - th * .3)}v${r1(-th * .35)}a${r1(tw * .2)} ${r1(tw * .2)} 0 0 1 ${r1(tw * .4)} 0v${r1(th * .35)}Z" fill="#33454a"/>`;
        out += `<rect x="${r1(x - 1.5 * s)}" y="${r1(y - th - 3 * s)}" width="${r1(tw + 3 * s)}" height="${r1(3 * s)}" fill="#fff3dc"/>`;
        out += `<path d="M${r1(x)} ${r1(y - th - 3 * s)}L${r1(x + tw / 2)} ${r1(y - th - 15 * s)}L${r1(x + tw)} ${r1(y - th - 3 * s)}Z" fill="#b65a3c"/>`;
        out += `<path d="M${r1(x + tw / 2)} ${r1(y - th - 15 * s)}v${r1(-6 * s)}" stroke="#5a4636" stroke-width=".8"/>`;
      }
    });
    return out;
  }

  /* palm: trunk + fronds made of many leaflet strokes */
  function frond(x, y, ang, len, droop, col, w = 1.5) {
    const a = ang * Math.PI / 180;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len + droop;
    const cx = x + Math.cos(a) * len * .55, cy = y + Math.sin(a) * len * .55 - droop * .25;
    const B = t => [(1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ey];
    let dd = `M${pt([x, y])}Q${pt([cx, cy])} ${pt([ex, ey])}`;
    const n = Math.max(8, Math.round(len / 3.2));
    for (let i = 1; i < n; i++) {
      const t = i / n, p = B(t), q = B(Math.min(1, t + .02));
      const tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1;
      const L = len * .32 * Math.sin(Math.PI * (.15 + t * .85)) * (.8 + rnd() * .35);
      for (const sd of [-1, 1]) {
        const nx = -ty / tl * sd, ny = tx / tl * sd;
        // leaflets sweep forward and hang down with gravity
        const lx = p[0] + (nx * .7 + tx / tl * .55) * L, ly = p[1] + (ny * .7 + ty / tl * .55) * L + L * .55;
        dd += `M${pt(p)}Q${pt([p[0] + nx * L * .5, p[1] + ny * L * .5])} ${pt([lx, ly])}`;
      }
    }
    return `<path d="${dd}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  function palm(bx, by, tx, ty, size, flip = 1) {
    const c1 = '#2f5a3a', c2 = '#4f7f45', c3 = '#86a35a';
    const mx = (bx + tx) / 2 + 10 * flip, my = (by + ty) / 2;
    let g = `<path d="M${bx - 3} ${by}Q${mx - 2} ${my} ${tx - 1.6} ${ty}L${tx + 1.6} ${ty}Q${mx + 3} ${my} ${bx + 4} ${by}Z" fill="#8a6a4c"/>`;
    g += `<path d="M${bx + 1} ${by}Q${mx + 1.5} ${my} ${tx + .8} ${ty}" stroke="#5e4532" stroke-width="1.6" fill="none" opacity=".6"/>`;
    // trunk rings
    for (let i = 1; i < 14; i++) {
      const t = i / 14, x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * tx, y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * my + t * t * ty;
      g += `<path d="M${r1(x - 3.4 + t)} ${r1(y)}h${r1(6.8 - 2 * t)}" stroke="#5e4532" stroke-width=".7" opacity=".55"/>`;
    }
    const angs = [-160, -130, -100, -70, -40, -10, 20, 200, 160, 120];
    angs.forEach((a, i) => {
      g += frond(tx, ty, a, size * (.75 + rnd() * .35), size * (.25 + rnd() * .3), [c1, c2, c3][i % 3], 1.5);
    });
    g += `<circle cx="${tx}" cy="${ty + 2}" r="3" fill="#6b5a2a"/><circle cx="${tx + 3}" cy="${ty + 4}" r="2.2" fill="#8a6a2a"/>`;
    return g;
  }
  function cloud(x, y, s, a = 1) {
    const puffs = [[0, 0, 22], [22, -10, 26], [48, -2, 22], [66, 8, 16], [-18, 10, 15], [30, 12, 20], [10, 14, 18]];
    const lit = puffs.map(([dx, dy, r]) => `<circle cx="${r1(x + dx * s)}" cy="${r1(y + dy * s)}" r="${r1(r * s)}"/>`).join('');
    const sh = puffs.map(([dx, dy, r]) => `<circle cx="${r1(x + dx * s + 3 * s)}" cy="${r1(y + dy * s + 7 * s)}" r="${r1(r * s * .9)}"/>`).join('');
    return `<g opacity="${a}"><g fill="#f0b98e" opacity=".75">${sh}</g><g fill="#fdf2dc">${lit}</g><g fill="#fff9ec" opacity=".8">${puffs.slice(0, 3).map(([dx, dy, r]) => `<circle cx="${r1(x + dx * s - 4 * s)}" cy="${r1(y + dy * s - 5 * s)}" r="${r1(r * s * .6)}"/>`).join('')}</g></g>`;
  }
  function tower() {
    // tall slender tower at the end of the street
    const x = 296, w = 30, top = 80, bot = 190;
    let g = `<rect x="${x}" y="${top}" width="${w}" height="${bot - top}" fill="#ece5d3"/>`;
    g += `<rect x="${x + w * .58}" y="${top}" width="${w * .42}" height="${bot - top}" fill="#b8b1a2"/>`;
    for (let yy = top + 4; yy < bot; yy += 3.2) g += `<path d="M${x} ${r1(yy)}h${w}" stroke="#8f8878" stroke-width=".45" opacity=".6"/>`;
    for (let xx = x + 3; xx < x + w; xx += 4.2) g += `<path d="M${r1(xx)} ${top}V${bot}" stroke="#fff" stroke-width=".7" opacity=".45"/>`;
    g += `<path d="M${x + 2} ${top}L${x + 5} ${top - 8}H${x + w - 5}L${x + w - 2} ${top}Z" fill="#ddd5c2"/>`;
    g += `<path d="M${x + 6} ${top - 8}L${x + 9} ${top - 16}H${x + w - 9}L${x + w - 6} ${top - 8}Z" fill="#cfc7b3"/>`;
    g += `<path d="M${x + 9} ${top - 16}Q${x + w / 2} ${top - 30} ${x + w - 9} ${top - 16}Z" fill="#e6dfcd"/>`;
    g += `<path d="M${x + w / 2} ${top - 24}V${top - 44}" stroke="#a49c8a" stroke-width="1.1"/>`;
    return g;
  }

  function postcardScene(uid) {
    const id = uid();
    seed = 7;
    const sky = `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f7a76"/><stop offset=".3" stop-color="#8fb3aa"/><stop offset=".55" stop-color="#e3d6b4"/><stop offset=".78" stop-color="#f2c79c"/></linearGradient>`;
    const road = `<linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6c3a2"/><stop offset="1" stop-color="#b59c7a"/></linearGradient>`;
    const vig = `<radialGradient id="${id}v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#7a5a32" stop-opacity="0"/><stop offset="1" stop-color="#7a5a32" stop-opacity=".38"/></radialGradient>`;
    const rough = `<filter id="${id}f" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>`;
    const blur = `<filter id="${id}b"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="3" seed="8"/><feDisplacementMap in="SourceGraphic" scale="9"/><feGaussianBlur stdDeviation=".9"/></filter>`;
    const grain = `<filter id="${id}g"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .35 0 0 0 0 .25 0 0 0 0 .12 0 0 0 .55 0"/></filter>`;
    const wash = `<filter id="${id}w"><feTurbulence type="fractalNoise" baseFrequency=".018 .05" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 .97 0 0 0 0 .9 0 0 0 .9 -.25"/></filter>`;

    // the street floor
    const kerbL = [60, Hh + 4], bend = [272, 213];
    const ground = [
      poly([[-10, Hh + 4], kerbL, bend, [VP[0] - 2, VP[1]], [VP[0] - 70, VP[1] - 4], [-10, 200]], '#d8c7a6'), // five-foot-way & pavement
      poly([kerbL, [W + 40, Hh + 4], [VP[0] + 4, VP[1]], [VP[0] - 2, VP[1]], bend], `url(#${id}r)`),
      `<path d="M${pt(kerbL)}L${pt(bend)}L${VP[0] - 2} ${VP[1]}" stroke="#efe4cc" stroke-width="2" fill="none"/>`,
      // lane dashes shrinking into the distance
      [0, 1, 2, 3, 4, 5, 6].map(i => {
        const t0 = 1 / (1 + i * .55), t1 = 1 / (1 + i * .55 + .25);
        const a = [VP[0] + (262 - VP[0]) * t0, VP[1] + (Hh + 4 - VP[1]) * t0], z = [VP[0] + (262 - VP[0]) * t1, VP[1] + (Hh + 4 - VP[1]) * t1];
        return `<path d="M${pt(a)}L${pt(z)}" stroke="#f4ead2" stroke-width="${r1(2.4 * t0)}" stroke-linecap="round" opacity=".85"/>`;
      }).join(''),
      // soft shadows cast across the road
      poly([[kerbL[0] - 30, Hh + 4], [kerbL[0] + 40, Hh + 4], [VP[0] - 30, VP[1] + 8], [VP[0] - 40, VP[1] + 6]], '#6b5a44', ' opacity=".12"'),
      poly([[W, 214], [W, Hh + 4], [300, Hh + 4], [330, 200]], '#4a5a3a', ' opacity=".16"'),
    ].join('');

    const mountains = `<g transform="translate(0 14)"><path d="M196 176C220 160 240 150 262 142c14-5 24-2 34 4 10-8 22-14 34-10 18 6 34 18 54 26V178H196Z" fill="#7d9f9a" opacity=".85"/><path d="M230 178c14-8 30-12 44-10 20 2 40-6 60-4 20 2 34 6 50 10v6H230Z" fill="#5f8a6c"/></g>`;
    const farTrees = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<circle cx="${244 + i * 8}" cy="${190 - (i % 3) * 2}" r="${6 + (i % 2) * 2}" fill="${i % 2 ? '#4f7a4a' : '#6a8f52'}"/>`).join('');
    const rightHouse = `<g transform="translate(0 6)"><path d="M330 192V174h44v18Z" fill="#efe2c4"/><path d="M326 175l8-9h36l8 9Z" fill="#b65a3c"/><g fill="#33454a"><rect x="335" y="178" width="5" height="7"/><rect x="345" y="178" width="5" height="7"/><rect x="355" y="178" width="5" height="7"/><rect x="365" y="178" width="5" height="7"/></g></g>`;
    const car = `<g transform="translate(296 198)"><rect x="0" y="0" width="13" height="5" rx="1.5" fill="#d9d2bf"/><rect x="2" y="-3" width="9" height="4" rx="1.5" fill="#bfb6a0"/><circle cx="3" cy="5" r="1.4" fill="#2e2a26"/><circle cx="10" cy="5" r="1.4" fill="#2e2a26"/></g>`;
    const bushes = `<g><ellipse cx="350" cy="232" rx="40" ry="16" fill="#3f6a3e"/><ellipse cx="372" cy="222" rx="26" ry="18" fill="#4f7f45"/><ellipse cx="335" cy="214" rx="18" ry="10" fill="#5f8a4c"/><ellipse cx="10" cy="236" rx="22" ry="10" fill="#4f7f45"/><ellipse cx="24" cy="230" rx="12" ry="9" fill="#6a8f52"/></g>`;
    const people = [[78, 238, '#c4573f'], [112, 233, '#3f6f73'], [196, 224, '#e8a24a'], [236, 219, '#4a5a78']].map(([x, y, c]) => `<g><circle cx="${x}" cy="${y - 9}" r="1.8" fill="#4a3428"/><path d="M${x - 2} ${y - 7}h4l1 7h-6Z" fill="${c}"/></g>`).join('');

    const art = `
      <rect width="${W}" height="${Hh}" fill="url(#${id}s)"/>
      <g filter="url(#${id}b)">${cloud(150, 58, 1.15)}${cloud(108, 92, .8, .9)}${cloud(246, 116, .7, .85)}${cloud(320, 132, .55, .8)}</g>
      <path d="M0 70c40-6 90-2 120 6" stroke="#fff6e4" stroke-width="3" opacity=".4" fill="none"/>
      ${mountains}${tower()}${farTrees}${rightHouse}
      ${ground}${car}
      ${shophouses(SHOPS2, { vp: [VP[0] + 2, VP[1] - 1], x0: 270, y0: 209, h: 78 })}${shophouses(SHOPS, { vp: [595, 173], x0: -8, y0: 238, h: 152 })}${people}
      ${palm(350, 236, 362, 150, 34, -1)}${palm(376, 240, 392, 112, 40, -1)}${palm(330, 230, 340, 176, 22, -1)}
      ${bushes}
      ${palm(52, 242, 66, 34, 64, 1)}${palm(-4, 242, 14, 70, 44, 1)}`;

    return `<svg class="pc-scene" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>${sky}${road}${vig}${rough}${blur}${grain}${wash}<clipPath id="${id}c"><rect width="${W}" height="${Hh}"/></clipPath></defs>
      <g clip-path="url(#${id}c)">
        <g filter="url(#${id}f)">${art}</g>
        <rect width="${W}" height="${Hh}" filter="url(#${id}w)" opacity=".35" style="mix-blend-mode:soft-light"/>
        <rect width="${W}" height="${Hh}" fill="#f3d9a6" opacity=".14" style="mix-blend-mode:multiply"/>
        <rect width="${W}" height="${Hh}" fill="url(#${id}v)"/>
        <rect width="${W}" height="${Hh}" filter="url(#${id}g)" opacity=".22"/>
      </g>
    </svg>`;
  }

  function hibiscusTile(c) {
    const id = c.uid();
    const leaf = (x, y, a, s, col) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C10-14 34-16 52-4 34 6 12 8 0 0Z" fill="${col}"/><path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M2 0Q26-6 50-4" stroke="#24452f" stroke-width="1" fill="none" opacity=".55"/>`;
    const fern = (x, y, a, s, col) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">${frond(0, 0, -90, 60, 6, col, 2.2)}</g>`;
    seed = 21;
    return `<svg class="pc-hib" viewBox="0 0 130 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><filter id="${id}f"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="1.4"/></filter>
      <radialGradient id="${id}p" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#e2604f"/><stop offset=".45" stop-color="#ee8a72"/><stop offset="1" stop-color="#f6b096"/></radialGradient></defs>
      <rect width="130" height="100" fill="#f6e8cc"/>
      <g filter="url(#${id}f)">
        <path d="M70 0c18 6 40 4 60 10V0Z" fill="#f2c9a6" opacity=".7"/>
        <path d="M84 8c10-4 24-2 34 6-10 6-24 6-34-6Z" fill="#9cc0bb" opacity=".7"/>
        ${fern(14, 100, 8, .9, '#3f6a4a')}${fern(34, 104, 24, .7, '#5f8a62')}${fern(6, 70, -18, .6, '#6f9a6a')}
        ${leaf(30, 30, -50, 1, '#3f6a4a')}${leaf(18, 64, -30, .9, '#5c8a5a')}${leaf(70, 70, 20, 1, '#3f6a4a')}${leaf(60, 40, -70, .8, '#7aa070')}
        ${leaf(84, 52, -10, .8, '#4f7f55')}${leaf(52, 92, -40, .8, '#2f5a3a')}${leaf(92, 86, -60, .7, '#5c8a5a')}
        <g transform="translate(70 54)">
          ${[0, 72, 144, 216, 288].map(r => `<path transform="rotate(${r})" d="M0 0C-12-6-20-20-12-29c5-5 12-4 15 0 6-5 13-3 14 3 3 10-5 20-17 26Z" fill="url(#${id}p)" stroke="#c9503f" stroke-width=".7"/>`).join('')}
          ${[0, 72, 144, 216, 288].map(r => `<path transform="rotate(${r + 8})" d="M0 0L-2-18" stroke="#c9503f" stroke-width=".6" opacity=".6"/>`).join('')}
          <circle r="4.5" fill="#b8392f"/><path d="M0 0C4-6 8-12 14-16" stroke="#e8b04a" stroke-width="1.6" fill="none"/><circle cx="14" cy="-16" r="2.4" fill="#f2c94c"/>
        </g>
        <g transform="translate(16 18) scale(.5)" opacity=".85">${[0, 72, 144, 216, 288].map(r => `<path transform="rotate(${r})" d="M0 0C-12-6-20-20-12-29c5-5 12-4 15 0 6-5 13-3 14 3 3 10-5 20-17 26Z" fill="#f4a58a"/>`).join('')}</g>
      </g>
      <rect width="130" height="100" fill="none" stroke="#f6e8cc" stroke-width="4" opacity=".6"/>
    </svg>`;
  }

  (window.SEHARI_THEMES = window.SEHARI_THEMES || {}).postcard = {
    masthead: c => `<div class="mh mh-post">${postcardScene(c.uid)}<p class="pc-hello"><span class="pc-sd">Selamat Datang</span><span class="pc-ke">ke</span><b>MALAYSIA</b></p></div>`,
    monthTitle: c => `
      <h2 class="mt-main"><span class="mt-month"><span class="full">${c.msMonth.toUpperCase()}</span><span class="short">${c.mon3}</span></span> <span class="mt-year">${c.y}</span></h2>
      ${c.nav(-1)}
      <p class="mt-sub"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></p>
      ${c.nav(1)}`,
    summaryArt: c => `<div class="s-art">${hibiscusTile(c)}</div>`,
    dateArt: c => `<div class="pc-stamp" aria-hidden="true">${hibiscusTile(c)}</div>`,
  };
})();
