# Sehari Selembar

A nostalgic Malaysian calendar app with nine styles to choose from. Every day has a sheet to tear off, with a **Tahukah Anda?** fact about Malaysia and a **peribahasa** with its maksud, an English explanation and an example sentence.

It is static HTML, CSS and JS with no build step. Netlify publishes it at `/kalendar/`.

## Nine styles

The first visit opens a picker showing live previews of nine styles. You can change style any time with the **Gaya** button.

1. **Tear-off.** A red-bound daily pad with a huge red date.
2. **Kalendar Kuda.** A red grid with blue numbers and the horse.
3. **Kopitiam Ledger.** A green ledger book where each day is a row.
4. **Kedai Runcit.** "HARI HARI" in yellow and red, with a shelf of goods.
5. **Batik Margin.** A serif title with a navy-and-gold batik border.
6. **Postcard Month.** A shophouse street postcard header.
7. **Rubber Stamp.** A *Pelan Jadual Harian* form with a KHAMIS stamp and a seal.
8. **Riso Pop.** Red and blue riso print, a hibiscus, the twin towers and a bus.
9. **Midnight Almanac.** Dark, with a crescent moon and gold line-art.

Every style has the same pieces:
- a **Bulan** view: the month grid, or a ledger in Kopitiam, plus the selected day's agenda
- a **Hari** view: the daily sheet with the date in Malay, English, Chinese and Tamil, the Hijri and lunar dates, the day's agenda, a *Tahukah Anda?* fact, a peribahasa and a notes field
- **+ Acara** to add events: a time, a title and an optional place. Tap an event to edit or delete it, and tick it when it's done.

Months flip with a page curl: swipe the page sideways, drag it up with a mouse, or use the arrows. Days tear off: swipe a sheet left, or use Esok and Semalam. On a wide screen, Bulan and Hari sit side by side.

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
