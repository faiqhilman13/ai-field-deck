/* Sehari Selembar: a Malaysian wall calendar with a fact and a peribahasa for every day. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const wideScreen = matchMedia('(min-width: 1040px)');

  /* ------------------------------------------------------------------ names */
  const MS_MONTH = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const MS_MON3 = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'];
  const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MS_DAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const EN_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MS_DAY1 = ['A', 'I', 'S', 'R', 'K', 'J', 'S'];
  const ZH_NUM = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const ZH_DAY = ['日', '一', '二', '三', '四', '五', '六'];
  const ZH_LUNAR_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const HIJRI_MONTH = ['Muharam', 'Safar', 'Rabiulawal', 'Rabiulakhir', 'Jamadilawal', 'Jamadilakhir', 'Rejab', 'Syaaban', 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijah'];
  const CAT_EN = { Sejarah: 'History', Alam: 'Nature', Makanan: 'Food', Budaya: 'Culture', Geografi: 'Geography', Bahasa: 'Language', Sukan: 'Sport', Tempat: 'Places' };
  const zhMonth = m => (m <= 10 ? ZH_NUM[m] : '十' + ZH_NUM[m - 10]) + '月';

  /* ------------------------------------------------------------- date maths */
  const iso = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
  const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return { y, m: m - 1, d }; };
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const weekday = (y, m, d) => new Date(y, m, d, 12).getDay();
  const dayNum = (y, m, d) => Math.round(Date.UTC(y, m, d) / 864e5);
  const addDays = (p, n) => { const t = new Date(p.y, p.m, p.d + n, 12); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };
  const shiftMonth = (y, m, n) => { const t = new Date(y, m + n, 1, 12); return { y: t.getFullYear(), m: t.getMonth() }; };
  const today = () => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };
  const same = (a, b) => a.y === b.y && a.m === b.m && a.d === b.d;
  const cmpDate = (a, b) => dayNum(a.y, a.m, a.d) - dayNum(b.y, b.m, b.d);

  /* Chinese lunar date via Intl (falls back to nothing on engines without it) */
  const lunarFmt = (() => {
    try {
      const f = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric' });
      return f.resolvedOptions().calendar === 'chinese' ? f : null;
    } catch { return null; }
  })();
  const lunarYearFmt = (() => {
    try { return new Intl.DateTimeFormat('zh-u-ca-chinese', { year: 'numeric' }); } catch { return null; }
  })();
  function lunar(y, m, d) {
    if (!lunarFmt) return null;
    const parts = lunarFmt.formatToParts(new Date(y, m, d, 12));
    const mon = (parts.find(p => p.type === 'month') || {}).value || '';
    const day = parseInt((parts.find(p => p.type === 'day') || {}).value, 10);
    const month = parseInt(mon, 10);
    if (!month || !day) return null;
    return { month, day, leap: /bis/i.test(mon) };
  }
  const lunarDayZh = d => d === 10 ? '初十' : d < 10 ? '初' + ZH_NUM[d] : d < 20 ? '十' + ZH_NUM[d - 10] : d === 20 ? '二十' : d < 30 ? '廿' + ZH_NUM[d - 20] : '三十';
  const lunarMonthZh = l => (l.leap ? '闰' : '') + ZH_LUNAR_MONTH[l.month - 1] + '月';
  function lunarYearName(y, m, d) {
    if (!lunarYearFmt) return '';
    const p = lunarYearFmt.formatToParts(new Date(y, m, d, 12)).find(x => x.type === 'yearName');
    return p ? p.value + '年' : '';
  }

  /* Hijri date via Intl (Umm al-Qura); Malaysia's own sighting can differ by a day */
  const hijriFmt = (() => {
    for (const cal of ['islamic-umalqura', 'islamic', 'islamic-civil']) {
      try {
        const f = new Intl.DateTimeFormat('en-u-ca-' + cal, { year: 'numeric', month: 'numeric', day: 'numeric' });
        if (f.resolvedOptions().calendar === cal) return f;
      } catch { /* try the next one */ }
    }
    return null;
  })();
  function hijriUQ(y, m, d) {
    if (!hijriFmt) return null;
    const parts = hijriFmt.formatToParts(new Date(y, m, d, 12));
    const get = t => parseInt((parts.find(p => p.type === t) || {}).value, 10);
    const r = { day: get('day'), month: get('month'), year: get('year') };
    return r.day && r.month ? r : null;
  }

  /* Malaysia starts Hijri months by its own moon sighting, often a day off Umm al-Qura.
     The gazetted Islamic holidays pin down when Malaysia's month began, so each one
     becomes a correction for its whole month. */
  const HIJRI_ANCHORS = [
    [/^Awal Muharam$/, 1, 1], [/^Maulidur Rasul$/, 3, 12], [/^Nuzul Al-Quran$/, 9, 17],
    [/^Hari Raya Aidilfitri$/, 10, 1], [/^Hari Raya Aidiladha$/, 12, 10],
  ];
  const hijriFixes = [];
  Object.entries(window.KALENDAR_HOLIDAYS || {}).forEach(([k, h]) => {
    String(h.ms).split(' / ').forEach(name => {
      const a = HIJRI_ANCHORS.find(([re]) => re.test(name.trim()));
      if (!a) return;
      const { y, m, d } = parseIso(k);
      for (const delta of [0, 1, -1, 2, -2]) {
        const t = new Date(y, m, d - delta, 12);
        const u = hijriUQ(t.getFullYear(), t.getMonth(), t.getDate());
        if (u && u.month === a[1] && u.day === a[2]) {
          if (delta) hijriFixes.push({ year: u.year, month: u.month, delta, at: dayNum(y, m, d) });
          return;
        }
      }
    });
  });
  function hijri(y, m, d) {
    const uq = hijriUQ(y, m, d);
    if (!uq || !hijriFixes.length) return uq;
    const n = dayNum(y, m, d);
    const near = hijriFixes.filter(f => Math.abs(n - f.at) < 45);
    for (const f of near) {
      const t = new Date(y, m, d - f.delta, 12);
      const u = hijriUQ(t.getFullYear(), t.getMonth(), t.getDate());
      if (u && u.year === f.year && u.month === f.month) return u;
    }
    // the extra day before a month that Malaysia started late is the 30th of the month before
    const late = near.find(f => f.delta > 0 && uq.year === f.year && uq.month === f.month);
    if (late) {
      const t = new Date(y, m, d - late.delta, 12);
      const u = hijriUQ(t.getFullYear(), t.getMonth(), t.getDate());
      if (u) return { year: u.year, month: u.month, day: u.day + late.delta };
    }
    return uq;
  }

  /* ---------------------------------------------------------------- holidays */
  const HOLIDAYS = window.KALENDAR_HOLIDAYS || {};
  const holidayYears = {};
  function holidaysFor(y) {
    if (holidayYears[y]) return holidayYears[y];
    const out = {};
    const prefix = y + '-';
    const keys = Object.keys(HOLIDAYS).filter(k => k.startsWith(prefix));
    if (keys.length) {
      keys.forEach(k => { out[k] = HOLIDAYS[k]; });
    } else {
      // Outside the gazetted table: fixed dates plus lunar/Hijri estimates, all flagged.
      const add = (k, ms, en, scope = 'national', approx = true) => {
        out[k] = out[k]
          ? { ms: out[k].ms + ' / ' + ms, en: out[k].en + ' / ' + en, scope: out[k].scope, approx: out[k].approx || approx }
          : { ms, en, scope, approx };
      };
      add(`${y}-01-01`, 'Tahun Baru', "New Year's Day", 'some', false);
      add(`${y}-05-01`, 'Hari Pekerja', 'Labour Day', 'national', false);
      add(`${y}-08-31`, 'Hari Kebangsaan', 'National Day', 'national', false);
      add(`${y}-09-16`, 'Hari Malaysia', 'Malaysia Day', 'national', false);
      add(`${y}-12-25`, 'Hari Krismas', 'Christmas Day', 'national', false);
      for (let d = 1; d <= 7; d++) if (weekday(y, 5, d) === 1) { add(iso(y, 5, d), 'Hari Keputeraan YDP Agong', "Agong's Birthday"); break; }
      for (let n = 0, p = { y, m: 0, d: 1 }; n < 366 && p.y === y; n++, p = addDays(p, 1)) {
        const k = iso(p.y, p.m, p.d);
        const l = lunar(p.y, p.m, p.d);
        if (l && !l.leap) {
          if (l.month === 1 && l.day === 1) add(k, 'Tahun Baru Cina', 'Chinese New Year');
          if (l.month === 1 && l.day === 2) add(k, 'Tahun Baru Cina (Hari Kedua)', 'Chinese New Year (Day 2)');
          if (l.month === 4 && l.day === 15) add(k, 'Hari Wesak', 'Wesak Day');
        }
        const h = hijri(p.y, p.m, p.d);
        if (h) {
          if (h.month === 1 && h.day === 1) add(k, 'Awal Muharam', 'Awal Muharram');
          if (h.month === 3 && h.day === 12) add(k, 'Maulidur Rasul', "Prophet Muhammad's Birthday");
          if (h.month === 9 && h.day === 17) add(k, 'Nuzul Al-Quran', 'Nuzul Al-Quran', 'some');
          if (h.month === 10 && h.day === 1) add(k, 'Hari Raya Aidilfitri', 'Hari Raya Aidilfitri');
          if (h.month === 10 && h.day === 2) add(k, 'Hari Raya Aidilfitri (Hari Kedua)', 'Hari Raya Aidilfitri (Day 2)');
          if (h.month === 12 && h.day === 10) add(k, 'Hari Raya Aidiladha', 'Hari Raya Haji');
        }
      }
    }
    return (holidayYears[y] = out);
  }
  const holiday = (y, m, d) => holidaysFor(y)[iso(y, m, d)] || null;

  /* ------------------------------------------------------- daily content */
  const FACTS = Array.isArray(window.KALENDAR_FACTS) && window.KALENDAR_FACTS.length
    ? window.KALENDAR_FACTS
    : [{ cat: 'Bahasa', t: 'The word "kalendar" came into Malay from Dutch and English; the older Malay word for an almanac is "takwim", from Arabic.' }];
  const PERI = Array.isArray(window.KALENDAR_PERIBAHASA) && window.KALENDAR_PERIBAHASA.length
    ? window.KALENDAR_PERIBAHASA
    : [{ p: 'Sehari selembar benang, lama-lama menjadi kain', jenis: 'Pepatah', maksud: 'Usaha yang sedikit demi sedikit, lama-kelamaan akan berhasil.', en: 'A thread a day, and in time it becomes cloth: small, steady effort adds up to something whole.', contoh: 'Sehari selembar benang, lama-lama menjadi kain; Aminah menabung seringgit setiap hari.' }];

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffled(n, seed) {
    const r = mulberry32(seed), a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const pinnedFact = {};
  const factPool = [];
  FACTS.forEach((f, i) => { if (f.on && pinnedFact[f.on] == null) pinnedFact[f.on] = i; else factPool.push(i); });
  if (!factPool.length) factPool.push(0);
  const factOrder = shuffled(factPool.length, 31081957);
  const periOrder = shuffled(PERI.length, 16091963);
  const reroll = { fact: {}, peri: {} };

  function factFor(p) {
    const k = iso(p.y, p.m, p.d), shift = reroll.fact[k] || 0;
    const pin = pinnedFact[pad2(p.m + 1) + '-' + pad2(p.d)];
    if (pin != null && !shift) return FACTS[pin];
    return FACTS[factPool[factOrder[mod(dayNum(p.y, p.m, p.d) + shift * 89, factPool.length)]]];
  }
  function periFor(p) {
    const shift = reroll.peri[iso(p.y, p.m, p.d)] || 0;
    return PERI[periOrder[mod(dayNum(p.y, p.m, p.d) + shift * 97, PERI.length)]];
  }

  /* ------------------------------------------------------------ storage */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem('sehari:' + k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem('sehari:' + k, JSON.stringify(v)); } catch { /* private mode: fine */ } },
  };
  const notes = store.get('notes', {}) || {};

  /* ----------------------------------------------------------------- sound */
  const Sound = (() => {
    let ctx = null, noise = null, on = store.get('sound', true) !== false;
    function ac() {
      if (!on) return null;
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function noiseBuf(c) {
      if (noise) return noise;
      const len = Math.floor(c.sampleRate * 1.5), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return (noise = b);
    }
    function burst(c, t0, dur, { type = 'bandpass', f0 = 1800, f1 = 3200, q = 0.8, gain = 0.12 } = {}) {
      const src = c.createBufferSource(); src.buffer = noiseBuf(c);
      const flt = c.createBiquadFilter(); flt.type = type; flt.Q.value = q;
      flt.frequency.setValueAtTime(f0, t0); flt.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.03, dur * 0.25));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(flt).connect(g).connect(c.destination);
      src.start(t0, Math.random() * 0.6, dur + 0.05);
    }
    return {
      get on() { return on; },
      toggle() { on = !on; store.set('sound', on); return on; },
      rustle(len = 0.6) {
        const c = ac(); if (!c) return;
        const t = c.currentTime;
        burst(c, t, len, { f0: 700, f1: 2400, q: 0.6, gain: 0.08 });
        for (let i = 0; i < 6; i++) burst(c, t + Math.random() * len * 0.8, 0.04 + Math.random() * 0.06, { type: 'highpass', f0: 2600, f1: 4200, q: 0.4, gain: 0.04 });
      },
      rip() {
        const c = ac(); if (!c) return;
        const t = c.currentTime;
        for (let i = 0; i < 18; i++) {
          burst(c, t + 0.1 + i * 0.02 + Math.random() * 0.012, 0.025 + Math.random() * 0.03,
            { f0: 1300 + Math.random() * 1500, f1: 2800 + Math.random() * 1600, q: 1.3, gain: 0.06 + Math.random() * 0.06 });
        }
        burst(c, t + 0.45, 0.5, { f0: 800, f1: 2000, q: 0.6, gain: 0.04 });
      },
      chirp() {
        const c = ac(); if (!c) return;
        const t = c.currentTime;
        for (let i = 0; i < 7; i++) {
          const o = c.createOscillator(), g = c.createGain(), tt = t + i * 0.105;
          o.type = 'square';
          o.frequency.setValueAtTime(3200 - i * 50, tt);
          o.frequency.exponentialRampToValueAtTime(2100, tt + 0.035);
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.exponentialRampToValueAtTime(0.035, tt + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.045);
          o.connect(g).connect(c.destination);
          o.start(tt); o.stop(tt + 0.06);
        }
      },
    };
  })();

  /* ------------------------------------------------------------- artwork */
  const ICONS = {
    Sejarah: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3c2.2 2.4-1.8 4.2 0 6.6s-1.8 4.2 0 6.6-1.8 3.6 0 5.4"/><path d="M10 22h12"/><path d="M14.5 22v3.5c0 1.5 3 1.5 3 0V22"/><path d="M14 28.5c1.4 1 2.6 1 4 0"/></svg>',
    Alam: '<svg viewBox="0 0 32 32"><g fill="currentColor">' + [0, 72, 144, 216, 288].map(r => `<ellipse cx="16" cy="9" rx="5.2" ry="7" transform="rotate(${r} 16 16)"/>`).join('') + '</g><circle cx="16" cy="16" r="3" fill="#fdebd2"/><path d="M16 16 L23 6" stroke="#fdebd2" stroke-width="1.6" stroke-linecap="round"/><circle cx="23.5" cy="5.5" r="1.6" fill="#f2c94c"/></svg>',
    Makanan: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M16 8 L26 18 L16 28 L6 18Z" fill="currentColor" fill-opacity=".18"/><path d="M11 13l10 10M13.5 10.5l10 10M8.5 15.5l10 10M21 13L11 23M18.5 10.5l-10 10M23.5 15.5l-10 10"/><path d="M16 8c-1-3 0-5 2-6M16 8c2-2 4-2 6-1" stroke-linecap="round"/></svg>',
    Budaya: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M16 3l4.5 6.5c3.5.6 7 2.3 9 5.5-3.6-.9-6.8-.6-9 .8L16 22l-4.5-6.2c-2.2-1.4-5.4-1.7-9-.8 2-3.2 5.5-4.9 9-5.5Z" fill="currentColor" fill-opacity=".18"/><path d="M9 25c2.5 3 11.5 3 14 0-2.5 1.2-11.5 1.2-14 0Z" fill="currentColor"/><path d="M16 22v4"/></svg>',
    Geografi: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 27 11 11l4 6 5-10 10 20Z" fill="currentColor" fill-opacity=".18"/><path d="M17.5 12l2.5-5 2.6 5.3-2 1.2-1.2-1.4z" fill="currentColor"/><path d="M2 27h28"/></svg>',
    Bahasa: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8c4.5-1.8 9-1.5 13 1.5 4-3 8.5-3.3 13-1.5v17c-4.5-1.8-9-1.5-13 1.5-4-3-8.5-3.3-13-1.5Z" fill="currentColor" fill-opacity=".12"/><path d="M16 9.5V26"/><path d="M7 13c2-.6 4-.5 6 .4M7 17c2-.6 4-.5 6 .4M19 13.4c2-.9 4-1 6-.4M19 17.4c2-.9 4-1 6-.4" stroke-linecap="round"/></svg>',
    Sukan: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M11 21h10l4-17H7Z" fill="currentColor" fill-opacity=".12"/><path d="M13 21 12 4M19 21l1-17M16 21V4M8.5 10h15M9.8 15.5h12.4"/><path d="M11 21h10v2a5 5 0 0 1-10 0Z" fill="currentColor"/></svg>',
    Tempat: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 14 16 5l13 9" fill="currentColor" fill-opacity=".18"/><path d="M6 13v9h20v-9"/><path d="M9 22v6M23 22v6M14 22v6h4v-6"/><path d="M9.5 15.5h4v3.5h-4zM18.5 15.5h4v3.5h-4z"/></svg>',
  };
  const GOODS = [
    '<svg viewBox="0 0 40 50" aria-hidden="true"><path d="M8 11Q6 30 7 46q13 3 26 0 1-16-1-35-12 3-24 0Z" fill="#f4ecd6" stroke="#8a7a5a"/><path d="M11 7q9 5 18 0l1.5 4.5Q20 15 9.5 11.5Z" fill="#e8dcc0" stroke="#8a7a5a"/><path d="M14 9h12" stroke="#c0392b" stroke-width="1.6"/><rect x="10.5" y="21" width="19" height="13" rx="2" fill="#d0281f"/><text x="20" y="30.2" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="7.4" fill="#fff5c8">BERAS</text><text x="20" y="42" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="700" font-size="5.6" fill="#1d58a8">10 KG</text></svg>',
    '<svg viewBox="0 0 32 50" aria-hidden="true"><rect x="13" y="2" width="6" height="5" fill="#8a8f96"/><path d="M9 7h14v4H9z" fill="#5f646b"/><path d="M5 18q0-8 11-8t11 8v26q0 3-3 3H8q-3 0-3-3Z" fill="#2f8a4f"/><rect x="5" y="24" width="22" height="9" fill="#f4ecd6"/><text x="16" y="31.2" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="7.4" fill="#d0281f">GAS</text><path d="M8 13q8-3 16 0" stroke="#7fc79a" stroke-width="1.2" fill="none"/><rect x="7" y="46" width="18" height="3" fill="#1f5c35"/></svg>',
    '<svg viewBox="0 0 32 38" aria-hidden="true"><ellipse cx="16" cy="6" rx="12" ry="3.5" fill="#c9ccd1"/><path d="M4 6v24q12 5 24 0V6q-12 4-24 0Z" fill="#1d58a8"/><path d="M4 12q12 4 24 0v12q-12 4-24 0Z" fill="#fff8e0"/><text x="16" y="21.6" text-anchor="middle" font-family="Barlow Condensed,sans-serif" font-weight="800" font-size="6.4" fill="#d0281f">SUSU</text><path d="M6 31q10 3 20 0" stroke="#a9c3ea" stroke-width="1" fill="none"/></svg>',
  ];
  const FLOWER = '<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="#d0281f">' + [0, 72, 144, 216, 288].map(r => `<ellipse cx="16" cy="9" rx="5" ry="7" transform="rotate(${r} 16 16)"/>`).join('') + '</g><circle cx="16" cy="16" r="2.6" fill="#f2c94c"/></svg>';
  const RING = '<svg class="ring" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M64 9C34 1 7 16 8 40c1 24 30 37 58 32 25-4 31-30 21-47C79 9 58 4 38 12"/></svg>';
  const REDRAW_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.6-3.7M13.2 1.8v3.6H9.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ----------------------------------------------------------- month page */
  function dayCell(y, m, d, cls, area) {
    const w = weekday(y, m, d);
    const h = holiday(y, m, d);
    const l = lunar(y, m, d);
    const hj = hijri(y, m, d);
    const k = iso(y, m, d);
    const isToday = same({ y, m, d }, today());
    const classes = ['day', cls,
      (h || w === 0) ? 'red' : w === 6 ? 'blue' : '',
      isToday ? 'today' : '',
      notes[k] ? 'note' : '',
      same({ y, m, d }, padDate) ? 'sel' : ''].filter(Boolean).join(' ');
    const label = `${MS_DAY[w]}, ${d} ${MS_MONTH[m]} ${y}${h ? ', ' + h.ms : ''}${isToday ? ', hari ini' : ''}`;
    const lun = l ? `<span class="lun${l.day === 1 ? ' new' : ''}" lang="zh">${l.day === 1 ? lunarMonthZh(l) : lunarDayZh(l.day)}</span>` : '';
    const hij = hj ? `<span class="hij${hj.day === 1 ? ' new' : ''}">${hj.day === 1 ? HIJRI_MONTH[hj.month - 1] : hj.day}</span>` : '';
    const hol = h ? `<span class="hol">${esc(h.ms)}${h.approx ? '*' : ''}</span>` : '';
    return `<button type="button" class="${classes}" data-date="${k}"${area ? ` style="${area}"` : ''} aria-label="${esc(label)}">${hij}<span class="num">${d}</span>${lun}${hol}${isToday ? RING : ''}</button>`;
  }

  function miniCal(y, m) {
    const first = weekday(y, m, 1), n = daysIn(y, m);
    let g = MS_DAY1.map((c, i) => `<i${i === 0 ? ' class="r"' : ''}>${c}</i>`).join('');
    for (let i = 0; i < first; i++) g += '<span></span>';
    for (let d = 1; d <= n; d++) g += `<span${(first + d - 1) % 7 === 0 || holiday(y, m, d) ? ' class="r"' : ''}>${d}</span>`;
    return `<span class="mini-t">${MS_MON3[m]} ${y}</span><span class="mini-g">${g}</span>`;
  }

  function filler(kind, k, area) {
    if (kind === 'lead') {
      return `<div class="filler lead k${k}" style="${area}" aria-hidden="true">${k >= 3 ? '<span class="ad-burst">MURAH!</span>' : ''}${k >= 2 ? '<span class="ad-h">Ah Seng</span>' : ''}<span class="goods">${GOODS.join('')}</span>${k >= 2 ? '<span class="ad-s">Barang runcit lengkap</span>' : ''}</div>`;
    }
    if (k >= 2) return `<div class="filler memo" style="${area}" aria-hidden="true"><b>Catatan<i lang="zh">备忘</i></b></div>`;
    return `<div class="filler orn" style="${area}" aria-hidden="true">${FLOWER}</div>`;
  }

  function pageHTML(y, m) {
    const first = weekday(y, m, 1), n = daysIn(y, m);
    const slots = {};
    for (let d = 1; d <= n; d++) {
      const idx = first + d - 1;
      const col = Math.min(4, Math.floor(idx / 7)); // a sixth week folds into the fifth: the 24/31 cell
      (slots[col + '-' + (idx % 7)] = slots[col + '-' + (idx % 7)] || []).push(d);
    }
    let grid = '';
    for (let r = 0; r < 7; r++) {
      grid += `<div class="lbl${r === 0 ? ' sun' : r === 6 ? ' sat' : ''}" style="grid-area:${r + 1}/1"><b>${MS_DAY[r].toUpperCase()}</b><span>${EN_DAY[r].slice(0, 3)}<i lang="zh">${ZH_DAY[r]}</i></span></div>`;
    }
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 7; r++) {
        const s = slots[c + '-' + r];
        if (!s) continue;
        const area = `grid-area:${r + 1}/${c + 2}`;
        grid += s.length === 1
          ? dayCell(y, m, s[0], '', area)
          : `<div class="split" style="${area}">${dayCell(y, m, s[0], 'half a')}${dayCell(y, m, s[1], 'half b')}<svg class="diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="100" x2="100" y2="0"/></svg></div>`;
      }
    }
    if (first > 0) grid += filler('lead', first, `grid-area:1/2/${first + 1}/3`);
    const lastIdx = first + n - 1, lastCol = Math.floor(lastIdx / 7), lastRow = lastIdx % 7;
    if (lastCol <= 4 && lastRow < 6) grid += filler('tail', 6 - lastRow, `grid-area:${lastRow + 2}/${lastCol + 2}/8/${lastCol + 3}`);
    for (let c = lastCol + 1; c <= 4; c++) grid += filler('tail', 7, `grid-area:1/${c + 2}/8/${c + 3}`);

    const prev = shiftMonth(y, m, -1), next = shiftMonth(y, m, 1);
    const hols = Object.entries(holidaysFor(y)).filter(([k]) => k.startsWith(`${y}-${pad2(m + 1)}-`)).sort(([a], [b]) => a.localeCompare(b));
    const anyApprox = hols.some(([, h]) => h.approx);
    const list = hols.length
      ? hols.map(([k, h]) => `<li><b>${+k.slice(8)}</b><span>${esc(h.ms)}${h.approx ? '*' : ''}</span></li>`).join('')
      : '<li class="none">Tiada cuti umum bulan ini</li>';

    return `<div class="page" data-ym="${y}-${pad2(m + 1)}">
      <div class="mhead">
        <button type="button" class="mini prev" data-nav="-1" aria-label="Bulan lepas: ${MS_MONTH[prev.m]} ${prev.y}">${miniCal(prev.y, prev.m)}</button>
        <div class="mtitle"><span class="mnum">${m + 1}</span><span class="mname"><b>${MS_MONTH[m].toUpperCase()}</b><small>${EN_MONTH[m]} · <span lang="zh">${zhMonth(m + 1)}</span></small></span><span class="myear">${y}</span></div>
        <button type="button" class="mini next" data-nav="1" aria-label="Bulan depan: ${MS_MONTH[next.m]} ${next.y}">${miniCal(next.y, next.m)}</button>
      </div>
      <div class="grid">${grid}</div>
      <div class="mfoot">
        <div class="mfoot-h">Cuti Umum · Public Holidays</div>
        <ul>${list}</ul>
        <div class="mfoot-n">${anyApprox ? '* Tertakluk kepada pengisytiharan anak bulan. ' : ''}Angka kecil hijau: tarikh Hijrah · aksara Cina: tarikh lunar.</div>
        <div class="mfoot-shop">Terima kasih atas sokongan anda! · <span lang="zh">谢谢惠顾</span></div>
      </div>
    </div>`;
  }

  /* --------------------------------------------------------- state & DOM */
  const pages = $('#pages');
  const pageBase = $('#pageBase');
  const flipShade = $('#flipShade');
  const cal = $('#cal');
  const wallEl = $('.wall');
  const padWrap = $('#padWrap');
  const padStack = $('#padStack');

  const now = today();
  const view = { y: now.y, m: now.m };
  let padDate = now;
  let flip = null;
  let pendingView = null;
  let suppressClickUntil = 0;

  function renderBase() {
    // keep keyboard focus on the same control across a re-render
    const a = document.activeElement;
    const keep = a && pageBase.contains(a) ? (a.dataset.nav ? `[data-nav="${a.dataset.nav}"]` : a.dataset.date ? `[data-date="${a.dataset.date}"]` : null) : null;
    pageBase.innerHTML = pageHTML(view.y, view.m);
    if (keep) {
      const next = pageBase.querySelector(keep) || pageBase.querySelector('.day');
      if (next) next.focus({ preventScroll: true });
    }
  }
  function markSelection() {
    pageBase.querySelectorAll('.day.sel').forEach(b => b.classList.remove('sel'));
    const b = pageBase.querySelector(`.day[data-date="${iso(padDate.y, padDate.m, padDate.d)}"]`);
    if (b) b.classList.add('sel');
  }
  function nudge() {
    if (reducedMotion.matches) return;
    cal.classList.remove('nudge');
    void cal.offsetWidth;
    cal.classList.add('nudge');
  }

  /* ------------------------------------------------- page curl (the flip)
     The page is cut into horizontal strips, each nested inside the one above
     and hinged on its top edge. Rotating every strip a little more than its
     parent bends the paper; letting the bottom strips lead makes it curl up
     from the bottom edge, the way you lift a wall-calendar page. */
  function buildFlipper(html, H) {
    const N = H > 520 ? 16 : 12;
    const h = H / N;
    const root = document.createElement('div');
    root.className = 'flipper';
    root.setAttribute('aria-hidden', 'true');
    root.inert = true;
    const strips = [];
    let parent = root;
    for (let i = 0; i < N; i++) {
      const el = document.createElement('div');
      el.className = 'strip';
      el.style.height = h + 'px';
      el.style.top = i === 0 ? '0' : '100%';
      const front = document.createElement('div');
      front.className = 'face front';
      const inner = document.createElement('div');
      inner.className = 'face-inner';
      inner.style.transform = `translateY(${-i * h}px)`;
      inner.innerHTML = html;
      const shade = document.createElement('div');
      shade.className = 'shade';
      front.append(inner, shade);
      const back = document.createElement('div');
      back.className = 'face back';
      const bshade = document.createElement('div');
      bshade.className = 'shade';
      back.append(bshade);
      el.append(front, back);
      parent.appendChild(el);
      strips.push({ el, front, back, shade, bshade });
      parent = el;
    }
    return { root, strips };
  }

  const easeInOut = u => 0.5 - Math.cos(Math.PI * u) / 2;
  function setCurl(s, t) {
    s.t = t;
    const strips = s.f.strips, N = strips.length, K = 0.7, MAX = 172;
    const A = new Array(N);
    for (let i = 0; i < N; i++) {
      const lag = (1 - i / (N - 1)) * K;
      A[i] = MAX * easeInOut(clamp(t * (1 + K) - lag, 0, 1));
    }
    const rad = a => a * Math.PI / 180;
    const fs = A.map(a => 0.5 * Math.sin(rad(Math.min(a, 90))));
    const bs = A.map(a => (a > 90 ? 0.04 + 0.16 * (1 - Math.sin(rad(a))) : 0.2));
    const fade = t > 0.7 ? clamp(1 - (t - 0.7) / 0.26, 0, 1) : 1;
    for (let i = 0; i < N; i++) {
      const st = strips[i];
      st.el.style.transform = `rotateX(${(A[i] - (i ? A[i - 1] : 0)).toFixed(3)}deg)`;
      const ft = (fs[i] + fs[Math.max(0, i - 1)]) / 2, fb = (fs[i] + fs[Math.min(N - 1, i + 1)]) / 2;
      st.shade.style.background = `linear-gradient(rgba(70,40,0,${ft.toFixed(3)}),rgba(70,40,0,${fb.toFixed(3)}))`;
      const bt = (bs[i] + bs[Math.max(0, i - 1)]) / 2, bb = (bs[i] + bs[Math.min(N - 1, i + 1)]) / 2;
      st.bshade.style.background = `linear-gradient(rgba(70,40,0,${bb.toFixed(3)}),rgba(70,40,0,${bt.toFixed(3)}))`;
      st.front.style.opacity = st.back.style.opacity = fade;
    }
    flipShade.style.opacity = t > 0 && t < 1 ? (0.55 * Math.pow(1 - t, 1.4)).toFixed(3) : 0;
  }

  function tween(from, to, ms, fn, ease = easeInOut) {
    return new Promise(resolve => {
      const t0 = performance.now();
      const step = now => {
        const u = clamp((now - t0) / ms, 0, 1);
        fn(from + (to - from) * ease(u));
        if (u < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  function beginFlip(target) {
    if (flip) return null;
    const dir = (target.y - view.y) * 12 + (target.m - view.m) > 0 ? 1 : -1;
    const H = pageBase.offsetHeight;
    const s = { dir, from: { y: view.y, m: view.m }, target, t: dir > 0 ? 0 : 1 };
    if (dir > 0) {
      s.f = buildFlipper(pageBase.innerHTML, H);
      view.y = target.y; view.m = target.m;
      renderBase();
    } else {
      s.f = buildFlipper(pageHTML(target.y, target.m), H);
    }
    pages.appendChild(s.f.root);
    wallEl.classList.add('flipping');
    flip = s;
    setCurl(s, s.t);
    Sound.rustle();
    return s;
  }

  async function endFlip(s, complete, ms) {
    const to = complete === (s.dir > 0) ? 1 : 0;
    const dur = ms || 260 + 620 * Math.abs(to - s.t);
    await tween(s.t, to, dur, t => setCurl(s, t), ms ? easeInOut : u => 1 - Math.pow(1 - u, 2.2));
    if (s.dir > 0 && !complete) { view.y = s.from.y; view.m = s.from.m; renderBase(); }
    if (s.dir < 0 && complete) { view.y = s.target.y; view.m = s.target.m; renderBase(); }
    s.f.root.remove();
    flipShade.style.opacity = 0;
    wallEl.classList.remove('flipping');
    flip = null;
    if (complete) nudge();
    if (pendingView) {
      const p = pendingView;
      pendingView = null;
      showMonth(p.y, p.m);
    }
  }

  function showMonth(y, m, animate = true) {
    if (flip) { pendingView = { y, m }; return; }
    if (y === view.y && m === view.m) return;
    if (!animate || reducedMotion.matches) {
      view.y = y; view.m = m;
      renderBase();
      if (animate) pageBase.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      return;
    }
    const s = beginFlip({ y, m });
    if (s) endFlip(s, true, 1050);
  }
  function stepMonth(n) {
    const base = pendingView || (flip ? (flip.dir > 0 ? view : flip.target) : view);
    const t = shiftMonth(base.y, base.m, n);
    showMonth(t.y, t.m);
  }

  /* drag the page up to lift it, down to bring last month back; swipe sideways too */
  let drag = null;
  pages.addEventListener('pointerdown', e => {
    if (e.button !== 0 || flip) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: null, grip: e.target.closest('.dogear') != null, H: pageBase.offsetHeight };
  });
  pages.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.mode) {
      const canLift = e.pointerType !== 'touch' || drag.grip;
      if (canLift && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        const target = shiftMonth(view.y, view.m, dy < 0 ? 1 : -1);
        drag.s = beginFlip(target);
        if (!drag.s) { drag = null; return; }
        drag.mode = 'lift';
        try { pages.setPointerCapture(drag.id); } catch { /* ignore */ }
      } else if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        drag.mode = 'swipe';
      } else return;
    }
    if (drag.mode === 'lift') {
      const span = drag.H * (reducedMotion.matches ? 0.4 : 0.8);
      setCurl(drag.s, clamp(drag.s.dir > 0 ? -dy / span : 1 - dy / span, 0, 1));
      e.preventDefault();
    }
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.mode) suppressClickUntil = performance.now() + 350;
    if (d.mode === 'lift') {
      const t = d.s.t;
      endFlip(d.s, e.type !== 'pointercancel' && (d.s.dir > 0 ? t > 0.28 : t < 0.72));
    } else if (d.mode === 'swipe' && e.type !== 'pointercancel') {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 50) stepMonth(dx < 0 ? 1 : -1);
    }
  };
  pages.addEventListener('pointerup', endDrag);
  pages.addEventListener('pointercancel', endDrag);
  pages.addEventListener('click', e => {
    if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); return; }
    if (e.target.closest('.dogear')) { stepMonth(1); return; }
    const nav = e.target.closest('[data-nav]');
    if (nav) { stepMonth(+nav.dataset.nav); return; }
    const b = e.target.closest('.day[data-date]');
    if (b) {
      const p = parseIso(b.dataset.date);
      if (isPadVisible()) setPad(p);
      else { setPad(p, 'none'); openPad(b); }
    }
  }, true);

  /* ------------------------------------------------------ tear-off pad */
  function factCard(p) {
    const f = factFor(p);
    const cat = CAT_EN[f.cat] ? f.cat : 'Tempat';
    const [d, m, y] = [p.d, MS_MON3[p.m], p.y];
    return `<section class="stamp" aria-label="Fakta Malaysia">
      <div class="stamp-in">
        <svg class="postmark" viewBox="0 0 104 56" aria-hidden="true"><circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="28" cy="28" r="17.5" fill="none" stroke="currentColor" stroke-width=".8"/><text x="28" y="20" text-anchor="middle" style="font-size:6px">TAIPING</text><text x="28" y="30.5" text-anchor="middle">${d} ${m}</text><text x="28" y="40" text-anchor="middle" style="font-size:8px">${y}</text><path d="M56 16q6-4 12 0t12 0 12 0 12 0M56 28q6-4 12 0t12 0 12 0 12 0M56 40q6-4 12 0t12 0 12 0 12 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        <div class="stamp-top"><span class="stamp-kicker">Tahukah Anda?</span><span class="stamp-cat">${esc(cat)} · ${CAT_EN[cat]}</span></div>
        <div class="stamp-body"><span class="stamp-icon" aria-hidden="true">${ICONS[cat]}</span><p class="stamp-text">${esc(f.t)}</p></div>
        <div class="stamp-foot"><span class="stamp-val">MALAYSIA</span><button type="button" class="redraw" data-kind="fact">Fakta lain ${REDRAW_ICON}</button></div>
      </div>
    </section>`;
  }
  function periCard(p) {
    const r = periFor(p);
    return `<section class="exbook" aria-label="Peribahasa hari ini">
      <div class="ex-label"><span class="ex-title">Peribahasa Hari Ini</span>${r.jenis ? `<span class="ex-jenis">${esc(r.jenis)}</span>` : ''}</div>
      <p class="ex-p">${esc(r.p)}</p>
      <div class="ex-row"><span class="ex-k"><u>Maksud</u></span><p>${esc(r.maksud)}</p></div>
      ${r.en ? `<div class="ex-row"><span class="ex-k" lang="en"><u>Explanation</u></span><p lang="en">${esc(r.en)}</p></div>` : ''}
      ${r.contoh ? `<div class="ex-row hand"><span class="ex-k"><u>Contoh ayat</u></span><p>${esc(r.contoh)}</p></div>` : ''}
      <svg class="ex-tick" viewBox="0 0 38 30" aria-hidden="true"><path d="M3 16l9 10L35 3"/></svg>
      <div class="ex-foot"><button type="button" class="redraw" data-kind="peri">Peribahasa lain ${REDRAW_ICON}</button></div>
    </section>`;
  }
  function memoCard(p) {
    const k = iso(p.y, p.m, p.d);
    return `<section class="memo">
      <svg class="memo-clip" viewBox="0 0 18 44" aria-hidden="true"><path d="M6 30V8a4 4 0 0 1 8 0v26a6 6 0 0 1-12 0V12"/></svg>
      <label for="note-${k}">Catatan<i lang="zh">备忘</i></label>
      <textarea id="note-${k}" data-note="${k}" rows="3" spellcheck="false" placeholder="cth: bayar bil air, kenduri Mak Long…">${esc(notes[k] || '')}</textarea>
    </section>`;
  }

  // vertical Chinese text, one character per line (sturdier than writing-mode with fallback fonts)
  const stack = (txt, tag) => [...txt].map(c => `<${tag}>${c}</${tag}>`).join('');

  function sheetHTML(p) {
    const { y, m, d } = p;
    const w = weekday(y, m, d), h = holiday(y, m, d), l = lunar(y, m, d), hj = hijri(y, m, d);
    const tone = (h || w === 0) ? 'red' : w === 6 ? 'blue' : '';
    const doy = dayNum(y, m, d) - dayNum(y, 0, 1) + 1;
    const left = dayNum(y, 11, 31) - dayNum(y, m, d);
    const isToday = same(p, today());
    return `
      <header class="sh-head"><span class="sh-month">${MS_MONTH[m]}<small>${y}</small></span><span class="sh-sub">${EN_MONTH[m]} · <i lang="zh">${zhMonth(m + 1)}</i></span></header>
      <div class="sh-main">
        ${hj ? `<div class="sh-hijri" title="Tarikh Hijrah (anggaran)"><b>${hj.day}</b><span>${HIJRI_MONTH[hj.month - 1]}</span><small>${hj.year} H</small></div>` : '<span></span>'}
        <div class="sh-num ${tone}" aria-label="${d} ${MS_MONTH[m]} ${y}">${d}</div>
        ${l ? `<div class="sh-lunar" lang="zh" title="Kalendar lunar Cina">${stack(lunarYearName(y, m, d), 'small')}<i></i>${stack(lunarMonthZh(l) + lunarDayZh(l.day), 'b')}</div>` : '<span></span>'}
        ${isToday ? '<span class="sh-stamp-today">Hari Ini</span>' : ''}
      </div>
      <p class="sh-day"><b class="${tone}">${MS_DAY[w]}</b> · ${EN_DAY[w]} · <i lang="zh">星期${ZH_DAY[w]}</i></p>
      ${h ? `<p class="sh-hol">${esc(h.ms)}${h.approx ? '*' : ''}<small>${esc(h.en)}${h.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}
      <div class="sh-cards">${factCard(p)}${periCard(p)}${memoCard(p)}</div>
      <footer class="sh-foot"><span>Hari ke-${doy} · ${left} hari lagi</span><span>Ah Seng · <i lang="zh" style="font-style:normal">谢谢惠顾</i></span></footer>`;
  }

  function stackShadow(p) {
    const left = dayNum(p.y, 11, 31) - dayNum(p.y, p.m, p.d);
    const n = clamp(Math.ceil(left / 45), 1, 8);
    const layers = [];
    for (let i = 1; i <= n; i++) layers.push(`0 ${i * 1.6}px 0 ${i % 2 ? '#e7ddc0' : '#d9cdaa'}`);
    layers.push(`0 ${n * 1.6 + 3}px 6px rgba(0,0,0,.28)`);
    return layers.join(',');
  }
  function makeSheet(p) {
    const el = document.createElement('article');
    el.className = 'sheet';
    el.dataset.date = iso(p.y, p.m, p.d);
    el.style.setProperty('--stack-shadow', stackShadow(p));
    el.setAttribute('aria-label', `${MS_DAY[weekday(p.y, p.m, p.d)]}, ${p.d} ${MS_MONTH[p.m]} ${p.y}`);
    el.innerHTML = sheetHTML(p);
    return el;
  }
  const topSheet = () => padStack.querySelector('.sheet:not(.leaving):last-of-type') || [...padStack.querySelectorAll('.sheet:not(.leaving)')].pop();

  function setPad(p, how = 'auto') {
    const old = topSheet();
    if (how === 'auto') how = !old ? 'none' : same(p, padDate) ? 'none' : cmpDate(p, padDate) > 0 ? 'tear' : 'drop';
    padDate = p;
    markSelection();
    // keep the wall calendar on the month being read
    if (p.y !== view.y || p.m !== view.m) showMonth(p.y, p.m, isPadVisible() && wideScreen.matches);
    if (!old || how === 'none' || reducedMotion.matches) {
      if (old && !same(parseIso(old.dataset.date), p)) old.replaceWith(makeSheet(p));
      else if (!old) padStack.appendChild(makeSheet(p));
      return;
    }
    const fresh = makeSheet(p);
    if (how === 'tear') {
      padStack.insertBefore(fresh, old);
      tearAway(old);
    } else {
      padStack.appendChild(fresh);
      Sound.rustle(0.35);
      fresh.animate([
        { transform: 'translate(0, -40px) rotate(-3deg)', opacity: 0 },
        { transform: 'translate(0, 4px) rotate(.4deg)', opacity: 1, offset: 0.7 },
        { transform: 'none', opacity: 1 },
      ], { duration: 560, easing: 'cubic-bezier(.3,.7,.4,1)' }).finished.then(() => old.remove(), () => old.remove());
    }
  }

  function tearAway(sheet) {
    const from = getComputedStyle(sheet).transform;
    const start = from && from !== 'none' ? from : 'translate(0,0) rotate(0deg)';
    const scroll = sheet.scrollTop;
    sheet.classList.add('leaving', 'tearing');
    sheet.scrollTop = scroll;
    sheet.style.transition = 'none';
    Sound.rip();
    const a = sheet.animate([
      { transform: start, offset: 0 },
      { transform: 'translate(0, 2px) rotate(1.8deg)', offset: 0.16 },
      { transform: 'translate(3px, 9px) rotate(5.5deg)', offset: 0.34 },
      { transform: 'translate(-24px, 46px) rotate(11deg)', offset: 0.52 },
      { transform: 'translate(-120px, 115vh) rotate(-22deg)', offset: 1 },
    ], { duration: 1050, easing: 'cubic-bezier(.4,.05,.6,1)', fill: 'forwards' });
    a.finished.then(() => sheet.remove(), () => sheet.remove());
  }

  const stepDay = n => setPad(addDays(padDate, n));

  /* swipe the sheet: left tears it off, right brings yesterday back */
  let sw = null;
  padStack.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('textarea, button, a, input')) return;
    const el = e.target.closest('.sheet');
    if (!el || el.classList.contains('leaving')) return;
    sw = { id: e.pointerId, x: e.clientX, y: e.clientY, el, mode: null };
  });
  padStack.addEventListener('pointermove', e => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (!sw.mode) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        sw.mode = 'h';
        sw.el.style.transition = 'none';
        try { sw.el.setPointerCapture(sw.id); } catch { /* ignore */ }
      } else if (Math.abs(dy) > 10) { sw = null; return; } else return;
    }
    sw.dx = dx;
    sw.el.style.transform = dx < 0
      ? `translate(${dx * 0.18}px, ${-dx * 0.04}px) rotate(${-dx * 0.03}deg)`
      : `translate(${dx * 0.12}px, 0) rotate(${dx * 0.006}deg)`;
  });
  const endSwipe = e => {
    if (!sw || e.pointerId !== sw.id) return;
    const s = sw;
    sw = null;
    if (s.mode !== 'h') return;
    if (e.type !== 'pointercancel' && s.dx < -70) { stepDay(1); return; }
    s.el.style.transition = 'transform .35s cubic-bezier(.3,1.4,.5,1)';
    s.el.style.transform = '';
    if (e.type !== 'pointercancel' && s.dx > 70) stepDay(-1);
  };
  padStack.addEventListener('pointerup', endSwipe);
  padStack.addEventListener('pointercancel', endSwipe);

  padStack.addEventListener('click', e => {
    const btn = e.target.closest('.redraw');
    if (!btn) return;
    const kind = btn.dataset.kind;
    const card = btn.closest(kind === 'fact' ? '.stamp' : '.exbook');
    const k = iso(padDate.y, padDate.m, padDate.d);
    reroll[kind][k] = (reroll[kind][k] || 0) + 1;
    const swap = () => {
      const tmp = document.createElement('div');
      tmp.innerHTML = kind === 'fact' ? factCard(padDate) : periCard(padDate);
      const next = tmp.firstElementChild;
      card.replaceWith(next);
      return next;
    };
    Sound.rustle(0.3);
    if (reducedMotion.matches) { swap().querySelector('.redraw').focus(); return; }
    card.animate([{ transform: getComputedStyle(card).transform, opacity: 1 }, { transform: 'translateY(-10px) rotate(-4deg) scale(.96)', opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' })
      .finished.then(() => {
        const next = swap();
        next.querySelector('.redraw').focus({ preventScroll: true });
        next.animate([{ transform: 'translateY(14px) rotate(3deg) scale(.97)', opacity: 0 }, { transform: getComputedStyle(next).transform, opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,1.3,.5,1)' });
      });
  });

  let noteTimer = 0;
  padStack.addEventListener('input', e => {
    const ta = e.target.closest('textarea[data-note]');
    if (!ta) return;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const k = ta.dataset.note, v = ta.value.trim();
      if (v) notes[k] = ta.value; else delete notes[k];
      store.set('notes', notes);
      const b = pageBase.querySelector(`.day[data-date="${k}"]`);
      if (b) b.classList.toggle('note', !!v);
    }, 250);
  });

  /* mobile: the pad drops down over the calendar */
  let lastOpener = null;
  const setBehindInert = on => ['.masthead', '#calWrap', '.smallprint', '#cicak'].forEach(sel => { $(sel).inert = on; });
  const isPadVisible = () => wideScreen.matches || padWrap.classList.contains('open');
  function openPad(opener) {
    if (wideScreen.matches) return;
    lastOpener = opener || document.activeElement;
    padWrap.classList.add('open');
    padWrap.setAttribute('role', 'dialog');
    padWrap.setAttribute('aria-modal', 'true');
    document.body.classList.add('pad-open');
    setBehindInert(true);
    Sound.rustle(0.4);
    setTimeout(() => $('#padClose').focus({ preventScroll: true }), 60);
  }
  function closePad() {
    if (!padWrap.classList.contains('open')) return;
    padWrap.classList.remove('open');
    padWrap.removeAttribute('role');
    padWrap.removeAttribute('aria-modal');
    document.body.classList.remove('pad-open');
    setBehindInert(false);
    if (padDate.y !== view.y || padDate.m !== view.m) showMonth(padDate.y, padDate.m, false);
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
  }
  $('#padClose').addEventListener('click', closePad);
  $('#padBackdrop').addEventListener('click', closePad);
  wideScreen.addEventListener('change', () => {
    if (wideScreen.matches) closePad();
  });

  /* ------------------------------------------------------------ controls */
  $('#prevMonth').addEventListener('click', () => stepMonth(-1));
  $('#nextMonth').addEventListener('click', () => stepMonth(1));
  $('#todayBtn').addEventListener('click', e => {
    const t = today();
    showMonth(t.y, t.m);
    if (wideScreen.matches) setPad(t);
    else { setPad(t, 'none'); openPad(e.currentTarget); }
  });
  $('#prevDay').addEventListener('click', () => stepDay(-1));
  $('#nextDay').addEventListener('click', () => stepDay(1));
  $('#todayDay').addEventListener('click', () => setPad(today()));
  const soundBtn = $('#soundBtn');
  const paintSound = () => { soundBtn.setAttribute('aria-pressed', String(Sound.on)); soundBtn.textContent = Sound.on ? 'Bunyi: Ya' : 'Bunyi: Tidak'; };
  soundBtn.addEventListener('click', () => { Sound.toggle(); paintSound(); Sound.rustle(0.25); });
  paintSound();

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('textarea, input, [contenteditable]')) return;
    if (e.key === 'Escape') { closePad(); return; }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    e.preventDefault();
    if (e.shiftKey || !isPadVisible()) stepMonth(dir); else stepDay(dir);
  });

  /* ------------------------------------------------------------ the cicak */
  (() => {
    const cicak = $('#cicak');
    const wall = $('.wall');
    let timer = 0;
    let pos = { x: 0, y: 0 };
    function spots() {
      const W = wall.clientWidth;
      const wr = wall.getBoundingClientRect();
      const rel = r => ({ l: r.left - wr.left, r: r.right - wr.left, t: r.top - wr.top, b: r.bottom - wr.top });
      const c = rel($('#cal').getBoundingClientRect());
      const out = [];
      const rnd = (a, b) => a + Math.random() * (b - a);
      if (c.l > 70) out.push({ x: rnd(12, c.l - 50), y: rnd(c.t + 40, c.t + 520) });
      if (wideScreen.matches) {
        const p = rel($('#pad .pad-board').getBoundingClientRect());
        if (p.l - c.r > 50) out.push({ x: rnd(c.r + 6, p.l - 40), y: rnd(c.t + 120, c.t + 600) });
        if (W - p.r > 70) out.push({ x: rnd(p.r + 14, W - 44), y: rnd(p.t + 30, p.t + 520) });
      } else if (W - c.r > 70) out.push({ x: rnd(c.r + 14, W - 44), y: rnd(c.t + 40, c.t + 520) });
      const sky = rel($('#cal .scene').getBoundingClientRect());
      out.push({ x: rnd(sky.l + 16, sky.r - 56), y: rnd(sky.t + 6, sky.t + (sky.b - sky.t) * 0.35) });
      const f = rel($('.smallprint').getBoundingClientRect());
      if (f.t - c.b > 50) out.push({ x: rnd(W * 0.15, W * 0.85), y: rnd(c.b + 6, f.t - 48) });
      return out;
    }
    function moveTo(p, fast) {
      const dx = p.x - pos.x, dy = p.y - pos.y;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      pos = p;
      cicak.style.transitionDuration = fast ? '.7s' : '1.3s';
      cicak.classList.add('moving');
      cicak.style.setProperty('--cr', ang.toFixed(1) + 'deg');
      cicak.style.setProperty('--cx', p.x.toFixed(0) + 'px');
      cicak.style.setProperty('--cy', p.y.toFixed(0) + 'px');
      setTimeout(() => cicak.classList.remove('moving'), fast ? 700 : 1300);
    }
    function wander() {
      clearTimeout(timer);
      if (!reducedMotion.matches && !document.hidden) {
        const s = spots();
        moveTo(s[Math.floor(Math.random() * s.length)]);
      }
      timer = setTimeout(wander, 9000 + Math.random() * 12000);
    }
    cicak.addEventListener('click', () => {
      Sound.chirp();
      cicak.classList.add('talk');
      setTimeout(() => {
        cicak.classList.remove('talk');
        if (!reducedMotion.matches) { const s = spots(); moveTo(s[Math.floor(Math.random() * s.length)], true); }
      }, 1500);
    });
    const s = spots();
    pos = s[0];
    cicak.style.transition = 'none';
    cicak.style.setProperty('--cx', pos.x.toFixed(0) + 'px');
    cicak.style.setProperty('--cy', pos.y.toFixed(0) + 'px');
    requestAnimationFrame(() => requestAnimationFrame(() => { cicak.style.transition = ''; }));
    timer = setTimeout(wander, 4000);
  })();

  /* ---------------------------------------------------------- installable */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installEvt = e;
    $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!installEvt) return;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch { /* dismissed */ }
    installEvt = null;
    $('#installBtn').hidden = true;
  });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  /* --------------------------------------------------------------- start */
  renderBase();
  markSelection();
  setPad(padDate, 'none');

  // expose a tiny hook for automated checks
  window.__sehari = { showMonth, stepMonth, setPad, stepDay, view, get padDate() { return padDate; }, beginFlip, setCurl, endFlip };
})();
