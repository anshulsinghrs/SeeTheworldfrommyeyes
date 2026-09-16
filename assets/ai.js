/* ATLAS — the "AI" layer. There is no backend or LLM here: this is a
   transparent client-side heuristic engine. It extracts, suggests, and drafts,
   but everything it returns is labelled AI-suggested and must be confirmed. */
(function () {
  const A = (window.A = window.A || {});
  const AI = (A.AI = {});

  /* small knowledge base for the demo — pretend "recognised" inputs */
  const KB = {
    'design of everyday things': {
      type: 'book', conf: 0.96, title: 'The Design of Everyday Things', subtitle: 'Don Norman · 1988',
      fields: { author: 'Don Norman', year: 1988, genre: 'Design' },
      people: [{ name: 'Don Norman', rel: 'written_by' }],
      note: 'Foundational text on affordances, signifiers and human-centred design.',
    },
    'death and life of great american cities': {
      type: 'book', conf: 0.95, title: 'The Death and Life of Great American Cities', subtitle: 'Jane Jacobs · 1961',
      fields: { author: 'Jane Jacobs', year: 1961, genre: 'Urbanism' },
      people: [{ name: 'Jane Jacobs', rel: 'written_by' }],
    },
    'god of small things': {
      type: 'book', conf: 0.94, title: 'The God of Small Things', subtitle: 'Arundhati Roy · 1997',
      fields: { author: 'Arundhati Roy', year: 1997, genre: 'Literature' },
      places: [{ loc: 'Aymanam, Kerala', ctry: 'India', lat: 9.62, lng: 76.44, rel: 'set_in', res: 'LOCALITY' }],
    },
    'thinking fast and slow': {
      type: 'book', conf: 0.93, title: 'Thinking, Fast and Slow', subtitle: 'Daniel Kahneman · 2011',
      fields: { author: 'Daniel Kahneman', year: 2011, genre: 'Psychology' },
    },
  };

  const CITY = {
    kolkata: ['Kolkata', 'India', 22.57, 88.36], kharagpur: ['IIT Kharagpur', 'India', 22.32, 87.31],
    delhi: ['Delhi', 'India', 28.61, 77.21], mumbai: ['Mumbai', 'India', 19.08, 72.88],
    kyoto: ['Kyoto', 'Japan', 35.01, 135.77], tokyo: ['Tokyo', 'Japan', 35.67, 139.77],
    london: ['London', 'United Kingdom', 51.51, -0.13], 'new york': ['New York', 'United States', 40.71, -74.01],
    bengaluru: ['Bengaluru', 'India', 12.97, 77.59], chennai: ['Chennai', 'India', 13.08, 80.27],
  };
  A.CITY = CITY;

  const findCity = (s) => {
    s = s.toLowerCase();
    for (const k in CITY) if (s.includes(k)) return CITY[k];
    return null;
  };

  /* ---- classify: raw input -> a reviewable guess ---- */
  AI.classify = function (raw) {
    const s = (raw || '').trim();
    const low = s.toLowerCase();
    const g = { type: 'note', conf: 0.55, title: s.slice(0, 80), subtitle: '', fields: {}, places: [], people: [], note: '' };

    // known titles
    for (const k in KB) if (low.includes(k)) { Object.assign(g, JSON.parse(JSON.stringify(KB[k]))); return finalize(g, s); }

    // URL
    if (/^https?:\/\//i.test(s) || /\b\w+\.(com|org|net|io|edu|gov|news)\b/i.test(s)) {
      const newsy = /(news|times|post|guardian|reuters|bbc|hindu|herald)/i.test(s);
      g.type = newsy ? 'news' : 'website'; g.conf = 0.82;
      g.title = s.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 60);
      g.fields = { url: s, source: (s.match(/\/\/([^\/]+)/) || [, ''])[1] };
      g.note = 'Detected a link. Title and details would be read from the page.';
      return finalize(g, s);
    }
    // PDF / paper
    if (/\.pdf(\b|$)/i.test(low) || /\b(journal|proceedings|abstract|doi|et al)\b/i.test(low)) {
      g.type = 'paper'; g.conf = 0.8;
      g.title = s.replace(/\.pdf.*$/i, '').replace(/[-_]/g, ' ').slice(0, 80);
      g.fields = { area: '', year: new Date().getFullYear() };
      g.note = 'Looks like a document — title, authors and abstract would be extracted.';
      return finalize(g, s);
    }
    // first-person experience
    if (/^(i |we )/.test(low) && /(visited|went|met|saw|attended|walked|travel|trip|flew)/.test(low)) {
      g.type = 'experience'; g.conf = 0.78; g.title = s.charAt(0).toUpperCase() + s.slice(1, 90);
      const c = findCity(low); if (c) g.places = [{ loc: c[0], ctry: c[1], lat: c[2], lng: c[3], rel: 'located_in', res: 'CITY' }];
      const yr = (s.match(/\b(19|20)\d{2}\b/) || [])[0]; g.fields = { date: yr ? yr : '', location: c ? c[0] : '' };
      return finalize(g, s);
    }
    // "met NAME" -> person
    let m = low.match(/\bmet ([a-z][a-z]+)\b/);
    if (m) { g.type = 'person'; g.conf = 0.7; g.title = m[1][0].toUpperCase() + m[1].slice(1);
      const c = findCity(low); g.fields = { metwhere: c ? c[0] : '' };
      if (c) g.places = [{ loc: c[0], ctry: c[1], lat: c[2], lng: c[3], rel: 'met_at', res: 'CITY' }];
      return finalize(g, s); }
    // idea
    if (/^idea[:\- ]/i.test(s) || low.startsWith('what if')) {
      g.type = 'idea'; g.conf = 0.72; g.title = s.replace(/^idea[:\- ]*/i, '').slice(0, 90);
      g.fields = { summary: g.title, status: 'Spark' }; return finalize(g, s);
    }
    // else short place name?
    const c = findCity(low);
    if (c && low.length < 24) { g.type = 'place'; g.conf = 0.68; g.title = c[0]; g.fields = { country: c[1] };
      g.places = [{ loc: c[0], ctry: c[1], lat: c[2], lng: c[3], rel: 'located_in', res: 'CITY' }]; return finalize(g, s); }

    return finalize(g, s);
  };

  function finalize(g, raw) {
    g.raw = raw;
    // suggested connections to EXISTING objects (matched by title words)
    g.suggested = [];
    (g.people || []).forEach((p) => {
      const existing = A.state.objects.find((o) => o.title.toLowerCase() === p.name.toLowerCase());
      g.suggested.push({ rel: p.rel, otherTitle: p.name, otherType: 'person', otherId: existing ? existing.id : null, conf: 0.9 });
    });
    // fuzzy: any object whose title shares a distinctive word
    const words = (g.title || '').toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    A.state.objects.forEach((o) => {
      if (g.suggested.some((s) => s.otherId === o.id)) return;
      const ot = o.title.toLowerCase();
      if (words.some((w) => ot.includes(w))) g.suggested.push({ rel: 'related_to', otherTitle: o.title, otherType: o.type, otherId: o.id, conf: 0.6 });
    });
    g.suggested = g.suggested.slice(0, 5);
    return g;
  }

  AI.STEPS = ['Reading input', 'Identifying what this is', 'Extracting details', 'Finding people & places', 'Suggesting connections'];

  /* ---- writing assist: drafts you can accept or discard; never auto-saves ---- */
  AI.assist = function (kind, obj) {
    const t = A.type(obj.type).name.toLowerCase();
    const f = obj.fields || {};
    if (kind === 'summary') {
      const bits = [obj.title];
      if (f.author) bits.push('by ' + f.author);
      if (f.area) bits.push('on ' + f.area);
      let base = `A ${t}: ${bits.join(' ')}.`;
      if (obj.context && obj.context.who) base += ` It came to me through ${obj.context.who}.`;
      if (f.findings) base += ' ' + f.findings;
      return base + ' — draft; edit freely to make it yours.';
    }
    if (kind === 'thoughts') {
      return `What stayed with me about ${obj.title}: (draft) it connects to ` +
        (A.connectionsFor(obj.id).slice(0, 2).map((c) => c.other.title).join(' and ') || 'ideas I\'m still forming') + '.';
    }
    if (kind === 'improve') {
      const cur = obj[obj._assistField] || '';
      return cur ? cur.replace(/\s+/g, ' ').trim() + ' — (tightened)' : '';
    }
    return '';
  };

  /* ============================ ASK ATLAS ============================ */
  AI.ask = function (query) {
    const q = (query || '').trim(); const low = q.toLowerCase();
    const objs = A.state.objects;
    const titleOf = (id) => (A.get(id) || {}).title;
    const has = (...w) => w.every((x) => low.includes(x));

    // books recommended by people I met in <place>
    if (has('recommend') && (low.includes('met') || low.includes('kolkata') || low.includes('people'))) {
      const place = Object.keys(A.CITY).find((c) => low.includes(c));
      let people = objs.filter((o) => o.type === 'person');
      if (place) people = people.filter((p) => A.connectionsFor(p.id).some((c) => /met/.test(c.label) && new RegExp(place, 'i').test(c.other.title))
        || (p.fields && String(p.fields.metwhere || '').toLowerCase().includes(place)));
      const results = [];
      people.forEach((p) => A.connectionsFor(p.id).forEach((c) => { if (c.conn.type === 'recommended' && c.dir === 'out') results.push(c.other); }));
      return { answer: `Books recommended by ${place ? 'people you met in ' + cap(place) : 'people you know'}: ${results.length || 'none yet'}.`, results: uniq(results) };
    }
    // what did I learn during / trip to <place>
    if ((has('learn') || has('learnt') || has('trip')) ) {
      const place = Object.keys(A.CITY).find((c) => low.includes(c));
      let xs = objs.filter((o) => o.type === 'experience');
      if (place) xs = xs.filter((x) => JSON.stringify(x).toLowerCase().includes(place));
      const learned = xs.map((x) => x.fields && x.fields.learned).filter(Boolean);
      return { answer: learned.length ? learned.join(' — ') : `No experiences${place ? ' in ' + cap(place) : ''} recorded yet.`, results: xs };
    }
    // which books have I not finished
    if (has('book') && (has('not', 'finish') || has('unfinished') || has('finished'))) {
      const results = objs.filter((o) => o.type === 'book' && (o.fields.status || '') !== 'Finished');
      return { answer: `Books you haven't finished: ${results.length}.`, results };
    }
    // who introduced me to the most ... / recommended the most
    if (has('who') && (has('most') || has('introduc') || has('recommend'))) {
      const tally = {};
      A.state.connections.forEach((c) => { if (c.type === 'recommended' || c.type === 'discovered_through') tally[c.from] = (tally[c.from] || 0) + 1; });
      const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      const top = ranked[0];
      return { answer: top ? `${titleOf(top[0])} — ${top[1]} recommendation(s).` : 'No recommenders recorded yet.',
        results: ranked.map(([id]) => A.get(id)).filter(Boolean) };
    }
    // ideas developed after reading papers/books
    if (has('idea') && (has('paper') || has('read') || has('book'))) {
      const results = objs.filter((o) => o.type === 'idea' && A.connectionsFor(o.id).some((c) => ['book', 'paper'].includes(c.other.type)));
      return { answer: `Ideas connected to what you've read: ${results.length}.`, results };
    }
    // everything connected to <topic/title>
    if (has('connect') || has('everything') || has('related')) {
      const target = objs.find((o) => low.includes(o.title.toLowerCase().split(' ').slice(0, 2).join(' ')))
        || A.search(q.replace(/(show me|everything|connected to|related to|what|is)/gi, '').trim())[0];
      if (target) {
        const results = A.connectionsFor(target.id).map((c) => c.other);
        return { answer: `${results.length} things connected to ${target.title}.`, results: [target, ...results] };
      }
    }
    // papers connected to my research/projects
    if (has('paper') && (has('research') || has('project') || has('current'))) {
      const projects = objs.filter((o) => o.type === 'project');
      const results = [];
      projects.forEach((p) => A.connectionsFor(p.id).forEach((c) => { if (c.other.type === 'paper') results.push(c.other); }));
      return { answer: `Papers connected to your projects: ${uniq(results).length}.`, results: uniq(results) };
    }
    // fallback: search
    const results = A.search(q);
    return { answer: results.length ? `Found ${results.length} matching item(s).` : `Nothing in your ATLAS matches that yet.`, results };
  };

  const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const uniq = (arr) => { const seen = new Set(); return arr.filter((o) => o && !seen.has(o.id) && seen.add(o.id)); };
})();
