/* ATLAS — app shell: routing, navigation, the "+ Add to ATLAS" flow,
   connections, personal context, and the Control Center. */
(function () {
  const A = (window.A = window.A || {});
  const V = A.views; const esc = A.esc;
  const app = (A.app = {});
  A.ui = { mode: 'cards', filter: new Set(), q: '', lastPath: '', lastOpts: null };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- toast / download ---------------- */
  let tT;
  app.toast = (msg) => { const t = $('#toast'); t.innerHTML = `<svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="#FF7A33" stroke-width="1.6"><path d="M2 6.2 4.6 8.8 10 3.4"/></svg><span>${esc(msg)}</span>`; t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 3200); };
  app.download = (name, text) => { const b = new Blob([text], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); };

  /* ---------------- modal ---------------- */
  const modal = () => $('#modal'), scrim = () => $('#scrim');
  app.openModal = (html) => { modal().innerHTML = html; modal().classList.add('on'); scrim().classList.add('on'); };
  app.closeModal = () => { modal().classList.remove('on'); scrim().classList.remove('on'); modal().innerHTML = ''; };

  /* ---------------- navigation ---------------- */
  const NAV = [
    { g: 'Home', items: [['#/home', 'Home', 'home'], ['#/explore', 'Explore', 'explore']] },
    { g: 'My world', items: [['#/life', 'My Life', 'person'], ['#/knowledge', 'Knowledge', 'book'], ['#/projects', 'Projects', 'project']] },
    { g: 'Views', items: [['#/connections', 'Connections', 'topic'], ['#/timeline', 'Timeline', 'event'], ['#/map', 'Map', 'place'], ['#/gallery', 'Gallery', 'photo']] },
  ];
  const NAVICON = {
    home: '<path d="M2.5 7 8 2.5 13.5 7M4 6v7.5h8V6"/>', explore: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>',
    person: A.GLYPH.person, book: A.GLYPH.book, project: A.GLYPH.project, topic: '<circle cx="4.5" cy="4.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/><path d="M6 6l4 4"/>',
    event: A.GLYPH.event, place: A.GLYPH.place, photo: A.GLYPH.photo,
  };
  function buildNav() {
    const nav = $('.nav');
    const stat = A.stats();
    const ct = { life: A.byType(A.visibleTypes().filter(t => t.group === 'life').map(t => t.id)).length,
      knowledge: A.byType(A.visibleTypes().filter(t => t.group === 'knowledge').map(t => t.id)).length,
      projects: A.byType(['project', 'idea']).length, explore: stat.total };
    let html = '';
    NAV.forEach((grp) => {
      html += `<div class="grp lbl">${grp.g}</div>`;
      grp.items.forEach(([hash, label, ico]) => {
        const key = hash.slice(2); const c = ct[key];
        html += `<div class="navitem" data-go="${hash}" data-navk="${hash}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C9C8C3" stroke-width="1.2">${NAVICON[ico] || ''}</svg><span>${label}</span>${c != null ? `<span class="ct">${c}</span>` : ''}</div>`;
      });
    });
    html += `<div class="sep"></div><div class="add"><button class="btn-accent" data-add><svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" stroke-width="1.7"><path d="M6 1v10M1 6h10"/></svg> Add to ATLAS</button></div>`;
    html += `<div class="add"><button class="btn" style="width:100%;justify-content:center" data-go="#/ask"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg> Ask ATLAS</button></div>`;
    html += `<div class="sep"></div><div class="navitem" data-go="#/control"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C9C8C3" stroke-width="1.2"><circle cx="8" cy="8" r="2"/><path d="M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4"/></svg><span>Control Center</span></div>`;
    html += `<div class="navitem" data-go="#/settings"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#C9C8C3" stroke-width="1.2"><path d="M3 4.5h10M3 8h10M3 11.5h10"/></svg><span>Settings</span></div>`;
    nav.innerHTML = html;
  }
  function setActiveNav(hash) {
    const base = '#/' + (hash.slice(2).split('/')[0] || 'home');
    $$('.navitem').forEach((n) => n.classList.toggle('active', n.dataset.navk === base));
  }
  const closeDrawer = () => $('.nav').classList.remove('open');

  /* ---------------- router ---------------- */
  app.route = function () {
    const hash = location.hash || '#/home';
    const parts = hash.slice(2).split('?')[0].split('/').filter(Boolean);
    setActiveNav(hash); closeDrawer();
    const p0 = parts[0] || 'home';
    if (p0 === 'home') return V.home();
    if (p0 === 'object') return V.detail(parts[1]);
    if (p0 === 'ask') return V.ask();
    if (p0 === 'settings') return V.settings();
    if (p0 === 'control') return controlCenter(hash.split('?')[1] || '');
    let opts = null, mode = null;
    if (p0 === 'explore') opts = { title: 'Explore', desc: 'Everything in your ATLAS.', types: null };
    else if (p0 === 'life') opts = { title: 'My Life', desc: 'People, places, experiences and events.', group: 'life' };
    else if (p0 === 'knowledge') opts = { title: 'Knowledge', desc: 'Books, papers, articles, notes and ideas.', group: 'knowledge' };
    else if (p0 === 'projects') opts = { title: 'Projects & Ideas', desc: 'What you are making and thinking.', types: ['project', 'idea'] };
    else if (p0 === 'type') { const t = A.type(parts[1]); opts = { title: t.plural, desc: '', types: [parts[1]] }; }
    else if (p0 === 'connections') { opts = { title: 'Connections', desc: 'How everything in your world relates. Drag to explore.', types: null }; mode = 'graph'; }
    else if (p0 === 'timeline') { opts = { title: 'Timeline', desc: 'Your world in chronological order.', types: null }; mode = 'timeline'; }
    else if (p0 === 'map') { opts = { title: 'Map', desc: 'Everything you’ve placed on the earth.', types: null }; mode = 'map'; }
    else if (p0 === 'gallery') { opts = { title: 'Gallery', desc: 'Visual browsing.', types: null }; mode = 'gallery'; }
    else opts = { title: 'Explore', types: null };
    const pathId = p0 + (parts[1] || '');
    const changed = A.ui.lastPath !== pathId; A.ui.lastPath = pathId;
    if (changed) { A.ui.filter = new Set(); A.ui.q = ''; A.ui.mode = mode || 'cards'; }
    else if (mode) A.ui.mode = mode;
    A.ui.lastOpts = opts;
    V.collection(opts);
  };
  app.renderCollection = () => V.collection(A.ui.lastOpts);

  /* ---------------- global click delegation ---------------- */
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go) { location.hash = go.dataset.go; return; }
    const obj = e.target.closest('[data-obj]'); if (obj && !e.target.closest('[data-delconn],[data-delidea],[data-x]')) { location.hash = '#/object/' + obj.dataset.obj; return; }
    const add = e.target.closest('[data-add]'); if (add) { openAdd(); return; }
    const mode = e.target.closest('[data-mode]'); if (mode) { A.ui.mode = mode.dataset.mode; app.renderCollection(); return; }
    const flt = e.target.closest('[data-filter]'); if (flt) { const id = flt.dataset.filter; A.ui.filter.has(id) ? A.ui.filter.delete(id) : A.ui.filter.add(id); app.renderCollection(); return; }
    const mb = e.target.closest('[data-menu]'); if (mb) { $('.nav').classList.toggle('open'); return; }
  });
  scrim().addEventListener('click', app.closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { app.closeModal(); $('#results').classList.remove('on'); } if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && !document.activeElement.isContentEditable) { e.preventDefault(); $('#gsearch').focus(); } });

  /* ============================ ADD FLOW ============================ */
  let ADD;
  function openAdd(prefill) {
    ADD = { step: 'input', raw: prefill || '', guess: null, chosen: new Set(), state: 'CONFIRMED', context: {} };
    renderAdd(); scrim().classList.add('on');
  }
  app.openAdd = openAdd;
  function renderAdd() {
    if (ADD.step === 'input') return addInput();
    if (ADD.step === 'think') return addThink();
    if (ADD.step === 'confirm') return addConfirm();
    if (ADD.step === 'manual') return addManual();
  }
  const addHead = (sub) => `<div class="mh"><div><span class="lbl">Add to ATLAS</span>${sub ? `<div class="mute" style="font-size:11.5px;margin-top:3px">${esc(sub)}</div>` : ''}</div>
    <div style="display:flex;gap:8px"><button class="btn sm" data-manual>Enter manually</button><button class="iconbtn" data-close style="width:30px;height:30px">✕</button></div></div>`;
  function wireHead() { $('[data-close]', modal())?.addEventListener('click', app.closeModal); $('[data-manual]', modal())?.addEventListener('click', () => { ADD.step = ADD.step === 'manual' ? 'input' : 'manual'; renderAdd(); }); }

  function addInput() {
    app.openModal(addHead('Paste a link, a book title, a PDF name, or describe an experience. No category needed.') +
      `<input class="bigin" id="raw" placeholder="Anything — “The Design of Everyday Things”, a URL, “I visited Kyoto in 2024”…" value="${esc(ADD.raw)}">
      <div style="padding:2px 18px 14px" class="chips">${['The Design of Everyday Things', 'I met Rahul in Kolkata', 'https://example.news/city-transit', 'sidewalk-access.pdf', 'idea: walkable campus'].map(s => `<span class="chip" data-eg="${esc(s)}">${esc(s)}</span>`).join('')}</div>
      <div class="mfoot"><span class="mute" style="font-size:11.5px">Nothing is saved until you confirm.</span><button class="btn-accent" data-go2>Understand this</button></div>`);
    wireHead();
    const raw = $('#raw', modal()); raw.focus();
    raw.oninput = () => ADD.raw = raw.value;
    raw.onkeydown = (e) => { if (e.key === 'Enter') go2(); };
    $('[data-go2]', modal()).onclick = go2;
    $$('[data-eg]', modal()).forEach((el) => el.onclick = () => { ADD.raw = el.dataset.eg; raw.value = ADD.raw; go2(); });
    function go2() { if (ADD.raw.trim()) { ADD.step = 'think'; renderAdd(); } }
  }
  function addThink() {
    app.openModal(addHead('Reading your input') + `<div style="padding:16px 0 8px">${A.AI.STEPS.map((s, i) => `<div class="step" id="s${i}"><span class="spin" style="visibility:hidden"></span><span>${s}</span></div>`).join('')}</div>
      <div class="mfoot"><span class="mute" style="font-size:11.5px">Heuristic engine (no data leaves your browser).</span><button class="btn sm" data-close>Cancel</button></div>`);
    wireHead(); $('[data-close]', modal()).onclick = app.closeModal;
    A.AI.STEPS.forEach((s, i) => setTimeout(() => { const el = $('#s' + i, modal()); if (!el) return; el.className = 'step doing'; el.querySelector('.spin').style.visibility = 'visible';
      setTimeout(() => { if (!$('#s' + i, modal())) return; el.className = 'step done'; el.querySelector('.spin').outerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#6DD3A7" stroke-width="1.6"><path d="M2 6.2 4.6 8.8 10 3.4"/></svg>'; }, 200); }, i * 230));
    setTimeout(() => { if (ADD.step !== 'think') return; ADD.guess = A.AI.classify(ADD.raw);
      ADD.chosen = new Set(ADD.guess.suggested.map((s, i) => s.conf >= 0.85 ? i : null).filter((i) => i !== null));
      ADD.step = 'confirm'; renderAdd(); }, A.AI.STEPS.length * 230 + 360);
  }
  function addConfirm() {
    const g = ADD.guess; const t = A.type(g.type);
    const fields = (t.fields || []).map((f) => `<label class="fld" style="padding:0 18px 10px"><span class="lbl">${esc(f.label)}</span>
      <input data-af="${f.id}" value="${esc((g.fields || {})[f.id] || '')}" placeholder="—"></label>`).join('');
    app.openModal(addHead('Nothing is saved until you confirm.') +
      `<div style="padding:16px 18px 6px;display:flex;gap:14px;align-items:flex-start">
        <div class="tico big" style="width:44px;height:44px;border-color:${t.color}44">${A.icon(g.type, 20)}</div>
        <div style="flex:1;min-width:0"><span class="lbl">I think this is a ${esc(t.name)} · ${Math.round(g.conf * 100)}% confident</span>
          <input id="gt" value="${esc(g.title)}" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);color:var(--ink);font:300 19px/1.3 var(--sans);padding:7px 0 5px;outline:0">
          <input id="gs" value="${esc(g.subtitle || '')}" style="width:100%;background:none;border:0;color:var(--mute);font-size:12.5px;padding:6px 0;outline:0" placeholder="subtitle">
        </div>
        <select id="gtype" title="Change type" style="background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;color:var(--ink2);font-size:12px;padding:8px">${A.visibleTypes().map((tt) => `<option value="${tt.id}" ${tt.id === g.type ? 'selected' : ''}>${esc(tt.name)}</option>`).join('')}</select>
      </div>
      ${g.note ? `<div class="mute" style="padding:0 18px 8px;font-size:12px">${esc(g.note)}</div>` : ''}
      <div style="padding:6px 18px 4px" class="lbl">Details</div>${fields}
      ${g.suggested.length ? `<div style="padding:8px 18px 4px" class="lbl">Suggested connections · pick what's true</div>
        ${g.suggested.map((s, i) => `<div class="pickline ${ADD.chosen.has(i) ? 'on' : ''}" data-pick="${i}"><span class="box"></span>
          <div><div style="font-size:13.5px">${esc(s.otherTitle)} <span class="mute" style="font-size:11px">· ${esc(A.type(s.otherType).name)}${s.otherId ? '' : ' · new'}</span></div>
          <div style="margin-top:3px"><span class="rel mono" style="font-size:10px;letter-spacing:.1em;color:var(--mute)">${esc(A.connType(s.rel).label)}</span> <span class="tag ai">ai suggestion</span></div></div></div>`).join('')}` : ''}
      <div style="padding:12px 18px 4px" class="lbl">How I found this <span class="mute" style="text-transform:none;letter-spacing:0;font-size:11px">— optional, makes it personal</span></div>
      <div class="grid2"><label class="fld"><span class="lbl">Origin</span><select id="cx-origin"><option value="">—</option>${ORIGINS.map((o) => `<option ${ADD.context.origin === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="fld"><span class="lbl">Who</span><input id="cx-who" placeholder="e.g. Rahul" value="${esc(ADD.context.who || '')}"></label></div>
      <div class="grid2"><label class="fld"><span class="lbl">Where</span><input id="cx-where" placeholder="e.g. Kolkata" value="${esc(ADD.context.where || '')}"></label>
        <label class="fld"><span class="lbl">When</span><input id="cx-when" type="date" value="${esc(ADD.context.when || '')}"></label></div>
      <label class="fld"><span class="lbl">Why / context</span><textarea id="cx-why" rows="2" placeholder="Why does this matter to you?">${esc(ADD.context.why || '')}</textarea></label>
      <div class="mfoot"><div style="display:flex;gap:8px;align-items:center"><button class="btn sm" data-back>Back</button>
        <span class="lbl" style="text-transform:none;letter-spacing:0">Keep as</span>
        <select id="gstate" style="background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:8px;color:var(--ink2);font-size:12px;padding:7px">${Object.values(A.STATES).map((s) => `<option value="${s.id}" ${s.id === ADD.state ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
        <button class="btn-accent" data-save>Add to ATLAS</button></div>`);
    wireHead();
    $('[data-back]', modal()).onclick = () => { ADD.step = 'input'; renderAdd(); };
    $('#gtype', modal()).onchange = (e) => { ADD.guess.type = e.target.value; renderAdd(); };
    $$('[data-pick]', modal()).forEach((el) => el.onclick = () => { const i = +el.dataset.pick; ADD.chosen.has(i) ? ADD.chosen.delete(i) : ADD.chosen.add(i); el.classList.toggle('on'); });
    $('[data-save]', modal()).onclick = saveAdd;
  }
  const ORIGINS = ['Someone recommended it', 'I discovered it', 'I read it', 'I visited it', 'Someone told me about it', 'I saw it in the news', 'It came from my research', 'I created it', 'It happened to me', 'Imported from another source'];

  function collectContext() {
    const c = {};
    ['origin', 'who', 'where', 'when', 'why'].forEach((k) => { const el = $('#cx-' + k, modal()); if (el && el.value.trim()) c[k] = el.value.trim(); });
    return c;
  }
  function saveAdd() {
    const g = ADD.guess; const t = A.type(g.type);
    const fields = {}; $$('[data-af]', modal()).forEach((el) => { if (el.value.trim()) fields[el.dataset.af] = el.value.trim(); });
    const context = collectContext();
    const yr = +(fields.year) || (String(context.when || '').match(/\d{4}/) || [])[0] || null;
    const obj = A.addObject({
      type: g.type, title: ($('#gt', modal()).value.trim() || g.title), subtitle: $('#gs', modal()).value.trim(),
      fields, places: g.places || [], year: yr ? +yr : undefined, context,
      state: $('#gstate', modal()).value, source: { kind: context.origin || 'Added', ref: context.who || '' },
    });
    // accepted connections
    [...ADD.chosen].forEach((i) => { const s = g.suggested[i]; let toId = s.otherId;
      if (!toId) { const other = A.addObject({ type: s.otherType, title: s.otherTitle, state: 'SOURCE' }); toId = other.id; }
      A.addConnection({ from: obj.id, to: toId, type: s.rel, state: 'CONFIRMED' }); });
    // recommendation / origin → auto connection from a named person
    applyContextConnection(obj, context);
    app.closeModal(); app.toast(`"${obj.title}" added to ATLAS`);
    buildNav(); location.hash = '#/object/' + obj.id;
  }
  function applyContextConnection(obj, context) {
    if (!context.who) return;
    let person = A.state.objects.find((o) => o.type === 'person' && o.title.toLowerCase() === context.who.toLowerCase());
    if (!person) person = A.addObject({ type: 'person', title: context.who, state: 'CONFIRMED', fields: context.where ? { metwhere: context.where } : {} });
    const rel = /recommend/i.test(context.origin || '') ? 'recommended' : /told/i.test(context.origin || '') ? 'discovered_through' : 'related_to';
    A.addConnection({ from: person.id, to: obj.id, type: rel, state: 'CONFIRMED', meta: { location: context.where || '', date: context.when || '', context: context.why || '' } });
  }

  function addManual() {
    const typeSel = A.visibleTypes();
    app.openModal(addHead('Manual entry — you type it, no AI.') +
      `<div class="grid2"><label class="fld"><span class="lbl">Type</span><select id="mtype">${typeSel.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
        <label class="fld"><span class="lbl">Title</span><input id="mtitle" placeholder="What is it?"></label></div>
      <div id="mfields"></div>
      <div style="padding:6px 18px 4px" class="lbl">How I found this — optional</div>
      <div class="grid2"><label class="fld"><span class="lbl">Origin</span><select id="cx-origin"><option value="">—</option>${ORIGINS.map((o) => `<option>${o}</option>`).join('')}</select></label>
        <label class="fld"><span class="lbl">Who</span><input id="cx-who" placeholder="Person"></label></div>
      <div class="grid2"><label class="fld"><span class="lbl">Where</span><input id="cx-where"></label><label class="fld"><span class="lbl">When</span><input id="cx-when" type="date"></label></div>
      <label class="fld"><span class="lbl">Why / context</span><textarea id="cx-why" rows="2"></textarea></label>
      <div class="mfoot"><button class="btn sm" data-back>Back</button><button class="btn-accent" data-msave>Add to ATLAS</button></div>`);
    wireHead();
    const renderFields = () => { const t = A.type($('#mtype', modal()).value); $('#mfields', modal()).innerHTML = (t.fields || []).map((f) => `<label class="fld" style="padding:0 18px 10px"><span class="lbl">${esc(f.label)}</span><input data-mf="${f.id}" placeholder="—"></label>`).join(''); };
    renderFields(); $('#mtype', modal()).onchange = renderFields;
    $('[data-back]', modal()).onclick = () => { ADD.step = 'input'; renderAdd(); };
    $('[data-msave]', modal()).onclick = () => {
      const title = $('#mtitle', modal()).value.trim(); if (!title) { app.toast('Give it a title.'); return; }
      const type = $('#mtype', modal()).value; const fields = {}; $$('[data-mf]', modal()).forEach((el) => { if (el.value.trim()) fields[el.dataset.mf] = el.value.trim(); });
      const context = collectContext();
      const yr = +(fields.year) || (String(context.when || '').match(/\d{4}/) || [])[0] || null;
      const obj = A.addObject({ type, title, fields, context, year: yr ? +yr : undefined, state: 'CONFIRMED', source: { kind: context.origin || 'Manual entry', ref: context.who || '' } });
      applyContextConnection(obj, context);
      app.closeModal(); app.toast(`"${title}" added`); buildNav(); location.hash = '#/object/' + obj.id;
    };
  }

  /* ============================ CONNECT + CONTEXT ============================ */
  app.connect = function (obj) {
    const others = A.state.objects.filter((o) => o.id !== obj.id);
    app.openModal(`<div class="mh"><span class="lbl">Add a connection</span><button class="iconbtn" data-close style="width:30px;height:30px">✕</button></div>
      <div style="padding:16px 18px"><div style="font-size:14px;margin-bottom:12px">${esc(obj.title)} <span class="mono" id="cdir" style="color:var(--accent);font-size:12px">${esc(A.connType('related_to').label)}</span> …</div>
        <div class="grid2"><label class="fld" style="padding:0 0 12px"><span class="lbl">Relationship</span><select id="crel">${A.state.connTypes.filter((c) => !c.hidden).map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>
          <label class="fld" style="padding:0 0 12px"><span class="lbl">Connect to</span><input id="csearch" placeholder="Search your ATLAS…" autocomplete="off"></label></div>
        <div id="chits" style="margin:-4px 0 12px;max-height:180px;overflow-y:auto"></div>
        <div style="padding-top:6px" class="lbl">Context — optional (for recommendations etc.)</div>
        <div class="grid2"><label class="fld" style="padding:8px 0 0"><span class="lbl">Where</span><input id="cmloc"></label><label class="fld" style="padding:8px 0 0"><span class="lbl">When</span><input id="cmdate" type="date"></label></div>
        <label class="fld" style="padding:8px 0 0"><span class="lbl">Note / context</span><textarea id="cmctx" rows="2"></textarea></label>
      </div>
      <div class="mfoot"><span class="mute" id="cpick" style="font-size:12px">Pick something to connect.</span><button class="btn-accent" data-csave disabled style="opacity:.5">Connect</button></div>`);
    $('[data-close]', modal()).onclick = app.closeModal;
    let target = null;
    const relSel = $('#crel', modal()); relSel.onchange = () => $('#cdir', modal()).textContent = A.connType(relSel.value).label;
    const search = $('#csearch', modal()), hits = $('#chits', modal());
    const renderHits = () => { const q = search.value.trim().toLowerCase(); const list = (q ? others.filter((o) => o.title.toLowerCase().includes(q)) : others).slice(0, 8);
      hits.innerHTML = list.map((o) => `<div class="connrow" data-pick="${o.id}" style="margin-bottom:6px">${A.icon(o.type, 14)}<div class="to">${esc(o.title)} <span class="st">· ${esc(A.type(o.type).name)}</span></div></div>`).join('') +
        (q ? `<div class="connrow" data-new style="margin-bottom:6px;border-style:dashed">＋<div class="to">Create new “${esc(search.value.trim())}”</div></div>` : '');
      $$('[data-pick]', hits).forEach((el) => el.onclick = () => { target = { id: el.dataset.pick }; $('#cpick', modal()).textContent = 'Connecting to ' + A.get(el.dataset.pick).title; enable(); });
      $('[data-new]', hits)?.addEventListener('click', () => { app.openNewTargetPrompt(search.value.trim(), (o) => { target = { id: o.id }; $('#cpick', modal()).textContent = 'Connecting to ' + o.title; renderHits(); enable(); }); });
    };
    const enable = () => { const b = $('[data-csave]', modal()); b.disabled = !target; b.style.opacity = target ? 1 : .5; };
    search.oninput = renderHits; renderHits();
    $('[data-csave]', modal()).onclick = () => { if (!target) return; A.addConnection({ from: obj.id, to: target.id, type: relSel.value, state: 'CONFIRMED', meta: { location: $('#cmloc', modal()).value, date: $('#cmdate', modal()).value, context: $('#cmctx', modal()).value } }); app.closeModal(); app.toast('Connected'); V.detail(obj.id); };
  };
  app.openNewTargetPrompt = function (title, cb) {
    const cur = modal().innerHTML; // simple type picker overlay via prompt-like modal reuse
    const t = prompt('Create “' + title + '” as which type? (book, paper, person, place, idea, project, note…)', 'note');
    if (!t) return; const type = A.type(t.trim().toLowerCase()).id;
    const o = A.addObject({ type, title, state: 'CONFIRMED' }); cb(o);
  };

  app.editContext = function (obj) {
    const c = obj.context || {};
    app.openModal(`<div class="mh"><span class="lbl">How I found this</span><button class="iconbtn" data-close style="width:30px;height:30px">✕</button></div>
      <div class="grid2"><label class="fld"><span class="lbl">Origin</span><select id="cx-origin"><option value="">—</option>${ORIGINS.map((o) => `<option ${c.origin === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
        <label class="fld"><span class="lbl">Who</span><input id="cx-who" value="${esc(c.who || '')}"></label></div>
      <div class="grid2"><label class="fld"><span class="lbl">Where</span><input id="cx-where" value="${esc(c.where || '')}"></label><label class="fld"><span class="lbl">When</span><input id="cx-when" type="date" value="${esc(c.when || '')}"></label></div>
      <label class="fld"><span class="lbl">Why</span><textarea id="cx-why" rows="2">${esc(c.why || '')}</textarea></label>
      <label class="fld"><span class="lbl">Personal note</span><textarea id="cx-note" rows="2">${esc(c.note || '')}</textarea></label>
      <div class="mfoot"><span class="mute" style="font-size:11.5px">A named person can become a connection.</span><button class="btn-accent" data-cxsave>Save</button></div>`);
    $('[data-close]', modal()).onclick = app.closeModal;
    $('[data-cxsave]', modal()).onclick = () => {
      const nc = {}; ['origin', 'who', 'where', 'when', 'why', 'note'].forEach((k) => { const el = $('#cx-' + k, modal()); if (el && el.value.trim()) nc[k] = el.value.trim(); });
      const hadWho = (obj.context || {}).who; A.updateObject(obj.id, { context: nc });
      if (nc.who && nc.who !== hadWho) applyContextConnection(obj, nc);
      app.closeModal(); V.detail(obj.id); app.toast('Saved');
    };
  };

  app.assist = function (obj, kind) {
    obj._assistField = kind.startsWith('improve-') ? kind.split('-')[1] : (kind === 'summary' ? 'mySummary' : kind === 'thoughts' ? 'myThoughts' : '');
    const draft = A.AI.assist(kind.startsWith('improve') ? 'improve' : kind, obj);
    const field = obj._assistField; const current = obj[field] || '';
    app.openModal(`<div class="mh"><span class="lbl">AI draft — you decide</span><button class="iconbtn" data-close style="width:30px;height:30px">✕</button></div>
      <div style="padding:16px 18px"><p class="mute" style="font-size:12px;margin-top:0">A suggestion. It won't overwrite your writing unless you say so.</p>
        <textarea class="editable" id="draft" rows="5">${esc(draft || current)}</textarea></div>
      <div class="mfoot"><button class="btn sm" data-close>Discard</button><div style="display:flex;gap:8px">
        ${current ? '<button class="btn sm" data-append>Append to mine</button>' : ''}
        <button class="btn-accent" data-replace>Use this</button></div></div>`);
    $$('[data-close]', modal()).forEach((b) => b.onclick = app.closeModal);
    $('[data-replace]', modal()).onclick = () => { A.updateObject(obj.id, { [field]: $('#draft', modal()).value }); app.closeModal(); V.detail(obj.id); app.toast('Updated'); };
    $('[data-append]', modal())?.addEventListener('click', () => { A.updateObject(obj.id, { [field]: (current + '\n\n' + $('#draft', modal()).value).trim() }); app.closeModal(); V.detail(obj.id); });
  };

  /* ============================ CONTROL CENTER ============================ */
  function controlCenter(query) {
    const tab = (query.match(/tab=(\w+)/) || [, 'types'])[1];
    const tabs = [['types', 'Object types'], ['fields', 'Custom fields'], ['connections', 'Connections'], ['dashboard', 'Dashboard'], ['data', 'Data']];
    let body = '';
    if (tab === 'types') body = ccTypes();
    else if (tab === 'fields') body = ccFields();
    else if (tab === 'connections') body = ccConns();
    else if (tab === 'dashboard') body = ccDash();
    else body = ccData();
    $('.main').innerHTML = `<div class="wrap"><div class="detail" style="max-width:760px">
      <div class="page-h"><div><h1>Control Center</h1><p>Make ATLAS work the way your mind does. Everything here is yours to change.</p></div></div>
      <div class="cc-tabs">${tabs.map(([id, l]) => `<button class="${tab === id ? 'on' : ''}" data-go="#/control?tab=${id}">${l}</button>`).join('')}</div>
      <div id="ccbody">${body}</div></div></div>`;
    ccWire(tab);
  }
  const GLYPHKEYS = Object.keys(A.GLYPH);
  function ccTypes() {
    return A.state.types.map((t, i) => `<div class="cc-row" data-tid="${t.id}"><span class="grab">⋮⋮</span>
      <span class="swatch" style="background:${t.color}"></span>${A.icon(t.id, 15)}
      <input class="name" value="${esc(t.name)}" data-tname="${t.id}">
      <span class="mute" style="font-size:11px">${(t.fields || []).length} fields · ${A.byType([t.id]).length} items</span>
      <span class="spacer"></span>
      <button class="btn tiny" data-up="${i}">↑</button><button class="btn tiny" data-down="${i}">↓</button>
      <button class="btn tiny" data-hide="${t.id}">${t.hidden ? 'Show' : 'Hide'}</button>
      <button class="btn tiny danger" data-deltype="${t.id}">Delete</button></div>`).join('') +
      `<div class="miniform"><input id="ntname" placeholder="New type name (e.g. Recipes)"><input id="ntcolor" type="color" value="#FF7A33" style="width:40px;height:36px;padding:2px">
        <select id="ntglyph">${GLYPHKEYS.map((g) => `<option value="${g}">${g}</option>`).join('')}</select>
        <select id="ntgroup"><option value="knowledge">Knowledge</option><option value="life">My Life</option><option value="creation">Creation</option></select>
        <button class="btn sm" id="addtype">+ Add type</button></div>`;
  }
  function ccFields() {
    const tid = A.ui.ccType || A.state.types[0].id; const t = A.type(tid);
    return `<label class="fld" style="padding:0 0 14px"><span class="lbl">Fields for</span>
      <select id="fftype" style="max-width:260px">${A.state.types.map((x) => `<option value="${x.id}" ${x.id === tid ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      ${(t.fields || []).map((f, i) => `<div class="cc-row" data-fid="${f.id}"><span class="grab">⋮⋮</span>
        <input class="name" value="${esc(f.label)}" data-flabel="${f.id}">
        <select data-fkind="${f.id}" style="background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:7px;color:var(--ink2);font-size:12px;padding:6px">
          ${['text', 'longtext', 'number', 'date', 'url', 'status', 'rating'].map((k) => `<option ${f.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
        <span class="spacer"></span><button class="btn tiny" data-fup="${i}">↑</button><button class="btn tiny" data-fdown="${i}">↓</button>
        <button class="btn tiny danger" data-delfield="${f.id}">Delete</button></div>`).join('') || '<div class="mute" style="font-size:13px;margin-bottom:10px">No fields yet.</div>'}
      <div class="miniform"><input id="nflabel" placeholder="New field label (e.g. Rating)">
        <select id="nfkind">${['text', 'longtext', 'number', 'date', 'url', 'status', 'rating'].map((k) => `<option>${k}</option>`).join('')}</select>
        <button class="btn sm" id="addfield">+ Add field</button></div>`;
  }
  function ccConns() {
    return A.state.connTypes.map((c) => `<div class="cc-row" data-cid="${c.id}">
      <input class="name" value="${esc(c.label)}" data-clabel="${c.id}"><span class="mute">↔ inverse</span>
      <input class="name" value="${esc(c.inverse || '')}" data-cinv="${c.id}" style="color:var(--mute)">
      <span class="spacer"></span>
      <button class="btn tiny ${c.bidirectional ? 'on' : ''}" data-cbi="${c.id}">${c.bidirectional ? 'Two-way' : 'One-way'}</button>
      <button class="btn tiny danger" data-delconn="${c.id}">Delete</button></div>`).join('') +
      `<div class="miniform"><input id="nclabel" placeholder="New relationship (e.g. changed my thinking about)"><input id="ncinv" placeholder="inverse (optional)">
        <button class="btn sm" id="addconn">+ Add relationship</button></div>`;
  }
  function ccDash() {
    return A.state.widgets.map((w, i) => `<div class="cc-row" data-wid="${w.id}"><span class="grab">⋮⋮</span>
      <input class="name" value="${esc(w.title)}" data-wtitle="${w.id}"><span class="spacer"></span>
      <button class="btn tiny" data-wwidth="${w.id}">${w.w >= 2 ? 'Wide' : 'Narrow'}</button>
      <button class="btn tiny ${w.on ? 'on' : ''}" data-won="${w.id}">${w.on ? 'Shown' : 'Hidden'}</button>
      <button class="btn tiny" data-wup="${i}">↑</button><button class="btn tiny" data-wdown="${i}">↓</button></div>`).join('') +
      `<p class="mute" style="font-size:12.5px;margin-top:12px">These are the widgets on your Home dashboard. Toggle, rename, resize and reorder them.</p>`;
  }
  function ccData() {
    const s = A.stats();
    return `<div class="foundcard" style="margin-bottom:16px"><div style="font-size:14px">${s.total} objects · ${s.connections} connections · ${A.state.types.length} types</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="ccexp">Export JSON</button><button class="btn sm" id="ccimp">Import JSON</button><button class="btn sm danger" id="ccrst">Reset to sample</button></div>
      <input type="file" id="ccimpf" accept="application/json" style="display:none">
      <p class="mute" style="font-size:12.5px;margin-top:14px">Your ATLAS is stored only in this browser (localStorage). Export regularly to keep a portable copy.</p>`;
  }
  function ccWire(tab) {
    const reload = (t) => { location.hash = '#/control?tab=' + (t || tab); app.route(); };
    const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; const x = arr[i]; arr[i] = arr[j]; arr[j] = x; A.save(); };
    if (tab === 'types') {
      $$('[data-tname]').forEach((el) => el.onchange = () => { A.type(el.dataset.tname).name = el.value; A.save(); buildNav(); });
      $$('[data-hide]').forEach((el) => el.onclick = () => { const t = A.type(el.dataset.hide); t.hidden = !t.hidden; A.save(); reload(); });
      $$('[data-deltype]').forEach((el) => el.onclick = () => { const id = el.dataset.deltype; if (A.byType([id]).length && !confirm('This type has items. Delete the type anyway? Items remain but show as this type id.')) return; A.state.types = A.state.types.filter((t) => t.id !== id); A.save(); reload(); buildNav(); });
      $$('[data-up]').forEach((el) => el.onclick = () => { move(A.state.types, +el.dataset.up, -1); reload(); buildNav(); });
      $$('[data-down]').forEach((el) => el.onclick = () => { move(A.state.types, +el.dataset.down, 1); reload(); buildNav(); });
      $('#addtype').onclick = () => { const name = $('#ntname').value.trim(); if (!name) return; const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) + '_' + Math.random().toString(36).slice(2, 5);
        A.state.types.push({ id, name, plural: name + 's', color: $('#ntcolor').value, glyph: $('#ntglyph').value, group: $('#ntgroup').value, hidden: false, fields: [] }); A.save(); reload(); buildNav(); app.toast('Type added'); };
    } else if (tab === 'fields') {
      $('#fftype').onchange = (e) => { A.ui.ccType = e.target.value; reload(); };
      const t = A.type(A.ui.ccType || A.state.types[0].id);
      $$('[data-flabel]').forEach((el) => el.onchange = () => { const f = t.fields.find((x) => x.id === el.dataset.flabel); f.label = el.value; A.save(); });
      $$('[data-fkind]').forEach((el) => el.onchange = () => { const f = t.fields.find((x) => x.id === el.dataset.fkind); f.kind = el.value; A.save(); });
      $$('[data-delfield]').forEach((el) => el.onclick = () => { t.fields = t.fields.filter((x) => x.id !== el.dataset.delfield); A.save(); reload(); });
      $$('[data-fup]').forEach((el) => el.onclick = () => { move(t.fields, +el.dataset.fup, -1); reload(); });
      $$('[data-fdown]').forEach((el) => el.onclick = () => { move(t.fields, +el.dataset.fdown, 1); reload(); });
      $('#addfield').onclick = () => { const label = $('#nflabel').value.trim(); if (!label) return; const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20); t.fields.push({ id, label, kind: $('#nfkind').value, opts: $('#nfkind').value === 'status' ? ['Todo', 'Doing', 'Done'] : null }); A.save(); reload(); };
    } else if (tab === 'connections') {
      $$('[data-clabel]').forEach((el) => el.onchange = () => { A.connType(el.dataset.clabel).label = el.value; A.save(); });
      $$('[data-cinv]').forEach((el) => el.onchange = () => { A.connType(el.dataset.cinv).inverse = el.value; A.save(); });
      $$('[data-cbi]').forEach((el) => el.onclick = () => { const c = A.connType(el.dataset.cbi); c.bidirectional = !c.bidirectional; A.save(); reload(); });
      $$('[data-delconn]').forEach((el) => el.onclick = () => { A.state.connTypes = A.state.connTypes.filter((c) => c.id !== el.dataset.delconn); A.save(); reload(); });
      $('#addconn').onclick = () => { const label = $('#nclabel').value.trim(); if (!label) return; A.state.connTypes.push({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24), label, inverse: $('#ncinv').value.trim() || label, bidirectional: false, hidden: false }); A.save(); reload(); app.toast('Relationship added'); };
    } else if (tab === 'dashboard') {
      $$('[data-wtitle]').forEach((el) => el.onchange = () => { A.state.widgets.find((w) => w.id === el.dataset.wtitle).title = el.value; A.save(); });
      $$('[data-won]').forEach((el) => el.onclick = () => { const w = A.state.widgets.find((w) => w.id === el.dataset.won); w.on = !w.on; A.save(); reload(); });
      $$('[data-wwidth]').forEach((el) => el.onclick = () => { const w = A.state.widgets.find((w) => w.id === el.dataset.wwidth); w.w = w.w >= 2 ? 1 : 2; A.save(); reload(); });
      $$('[data-wup]').forEach((el) => el.onclick = () => { move(A.state.widgets, +el.dataset.wup, -1); reload(); });
      $$('[data-wdown]').forEach((el) => el.onclick = () => { move(A.state.widgets, +el.dataset.wdown, 1); reload(); });
    } else if (tab === 'data') {
      $('#ccexp').onclick = () => app.download('atlas-export.json', A.exportJSON());
      $('#ccimp').onclick = () => $('#ccimpf').click();
      $('#ccimpf').onchange = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { A.importJSON(r.result); buildNav(); reload(); app.toast('Imported'); } catch (err) { app.toast('Import failed: ' + err.message); } }; r.readAsText(f); };
      $('#ccrst').onclick = () => { if (confirm('Reset to the sample ATLAS?')) { A.reset(); buildNav(); reload(); app.toast('Reset'); } };
    }
  }

  /* ============================ GLOBAL SEARCH ============================ */
  function wireSearch() {
    const inp = $('#gsearch'), res = $('#results');
    const render = () => { const q = inp.value.trim(); if (!q) { res.classList.remove('on'); return; } const hits = A.search(q).slice(0, 8);
      res.innerHTML = hits.length ? `<div style="padding:8px 12px 4px" class="lbl">${hits.length} result${hits.length === 1 ? '' : 's'}</div>` + hits.map((o) => `<div class="row" data-obj="${o.id}">${A.icon(o.type, 15)}<div><div class="t" style="font-size:13px">${esc(o.title)}</div><div class="s">${esc(A.type(o.type).name)}</div></div><span></span></div>`).join('') + `<div class="row" data-ask style="cursor:pointer"><span></span><div><div class="t" style="font-size:13px;color:var(--accent)">Ask ATLAS: “${esc(q)}”</div></div><span></span></div>` : `<div style="padding:12px" class="mute">No matches. <span data-ask style="color:var(--accent);cursor:pointer">Ask ATLAS instead →</span></div>`;
      res.classList.add('on');
      $$('[data-ask]', res).forEach((el) => el.onclick = () => { res.classList.remove('on'); location.hash = '#/ask'; setTimeout(() => { const a = $('#askin'); if (a) { a.value = q; a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); } }, 60); });
    };
    inp.addEventListener('input', render);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const q = inp.value.trim(); if (q) { res.classList.remove('on'); location.hash = '#/ask'; setTimeout(() => { const a = $('#askin'); if (a) { a.value = q; a.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); } }, 60); } } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.searchwrap')) res.classList.remove('on'); });
  }

  /* ============================ INIT ============================ */
  function init() {
    A.load();
    document.querySelectorAll('[data-brandname]').forEach((n) => n.textContent = A.state.settings.name || 'My ATLAS');
    buildNav(); wireSearch();
    window.addEventListener('hashchange', app.route);
    if (!location.hash) location.hash = '#/home'; else app.route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
