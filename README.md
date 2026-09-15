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

It's a static site — no build step, no backend. **Serve it over HTTP** (the map
data is loaded with `fetch`, which browsers block on `file://`):

```bash
# any static server works; from the repo root:
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening `index.html` straight off disk (`file://`) shows the UI and plots every
object, but the country outlines won't load — the app detects this and tells you
to serve the folder. On GitHub Pages / any real host it just works.

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

## Basemap — India point of view

The country outlines are served **locally** from
[`basemap/countries-india-pov.json`](basemap/countries-india-pov.json), not a CDN.
It is built from Natural Earth's official **India point-of-view** admin-0 dataset
(`ne_10m_admin_0_countries_ind`), so the whole of Jammu & Kashmir — including
Gilgit-Baltistan / PoK and Aksai Chin — is rendered as part of India, matching the
map India uses officially. The 10m source is simplified down to a ~110m weight
(TopoJSON, ~190 KB) to keep the minimalist look and a small payload. Rebuild notes
are in [`basemap/README.md`](basemap/README.md).

## External dependencies (loaded in the browser from CDNs)

- [D3 7.9](https://d3js.org/) and [topojson-client 3.1](https://github.com/topojson/topojson-client) — map projection & rendering
- IBM Plex Sans / Mono via Google Fonts

The browser viewing the site needs to reach `unpkg.com` for the two libraries and
Google Fonts for the typefaces; the basemap itself is local. (Some sandboxed
networks block the CDNs — the fonts and libraries then fall back to system
defaults / fail soft.)

## `design/` — source mockups

The original UI-review material this app was built from:

- [`design/mobile.html`](design/mobile.html) — a thumb-first mobile concept (static SVG screens).
- `design/add-flow-directions.dc.html` — a Claude Design **canvas** document comparing
  three directions for the Add flow. It's design source; it renders inside the
  canvas host, not as a standalone page. Direction **1a** is the one wired live in `index.html`.
