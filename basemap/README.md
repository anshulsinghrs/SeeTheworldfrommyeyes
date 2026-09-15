# Basemap — India point of view

`countries-india-pov.json` is the country-outline layer the map renders. It shows
**Jammu & Kashmir in full (Gilgit-Baltistan / PoK and Aksai Chin included) as part
of India**, i.e. India's official point of view.

## Source

Natural Earth, admin-0 countries, **India point-of-view** variant:
`ne_10m_admin_0_countries_ind.geojson`, from
[nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
(`geojson/`). Natural Earth is public domain (no permission needed, no rights
reserved). Only the 10m scale ships an India POV — there is no 110m/50m POV — so
the coarse look is produced by simplification, not by using a lower-scale file.

## How it was built

TopoJSON, from the 10m GeoJSON:

1. `topojson-server` `topology({countries}, 1e5)` — build topology, quantize.
2. `topojson-simplify` `presimplify(·, sphericalTriangleArea)` then
   `simplify(·, 2e-4)` — thin 10m detail down to a ~110m weight so the map stays
   minimalist and small (~190 KB) while J&K's extent is preserved.
3. `topojson-client` `quantize(·, 1e5)` — final coordinate quantization.
4. Per feature: `properties.name` set from `NAME_LONG`/`NAME`, plus a unique `id`
   (what the app reads for labels and keys).

Output shape matches what the app consumes: `topojson.feature(topo, topo.objects.countries)`.

## Verification

Point-in-polygon checks against the built India feature: Aksai Chin (79.5, 35.1),
Gilgit/PoK (74.5, 35.8) and Srinagar (74.8, 34.1) all fall **inside** India;
Karachi (Pakistan) does not. India's polygon reaches ~37.0°N.
