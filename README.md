# ATLAS — *your knowledge, connected to the world*

A front-end prototype that plots your saved knowledge — books, papers, news,
people, places, notes, photographs — onto a world map by the **geographic
relationships** each object carries. Nothing is ever a bare pin: every location
records a *relationship type* (`SET_IN`, `BORN_IN`, `STUDY_AREA`, `HAPPENED_AT`…),
a *resolution* (city, locality, landmark…) and a *confidence*, so a suggestion is
never silently flattened into a fact.

**[`index.html`](index.html) is the live app.** Open it and you get the whole
thing: a pan/zoom D3 map, layer filters, full-text + relationship search, a
timeline scrubber, an object detail panel with a relationship graph, and an
"Add anything" flow that (mock-)extracts locations from a title, URL, file name,
or sentence and lets you confirm what belongs on your map before it lands.

## Run it

It's a static site — no build step, no backend.

```bash
# any static server works; from the repo root:
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening `index.html` directly with `file://` also works.

## Deploy (GitHub Pages)

Push this branch and enable Pages → *Deploy from a branch* → `/ (root)`.
A `.nojekyll` file is included so the site is served exactly as-is. The app is
the repository root, so the Pages URL loads straight into the map.

## What's real vs. mocked

- **Real:** the map, clustering, layers, search, timeline, detail panel and
  graph, and the full add → understand → confirm → commit interaction. All state
  lives in the browser for the session.
- **Mocked, on purpose:** the data is ~28 clearly-seeded example objects, and the
  "understanding" step in Add is a small client-side knowledge base simulating an
  extraction pipeline — there is no server or LLM call. It deliberately refuses to
  invent coordinates when it can't resolve a place, which is the point the design
  is making.

## Responsiveness & failure modes

- Works on desktop and touch phones (the bottom bar collapses, panels become
  full-width sheets, the map uses `touch-action:none` for clean pan/zoom).
- If the country-outline basemap can't be fetched (offline / blocked CDN), the
  app still runs — objects plot on the graticule sphere — and shows a
  "Basemap offline" notice instead of failing silently.

## External dependencies (loaded in the browser from CDNs)

- [D3 7.9](https://d3js.org/) and [topojson-client 3.1](https://github.com/topojson/topojson-client) — map projection & rendering
- [world-atlas](https://github.com/topojson/world-atlas) `countries-110m` — country outlines
- IBM Plex Sans / Mono via Google Fonts

The browser viewing the site needs to reach `unpkg.com`, `cdn.jsdelivr.net` and
Google Fonts. (Some sandboxed networks block these; see the graceful-degradation
note above.)

## `design/` — source mockups

The original UI-review material this app was built from:

- [`design/mobile.html`](design/mobile.html) — a thumb-first mobile concept (static SVG screens).
- `design/add-flow-directions.dc.html` — a Claude Design **canvas** document comparing
  three directions for the Add flow. It's design source; it renders inside the
  canvas host, not as a standalone page. Direction **1a** is the one wired live in `index.html`.
