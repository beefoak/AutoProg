// UI: settings panel, chord chart, chord editor, melody view, transport.
(function (AP) {
  'use strict';
  const T = AP.theory, GEN = AP.generator, MEL = AP.melody;
  const $ = (id) => document.getElementById(id);
  const LS = 'autoprog.v1';
  const SECTION = { verse: 'Verse', prechorus: 'Pre-chorus', chorus: 'Chorus', bridge: 'Bridge', outro: 'Outro' };
  const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2h.5A1.5 1.5 0 0 1 14 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-5A1.5 1.5 0 0 1 3.500 7H4zm2 0h4V5a2 2 0 0 0-4 0v2z"/></svg>';

  let state = load();
  const undoStack = [];
  let dragIdx = -1;

  const genre = () => AP.GENRES[state.genre];
  const sub = () => genre().subs[state.sub];
  const flat = () => T.keyFlat(state.keyRoot, state.mode);
  const keyName = () => T.spell(state.keyRoot, flat()) + ' ' + T.MODES[state.mode].short;
  const totalBeats = () => state.chords.reduce((a, c) => a + c.beats, 0);

  // ---------- state ----------
  function fresh() {
    const s = {
      genre: 0, sub: 0, keyRoot: 0, mode: 'major', mood: 'neutral', section: 'verse', bars: 4, tempo: 110,
      complexity: 'typical', feel: 'strum', swing: false, chords: [], sel: 0, loop: true, playChords: true,
      playMelody: true, vol: 0.8, mel: { style: 'melody', scale: 'auto', density: 2, seed: 1 + Math.floor(Math.random() * 1e6) },
    };
    return s;
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(LS));
      const g = AP.GENRES[s.genre];
      const ok = g && g.subs[s.sub] && T.MODES[s.mode] && Array.isArray(s.chords) && s.chords.length &&
        s.chords.every((c) => T.Q[c.q] && c.root >= 0 && c.root < 12 && [2, 4, 8].includes(c.beats)) && s.mel;
      if (ok) return Object.assign(fresh(), s, { melody: null });
    } catch (e) { /* no saved song, or storage unavailable */ }
    return null;
  }

  function save() {
    try {
      const copy = Object.assign({}, state);
      delete copy.melody;
      localStorage.setItem(LS, JSON.stringify(copy));
    } catch (e) { /* storage unavailable: the app still works for this session */ }
  }

  function snapshot() {
    const copy = Object.assign({}, state);
    delete copy.melody;
    undoStack.push(JSON.stringify(copy));
    if (undoStack.length > 60) undoStack.shift();
  }

  function change(fn) {
    snapshot();
    fn();
    update();
  }

  function applySubDefaults() {
    const g = genre(), s = sub();
    state.mode = s.mode;
    state.tempo = Math.round((s.tempo[0] + s.tempo[1]) / 2);
    state.feel = s.feel || g.feel;
    state.swing = s.swing !== undefined ? s.swing : !!g.swing;
    const bars = s.bars || g.bars;
    state.bars = bars || (state.bars === 12 ? 4 : state.bars);
  }

  function regenerate() {
    const next = GEN.generate({
      sub: sub(), keyRoot: state.keyRoot, mode: state.mode, mood: state.mood, section: state.section,
      bars: state.bars, complexity: state.complexity,
    });
    state.chords.forEach((c, i) => {
      if (!c.locked) return;
      if (i < next.length) next[i] = c;
      else next.push(c);
    });
    state.chords = next;
    state.sel = Math.min(state.sel, next.length - 1);
  }

  function refreshMelody() {
    const g = genre(), s = sub();
    state.melody = MEL.generate(state.chords, {
      keyRoot: state.keyRoot, mode: state.mode, mel: s.mel || g.mel, scaleId: state.mel.scale,
      style: state.mel.style, density: state.mel.density,
    }, state.mel.seed);
  }

  function update() {
    state.sel = Math.max(0, Math.min(state.sel, state.chords.length - 1));
    refreshMelody();
    syncControls();
    renderChart();
    renderEditor();
    renderMelody();
    save();
    AP.audio.refresh();
  }

  // ---------- settings panel ----------
  function fillSelect(el, items) {
    el.innerHTML = items.map(([v, label]) => `<option value="${v}">${label}</option>`).join('');
  }

  function initControls() {
    fillSelect($('genre'), AP.GENRES.map((g, i) => [i, g.name.replace('&', '&amp;')]));
    fillSelect($('keyRoot'), T.KEY_LABELS.map((k, i) => [i, k]));
    fillSelect($('mode'), Object.keys(T.MODES).map((id) => [id, T.MODES[id].name]));
    fillSelect($('melScale'), [['auto', 'Auto (genre default)']].concat(
      Object.keys(MEL.SCALES).map((id) => [id, MEL.SCALES[id].name.replace(/^./, (ch) => ch.toUpperCase())])));

    $('genre').onchange = (e) => change(() => { state.genre = +e.target.value; state.sub = 0; applySubDefaults(); regenerate(); });
    $('sub').onchange = (e) => change(() => { state.sub = +e.target.value; applySubDefaults(); regenerate(); });
    $('keyRoot').onchange = (e) => change(() => {
      const d = (+e.target.value - state.keyRoot + 12) % 12;
      state.keyRoot = +e.target.value;
      for (const c of state.chords) c.root = (c.root + d) % 12;
    });
    for (const id of ['mode', 'mood', 'section', 'complexity']) {
      $(id).onchange = (e) => change(() => { state[id] = e.target.value; regenerate(); });
    }
    $('bars').onchange = (e) => change(() => { state.bars = +e.target.value; regenerate(); });
    $('tempo').oninput = (e) => { state.tempo = +e.target.value; $('tempoOut').textContent = state.tempo + ' BPM'; renderHead(); save(); AP.audio.refresh(); };
    $('feel').onchange = (e) => { state.feel = e.target.value; save(); AP.audio.refresh(); };
    $('swing').onchange = (e) => { state.swing = e.target.checked; save(); AP.audio.refresh(); };
    for (const id of ['loop', 'playChords', 'playMelody']) {
      $(id).onchange = (e) => { state[id] = e.target.checked; save(); AP.audio.refresh(); };
    }
    $('vol').oninput = (e) => { state.vol = +e.target.value; save(); AP.audio.refresh(); };

    $('generate').onclick = $('regen').onclick = () => change(regenerate);
    $('play').onclick = togglePlay;
    $('undo').onclick = undo;
    $('copy').onclick = copyChart;
    $('midi').onclick = exportMidi;

    $('melStyle').onchange = (e) => { state.mel.style = e.target.value; update(); };
    $('melScale').onchange = (e) => { state.mel.scale = e.target.value; update(); };
    $('melDensity').onchange = (e) => { state.mel.density = +e.target.value; update(); };
    $('newMelody').onclick = () => { state.mel.seed = 1 + Math.floor(Math.random() * 1e6); update(); };
  }

  function syncControls() {
    $('genre').value = state.genre;
    fillSelect($('sub'), genre().subs.map((s, i) => [i, s.name.replace('&', '&amp;')]));
    $('sub').value = state.sub;
    const s = sub();
    $('genreHint').textContent = `${genre().blurb} Usually ${T.MODES[s.mode].short}, ${s.tempo[0]}–${s.tempo[1]} BPM.`;
    for (const id of ['keyRoot', 'mode', 'mood', 'section', 'bars', 'complexity', 'tempo', 'feel', 'vol']) $(id).value = state[id];
    for (const id of ['swing', 'loop', 'playChords', 'playMelody']) $(id).checked = state[id];
    $('tempoOut').textContent = state.tempo + ' BPM';
    $('melStyle').value = state.mel.style;
    $('melScale').value = state.mel.scale;
    $('melDensity').value = state.mel.density;
    $('undo').disabled = !undoStack.length;
  }

  // ---------- chord chart ----------
  function nameHtml(c) {
    return `${T.rootName(c, flat())}<small>${T.Q[c.q].label}</small>`;
  }

  function renderHead() {
    $('songTitle').textContent = `${sub().name} ${SECTION[state.section].toLowerCase()} in ${keyName()}`;
    const bars = totalBeats() / 4;
    $('songMeta').textContent = `${genre().name} · ${state.tempo} BPM · ${bars} ${bars === 1 ? 'bar' : 'bars'} · ${state.chords.length} chords`;
  }

  function renderChart() {
    renderHead();
    $('chart').innerHTML = state.chords.map((c, i) => `
      <div class="chord b${c.beats}${i === state.sel ? ' sel' : ''}${c.locked ? ' locked' : ''}" data-i="${i}" draggable="true" tabindex="0" role="button" aria-label="${T.chordName(c, flat())}, chord ${i + 1}">
        <span class="rn">${T.roman(c, state.keyRoot)}</span>
        <span class="nm">${nameHtml(c)}</span>
        <span class="nt">${T.chordNotes(c, flat()).join(' ')}</span>
        <button class="lock" data-lock="${i}" title="${c.locked ? 'Unlock' : 'Lock: keep this chord when regenerating'}" aria-pressed="${!!c.locked}">${LOCK}</button>
      </div>`).join('') + '<button class="chord add" id="addChord" >+ Add chord</button>';
  }

  function initChart() {
    const chart = $('chart');
    chart.addEventListener('click', (e) => {
      const lock = e.target.closest('[data-lock]');
      if (lock) return change(() => { const c = state.chords[+lock.dataset.lock]; c.locked = !c.locked; });
      if (e.target.closest('#addChord')) return addChord(state.chords.length - 1);
      const card = e.target.closest('[data-i]');
      if (card) select(+card.dataset.i);
    });
    chart.addEventListener('keydown', (e) => {
      const card = e.target.closest('[data-i]');
      if (!card || e.target.closest('[data-lock]')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(+card.dataset.i); }
    });
    chart.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-i]');
      if (!card) return;
      dragIdx = +card.dataset.i;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragIdx));
    });
    chart.addEventListener('dragover', (e) => {
      const card = e.target.closest('[data-i]');
      if (!card || dragIdx < 0) return;
      e.preventDefault();
      chart.querySelectorAll('.over').forEach((x) => x.classList.remove('over'));
      card.classList.add('over');
    });
    chart.addEventListener('dragend', () => { dragIdx = -1; chart.querySelectorAll('.over').forEach((x) => x.classList.remove('over')); });
    chart.addEventListener('drop', (e) => {
      const card = e.target.closest('[data-i]');
      if (!card || dragIdx < 0) return;
      e.preventDefault();
      const from = dragIdx, to = +card.dataset.i;
      dragIdx = -1;
      if (from !== to) moveChord(from, to);
    });
  }

  function select(i) {
    state.sel = i;
    renderChart();
    renderEditor();
    save();
    AP.audio.audition(state.chords[i], state.vol);
  }

  // ---------- chord editing ----------
  function edit(fn) {
    change(() => fn(state.chords[state.sel]));
    AP.audio.audition(state.chords[state.sel], state.vol);
  }

  function moveChord(from, to) {
    change(() => {
      const [c] = state.chords.splice(from, 1);
      state.chords.splice(to, 0, c);
      state.sel = to;
    });
  }

  function addChord(after) {
    change(() => {
      const tonic = { root: state.keyRoot, q: T.MODES[state.mode].family === 'minor' ? 'min' : 'maj', beats: 4, locked: false };
      state.chords.splice(after + 1, 0, tonic);
      state.sel = after + 1;
    });
  }

  function renderEditor() {
    const i = state.sel, c = state.chords[i], fl = flat();
    const groups = {};
    for (const id in T.Q) (groups[T.Q[id].g] = groups[T.Q[id].g] || []).push(id);
    const sugg = GEN.suggest(state.chords, i, state.keyRoot, state.mode, state.complexity);
    const sGroups = {};
    sugg.forEach((s, k) => (sGroups[s.group] = sGroups[s.group] || []).push([s, k]));

    const rootChips = T.SHARP.map((_, pc) =>
      `<button class="chip root${pc === c.root ? ' on' : ''}" data-root="${pc}">${T.spell(pc, pc === c.root ? (c.fl === undefined ? fl : c.fl) : fl)}</button>`).join('');
    const qualBlocks = Object.keys(groups).map((g) => `
      <div class="ed-block"><h3>${g.replace('&', '&amp;')}</h3><div class="chips">${groups[g].map((id) =>
        `<button class="chip${id === c.q ? ' on' : ''}" data-q="${id}" title="${T.Q[id].name}">${T.spell(c.root, c.fl === undefined ? fl : c.fl)}${T.Q[id].label}</button>`).join('')}</div></div>`).join('');
    const suggBlocks = Object.keys(sGroups).map((g) => `
      <div class="ed-block"><h3>${g}</h3><div class="chips">${sGroups[g].map(([s, k]) =>
        `<button class="chip" data-sugg="${k}">${T.chordName(s, fl)} <small>${s.why}</small></button>`).join('')}</div></div>`).join('');
    const lens = [[2, '½ bar'], [4, '1 bar'], [8, '2 bars']].map(([b, label]) =>
      `<button class="chip${c.beats === b ? ' on' : ''}" data-beats="${b}">${label}</button>`).join('');

    $('editor').innerHTML = `
      <div class="ed-head">
        <h2>Edit chord ${i + 1}: ${T.chordName(c, fl)}<span>${T.Q[c.q].name} · ${T.roman(c, state.keyRoot)} · ${T.chordNotes(c, fl).join(' ')}</span></h2>
        <div class="ed-actions">
          <button class="btn" data-act="lock">${c.locked ? 'Unlock' : 'Lock'}</button>
          <button class="btn" data-act="left" ${i === 0 ? 'disabled' : ''}>◀ Move</button>
          <button class="btn" data-act="right" ${i === state.chords.length - 1 ? 'disabled' : ''}>Move ▶</button>
          <button class="btn" data-act="dup">Duplicate</button>
          <button class="btn" data-act="add">Add after</button>
          <button class="btn danger" data-act="del" ${state.chords.length === 1 ? 'disabled' : ''}>Delete</button>
        </div>
      </div>
      <div class="ed-grid">
        <div>
          <div class="ed-block"><h3>Root</h3><div class="chips">${rootChips}</div></div>
          ${qualBlocks}
          <div class="ed-block"><h3>Length</h3><div class="chips">${lens}</div></div>
        </div>
        <div>${suggBlocks}</div>
      </div>`;
    $('editor')._sugg = sugg;
  }

  function initEditor() {
    $('editor').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      const d = b.dataset, i = state.sel;
      if (d.root !== undefined) return edit((c) => { c.root = +d.root; delete c.fl; });
      if (d.q !== undefined) return edit((c) => { c.q = d.q; });
      if (d.beats !== undefined) return change(() => { state.chords[i].beats = +d.beats; });
      if (d.sugg !== undefined) {
        const s = $('editor')._sugg[+d.sugg];
        return edit((c) => { c.root = s.root; c.q = s.q; if (s.fl === undefined) delete c.fl; else c.fl = s.fl; });
      }
      if (d.act === 'lock') return change(() => { state.chords[i].locked = !state.chords[i].locked; });
      if (d.act === 'left') return moveChord(i, i - 1);
      if (d.act === 'right') return moveChord(i, i + 1);
      if (d.act === 'dup') return change(() => { state.chords.splice(i + 1, 0, Object.assign({}, state.chords[i], { locked: false })); state.sel = i + 1; });
      if (d.act === 'add') return addChord(i);
      if (d.act === 'del') return change(() => { state.chords.splice(i, 1); });
    });
  }

  function undo() {
    if (!undoStack.length) return;
    state = Object.assign(fresh(), JSON.parse(undoStack.pop()));
    update();
  }

  // ---------- melody ----------
  function barNotes() {
    const fl = flat(), bars = [];
    for (const n of state.melody.notes) {
      const b = Math.floor(n.s / 16);
      (bars[b] = bars[b] || []).push(T.midiName(n.midi, fl));
    }
    return Array.from(bars, (b) => b || []);
  }

  function renderMelody() {
    const a = MEL.advice(state.chords, { keyRoot: state.keyRoot, mode: state.mode }, state.melody.scaleId);
    $('melMeta').textContent = `${state.mel.style === 'solo' ? 'Solo' : 'Melody'} line over your ${state.chords.length} chords · ${state.melody.notes.length} notes`;
    $('advice').innerHTML = `
      <p class="main">Play <b>${a.root} ${a.name}</b> &nbsp;<span class="scale-notes">${a.notes}</span></p>
      <p class="hint">${a.tip}</p>
      ${a.alts.length ? `<ul>${a.alts.map((x) => `<li><b>${a.root} ${x.name}</b> (${x.notes}) — ${x.why}</li>`).join('')}</ul>` : ''}`;
    $('melText').innerHTML = barNotes().map((b, i) => `<div><b>Bar ${i + 1}</b>${b.length ? b.join(' ') : 'rest'}</div>`).join('');
    drawRoll(-1);
  }

  function drawRoll(playBeat) {
    const cv = $('roll'), mel = state.melody;
    if (!mel) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const css = getComputedStyle(document.documentElement);
    const col = (n) => css.getPropertyValue(n).trim();
    const fl = flat(), gutter = 40, top = 22;
    const pitches = mel.notes.map((n) => n.midi);
    let lo = Math.min(...pitches) - 2, hi = Math.max(...pitches) + 2;
    while (hi - lo < 14) { hi++; lo--; }
    const rows = hi - lo + 1, rh = (H - top) / rows;
    const x = (step) => gutter + (step / mel.total) * (W - gutter);
    const y = (m) => top + (hi - m) * rh;

    // chord-tone lanes and chord names
    let step = 0;
    g.font = '600 12px "Segoe UI", system-ui, sans-serif';
    g.textBaseline = 'middle';
    for (const c of state.chords) {
      const x0 = x(step), x1 = x(step + c.beats * 4);
      const pcs = T.chordPcs(c);
      g.fillStyle = 'rgba(242, 165, 65, 0.15)';
      for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) g.fillRect(x0, y(m), x1 - x0, rh);
      g.fillStyle = col('--accent');
      g.fillText(T.chordName(c, fl), x0 + 5, top / 2);
      g.fillStyle = col('--line');
      g.fillRect(x0, 0, 1, H);
      step += c.beats * 4;
    }
    // bar lines
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let s = 0; s <= mel.total; s += 16) g.fillRect(x(s), top, 1, H - top);
    // pitch labels
    g.fillStyle = col('--muted');
    g.font = '11px "Segoe UI", system-ui, sans-serif';
    const every = rh >= 11 ? 1 : rh >= 6 ? 2 : 4;
    for (let m = lo; m <= hi; m++) if ((m - lo) % every === 0) g.fillText(T.midiName(m, fl), 6, y(m) + rh / 2);
    // notes
    for (const n of mel.notes) {
      const x0 = x(n.s) + 1, w = Math.max(3, x(n.s + n.d) - x(n.s) - 2);
      const active = playBeat >= 0 && playBeat * 4 >= n.s && playBeat * 4 < n.s + n.d;
      g.fillStyle = active ? '#ffffff' : col('--mel');
      g.beginPath();
      g.roundRect(x0, y(n.midi) + 1, w, Math.max(3, rh - 2), 3);
      g.fill();
    }
    if (playBeat >= 0) {
      g.fillStyle = col('--accent');
      g.fillRect(x(playBeat * 4), 0, 2, H);
    }
  }

  // ---------- transport ----------
  function togglePlay() {
    if (AP.audio.isPlaying()) AP.audio.stop();
    else AP.audio.start(() => state);
    syncPlayButton();
  }

  function syncPlayButton() {
    const on = AP.audio.isPlaying();
    $('playIcon').textContent = on ? '■' : '▶';
    $('playText').textContent = on ? 'Stop' : 'Play';
    $('play').setAttribute('aria-pressed', String(on));
  }

  let wasPlaying = false, lastChord = -1;
  function frame() {
    const on = AP.audio.isPlaying();
    if (on) {
      const b = AP.audio.beat();
      let acc = 0, cur = -1;
      state.chords.forEach((c, i) => { if (cur < 0 && b < acc + c.beats) cur = i; acc += c.beats; });
      if (cur !== lastChord) {
        document.querySelectorAll('.chord.playing').forEach((x) => x.classList.remove('playing'));
        const card = document.querySelector(`.chord[data-i="${cur}"]`);
        if (card) card.classList.add('playing');
        lastChord = cur;
      }
      drawRoll(b);
    } else if (wasPlaying) {
      document.querySelectorAll('.chord.playing').forEach((x) => x.classList.remove('playing'));
      lastChord = -1;
      drawRoll(-1);
      syncPlayButton();
    }
    wasPlaying = on;
    requestAnimationFrame(frame);
  }

  // ---------- export ----------
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function chartText() {
    const fl = flat(), lines = [];
    lines.push(`${sub().name} (${genre().name}) — ${SECTION[state.section]}`);
    lines.push(`Key: ${keyName()} · ${state.tempo} BPM`);
    lines.push('');
    for (let i = 0; i < state.chords.length; i += 4) {
      const row = state.chords.slice(i, i + 4);
      const cells = row.map((c) => {
        const name = T.chordName(c, fl) + (c.beats === 8 ? ' (2 bars)' : c.beats === 2 ? ' (½ bar)' : '');
        const rn = T.roman(c, state.keyRoot);
        const w = Math.max(name.length, rn.length) + 1;
        return [name.padEnd(w), rn.padEnd(w)];
      });
      lines.push('| ' + cells.map((x) => x[0]).join('| ') + '|');
      lines.push('  ' + cells.map((x) => x[1]).join('  '));
    }
    const a = MEL.advice(state.chords, { keyRoot: state.keyRoot, mode: state.mode }, state.melody.scaleId);
    lines.push('', `Melody (${a.root} ${a.name}: ${a.notes})`);
    barNotes().forEach((b, i) => lines.push(`Bar ${i + 1}: ${b.join(' ') || 'rest'}`));
    return lines.join('\n');
  }

  function copyChart() {
    const text = chartText();
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      toast(ok ? 'Chart copied' : 'Could not copy — select and copy manually');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast('Chart copied'), fallback);
    else fallback();
  }

  function exportMidi() {
    const bytes = AP.midi.build(state);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sub().name}-${keyName()}`.replace(/[^\w♯♭-]+/g, '-').replace('♯', 'sharp').replace('♭', 'flat') + '.mid';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('MIDI file saved');
  }

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return undo(); }
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'BUTTON' || e.target.closest('.chord')) return;
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowRight') select(Math.min(state.chords.length - 1, state.sel + 1));
    else if (e.key === 'ArrowLeft') select(Math.max(0, state.sel - 1));
  });
  window.addEventListener('resize', () => drawRoll(AP.audio.beat()));

  // ---------- boot ----------
  initControls();
  initChart();
  initEditor();
  if (!state) {
    state = fresh();
    applySubDefaults();
    regenerate();
  }
  update();
  requestAnimationFrame(frame);
})(globalThis.AP);
