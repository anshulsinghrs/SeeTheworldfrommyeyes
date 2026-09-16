/* ATLAS — views. Each renderer writes into .main and wires its own interactions.
   One dataset (the store), many ways to look at it. */
(function () {
  const A = (window.A = window.A || {});
  const V = (A.views = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  A.esc = esc;
  const main = () => document.querySelector('.main');

  A.icon = function (typeId, size) {
    const t = A.type(typeId); const g = A.GLYPH[t.glyph] || A.GLYPH.custom; size = size || 15;
    return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="${t.color}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${g}</svg>`;
  };
  const tico = (typeId, cls) => `<span class="tico ${cls || ''}" style="border-color:${A.type(typeId).color}44">${A.icon(typeId, cls === 'big' ? 20 : 15)}</span>`;
  const stateTag = (st) => { const s = A.STATES[st] || A.STATES.CONFIRMED; return `<span class="tag ${s.cls}">${s.label}</span>`; };
  const excerpt = (o) => o.mySummary || o.subtitle || (o.fields && (o.fields.summary || o.fields.findings)) || (o.context && o.context.why) || '';
  const when = (iso) => { if (!iso) return ''; const d = new Date(iso), n = Date.now(); const days = Math.round((n - d) / 86400000);
    if (days <= 0) return 'today'; if (days === 1) return 'yesterday'; if (days < 30) return days + 'd ago'; if (days < 365) return Math.round(days / 30) + 'mo ago'; return Math.round(days / 365) + 'y ago'; };

  /* ============================ CARD / ROW ============================ */
  V.card = (o) => `<article class="card" data-obj="${o.id}">
    <div class="thead">${tico(o.type)}<div style="min-width:0"><h3>${esc(o.title)}</h3>
      <div class="sub">${esc(o.subtitle || A.type(o.type).name)}</div></div></div>
    ${excerpt(o) ? `<p class="excerpt">${esc(excerpt(o))}</p>` : ''}
    <div class="foot"><span class="typeTag" style="color:${A.type(o.type).color}">${esc(A.type(o.type).name)}</span>
      ${stateTag(o.state)}
      <span class="count">${A.connectionsFor(o.id).length} link${A.connectionsFor(o.id).length === 1 ? '' : 's'}</span></div>
  </article>`;

  V.row = (o) => `<div class="row" data-obj="${o.id}">${tico(o.type)}
    <div><div class="t">${esc(o.title)}</div><div class="s">${esc(o.subtitle || A.type(o.type).name)}</div></div>
    <div style="display:flex;gap:7px;align-items:center">${stateTag(o.state)}<span class="count">${A.connectionsFor(o.id).length}</span></div></div>`;

  /* ============================ DASHBOARD ============================ */
  V.home = function () {
    const s = A.stats();
    const widgets = A.state.widgets.filter((w) => w.on);
    const box = (w, inner) => `<section class="widget w${w.w >= 2 ? 2 : 1}"><h2>${esc(w.title)}</h2>${inner}</section>`;

    const render = {
      overview: () => `<div class="stat-grid">${A.visibleTypes().map((t) => {
        const n = s.by[t.id] || 0;
        return `<div class="stat" data-go="#/type/${t.id}"><em>${n}</em><span>${A.icon(t.id, 12)} ${esc(t.plural)}</span></div>`;
      }).join('')}<div class="stat"><em>${s.connections}</em><span>Connections</span></div></div>`,
      recent: () => `<div class="feed">${A.recent(6).map((o) => `<div class="feeditem" data-obj="${o.id}">${tico(o.type)}
        <div><div class="t">${esc(o.title)}</div><div class="s">Added ${esc(A.type(o.type).name.toLowerCase())}</div></div>
        <span class="when">${when(o.created)}</span></div>`).join('')}</div>`,
      continue: () => { const items = A.recentlyOpened(6); return items.length ? `<div class="feed">${items.map((o) => `<div class="feeditem" data-obj="${o.id}">${tico(o.type)}
        <div><div class="t">${esc(o.title)}</div><div class="s">${esc(A.type(o.type).name)}</div></div>
        <span class="when">${when(o.opened)}</span></div>`).join('')}</div>` : `<div class="mute" style="font-size:13px">Open something and it will wait for you here.</div>`; },
      discovered: () => { const d = A.discovered(6); return d.length ? d.map((x) => `<div class="insight" data-obj="${x.id}">
        <span class="ic"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="5" cy="5" r="2.4"/><circle cx="11" cy="11" r="2.4"/><path d="M6.7 6.7 9.3 9.3"/></svg></span>
        <p>${esc(x.text)}</p></div>`).join('') : `<div class="mute" style="font-size:13px">Connect a few things and patterns will surface here.</div>`; },
      timeline: () => { const ys = A.byType().filter((o) => o.year).sort((a, b) => a.year - b.year);
        if (!ys.length) return '<div class="mute">No dated items yet.</div>';
        const min = ys[0].year, max = ys[ys.length - 1].year, span = Math.max(1, max - min);
        return `<div style="position:relative;height:56px;border:1px solid var(--line2);border-radius:10px;background:rgba(255,255,255,.015)">
          ${ys.map((o) => { const p = ((o.year - min) / span) * 100; return `<span title="${esc(o.title)} (${o.year})" data-obj="${o.id}" style="position:absolute;left:${p}%;top:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:${A.type(o.type).color};cursor:pointer;box-shadow:0 0 0 3px rgba(0,0,0,.4)"></span>`; }).join('')}
          <span class="mono" style="position:absolute;left:8px;bottom:5px;font-size:10px;color:var(--mute2)">${min}</span>
          <span class="mono" style="position:absolute;right:8px;bottom:5px;font-size:10px;color:var(--mute2)">${max}</span>
        </div><div style="margin-top:8px"><a class="lbl" data-go="#/timeline" href="#/timeline">Open timeline →</a></div>`; },
    };

    main().innerHTML = `<div class="wrap">
      <div class="page-h"><div><div class="lbl">${esc(A.state.settings.name || 'My ATLAS')}</div>
        <h1>Welcome back.</h1><p>Everything you've collected, connected and reflected on — ${s.total} things and ${s.connections} connections so far.</p></div>
        <button class="btn" data-go="#/control"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4"/></svg> Customize dashboard</button>
      </div>
      <div class="dash">${widgets.map((w) => box(w, (render[w.id] || (() => '<div class="mute">—</div>'))())).join('')}</div>
    </div>`;
  };

  /* ============================ COLLECTION ============================ */
  const GROUPS = { knowledge: 'Knowledge', creation: 'Creation', life: 'My Life' };
  V.collection = function (opts) {
    // opts: {title, desc, types:[ids]|null, group}
    A.ui.mode = A.ui.mode || 'cards';
    let types = opts.types;
    if (opts.group) types = A.visibleTypes().filter((t) => t.group === opts.group).map((t) => t.id);
    let items = A.byType(types);
    if (A.ui.filter && A.ui.filter.size) items = items.filter((o) => A.ui.filter.has(o.type));
    if (A.ui.q) items = A.search(A.ui.q).filter((o) => !types || types.includes(o.type));
    items = items.sort((a, b) => (b.created || '').localeCompare(a.created || ''));

    const modes = [['cards', 'Cards'], ['list', 'List'], ['gallery', 'Gallery'], ['timeline', 'Timeline'], ['graph', 'Graph'], ['map', 'Map']];
    const typeChips = (types || A.visibleTypes().map((t) => t.id));
    const body = renderMode(items, A.ui.mode);

    main().innerHTML = `<div class="wrap">
      <div class="page-h"><div><h1>${esc(opts.title)}</h1><p>${esc(opts.desc || '')}</p></div>
        <div class="viewswitch">${modes.map(([m, l]) => `<button class="${A.ui.mode === m ? 'on' : ''}" data-mode="${m}">${l}</button>`).join('')}</div>
      </div>
      <div class="toolbar"><div class="chips">
        ${typeChips.map((id) => `<span class="chip ${A.ui.filter && A.ui.filter.has(id) ? 'on' : ''}" data-filter="${id}"><span class="dot" style="background:${A.type(id).color}"></span>${esc(A.type(id).plural)}</span>`).join('')}
      </div><div class="spacer" style="flex:1"></div><button class="btn sm" data-add>+ Add</button></div>
      <div id="collbody">${body}</div>
    </div>`;
    if (A.ui.mode === 'graph') V.mountGraph(items);
    if (A.ui.mode === 'map') V.mountMap(items);
  };
  function renderMode(items, mode) {
    if (!items.length) return `<div class="empty"><b>Nothing here yet</b>Add something and it will appear across every view.</div>`;
    if (mode === 'list') return `<div class="list">${items.map(V.row).join('')}</div>`;
    if (mode === 'gallery') return `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${items.map(galleryCell).join('')}</div>`;
    if (mode === 'timeline') return timelineHTML(items);
    if (mode === 'graph') return `<div id="graphview"></div><div class="hoverlabel" id="glabel"></div>`;
    if (mode === 'map') return `<div id="mapview"></div><div class="hoverlabel" id="mlabel"></div>`;
    return `<div class="grid">${items.map(V.card).join('')}</div>`;
  }
  const galleryCell = (o) => `<article class="card" data-obj="${o.id}" style="padding:0">
    <div style="height:120px;display:grid;place-items:center;background:linear-gradient(135deg,${A.type(o.type).color}22,transparent)">${A.icon(o.type, 34)}</div>
    <div style="padding:12px 14px"><h3 style="font-size:13.5px">${esc(o.title)}</h3><div class="sub" style="margin-top:3px">${esc(A.type(o.type).name)}</div></div></article>`;

  function timelineHTML(items) {
    const dated = items.filter((o) => o.year).sort((a, b) => b.year - a.year);
    const undated = items.filter((o) => !o.year);
    const byYear = {}; dated.forEach((o) => (byYear[o.year] = byYear[o.year] || []).push(o));
    let html = '<div class="tl">';
    Object.keys(byYear).sort((a, b) => b - a).forEach((y) => {
      html += `<div class="tlyear">${y}</div>` + byYear[y].map((o) => `<div class="tlitem" data-obj="${o.id}"><div class="t">${A.icon(o.type, 13)} ${esc(o.title)}</div><div class="s">${esc(A.type(o.type).name)}${o.subtitle ? ' · ' + esc(o.subtitle) : ''}</div></div>`).join('');
    });
    if (undated.length) html += `<div class="tlyear">Undated</div>` + undated.map((o) => `<div class="tlitem" data-obj="${o.id}"><div class="t">${A.icon(o.type, 13)} ${esc(o.title)}</div></div>`).join('');
    return html + '</div>';
  }
  V.timeline = () => V.collection({ title: 'Timeline', desc: 'Your world in chronological order.', types: null }) || (A.ui.mode = 'timeline');

  /* ============================ OBJECT DETAIL ============================ */
  V.detail = function (id) {
    const o = A.get(id); if (!o) { main().innerHTML = `<div class="wrap"><div class="empty">Not found.</div></div>`; return; }
    A.touch(id);
    const t = A.type(o.type);
    const conns = A.connectionsFor(id);
    const ctx = o.context || {};
    const foundBits = [];
    if (ctx.origin) foundBits.push(`<div class="foundrow"><span class="k">Origin</span> ${esc(ctx.origin)}</div>`);
    if (ctx.who) foundBits.push(`<div class="foundrow"><span class="k">Who</span> ${esc(ctx.who)}</div>`);
    if (ctx.where) foundBits.push(`<div class="foundrow"><span class="k">📍 Where</span> ${esc(ctx.where)}</div>`);
    if (ctx.when) foundBits.push(`<div class="foundrow"><span class="k">📅 When</span> ${esc(ctx.when)}</div>`);
    if (ctx.why) foundBits.push(`<div class="foundrow" style="width:100%"><span class="k">Why</span> ${esc(ctx.why)}</div>`);
    if (ctx.note) foundBits.push(`<div class="foundrow" style="width:100%"><span class="k">Note</span> ${esc(ctx.note)}</div>`);

    const fieldRows = (t.fields || []).map((f) => fieldRow(o, f)).join('');
    const groupedConns = () => conns.length ? conns.map((c) => `<div class="connrow" data-obj="${c.other.id}">
        ${A.icon(c.other.type, 15)}<div class="rel" style="width:120px">${esc(c.label)}</div>
        <div class="to">${esc(c.other.title)} <span class="st">· ${esc(A.type(c.other.type).name)}</span>${c.conn.state !== 'CONFIRMED' ? ' ' + stateTag(c.conn.state) : ''}</div>
        <span class="x" data-delconn="${c.conn.id}" title="Remove connection">✕</span></div>`).join('') : `<div class="mute" style="font-size:13px">No connections yet.</div>`;

    main().innerHTML = `<div class="wrap"><div class="detail">
      <div style="margin-bottom:14px"><a class="lbl" data-back href="javascript:void(0)">← back</a></div>
      <div class="dh">${tico(o.type, 'big')}<div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:2px"><span class="typeTag" style="color:${t.color}">${esc(t.name)}</span>${stateTag(o.state)}</div>
        <h1 contenteditable="true" data-edit="title" spellcheck="false">${esc(o.title)}</h1>
        <div class="sub" contenteditable="true" data-edit="subtitle" spellcheck="false">${esc(o.subtitle || '')}</div>
      </div>
      <div style="display:flex;gap:6px"><button class="btn sm" data-connect>+ Connect</button><button class="btn sm danger" data-delobj>Delete</button></div></div>

      ${foundBits.length || true ? `<div class="dsec"><div class="lbl">How I found this <span class="act"><button class="btn tiny" data-editctx>Edit</button></span></div>
        ${foundBits.length ? `<div class="foundcard"><div style="display:flex;flex-wrap:wrap;gap:8px 22px">${foundBits.join('')}</div></div>` : `<div class="mute" style="font-size:13px">How did this enter your life? <a data-editctx href="javascript:void(0)">Add the story →</a></div>`}</div>` : ''}

      <div class="dsec"><div class="lbl">My summary <span class="act">
        <button class="btn tiny" data-assist="summary">Generate draft</button>
        <button class="btn tiny" data-assist="improve-mySummary">Improve</button></div></div>
        <textarea class="editable" data-field="mySummary" data-ph="Your understanding of ${esc(o.title)} — in your own words." rows="4">${esc(o.mySummary || '')}</textarea>
      </div>

      <div class="dsec"><div class="lbl">My thoughts <span class="act"><button class="btn tiny" data-assist="thoughts">Draft</button></span></div>
        <textarea class="editable" data-field="myThoughts" data-ph="What you personally think — reactions, opinions, reflection." rows="3">${esc(o.myThoughts || '')}</textarea>
      </div>

      <div class="dsec ideas"><div class="lbl">Important ideas <span class="act"><button class="btn tiny" data-addidea>+ Add idea</button></span></div>
        <div id="ideaList">${(o.ideas || []).map((it, i) => `<div class="idea"><span class="b"></span><div style="flex:1" contenteditable="true" data-idea="${i}" spellcheck="false">${esc(it)}</div><span class="x" data-delidea="${i}" style="color:var(--mute2);cursor:pointer">✕</span></div>`).join('') || '<div class="mute" style="font-size:13px">Capture the ideas worth keeping.</div>'}</div>
      </div>

      ${(t.fields || []).length ? `<div class="dsec"><div class="lbl">Details</div><div>${fieldRows}</div></div>` : ''}

      <div class="dsec"><div class="lbl">Connections <span class="act"><button class="btn tiny" data-connect>+ Connect</button></span></div>
        <div>${groupedConns()}</div></div>

      <div class="dsec"><div class="lbl">Source</div>
        <div class="kv"><div class="k">Provenance</div><div class="v">${(A.STATES[o.state] || A.STATES.CONFIRMED).label}</div>
        ${o.source ? `<div class="k">From</div><div class="v">${esc(o.source.kind)}${o.source.ref ? ' — ' + esc(o.source.ref) : ''}</div>` : ''}
        <div class="k">Added</div><div class="v">${new Date(o.created).toLocaleDateString()}</div>
        <div class="k">Visibility</div><div class="v">Private</div></div>
      </div>
    </div></div>`;
    wireDetail(o);
  };

  function fieldRow(o, f) {
    const v = (o.fields || {})[f.id] || '';
    if (f.kind === 'rating') { return `<div class="field"><div class="k">${esc(f.label)}</div><div class="stars" data-rate="${f.id}">${[1, 2, 3, 4, 5].map((n) => `<span class="star ${n <= (+v || 0) ? 'on' : ''}" data-n="${n}">★</span>`).join('')}</div></div>`; }
    if (f.kind === 'status' || (f.kind === 'select' && f.opts)) {
      const opts = f.opts || []; return `<div class="field"><div class="k">${esc(f.label)}</div><select data-fld="${f.id}"><option value="">—</option>${opts.map((op) => `<option ${op === v ? 'selected' : ''}>${esc(op)}</option>`).join('')}</select></div>`;
    }
    const type = f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text';
    if (f.kind === 'longtext') return `<div class="field" style="grid-template-columns:130px 1fr;align-items:start"><div class="k">${esc(f.label)}</div><textarea class="editable" style="min-height:auto" rows="2" data-fld="${f.id}">${esc(v)}</textarea></div>`;
    return `<div class="field"><div class="k">${esc(f.label)}</div><input type="${type}" data-fld="${f.id}" value="${esc(v)}" placeholder="—"></div>`;
  }

  function wireDetail(o) {
    const root = main();
    const save = (patch) => A.updateObject(o.id, patch);
    root.querySelectorAll('[data-edit]').forEach((el) => el.addEventListener('blur', () => save({ [el.dataset.edit]: el.textContent.trim() })));
    root.querySelectorAll('textarea[data-field]').forEach((el) => el.addEventListener('input', () => save({ [el.dataset.field]: el.value })));
    root.querySelectorAll('[data-fld]').forEach((el) => el.addEventListener('change', () => { o.fields[el.dataset.fld] = el.value; save({ fields: o.fields }); }));
    root.querySelectorAll('[data-rate] .star').forEach((el) => el.addEventListener('click', () => { const id = el.closest('[data-rate]').dataset.rate; o.fields[id] = +el.dataset.n; save({ fields: o.fields }); V.detail(o.id); }));
    root.querySelectorAll('[data-idea]').forEach((el) => el.addEventListener('blur', () => { o.ideas[+el.dataset.idea] = el.textContent.trim(); save({ ideas: o.ideas.filter((x) => x) }); }));
    root.querySelectorAll('[data-delidea]').forEach((el) => el.addEventListener('click', () => { o.ideas.splice(+el.dataset.delidea, 1); save({ ideas: o.ideas }); V.detail(o.id); }));
    root.querySelector('[data-addidea]')?.addEventListener('click', () => { o.ideas = o.ideas || []; o.ideas.push('New idea'); save({ ideas: o.ideas }); V.detail(o.id); });
    root.querySelectorAll('[data-assist]').forEach((el) => el.addEventListener('click', () => A.app.assist(o, el.dataset.assist)));
    root.querySelectorAll('[data-editctx]').forEach((el) => el.addEventListener('click', () => A.app.editContext(o)));
    root.querySelectorAll('[data-connect]').forEach((el) => el.addEventListener('click', () => A.app.connect(o)));
    root.querySelectorAll('[data-delconn]').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); A.deleteConnection(el.dataset.delconn); V.detail(o.id); A.app.toast('Connection removed'); }));
    root.querySelector('[data-delobj]')?.addEventListener('click', () => { if (confirm('Delete "' + o.title + '"? This cannot be undone.')) { A.deleteObject(o.id); history.back(); A.app.toast('Deleted'); } });
    root.querySelector('[data-back]')?.addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/explore'));
  }

  /* ============================ ASK ============================ */
  V.ask = function () {
    main().innerHTML = `<div class="wrap"><div class="detail">
      <div class="page-h"><div><h1>Ask ATLAS</h1><p>Ask about your own world. This searches and traverses the connections in your ATLAS — it doesn't reach outside it.</p></div></div>
      <div class="search" style="height:46px"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#8A8A85" stroke-width="1.4"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
        <input id="askin" placeholder="e.g. What books were recommended by people I met in Kolkata?" autocomplete="off"></div>
      <div class="chips" style="margin-top:14px">${[
        'What books were recommended by people I met in Kolkata?',
        'What papers are connected to my current research?',
        'Which books have I not finished?',
        'Who introduced me to the most topics?',
        'What did I learn in Kyoto?',
        'Show me everything connected to walkability',
      ].map((q) => `<span class="chip" data-askq="${esc(q)}">${esc(q)}</span>`).join('')}</div>
      <div id="askout" style="margin-top:26px"></div>
    </div></div>`;
    const inp = document.getElementById('askin');
    const run = (q) => { inp.value = q; const r = A.AI.ask(q);
      document.getElementById('askout').innerHTML = `<div class="dsec" style="border-top:0;padding-top:0"><div class="foundcard" style="margin-bottom:16px"><div style="font-size:15px;font-weight:300">${esc(r.answer)}</div></div>
        <div class="grid">${r.results.map(V.card).join('')}</div></div>`; };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && inp.value.trim()) run(inp.value.trim()); });
    main().querySelectorAll('[data-askq]').forEach((el) => el.addEventListener('click', () => run(el.dataset.askq)));
    inp.focus();
  };

  /* ============================ GRAPH ============================ */
  V.mountGraph = function (items) {
    const host = document.getElementById('graphview'); if (!host || !window.d3) { if (host) host.innerHTML = '<div class="empty">Graph needs the visualization library (offline).</div>'; return; }
    const ids = new Set(items.map((o) => o.id));
    const nodes = items.map((o) => ({ id: o.id, o }));
    const links = A.state.connections.filter((c) => ids.has(c.from) && ids.has(c.to)).map((c) => ({ source: c.from, target: c.to, c }));
    const W = host.clientWidth, H = host.clientHeight;
    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 4]).on('zoom', (e) => g.attr('transform', e.transform)));
    const link = g.append('g').attr('stroke', 'rgba(255,255,255,.14)').selectAll('line').data(links).join('line').attr('stroke-width', 1);
    const node = g.append('g').selectAll('g').data(nodes).join('g').attr('class', 'node-c')
      .on('click', (e, d) => { location.hash = '#/object/' + d.id; })
      .on('mouseenter', (e, d) => { const l = document.getElementById('glabel'); l.textContent = d.o.title; l.style.display = 'block'; l.style.left = (e.offsetX + 12) + 'px'; l.style.top = (e.offsetY + 8) + 'px'; })
      .on('mouseleave', () => { document.getElementById('glabel').style.display = 'none'; });
    node.append('circle').attr('r', (d) => 7 + Math.min(6, A.connectionsFor(d.id).length)).attr('fill', '#0C0C0F').attr('stroke', (d) => A.type(d.o.type).color).attr('stroke-width', 1.6);
    node.append('text').text((d) => d.o.title.length > 22 ? d.o.title.slice(0, 21) + '…' : d.o.title).attr('x', 12).attr('y', 4).attr('fill', '#C9C8C3').attr('font-size', 11).attr('font-family', 'IBM Plex Sans');
    const sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id((d) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-240)).force('center', d3.forceCenter(W / 2, H / 2)).force('collide', d3.forceCollide(34));
    sim.on('tick', () => { link.attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y).attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`); });
    node.call(d3.drag().on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; }).on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
  };

  /* ============================ MAP ============================ */
  V.mountMap = function (items) {
    const host = document.getElementById('mapview'); if (!host || !window.d3 || !window.topojson) { if (host) host.innerHTML = '<div class="empty">Map needs the visualization library (offline).</div>'; return; }
    const geoObjs = items.filter((o) => (o.places || []).some((p) => p.lat != null));
    const W = host.clientWidth, H = host.clientHeight;
    const svg = d3.select(host).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const proj = d3.geoNaturalEarth1().fitExtent([[16, 20], [W - 16, H - 16]], { type: 'Sphere' });
    const path = d3.geoPath(proj);
    const gGeo = svg.append('g'), gNode = svg.append('g');
    svg.call(d3.zoom().scaleExtent([1, 12]).on('zoom', (e) => { gGeo.attr('transform', e.transform); gNode.attr('transform', e.transform); gNode.selectAll('circle').attr('r', 5 / Math.sqrt(e.transform.k)); }));
    const drawPins = () => {
      const pins = [];
      geoObjs.forEach((o) => (o.places || []).forEach((p) => { if (p.lat != null) { const xy = proj([p.lng, p.lat]); if (xy) pins.push({ o, xy }); } }));
      gNode.selectAll('g').data(pins).join('g').attr('transform', (d) => `translate(${d.xy[0]},${d.xy[1]})`).attr('class', 'node-c')
        .on('click', (e, d) => { location.hash = '#/object/' + d.o.id; })
        .on('mouseenter', (e, d) => { const l = document.getElementById('mlabel'); l.textContent = d.o.title; l.style.display = 'block'; l.style.left = (e.offsetX + 12) + 'px'; l.style.top = (e.offsetY + 8) + 'px'; })
        .on('mouseleave', () => { document.getElementById('mlabel').style.display = 'none'; })
        .call((s) => { s.append('circle').attr('r', 6).attr('fill', '#0C0C0F').attr('stroke', (d) => A.type(d.o.type).color).attr('stroke-width', 1.6);
          s.append('circle').attr('r', 2.2).attr('fill', (d) => A.type(d.o.type).color); });
    };
    d3.json('basemap/countries-india-pov.json').then((topo) => {
      const land = topojson.feature(topo, topo.objects.countries);
      gGeo.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,.10)');
      gGeo.append('path').datum(d3.geoGraticule10()).attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,.035)');
      gGeo.append('path').attr('d', path(land)).attr('fill', '#161719').attr('stroke', 'rgba(255,255,255,.10)').attr('stroke-width', 0.6);
      drawPins();
    }).catch(() => { drawPins(); const n = document.createElement('div'); n.className = 'hoverlabel'; n.style.cssText = 'display:block;left:12px;bottom:12px;top:auto;color:#E5A06B'; n.textContent = 'Basemap unavailable — serve over HTTP to see outlines.'; host.appendChild(n); });
    if (!geoObjs.length) host.insertAdjacentHTML('beforeend', '<div class="hoverlabel" style="display:block;left:50%;top:14px;transform:translateX(-50%)">No items here have a location yet.</div>');
  };

  /* ============================ SETTINGS ============================ */
  V.settings = function () {
    const s = A.state.settings;
    main().innerHTML = `<div class="wrap"><div class="detail">
      <div class="page-h"><div><h1>Settings</h1><p>Your ATLAS lives in this browser. Export a copy any time.</p></div></div>
      <div class="dsec" style="border-top:0"><div class="lbl">Name</div>
        <input class="editable" id="setname" style="min-height:auto" value="${esc(s.name || 'My ATLAS')}"></div>
      <div class="dsec"><div class="lbl">Your data</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="exp">Export JSON</button>
          <button class="btn sm" id="imp">Import JSON</button>
          <button class="btn sm danger" id="rst">Reset to sample</button></div>
        <input type="file" id="impf" accept="application/json" style="display:none">
        <p class="mute" style="font-size:12.5px;margin-top:12px">Stored locally (no server, no sync). Clearing browser data erases it — keep an export.</p>
      </div>
    </div></div>`;
    document.getElementById('setname').addEventListener('input', (e) => { s.name = e.target.value; A.save(); document.querySelectorAll('[data-brandname]').forEach(n => n.textContent = s.name); });
    document.getElementById('exp').onclick = () => A.app.download('atlas-export.json', A.exportJSON());
    document.getElementById('imp').onclick = () => document.getElementById('impf').click();
    document.getElementById('impf').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { A.importJSON(r.result); A.app.toast('Imported'); location.hash = '#/home'; A.app.route(); } catch (err) { A.app.toast('Could not import: ' + err.message); } }; r.readAsText(f); };
    document.getElementById('rst').onclick = () => { if (confirm('Reset to the sample ATLAS? Your current data will be replaced.')) { A.reset(); location.hash = '#/home'; A.app.route(); A.app.toast('Reset to sample'); } };
  };
})();
