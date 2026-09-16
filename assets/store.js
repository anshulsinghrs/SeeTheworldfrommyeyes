/* ATLAS — data layer: model, defaults, seed, persistence, queries.
   Everything lives client-side (localStorage). No backend, no accounts.
   The whole app reads and writes through the global `A`. */
(function () {
  const A = (window.A = window.A || {});
  const KEY = 'atlas.v2';

  A.uid = (p) => (p || 'x') + Math.random().toString(36).slice(2, 9);
  const now = () => new Date().toISOString();
  A.now = now;

  /* ---- provenance states: an AI guess is never silently a personal fact ---- */
  A.STATES = {
    CONFIRMED: { id: 'CONFIRMED', label: 'Confirmed by me', cls: 'ok' },
    AI:        { id: 'AI',        label: 'AI suggested',    cls: 'ai' },
    IMPORTED:  { id: 'IMPORTED',  label: 'Imported',        cls: '' },
    SOURCE:    { id: 'SOURCE',    label: 'Source-derived',  cls: '' },
    NOTE:      { id: 'NOTE',      label: 'Personal note',   cls: 'note' },
  };

  /* ---- glyphs (16x16, stroke) reused + extended from the original map ---- */
  A.GLYPH = {
    book:'<path d="M3 3.5h7a1.5 1.5 0 0 1 1.5 1.5v7.5H4.5A1.5 1.5 0 0 1 3 11z"/><path d="M13 3.5v9"/>',
    paper:'<path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3M6 8.5h4M6 11h3"/>',
    news:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><path d="M5 6h4M5 8.5h6M5 11h3"/>',
    website:'<circle cx="8" cy="8" r="5.2"/><path d="M2.8 8h10.4M8 2.8c2.6 2.8 2.6 7.6 0 10.4M8 2.8c-2.6 2.8-2.6 7.6 0 10.4"/>',
    person:'<circle cx="8" cy="6" r="2.4"/><path d="M3.8 13.2a4.4 4.4 0 0 1 8.4 0"/>',
    place:'<path d="M8 13.5S3.5 9.8 3.5 6.8a4.5 4.5 0 0 1 9 0C12.5 9.8 8 13.5 8 13.5Z"/><circle cx="8" cy="6.8" r="1.5"/>',
    experience:'<path d="M8 2.6l1.6 3.5 3.8.4-2.9 2.6.9 3.8L8 11.4 4.6 13.3l.9-3.8L2.6 6.9l3.8-.4z"/>',
    event:'<rect x="2.8" y="3.5" width="10.4" height="9.5" rx="1"/><path d="M2.8 6.4h10.4M5.5 2.4v2.6M10.5 2.4v2.6"/>',
    idea:'<path d="M8 2.5a4 4 0 0 0-2.4 7.2c.5.4.8 1 .8 1.6v.2h3.2v-.2c0-.6.3-1.2.8-1.6A4 4 0 0 0 8 2.5Z"/><path d="M6.4 13.4h3.2M6.9 14.6h2.2"/>',
    project:'<path d="M8 2.4l5 2.6-5 2.6-5-2.6Z"/><path d="M3 8l5 2.6L13 8M3 11l5 2.6L13 11"/>',
    photo:'<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><circle cx="6" cy="6.8" r="1.2"/><path d="M3 11.5 6.6 8.4l3 2.4 2-1.6 1.4 1.2"/>',
    note:'<rect x="3" y="2.8" width="10" height="10.4" rx="1"/><path d="M5.6 6h4.8M5.6 8.4h4.8M5.6 10.8h3"/>',
    video:'<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/><path d="M6.7 6.3l3.6 1.9-3.6 1.9z"/>',
    topic:'<circle cx="8" cy="8" r="5.4"/><path d="M8 4.2v7.6M4.2 8h7.6"/>',
    custom:'<rect x="3" y="3" width="10" height="10" rx="2"/><path d="M8 5.5v5M5.5 8h5"/>',
  };

  /* ---- default object types (customizable in the Control Center) ---- */
  const T = (id, name, plural, color, glyph, group, fields) =>
    ({ id, name, plural, color, glyph: glyph || id, group, hidden: false, fields });

  const F = (id, label, kind, opts) => ({ id, label, kind, opts });

  A.DEFAULT_TYPES = [
    T('book','Book','Books','#B07CE8','book','knowledge',[
      F('author','Author','text'), F('year','Year','number'),
      F('genre','Genre','text'), F('rating','Rating','rating'),
      F('status','Status','status',['Want to read','Reading','Finished','Abandoned']),
    ]),
    T('paper','Research paper','Research','#45C08B','paper','knowledge',[
      F('authors','Authors','text'), F('journal','Journal','text'), F('year','Year','number'),
      F('doi','DOI','text'), F('area','Research area','text'),
      F('methodology','Methodology','text'), F('findings','Key findings','longtext'),
    ]),
    T('news','Article / News','News','#E5484D','news','knowledge',[
      F('source','Source','text'), F('url','URL','url'), F('date','Date','date'),
    ]),
    T('website','Website','Websites','#4C93E8','website','knowledge',[
      F('url','URL','url'), F('source','Site','text'),
    ]),
    T('idea','Idea','Ideas','#FF7A33','idea','creation',[
      F('summary','In one line','text'), F('status','Status','status',['Spark','Developing','Parked','Realised']),
    ]),
    T('project','Project','Projects','#E3B341','project','creation',[
      F('status','Status','status',['Planning','Active','On hold','Done']),
      F('started','Started','date'),
    ]),
    T('note','Note','Notes','#8A8A85','note','creation',[]),
    T('person','Person','People','#E8679B','person','life',[
      F('role','Role','text'), F('metwhere','Where we met','text'),
    ]),
    T('place','Place','Places','#2FC8C8','place','life',[
      F('country','Country','text'),
    ]),
    T('experience','Experience','Experiences','#7C8BE8','experience','life',[
      F('date','Date','date'), F('location','Location','text'), F('people','People','text'),
      F('learned','What I learned','longtext'),
    ]),
    T('event','Event','Events','#C7A44A','event','life',[
      F('date','Date','date'), F('location','Location','text'),
    ]),
    T('photo','Photo','Photos','#6DD3A7','photo','life',[
      F('date','Date','date'), F('location','Location','text'),
    ]),
    T('video','Video','Videos','#E86FA0','video','knowledge',[
      F('url','URL','url'), F('source','Channel','text'),
    ]),
  ];

  /* ---- default connection types (customizable) ---- */
  const C = (id, label, inverse, bidirectional) => ({ id, label, inverse, bidirectional: !!bidirectional, hidden: false });
  A.DEFAULT_CONNTYPES = [
    C('recommended','recommended','recommended by'),
    C('written_by','written by','wrote'),
    C('related_to','related to','related to', true),
    C('inspired','inspired','inspired by'),
    C('influenced','influenced','influenced by'),
    C('reminded_of','reminded me of','recalled by'),
    C('learned_from','learned from','taught'),
    C('discovered_through','discovered through','led me to'),
    C('discussed_with','discussed with','discussed with', true),
    C('met_at','met at','where I met'),
    C('visited','visited','visited by'),
    C('located_in','located in','contains'),
    C('studied_in','studied in','studied by'),
    C('set_in','set in','setting of'),
    C('published_in','published in','published'),
    C('born_in','born in','birthplace of'),
    C('mentioned','mentioned','mentioned in'),
    C('cited','cites','cited by'),
    C('part_of','part of','contains'),
    C('led_to','led to','came from'),
    C('created_from','created from','source of'),
  ];

  /* ---- default dashboard widgets (customizable) ---- */
  A.DEFAULT_WIDGETS = [
    { id: 'overview',   title: 'Overview',           w: 2, on: true },
    { id: 'recent',     title: 'Recent activity',    w: 1, on: true },
    { id: 'continue',   title: 'Continue exploring', w: 1, on: true },
    { id: 'discovered', title: 'Connections',        w: 2, on: true },
    { id: 'timeline',   title: 'Across time',        w: 2, on: true },
  ];

  /* ============================ SEED ============================ */
  function seed() {
    const o = {}; // id registry for wiring connections
    const objs = [];
    const mk = (id, type, title, extra) => {
      const obj = Object.assign({
        id, type, title, subtitle: '', fields: {}, places: [], tags: [],
        mySummary: '', myThoughts: '', ideas: [],
        context: {}, source: null, photos: [],
        state: 'CONFIRMED', created: now(), updated: now(), opened: null,
      }, extra || {});
      objs.push(obj); o[id] = obj; return obj;
    };
    const D = (s) => new Date(s).toISOString();

    mk('p_rahul','person','Rahul', { subtitle:'Friend · design & cities',
      fields:{ role:'Product designer', metwhere:'Kolkata' },
      context:{ origin:'I met them', where:'Kolkata', when:'2026-09-16', why:'Introduced through a mutual friend at a design meetup.' },
      places:[{loc:'Kolkata',ctry:'India',lat:22.57,lng:88.36,rel:'met_at',res:'CITY',state:'CONFIRMED'}] });

    mk('p_norman','person','Don Norman', { subtitle:'Author · cognitive scientist',
      fields:{ role:'Design researcher' }, state:'SOURCE',
      context:{ origin:'Source-derived', why:'Author of a book Rahul recommended.' } });

    mk('p_jacobs','person','Jane Jacobs', { subtitle:'Writer · urbanist', year:1961, state:'SOURCE',
      fields:{ role:'Urbanist' },
      places:[{loc:'Greenwich Village, New York',ctry:'India'.replace('India','United States'),lat:40.73,lng:-74.0,rel:'located_in',res:'LOCALITY',state:'SOURCE'}] });

    mk('b_doet','book','The Design of Everyday Things', {
      subtitle:'Don Norman · 1988', year:1988,
      fields:{ author:'Don Norman', year:1988, genre:'Design', status:'Reading', rating:5 },
      state:'AI',
      context:{ origin:'Someone recommended it', who:'Rahul', where:'Kolkata', when:'2026-09-16',
        why:'Rahul thought it would help with my interest in how everyday design shapes behaviour.',
        note:'He mentioned the chapter on affordances specifically.' },
      source:{ kind:'Recommendation', ref:'Rahul, in person' },
      mySummary:'', myThoughts:'',
      ideas:['Affordances vs. signifiers — worth mapping onto campus wayfinding.'] });

    mk('b_deathlife','book','The Death and Life of Great American Cities', {
      subtitle:'Jane Jacobs · 1961', year:1961,
      fields:{ author:'Jane Jacobs', year:1961, genre:'Urbanism', status:'Finished', rating:5 },
      state:'CONFIRMED',
      context:{ origin:'I discovered it', why:'Kept being cited in the walkability papers I was reading.' },
      mySummary:'The sidewalk is the city’s primary organ of safety and contact. Mixed use and short blocks do the work planners keep trying to legislate.',
      myThoughts:'Changed how I read a street — I now look for eyes on the street before anything else.' });

    mk('bk_god','book','The God of Small Things', {
      subtitle:'Arundhati Roy · 1997', year:1997,
      fields:{ author:'Arundhati Roy', year:1997, genre:'Literature', status:'Finished', rating:4 },
      places:[{loc:'Aymanam, Kerala',ctry:'India',lat:9.62,lng:76.44,rel:'set_in',res:'LOCALITY',state:'SOURCE'}],
      context:{ origin:'I read it', why:'The setting is inseparable from the prose.' } });

    mk('pa_side','paper','Pedestrian network completeness and access to transit', {
      subtitle:'Transportation Research Record · 2024', year:2024,
      fields:{ authors:'—', journal:'Transportation Research Record', year:2024,
        area:'Walkability', methodology:'Sidewalk-graph completeness vs. station catchments',
        findings:'Completeness explains more variance in transit access than raw density.' },
      places:[{loc:'IIT Kharagpur',ctry:'India',lat:22.32,lng:87.31,rel:'studied_in',res:'LANDMARK',state:'CONFIRMED'}],
      context:{ origin:'It came from my research', why:'Method is reusable for the KGP campus study.' },
      state:'IMPORTED' });

    mk('pa_heat','paper','Urban heat and informal settlement morphology', {
      subtitle:'2023', year:2023,
      fields:{ journal:'Elsevier', year:2023, area:'Climate', findings:'Footprint density tracks land-surface temperature in deltaic cities.' },
      places:[{loc:'Dhaka',ctry:'Bangladesh',lat:23.81,lng:90.41,rel:'studied_in',res:'CITY',state:'SOURCE'}],
      state:'IMPORTED', context:{ origin:'It came from my research' } });

    mk('pl_kolkata','place','Kolkata', { subtitle:'West Bengal, India',
      fields:{ country:'India' },
      places:[{loc:'Kolkata',ctry:'India',lat:22.57,lng:88.36,rel:'located_in',res:'CITY',state:'CONFIRMED'}] });
    mk('pl_kgp','place','IIT Kharagpur', { subtitle:'West Bengal, India',
      fields:{ country:'India' },
      places:[{loc:'IIT Kharagpur',ctry:'India',lat:22.32,lng:87.31,rel:'located_in',res:'LANDMARK',state:'CONFIRMED'}] });
    mk('pl_kyoto','place','Kyoto', { subtitle:'Japan',
      fields:{ country:'Japan' },
      places:[{loc:'Kyoto',ctry:'Japan',lat:35.01,lng:135.77,rel:'located_in',res:'CITY',state:'CONFIRMED'}] });

    mk('x_rahul','experience','Met Rahul at the Kolkata design meetup', {
      subtitle:'Experience · 16 Sep 2026', year:2026, date:D('2026-09-16'),
      fields:{ date:'2026-09-16', location:'Kolkata', people:'Rahul',
        learned:'That most “bad” objects are really failures of feedback and mapping, not user error.' },
      places:[{loc:'Kolkata',ctry:'India',lat:22.57,lng:88.36,rel:'located_in',res:'CITY',state:'CONFIRMED'}],
      mySummary:'Long conversation about how physical objects teach you how to use them. Rahul recommended Don Norman on the walk back.',
      context:{ origin:'It happened to me', where:'Kolkata', when:'2026-09-16' } });

    mk('x_kyoto','experience','Kyoto, autumn walk along the Kamo', {
      subtitle:'Experience · 2024', year:2024, date:D('2024-11-10'),
      fields:{ date:'2024-11-10', location:'Kyoto', learned:'Street width does most of the work — the trees get the credit.' },
      places:[{loc:'Kyoto',ctry:'Japan',lat:35.01,lng:135.77,rel:'located_in',res:'CITY',state:'CONFIRMED'}],
      mySummary:'Walked the Kamo river north from Shijo. The setback rhythm is doing more than the greenery.' });

    mk('i_walk','idea','Walkability score for the KGP campus', {
      subtitle:'Idea', year:2026,
      fields:{ summary:'Adapt sidewalk-completeness scoring to the campus.', status:'Developing' },
      context:{ origin:'I created it', why:'Fell out of the transit-access paper plus the Jane Jacobs read.' } });

    mk('i_afford','idea','Wayfinding as affordance, not signage', { subtitle:'Idea', year:2026,
      fields:{ summary:'Design campus paths so the route is obvious without signs.', status:'Spark' } });

    mk('pr_campus','project','Campus walkability study', {
      subtitle:'Project · Active', year:2026,
      fields:{ status:'Active', started:'2026-08-01' },
      mySummary:'Score every path on campus for completeness and comfort, then propose the ten cheapest fixes.',
      context:{ origin:'I created it' } });

    // ---- connections (the graph) ----
    const conns = [];
    const link = (from, to, type, meta, state) => conns.push({
      id: A.uid('c_'), from, to, type, meta: meta || {}, state: state || 'CONFIRMED', created: now() });

    link('p_rahul','b_doet','recommended',
      { location:'Kolkata', date:'2026-09-16',
        context:'Rahul recommended this because he thought it would help with my interest in design.' },
      'CONFIRMED');
    link('b_doet','p_norman','written_by', {}, 'SOURCE');
    link('b_doet','i_afford','inspired', {}, 'CONFIRMED');
    link('b_doet','pr_campus','related_to', {}, 'AI');
    link('x_rahul','p_rahul','met_at', {}, 'CONFIRMED');
    link('x_rahul','b_doet','led_to', { context:'The recommendation came out of this conversation.' }, 'CONFIRMED');
    link('b_deathlife','p_jacobs','written_by', {}, 'SOURCE');
    link('b_deathlife','i_walk','influenced', {}, 'CONFIRMED');
    link('pa_side','pr_campus','part_of', {}, 'CONFIRMED');
    link('pa_side','i_walk','related_to', {}, 'CONFIRMED');
    link('i_walk','pr_campus','part_of', {}, 'CONFIRMED');
    link('pa_side','pl_kgp','studied_in', {}, 'IMPORTED');
    link('p_rahul','pl_kolkata','met_at', {}, 'CONFIRMED');
    link('x_kyoto','pl_kyoto','located_in', {}, 'CONFIRMED');
    link('pa_heat','pr_campus','related_to', {}, 'AI');
    link('bk_god','pl_kyoto','reminded_of', {}, 'NOTE');

    return {
      version: 2,
      types: JSON.parse(JSON.stringify(A.DEFAULT_TYPES)),
      connTypes: JSON.parse(JSON.stringify(A.DEFAULT_CONNTYPES)),
      widgets: JSON.parse(JSON.stringify(A.DEFAULT_WIDGETS)),
      settings: { name: 'My ATLAS', theme: 'dark' },
      objects: objs,
      connections: conns,
    };
  }
  A.seed = seed;

  /* ============================ PERSISTENCE ============================ */
  let S = null;
  A.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { S = JSON.parse(raw); }
    } catch (e) { S = null; }
    if (!S || !S.objects) { S = seed(); A.save(); }
    // forward-compat: ensure arrays exist
    S.types = S.types || []; S.connTypes = S.connTypes || [];
    S.widgets = S.widgets || A.DEFAULT_WIDGETS; S.settings = S.settings || { name: 'My ATLAS' };
    A.state = S; return S;
  };
  A.save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  A.reset = function () { S = seed(); A.save(); return S; };
  A.exportJSON = () => JSON.stringify(S, null, 2);
  A.importJSON = function (text) {
    const parsed = JSON.parse(text);
    if (!parsed.objects) throw new Error('Not an ATLAS export');
    S = parsed; A.state = S; A.save(); return S;
  };

  /* ============================ ACCESSORS ============================ */
  A.type = (id) => S.types.find((t) => t.id === id) || { id, name: id, plural: id, color: '#8A8A85', glyph: 'custom', fields: [] };
  A.connType = (id) => S.connTypes.find((c) => c.id === id) || { id, label: id, inverse: id };
  A.get = (id) => S.objects.find((o) => o.id === id);
  A.visibleTypes = () => S.types.filter((t) => !t.hidden);

  A.addObject = function (obj) {
    obj.id = obj.id || A.uid('o_');
    obj.created = obj.created || now(); obj.updated = now();
    obj.fields = obj.fields || {}; obj.places = obj.places || []; obj.tags = obj.tags || [];
    obj.ideas = obj.ideas || []; obj.context = obj.context || {};
    S.objects.push(obj); A.save(); return obj;
  };
  A.updateObject = function (id, patch) {
    const o = A.get(id); if (!o) return null;
    Object.assign(o, patch); o.updated = now(); A.save(); return o;
  };
  A.touch = function (id) { const o = A.get(id); if (o) { o.opened = now(); A.save(); } };
  A.deleteObject = function (id) {
    S.objects = S.objects.filter((o) => o.id !== id);
    S.connections = S.connections.filter((c) => c.from !== id && c.to !== id);
    A.save();
  };

  A.addConnection = function (c) {
    c.id = c.id || A.uid('c_'); c.created = now(); c.meta = c.meta || {}; c.state = c.state || 'CONFIRMED';
    S.connections.push(c); A.save(); return c;
  };
  A.updateConnection = function (id, patch) {
    const c = S.connections.find((x) => x.id === id); if (!c) return null;
    Object.assign(c, patch); A.save(); return c;
  };
  A.deleteConnection = function (id) { S.connections = S.connections.filter((c) => c.id !== id); A.save(); };

  // connections involving an object, normalised to {other, label, dir, conn}
  A.connectionsFor = function (id) {
    const out = [];
    S.connections.forEach((c) => {
      const ct = A.connType(c.type);
      if (c.from === id) out.push({ conn: c, other: A.get(c.to), label: ct.label, dir: 'out' });
      else if (c.to === id) out.push({ conn: c, other: A.get(c.from), label: ct.inverse || ct.label, dir: 'in' });
    });
    return out.filter((x) => x.other);
  };

  /* ============================ DERIVED / QUERIES ============================ */
  A.stats = function () {
    const by = {};
    S.objects.forEach((o) => { by[o.type] = (by[o.type] || 0) + 1; });
    return { total: S.objects.length, connections: S.connections.length, by };
  };
  A.recent = (n) => [...S.objects].sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, n || 6);
  A.recentlyOpened = (n) => S.objects.filter((o) => o.opened)
    .sort((a, b) => (b.opened || '').localeCompare(a.opened || '')).slice(0, n || 5);
  A.byType = (types) => S.objects.filter((o) => !types || types.includes(o.type));

  // "interesting connections discovered in your ATLAS"
  A.discovered = function (n) {
    const out = [];
    S.objects.forEach((o) => {
      const cs = A.connectionsFor(o.id);
      const byLabel = {};
      cs.forEach((x) => { (byLabel[x.label] = byLabel[x.label] || []).push(x); });
      Object.entries(byLabel).forEach(([label, arr]) => {
        if (arr.length >= 2) {
          const kinds = new Set(arr.map((a) => a.other.type));
          const kindName = kinds.size === 1 ? A.type([...kinds][0]).plural.toLowerCase() : 'items';
          out.push({ id: o.id, text: `${o.title} is ${label} ${arr.length} ${kindName}.`, count: arr.length, ids: arr.map(a => a.other.id) });
        }
      });
    });
    // a couple of shaped highlights first
    out.sort((a, b) => b.count - a.count);
    return out.slice(0, n || 6);
  };

  A.search = function (q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/).filter((w) => w.length > 1);
    return S.objects.map((o) => {
      const hay = [o.title, o.subtitle, o.mySummary, o.myThoughts,
        (o.tags || []).join(' '), Object.values(o.fields || {}).join(' '),
        A.type(o.type).name, JSON.stringify(o.context || {})].join(' ').toLowerCase();
      let score = 0;
      if (o.title.toLowerCase().includes(q)) score += 5;
      words.forEach((w) => { if (hay.includes(w)) score += 1; });
      return { o, score };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.o);
  };

  A.mapObjects = () => S.objects.filter((o) => (o.places || []).some((p) => p.lat != null));
})();
