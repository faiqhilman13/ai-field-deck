# Sehari Selembar

A Malaysian kedai-runcit wall calendar, rebuilt as an installable web app. Every day has a sheet to tear off, with a **Tahukah Anda?** fact about Malaysia and a **peribahasa** with its maksud, an English explanation and an example sentence.

It is static HTML, CSS and JS with no build step. Netlify publishes it at `/kalendar/`.

## What's on the wall

- **Monthly calendar.** The layout copies the classic printed one:
  - weekday rows and week columns
  - a split `24/31` cell when a month runs to six weeks
  - the sponsor's goods filling the empty cells
  - the red 999 banner and red public holidays
  - small Hijri dates (green) and Chinese lunar dates
- **Flipping months.** Drag the page up, grab the dog-ear, swipe sideways or use the buttons. The page is cut into hinged strips that curl up from the bottom edge and over the binding.
- **Daily tear-off pad.** Tap a date, or swipe a sheet left to tear it off. The sheet holds a fact stamp, a peribahasa written up in a school exercise book, and a *Catatan* memo. Memos save in the browser, and dates with a memo get a ballpoint mark on the calendar.
- **Small touches.** A cicak on the wall (tap it), synthesised paper sounds that you can switch off, a dark "night" wall, and reduced-motion support.

## Files

| File | What it holds |
|---|---|
| `index.html`, `styles.css`, `app.js` | the app |
| `data/facts.js` | `window.KALENDAR_FACTS`: `{ cat, t, on? }`. `on: "MM-DD"` pins a fact to that date every year. |
| `data/peribahasa.js` | `window.KALENDAR_PERIBAHASA`: `{ p, jenis, maksud, en, contoh }` |
| `data/holidays.js` | `window.KALENDAR_HOLIDAYS`: gazetted federal holidays for 2025–2027, keyed by ISO date |
| `sw.js`, `manifest.webmanifest`, `icons/` | offline support and install on a phone |

Each day gets the same fact and peribahasa every time you open it. The day number indexes a fixed shuffle of each list, so consecutive days never repeat until the whole list has cycled.

Hijri dates come from the browser's Umm al-Qura calendar. They are then corrected with the gazetted Islamic holidays, because Malaysia starts its months by its own moon sighting. For years outside the holiday table, holidays are estimated from the lunar and Hijri calendars and marked with `*`.

## Run locally

```sh
npx http-server -p 8080 .   # from the repo root, then open http://localhost:8080/kalendar/
```
