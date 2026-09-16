# ATLAS — *your knowledge, connected to your life*

ATLAS is a **customizable personal environment** for everything you learn,
experience, create and discover. Under the hood it is a personal knowledge
graph; you experience it as a calm, browsable space — part knowledge base, part
life journal, part research workspace. The world map is now just **one view** of
your world, not the product.

**[`index.html`](index.html) is the app.** It's a static, no-build client-side
app. Open it over HTTP and you get a dashboard, an "+ Add to ATLAS" flow, rich
object pages, connections, several views of the same data, Ask ATLAS, and a
Control Center you can reshape.

## Run it

```bash
python3 -m http.server 8000   # from the repo root
# open http://localhost:8000/
```

Serve it over HTTP (the app loads its data and modules with paths that browsers
block on `file://`). On GitHub Pages / any host it just works.

## What it does

- **Dashboard** — overview counts, recent activity, continue exploring, and
  *connections discovered in your ATLAS* ("This project is related to 2 items").
  Every widget is toggle/rename/resize/reorder-able in the Control Center.
- **+ Add to ATLAS** — paste a URL, a book title, a PDF name, or describe an
  experience. A transparent client-side heuristic identifies the type
  (BOOK — 96%), extracts fields, and suggests connections. **You review and
  confirm** — nothing is saved until you do, and provenance is always labelled
  (*Confirmed by me · AI suggested · Imported · Source-derived · Personal note*).
- **Object pages** — *How I found this* (origin / who / where / when / why),
  *My summary* and *My thoughts* (yours; the AI can draft but never overwrites),
  *Important ideas*, typed fields, *Connections*, and *Source*.
- **Connections** — every object links to others through relationship types you
  can rename, invert, make two-way, or invent (`recommended`, `written by`,
  `inspired`, `changed my thinking about`…). The Rahul → *The Design of Everyday
  Things* → Don Norman recommendation is modelled end to end, with the meeting's
  place, date and context on the edge.
- **Views of one dataset** — Cards, List, Gallery, Timeline, **Graph**, and
  **Map** (the India point-of-view basemap). No data is duplicated between them.
- **Ask ATLAS** — ask about *your own world*: "which books have I not finished?",
  "what did I learn in Kyoto?", "papers connected to my projects?". Answers link
  straight back to your objects. (It traverses your graph — it does not reach
  outside it.)
- **Control Center** — create/rename/hide/reorder **object types**, define
  **custom fields** per type, manage **connection types**, and build your
  **dashboard**. Export / import / reset your data.

## Honest limits (no backend)

- **Storage is your browser** (`localStorage`, key `atlas.v2`). Your ATLAS grows
  with you *on this device*; it isn't synced or on a server. Settings →
  **Export JSON** gives you a portable copy; **Import** restores it.
- The **"AI"** is a transparent heuristic engine running in your browser (a small
  matcher + rules), not an LLM. It's honest about being a suggestion, which is
  the whole point of the confirm step. Swapping in a real model later only means
  replacing `assets/ai.js`.

## Project layout

```
index.html            the app shell
assets/atlas.css      design system (dark, IBM Plex, calm)
assets/store.js       data model, defaults, seed, localStorage, queries
assets/ai.js          heuristic classify / assist / Ask
assets/views.js       dashboard, collections, detail, timeline, graph, map, ask
assets/app.js         router, nav, Add flow, connections, Control Center
basemap/              India point-of-view country outlines (see basemap/README.md)
design/               original prototype: classic map app + mobile + flow doc
```

## Basemap — India point of view

The Map view's outlines come from [`basemap/countries-india-pov.json`](basemap/countries-india-pov.json),
built from Natural Earth's official India point-of-view dataset, so the whole of
Jammu & Kashmir (Gilgit-Baltistan / PoK and Aksai Chin) renders as part of India.
Details in [`basemap/README.md`](basemap/README.md).

## Deploy (GitHub Pages)

Settings → Pages → *Deploy from a branch* → this branch, `/ (root)`. A
`.nojekyll` file is included so the site serves as-is.
