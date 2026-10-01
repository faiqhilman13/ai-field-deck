/* Sehari Selembar: a Malaysian calendar with a fact and a peribahasa for every day, in nine nostalgic styles. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const mod = (n, m) => ((n % m) + m) % m;
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 960px)');

  /* ------------------------------------------------------------------ names */
  const MS_MONTH = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  const MS_MON3 = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'];
  const EN_MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TA_MONTH = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
  const MS_DAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const EN_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TA_DAY = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
  const WD_MON = ['I', 'S', 'R', 'K', 'J', 'S', 'A'];
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
  const rerolls = { fact: {}, peri: {} };

  function factFor(p) {
    const k = iso(p.y, p.m, p.d), shift = rerolls.fact[k] || 0;
    const pin = pinnedFact[pad2(p.m + 1) + '-' + pad2(p.d)];
    if (pin != null && !shift) return FACTS[pin];
    return FACTS[factPool[factOrder[mod(dayNum(p.y, p.m, p.d) + shift * 89, factPool.length)]]];
  }
  function periFor(p) {
    const shift = rerolls.peri[iso(p.y, p.m, p.d)] || 0;
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
  const REDRAW_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8a5 5 0 1 1-1.6-3.7M13.2 1.8v3.6H9.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const RING = '<svg class="ring" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M64 9C34 1 7 16 8 40c1 24 30 37 58 32 25-4 31-30 21-47C79 9 58 4 38 12"/></svg>';

  /* ------------------------------------------------------------- themes */
  const THEMES = [
    { id: 'tearoff', name: 'Tear-off', ms: 'Kalendar koyak harian', start: 'day', color: '#c62a22' },
    { id: 'kuda', name: 'Kalendar Kuda', ms: 'Merah, biru, klasik', start: 'month', color: '#d62b20' },
    { id: 'kopitiam', name: 'Kopitiam Ledger', ms: 'Buku akaun kedai kopi', start: 'month', color: '#1f5c3a' },
    { id: 'runcit', name: 'Kedai Runcit', ms: 'Kuning terang, rak barang', start: 'month', color: '#d0281f' },
    { id: 'batik', name: 'Batik Margin', ms: 'Tenang, berbunga batik', start: 'month', color: '#1f2a4d' },
    { id: 'postcard', name: 'Postcard Month', ms: 'Poskad lama Malaysia', start: 'month', color: '#e5604d' },
    { id: 'stamp', name: 'Rubber Stamp', ms: 'Borang & cop getah', start: 'day', color: '#7a1f1f' },
    { id: 'riso', name: 'Riso Pop', ms: 'Cetakan riso merah-biru', start: 'month', color: '#e2372b' },
    { id: 'midnight', name: 'Midnight Almanac', ms: 'Almanak waktu malam', start: 'month', color: '#191714' },
  ];
  let theme = THEMES[1];

  /* ------------------------------------------------------------ artwork */
  let uidN = 0;
  const uid = () => 'sx' + (++uidN);

  function hibiscus({ petal = '#d0281f', centre = '#f2c94c', line = '', sw = 1.6, cls = '' } = {}) {
    const rot = [0, 72, 144, 216, 288];
    const petals = rot.map(r => `<path transform="rotate(${r} 50 50)" d="M50 50C37 41 28 20 40 9c5-5 15-5 20 0 12 11 3 32-10 41Z" fill="${line ? 'none' : petal}" stroke="${line || 'rgba(0,0,0,.18)'}" stroke-width="${sw}"/>`).join('');
    const veins = rot.map(r => `<path transform="rotate(${r} 50 50)" d="M50 45V20" stroke="${line || 'rgba(0,0,0,.2)'}" stroke-width="${sw * 0.6}" fill="none"/>`).join('');
    return `<svg class="hib ${cls}" viewBox="0 0 100 100" aria-hidden="true">${petals}${veins}<path d="M50 50C57 40 65 30 76 21" stroke="${line || centre}" stroke-width="${sw * 1.5}" fill="none" stroke-linecap="round"/><circle cx="77" cy="20" r="4" fill="${line ? 'none' : centre}" stroke="${line || 'none'}" stroke-width="${sw}"/><circle cx="50" cy="50" r="5.5" fill="${line ? 'none' : '#7a0f0f'}" stroke="${line || 'none'}" stroke-width="${sw}"/></svg>`;
  }
  /* ------------------------------------------------------ style hooks
     Each style's themes/<id>.js registers optional hooks on window.SEHARI_THEMES[id]:
       masthead(c), monthTitle(c), titleArt(c), summary(c), summaryArt(c),
       sheetHead(c), dateArt(c), miniArt(c), and the flag ledger: true.
     Hooks return HTML strings; `c` is the context built by ctx() below. */
  const hooks = id => (window.SEHARI_THEMES || {})[id] || {};
  const hook = (id, name, c, fallback = '') => (typeof hooks(id)[name] === 'function' ? hooks(id)[name](c) : fallback);
  function ctx(t, p) {
    const { y, m, d } = p;
    const w = weekday(y, m, d), k = iso(y, m, d);
    const h = holiday(y, m, d), l = lunar(y, m, d), hj = hijri(y, m, d);
    return {
      t, y, m, d, w, iso: k,
      today: same(p, NOW), selected: same(p, padDate),
      tone: (h || w === 0) ? 'red' : w === 6 ? 'sat' : '',
      holiday: h,
      hijri: hj ? `${hj.day} ${HIJRI_MONTH[hj.month - 1]} ${hj.year} H` : '',
      lunar: l ? `${lunarYearName(y, m, d)}${lunarMonthZh(l)}${lunarDayZh(l.day)}` : '',
      doy: dayNum(y, m, d) - dayNum(y, 0, 1) + 1,
      left: dayNum(y, 11, 31) - dayNum(y, m, d),
      msMonth: MS_MONTH[m], enMonth: EN_MONTH[m], zhMonth: zhMonth(m + 1), taMonth: TA_MONTH[m], mon3: MS_MON3[m],
      msDay: MS_DAY[w], enDay: EN_DAY[w], zhDay: '星期' + ZH_DAY[w], taDay: TA_DAY[w],
      events: () => eventsListHTML(k),
      eventList: () => eventsFor(k),
      miniMonth: () => miniMonthHTML(y, m, d),
      nav: dir => `<button type="button" class="mnav ${dir < 0 ? 'prev' : 'next'}" data-nav="${dir}" aria-label="${dir < 0 ? 'Bulan lepas' : 'Bulan depan'}">${dir < 0 ? '‹' : '›'}</button>`,
      hibiscus, uid, esc, pad2, goods: GOODS, icons: ICONS,
    };
  }

  /* ------------------------------------------------------- events (Acara) */
  const events = store.get('events', {}) || {};
  const eventsFor = k => (events[k] || []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const saveEvents = () => store.set('events', events);

  function eventsListHTML(k) {
    const evs = eventsFor(k);
    if (!evs.length) return '<p class="ev-empty">Tiada acara lagi. Tekan <b>+ Acara</b> untuk tambah.</p>';
    return `<ul class="ev-list">${evs.map(e => `<li class="ev${e.done ? ' done' : ''}">
      <span class="ev-time">${esc(e.time)}</span>
      <button type="button" class="ev-body" data-edit="${esc(e.id)}" data-date="${k}"><span class="ev-title">${esc(e.title)}</span>${e.place ? `<small>${esc(e.place)}</small>` : ''}</button>
      <button type="button" class="ev-check" role="checkbox" aria-checked="${!!e.done}" aria-label="Selesai: ${esc(e.title)}" data-check="${esc(e.id)}" data-date="${k}"></button>
    </li>`).join('')}</ul>`;
  }

  /* --------------------------------------------------------- month page */
  function cellHTML(y, m, d) {
    const w = weekday(y, m, d), k = iso(y, m, d), h = holiday(y, m, d);
    const isToday = same({ y, m, d }, NOW);
    const sel = same({ y, m, d }, padDate);
    const n = (events[k] || []).length;
    const cls = ['cell', (h || w === 0) ? 'red' : '', w === 6 ? 'sat' : '', isToday ? 'today' : '', sel ? 'sel' : '', n ? 'has-ev' : '', h ? 'hol' : ''].filter(Boolean).join(' ');
    const label = `${MS_DAY[w]}, ${d} ${MS_MONTH[m]} ${y}${h ? ', ' + h.ms : ''}${n ? `, ${n} acara` : ''}${isToday ? ', hari ini' : ''}`;
    return `<button type="button" class="${cls}" data-date="${k}" aria-label="${esc(label)}" aria-pressed="${sel}"><span class="num">${d}</span>${n ? '<i class="dot" aria-hidden="true"></i>' : ''}</button>`;
  }
  function gridHTML(y, m) {
    const first = (weekday(y, m, 1) + 6) % 7, n = daysIn(y, m);
    const prev = shiftMonth(y, m, -1), prevN = daysIn(prev.y, prev.m);
    let h = WD_MON.map((c, i) => `<span class="wd${i === 6 ? ' sun' : ''}" aria-hidden="true">${c}</span>`).join('');
    const total = Math.ceil((first + n) / 7) * 7;
    for (let i = 0; i < total; i++) {
      const d = i - first + 1;
      if (d < 1 || d > n) h += `<span class="cell out" aria-hidden="true"><span class="num">${d < 1 ? prevN + d : d - n}</span></span>`;
      else h += cellHTML(y, m, d);
    }
    return `<div class="mgrid">${h}</div>`;
  }
  function ledgerHTML(y, m) {
    let h = '<div class="lg-head" aria-hidden="true"><span></span><span></span><span>ACARA</span></div>';
    for (let d = 1, n = daysIn(y, m); d <= n; d++) {
      const w = weekday(y, m, d), k = iso(y, m, d), hol = holiday(y, m, d);
      const sel = same({ y, m, d }, padDate), isToday = same({ y, m, d }, NOW);
      const evs = eventsFor(k);
      const lines = (sel ? evs : evs.slice(0, 1)).map(e => `<span class="lg-ev${e.done ? ' done' : ''}"><b>${esc(e.time)}</b> ${esc(e.title)}</span>`).join('') + (!sel && evs.length > 1 ? `<span class="lg-more">+${evs.length - 1} lagi</span>` : '');
      h += `<button type="button" class="lrow${(hol || w === 0) ? ' red' : ''}${sel ? ' sel' : ''}${isToday ? ' today' : ''}" data-date="${k}" aria-pressed="${sel}" aria-label="${esc(`${MS_DAY[w]}, ${d} ${MS_MONTH[m]}${hol ? ', ' + hol.ms : ''}${evs.length ? `, ${evs.length} acara` : ''}`)}">
        <span class="lg-n"><span>${d}</span>${sel ? RING : ''}</span><span class="lg-d">${sel ? MS_DAY[w] : MS_DAY[w].toUpperCase()}</span>
        <span class="lg-a">${hol ? `<span class="lg-hol">${esc(hol.ms)}${hol.approx ? '*' : ''}</span>` : ''}${lines}</span></button>`;
    }
    return `<div class="ledger">${h}</div>`;
  }
  function monthPageHTML(t, y, m) {
    const c = ctx(t, { y, m, d: 1 });
    return `<div class="mpage" data-ym="${y}-${pad2(m + 1)}">
      <div class="mtitle">${hook(t, 'monthTitle', c, `
        ${c.nav(-1)}
        <h2 class="mt-main"><span class="mt-month"><span class="full">${MS_MONTH[m].toUpperCase()}</span><span class="short">${MS_MON3[m]}</span></span> <span class="mt-year">${y}</span></h2>
        ${c.nav(1)}
        <p class="mt-sub"><span lang="zh">${zhMonth(m + 1)}</span><span>${EN_MONTH[m].toUpperCase()}</span><span lang="ta">${TA_MONTH[m]}</span></p>`)}
        ${hook(t, 'titleArt', c)}
      </div>
      ${hooks(t).ledger ? ledgerHTML(y, m) : gridHTML(y, m)}
    </div>`;
  }

  function summaryHTML(t, p) {
    const c = ctx(t, p);
    const custom = hook(t, 'summary', c, null);
    if (custom != null) return custom;
    return `<div class="sum-main">
      <div class="sum-big"><span class="sb-num ${c.tone}">${p.d}</span><span class="sb-names"><b>${c.msDay.toUpperCase()}</b><span>${c.enDay.toUpperCase()}</span><span lang="zh">${c.zhDay}</span></span></div>
      <h3 class="sum-h">${c.msDay.toUpperCase()}, ${p.d} ${c.msMonth.toUpperCase()} ${p.y}</h3>
      ${c.holiday ? `<p class="sum-hol">★ ${esc(c.holiday.ms)}${c.holiday.approx ? '*' : ''}</p>` : ''}
      <div class="sum-events">${c.events()}</div>
      <button type="button" class="sum-more" data-goto="day">Fakta &amp; peribahasa hari ini <span aria-hidden="true">›</span></button>
    </div>${hook(t, 'summaryArt', c)}`;
  }

  /* -------------------------------------------------------- day sheet */
  function miniMonthHTML(y, m, d) {
    const first = (weekday(y, m, 1) + 6) % 7, n = daysIn(y, m);
    let g = WD_MON.map((c, i) => `<i${i === 6 ? ' class="r"' : ''}>${c}</i>`).join('');
    for (let i = 0; i < first; i++) g += '<span></span>';
    for (let x = 1; x <= n; x++) {
      const red = weekday(y, m, x) === 0 || holiday(y, m, x);
      g += `<span class="${[red ? 'r' : '', x === d ? 'on' : ''].join(' ').trim()}">${x}</span>`;
    }
    return `<div class="mm" aria-hidden="true">${g}</div>`;
  }
  function factCard(p) {
    const f = factFor(p);
    const cat = CAT_EN[f.cat] ? f.cat : 'Tempat';
    return `<section class="c-card c-fact" aria-label="Fakta Malaysia">
      <div class="c-head"><span class="c-kick">Tahukah Anda?</span><span class="c-tag">${esc(cat)} · ${CAT_EN[cat]}</span></div>
      <div class="c-body"><span class="c-icon" aria-hidden="true">${ICONS[cat]}</span><p>${esc(f.t)}</p></div>
      <div class="c-foot"><button type="button" class="redraw" data-kind="fact">Fakta lain ${REDRAW_ICON}</button></div>
    </section>`;
  }
  function periCard(p) {
    const r = periFor(p);
    return `<section class="c-card c-peri" aria-label="Peribahasa hari ini">
      <div class="c-head"><span class="c-kick">Peribahasa Hari Ini</span>${r.jenis ? `<span class="c-tag">${esc(r.jenis)}</span>` : ''}</div>
      <p class="pb-p">${esc(r.p)}</p>
      <p class="pb-k">Maksud</p><p class="pb-v">${esc(r.maksud)}</p>
      ${r.en ? `<p class="pb-k" lang="en">Explanation</p><p class="pb-v" lang="en">${esc(r.en)}</p>` : ''}
      ${r.contoh ? `<p class="pb-k">Contoh ayat</p><p class="pb-v pb-hand">${esc(r.contoh)}</p>` : ''}
      <div class="c-foot"><button type="button" class="redraw" data-kind="peri">Peribahasa lain ${REDRAW_ICON}</button></div>
    </section>`;
  }
  function sheetHTML(t, p) {
    const c = ctx(t, p);
    const { y, m, d } = p;
    const h = c.holiday, k = c.iso;
    const head = hook(t, 'sheetHead', c, null) ?? `
      <div class="sh-form"><span>PELAN<br>JADUAL<br>HARIAN</span><span class="sh-no">No. ${pad2(y % 100)}${String(c.doy).padStart(4, '0')}</span></div>
      <header class="sh-top"><span class="sh-my">${c.msMonth.toUpperCase()} ${y}</span><span class="sh-alt"><span lang="zh">${c.zhMonth}</span><span>${c.enMonth.toUpperCase()}</span><span lang="ta">${c.taMonth}</span></span></header>
      <div class="sh-date">
        <span class="sh-stamp">${c.msDay.toUpperCase()}</span>
        <div class="sh-num ${c.tone}" aria-label="${d} ${c.msMonth} ${y}">${d}</div>
        <div class="sh-dmy">${pad2(d)} / ${pad2(m + 1)} / ${y}</div>
        <div class="sh-dayname ${c.tone}">${c.msDay.toUpperCase()}</div>
        <div class="sh-langs"><span lang="zh">${c.zhDay}</span><span>${c.enDay.toUpperCase()}</span><span lang="ta">${c.taDay}</span></div>
        ${hook(t, 'dateArt', c)}
      </div>
      <p class="sh-meta">${c.hijri ? `<span class="m-hij" title="Tarikh Hijrah">${c.hijri}</span>` : ''}${c.lunar ? `<span class="m-lun" lang="zh" title="Kalendar lunar Cina">${c.lunar}</span>` : ''}</p>
      ${h ? `<p class="sh-hol">${esc(h.ms)}${h.approx ? '*' : ''}<small>${esc(h.en)}${h.scope === 'some' ? ' · sesetengah negeri' : ''}</small></p>` : ''}
      <div class="sh-mini">${c.miniMonth()}<div class="sh-mini-side"><span>${c.msMonth.toUpperCase()}</span><span>${c.enMonth.toUpperCase()}</span><span lang="zh">${c.zhMonth}</span></div>${hook(t, 'miniArt', c)}</div>`;
    return `${head}
      <section class="sh-sec sh-events"><h3 class="sh-h">Acara</h3><div class="sh-ev-list">${eventsListHTML(k)}</div></section>
      ${factCard(p)}
      ${periCard(p)}
      <label class="sh-sec sh-note"><span class="sh-h">Catatan · Nota</span><textarea data-note="${k}" rows="3" spellcheck="false" placeholder="cth: bayar bil air, kenduri Mak Long…">${esc(notes[k] || '')}</textarea></label>
      <nav class="sh-nav" aria-label="Tukar hari"><button type="button" data-step="-1"><span aria-hidden="true">‹</span> Semalam</button><span>Hari ke-${c.doy} · ${c.left} hari lagi</span><button type="button" data-step="1">Esok <span aria-hidden="true">›</span></button></nav>`;
  }

  /* --------------------------------------------------------- state & DOM */
  const shell = $('#shell');
  const card = $('#card');
  const pages = $('#pages');
  const pageBase = $('#pageBase');
  const flipShade = $('#flipShade');
  const summary = $('#summary');
  const dayStack = $('#dayStack');

  const NOW = today();
  const view = { y: NOW.y, m: NOW.m };
  let padDate = NOW;
  let flip = null;
  let pendingView = null;
  let suppressClickUntil = 0;

  const monthVisible = () => wide.matches || card.dataset.tab === 'month';
  const dayVisible = () => wide.matches || card.dataset.tab === 'day';

  function renderBase() {
    const a = document.activeElement;
    const keep = a && pageBase.contains(a) ? (a.dataset.nav ? `[data-nav="${a.dataset.nav}"]` : a.dataset.date ? `[data-date="${a.dataset.date}"]` : null) : null;
    pageBase.innerHTML = monthPageHTML(theme.id, view.y, view.m);
    if (keep) { const next = pageBase.querySelector(keep); if (next) next.focus({ preventScroll: true }); }
  }
  function renderSummary() { summary.innerHTML = summaryHTML(theme.id, padDate); }
  function markSelection() {
    if (hooks(theme.id).ledger) { renderBase(); return; }
    $$('.sel', pageBase).forEach(b => { b.classList.remove('sel'); b.setAttribute('aria-pressed', 'false'); });
    const b = pageBase.querySelector(`[data-date="${iso(padDate.y, padDate.m, padDate.d)}"]`);
    if (b) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
  }

  /* ------------------------------------------------- page curl (the flip)
     The month page is cut into horizontal strips, each nested inside the one
     above and hinged on its top edge. Rotating every strip a little more than
     its parent bends the paper; letting the bottom strips lead makes it curl
     up from the bottom edge, the way you lift a wall-calendar page. */
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
    for (let i = 0; i < N; i++) A[i] = MAX * easeInOut(clamp(t * (1 + K) - (1 - i / (N - 1)) * K, 0, 1));
    const rad = a => a * Math.PI / 180;
    const fs = A.map(a => 0.5 * Math.sin(rad(Math.min(a, 90))));
    const bs = A.map(a => (a > 90 ? 0.04 + 0.16 * (1 - Math.sin(rad(a))) : 0.2));
    const fade = t > 0.7 ? clamp(1 - (t - 0.7) / 0.26, 0, 1) : 1;
    for (let i = 0; i < N; i++) {
      const st = strips[i];
      st.el.style.transform = `rotateX(${(A[i] - (i ? A[i - 1] : 0)).toFixed(3)}deg)`;
      const ft = (fs[i] + fs[Math.max(0, i - 1)]) / 2, fb = (fs[i] + fs[Math.min(N - 1, i + 1)]) / 2;
      st.shade.style.background = `linear-gradient(rgba(40,25,0,${ft.toFixed(3)}),rgba(40,25,0,${fb.toFixed(3)}))`;
      const bt = (bs[i] + bs[Math.max(0, i - 1)]) / 2, bb = (bs[i] + bs[Math.min(N - 1, i + 1)]) / 2;
      st.bshade.style.background = `linear-gradient(rgba(40,25,0,${bb.toFixed(3)}),rgba(40,25,0,${bt.toFixed(3)}))`;
      st.front.style.opacity = st.back.style.opacity = fade;
    }
    flipShade.style.opacity = t > 0 && t < 1 ? (0.5 * Math.pow(1 - t, 1.4)).toFixed(3) : 0;
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
      s.f = buildFlipper(monthPageHTML(theme.id, target.y, target.m), H);
    }
    pages.appendChild(s.f.root);
    card.classList.add('flipping');
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
    card.classList.remove('flipping');
    flip = null;
    if (pendingView) { const p = pendingView; pendingView = null; showMonth(p.y, p.m); }
  }
  function showMonth(y, m, animate = true) {
    if (flip) { pendingView = { y, m }; return; }
    if (y === view.y && m === view.m) return;
    if (!animate || reducedMotion.matches || !monthVisible()) {
      view.y = y; view.m = m;
      renderBase();
      if (animate && monthVisible()) pageBase.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      return;
    }
    const s = beginFlip({ y, m });
    if (s) endFlip(s, true, 1000);
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
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: null, H: pageBase.offsetHeight };
  });
  pages.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.mode) {
      if (e.pointerType !== 'touch' && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        drag.s = beginFlip(shiftMonth(view.y, view.m, dy < 0 ? 1 : -1));
        if (!drag.s) { drag = null; return; }
        drag.mode = 'lift';
        try { pages.setPointerCapture(drag.id); } catch { /* ignore */ }
      } else if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        drag.mode = 'swipe';
      } else return;
    }
    if (drag.mode === 'lift') {
      const span = drag.H * 0.8;
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
      endFlip(d.s, e.type !== 'pointercancel' && (d.s.dir > 0 ? d.s.t > 0.28 : d.s.t < 0.72));
    } else if (d.mode === 'swipe' && e.type !== 'pointercancel') {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 50) stepMonth(dx < 0 ? 1 : -1);
    }
  };
  pages.addEventListener('pointerup', endDrag);
  pages.addEventListener('pointercancel', endDrag);
  pages.addEventListener('click', e => {
    if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); return; }
    const nav = e.target.closest('[data-nav]');
    if (nav) { stepMonth(+nav.dataset.nav); return; }
    const b = e.target.closest('[data-date]');
    if (!b) return;
    const p = parseIso(b.dataset.date);
    if (same(p, padDate) && !wide.matches) { setTab('day'); return; }
    selectDate(p);
  }, true);

  /* ------------------------------------------------------- day sheets */
  function stackShadow(p) {
    const left = dayNum(p.y, 11, 31) - dayNum(p.y, p.m, p.d);
    const n = clamp(Math.ceil(left / 60), 1, 6);
    const layers = [];
    for (let i = 1; i <= n; i++) layers.push(`0 ${i * 1.5}px 0 var(--edge-${i % 2 ? 'a' : 'b'})`);
    layers.push(`0 ${n * 1.5 + 4}px 10px rgba(0,0,0,.22)`);
    return layers.join(',');
  }
  function makeSheet(p) {
    const el = document.createElement('article');
    el.className = 'sheet';
    el.dataset.date = iso(p.y, p.m, p.d);
    el.style.setProperty('--stack-shadow', stackShadow(p));
    el.setAttribute('aria-label', `${MS_DAY[weekday(p.y, p.m, p.d)]}, ${p.d} ${MS_MONTH[p.m]} ${p.y}`);
    el.innerHTML = sheetHTML(theme.id, p);
    return el;
  }
  const topSheet = () => $$('.sheet:not(.leaving)', dayStack).pop();

  function renderDay(how) {
    const p = padDate;
    const old = topSheet();
    if (!old || how === 'none' || reducedMotion.matches || !dayVisible()) {
      $$('.sheet', dayStack).forEach(s => s.remove());
      dayStack.appendChild(makeSheet(p));
      return;
    }
    const fresh = makeSheet(p);
    if (how === 'tear') {
      dayStack.insertBefore(fresh, old);
      tearAway(old);
    } else {
      dayStack.appendChild(fresh);
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
    sheet.classList.add('leaving', 'tearing');
    sheet.style.transition = 'none';
    Sound.rip();
    sheet.animate([
      { transform: start, offset: 0 },
      { transform: 'translate(0, 2px) rotate(1.8deg)', offset: 0.16 },
      { transform: 'translate(3px, 9px) rotate(5.5deg)', offset: 0.34 },
      { transform: 'translate(-24px, 46px) rotate(11deg)', offset: 0.52 },
      { transform: 'translate(-120px, 115vh) rotate(-22deg)', offset: 1 },
    ], { duration: 1050, easing: 'cubic-bezier(.4,.05,.6,1)', fill: 'forwards' })
      .finished.then(() => sheet.remove(), () => sheet.remove());
  }

  function selectDate(p, how = 'auto') {
    if (how === 'auto') how = same(p, padDate) ? 'none' : cmpDate(p, padDate) > 0 ? 'tear' : 'drop';
    padDate = p;
    if (p.y !== view.y || p.m !== view.m) showMonth(p.y, p.m, monthVisible());
    markSelection();
    renderSummary();
    renderDay(how);
  }
  const stepDay = n => selectDate(addDays(padDate, n));

  /* swipe a sheet: left tears it off, right brings yesterday back */
  let sw = null;
  dayStack.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('textarea, button, a, input')) return;
    const el = e.target.closest('.sheet');
    if (!el || el.classList.contains('leaving')) return;
    sw = { id: e.pointerId, x: e.clientX, y: e.clientY, el, mode: null };
  });
  dayStack.addEventListener('pointermove', e => {
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
  dayStack.addEventListener('pointerup', endSwipe);
  dayStack.addEventListener('pointercancel', endSwipe);

  /* clicks shared by the summary and the sheets */
  function onPanelClick(e) {
    const step = e.target.closest('[data-step]');
    if (step) { stepDay(+step.dataset.step); return; }
    if (e.target.closest('[data-goto="day"]')) { setTab('day'); return; }
    const chk = e.target.closest('[data-check]');
    if (chk) { toggleDone(chk.dataset.date, chk.dataset.check); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) { openEventDialog(ed.dataset.date, ed.dataset.edit); return; }
    const btn = e.target.closest('.redraw');
    if (btn) reroll(btn);
  }
  summary.addEventListener('click', onPanelClick);
  dayStack.addEventListener('click', onPanelClick);

  function reroll(btn) {
    const kind = btn.dataset.kind;
    const cardEl = btn.closest('.c-card');
    const k = iso(padDate.y, padDate.m, padDate.d);
    rerolls[kind][k] = (rerolls[kind][k] || 0) + 1;
    const swap = () => {
      const tmp = document.createElement('div');
      tmp.innerHTML = kind === 'fact' ? factCard(padDate) : periCard(padDate);
      const next = tmp.firstElementChild;
      cardEl.replaceWith(next);
      next.querySelector('.redraw').focus({ preventScroll: true });
      return next;
    };
    Sound.rustle(0.3);
    if (reducedMotion.matches) { swap(); return; }
    cardEl.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-10px) rotate(-3deg) scale(.97)', opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' })
      .finished.then(() => swap().animate([{ transform: 'translateY(14px) rotate(2deg) scale(.97)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.3,1.3,.5,1)' }));
  }

  let noteTimer = 0;
  dayStack.addEventListener('input', e => {
    const ta = e.target.closest('textarea[data-note]');
    if (!ta) return;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const k = ta.dataset.note;
      if (ta.value.trim()) notes[k] = ta.value; else delete notes[k];
      store.set('notes', notes);
    }, 250);
  });

  /* ------------------------------------------------------- event dialog */
  const dlg = $('#eventDialog');
  const form = $('#eventForm');
  let editing = null;
  function openEventDialog(k, id) {
    const p = parseIso(k);
    const ev = id ? (events[k] || []).find(e => e.id === id) : null;
    editing = { k, id: ev ? ev.id : null };
    $('#evTitle').textContent = ev ? 'Ubah Acara' : 'Acara Baharu';
    $('#evWhen').textContent = `${MS_DAY[weekday(p.y, p.m, p.d)]}, ${p.d} ${MS_MONTH[p.m]} ${p.y}`;
    form.time.value = ev ? ev.time : '09:00';
    form.title.value = ev ? ev.title : '';
    form.place.value = ev ? ev.place || '' : '';
    $('#evDelete').hidden = !ev;
    dlg.showModal();
    setTimeout(() => form.title.focus(), 30);
  }
  function refreshEvents(k) {
    renderSummary();
    if (hooks(theme.id).ledger || pageBase.querySelector(`[data-date="${k}"]`)) renderBase();
    $$(`.sheet[data-date="${k}"] .sh-ev-list`, dayStack).forEach(el => { el.innerHTML = eventsListHTML(k); });
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title || !editing) return;
    const list = events[editing.k] = events[editing.k] || [];
    const data = { time: form.time.value || '09:00', title, place: form.place.value.trim() };
    const ev = editing.id && list.find(x => x.id === editing.id);
    if (ev) Object.assign(ev, data);
    else list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), done: false, ...data });
    saveEvents();
    refreshEvents(editing.k);
    Sound.rustle(0.2);
    dlg.close();
  });
  $('#evCancel').addEventListener('click', () => dlg.close());
  $('#evDelete').addEventListener('click', () => {
    if (!editing || !editing.id) return;
    events[editing.k] = (events[editing.k] || []).filter(x => x.id !== editing.id);
    if (!events[editing.k].length) delete events[editing.k];
    saveEvents();
    refreshEvents(editing.k);
    dlg.close();
  });
  function toggleDone(k, id) {
    const ev = (events[k] || []).find(x => x.id === id);
    if (!ev) return;
    ev.done = !ev.done;
    saveEvents();
    refreshEvents(k);
  }
  $('#addEvent').addEventListener('click', () => openEventDialog(iso(padDate.y, padDate.m, padDate.d)));

  /* -------------------------------------------------------------- tabs */
  function setTab(tab) {
    const changed = card.dataset.tab !== tab;
    card.dataset.tab = tab;
    $$('.seg [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    if (changed && !wide.matches) {
      if (tab === 'day') renderDay('none');
      if (tab === 'month' && (padDate.y !== view.y || padDate.m !== view.m)) showMonth(padDate.y, padDate.m, false);
      const pane = tab === 'day' ? $('#paneDay') : $('#paneMonth');
      if (!reducedMotion.matches) pane.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
      if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
  }
  $$('.seg [role="tab"]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  /* ------------------------------------------------------------ themes */
  function applyTheme(id) {
    theme = THEMES.find(t => t.id === id) || THEMES[1];
    shell.dataset.theme = theme.id;
    document.body.dataset.bg = theme.id;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme.color;
    $('#masthead').innerHTML = hook(theme.id, 'masthead', ctx(theme.id, padDate));
    renderBase();
    renderSummary();
    renderDay('none');
    setTab(theme.start);
  }

  /* --------------------------------------------------------- onboarding */
  const onboard = $('#onboard');
  const obGrid = $('#obGrid');
  let obChoice = null;
  function previewHTML(t) {
    const bar = '<nav class="bottombar"><div class="seg"><span class="tab"' + (t.start === 'day' ? ' aria-selected="true"' : '') + '>Hari</span><span class="tab"' + (t.start === 'month' ? ' aria-selected="true"' : '') + '>Bulan</span></div><span class="btn-acara">+ Acara</span></nav>';
    if (t.start === 'day') return `<div class="card preview" data-tab="day"><section class="pane pane-day"><div class="day-stack"><article class="sheet">${sheetHTML(t.id, padDate)}</article></div></section>${bar}</div>`;
    return `<div class="card preview" data-tab="month"><section class="pane pane-month"><div class="masthead">${hook(t.id, 'masthead', ctx(t.id, padDate))}</div><div class="pages"><div class="page-base">${monthPageHTML(t.id, view.y, view.m)}</div></div><div class="summary">${summaryHTML(t.id, padDate)}</div></section>${bar}</div>`;
  }
  const fitPreviews = () => $$('.ob-prev', obGrid).forEach(el => el.style.setProperty('--s', (el.clientWidth / 400).toFixed(4)));
  function openOnboarding(first) {
    obChoice = theme.id;
    obGrid.innerHTML = THEMES.map((t, i) => `<div class="ob-tile" role="radio" tabindex="${t.id === obChoice ? 0 : -1}" aria-checked="${t.id === obChoice}" aria-label="${i + 1}. ${t.name}: ${t.ms}" data-id="${t.id}">
      <span class="ob-prev" data-theme="${t.id}" inert><span class="ob-scale">${previewHTML(t)}</span></span>
      <span class="ob-name" aria-hidden="true"><b>${i + 1}</b> · ${t.name}</span><span class="ob-desc" aria-hidden="true">${t.ms}</span></div>`).join('');
    $('#obClose').hidden = first;
    onboard.hidden = false;
    document.body.classList.add('ob-open');
    shell.inert = true;
    requestAnimationFrame(fitPreviews);
    paintChoice();
    setTimeout(() => (obGrid.querySelector('[aria-checked="true"]') || obGrid.firstElementChild).focus({ preventScroll: true }), 50);
  }
  function paintChoice() {
    $$('.ob-tile', obGrid).forEach(b => { const on = b.dataset.id === obChoice; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    const t = THEMES.find(x => x.id === obChoice);
    $('#obPicked').textContent = t ? `Dipilih: ${t.name}` : '';
  }
  function closeOnboarding() {
    onboard.hidden = true;
    document.body.classList.remove('ob-open');
    shell.inert = false;
    obGrid.innerHTML = '';
  }
  obGrid.addEventListener('click', e => {
    const tile = e.target.closest('.ob-tile');
    if (!tile) return;
    obChoice = tile.dataset.id;
    paintChoice();
    Sound.rustle(0.2);
  });
  obGrid.addEventListener('dblclick', e => { if (e.target.closest('.ob-tile')) $('#obGo').click(); });
  obGrid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const tile = e.target.closest('.ob-tile');
      if (tile) { e.preventDefault(); obChoice = tile.dataset.id; paintChoice(); if (e.key === 'Enter') $('#obGo').click(); }
      return;
    }
    const keys = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = clamp(THEMES.findIndex(t => t.id === obChoice) + keys[e.key], 0, THEMES.length - 1);
    obChoice = THEMES[i].id;
    paintChoice();
    obGrid.children[i].focus();
  });
  $('#obGo').addEventListener('click', () => {
    const changed = obChoice !== theme.id;
    store.set('theme', obChoice);
    closeOnboarding();
    if (changed || !store.get('seen', false)) applyTheme(obChoice);
    store.set('seen', true);
    if (!reducedMotion.matches) card.animate([{ opacity: 0, transform: 'translateY(14px) rotate(-.6deg)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    $('#themeBtn').focus({ preventScroll: true });
  });
  $('#obClose').addEventListener('click', () => { closeOnboarding(); $('#themeBtn').focus(); });
  window.addEventListener('resize', () => { if (!onboard.hidden) fitPreviews(); });

  /* ------------------------------------------------------------ controls */
  $('#themeBtn').addEventListener('click', () => openOnboarding(false));
  $('#todayBtn').addEventListener('click', () => {
    const t = today();
    showMonth(t.y, t.m);
    selectDate(t);
  });
  const soundBtn = $('#soundBtn');
  const paintSound = () => { soundBtn.setAttribute('aria-pressed', String(Sound.on)); soundBtn.textContent = Sound.on ? 'Bunyi: Ya' : 'Bunyi: Tidak'; };
  soundBtn.addEventListener('click', () => { Sound.toggle(); paintSound(); Sound.rustle(0.25); });
  paintSound();

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('textarea, input, [contenteditable], dialog')) return;
    if (e.key === 'Escape' && !onboard.hidden && !$('#obClose').hidden) { closeOnboarding(); $('#themeBtn').focus(); return; }
    if (!onboard.hidden) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    e.preventDefault();
    if (e.shiftKey || !dayVisible()) stepMonth(dir); else stepDay(dir);
  });
  wide.addEventListener('change', () => { renderDay('none'); if (!wide.matches) setTab(card.dataset.tab); });

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
  const saved = store.get('theme', null);
  applyTheme(saved || 'kuda');
  if (!saved || !THEMES.some(t => t.id === saved)) openOnboarding(true);

  // a tiny hook for automated checks
  window.__sehari = { showMonth, stepMonth, selectDate, stepDay, applyTheme, setTab, view, get padDate() { return padDate; }, beginFlip, setCurl, endFlip, openOnboarding };
})();
