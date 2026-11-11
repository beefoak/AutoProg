// Chord progression generator and substitution suggestions.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';
  const T = AP.theory;
  const split = (s) => s.split('|').map((p) => p.trim().split(/\s+/));

  // Characteristic progressions per mode, used as a fallback and when the chosen
  // mode differs from the subgenre's usual one.
  const MODE_POOL = {
    major: split('I V vi IV | I IV V IV | I vi IV V | vi IV I V | I IV vi V | I iii IV V'),
    minor: split('i bVI bIII bVII | i bVII bVI bVII | i iv bVI bVII | i bVI iv v | i bIII bVII iv | i iv v i'),
    dorian: split('i IV i IV | i7 IV7 | i bIII bVII IV | i ii bIII ii | i bVII IV i'),
    mixolydian: split('I bVII IV I | I bVII I bVII | I v IV I | I IV bVII IV'),
    lydian: split('I II I II | Imaj7 II | I II vii I | I II V I'),
    phrygian: split('i bII i bII | i bII bIII bII | i bvii bII i | i bVI bII i'),
    harmonic: split('i iv V i | i bVI V i | i V7 i iv | i bVI iv V7'),
    phrygdom: split('I bII I bII | I bII bvii I | iv bIII bII I | I iv bvii I'),
  };

  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  const family = (t) => (t.some((x) => /^i(?![iv])/.test(x)) ? 'minor' : 'major');

  function fitsMode(t, mode) {
    const pcs = T.MODES[mode].pcs;
    return t.every((tok) => {
      const c = T.parseRoman(tok);
      return T.Q[c.q].iv.slice(0, 3).every((i) => pcs.includes((c.semi + i) % 12));
    });
  }

  function candidatePool(sub, mode) {
    const fam = T.MODES[mode].family;
    let p = sub.progs.filter((t) => family(t) === fam);
    if (mode !== sub.mode && mode !== 'major' && mode !== 'minor') {
      p = p.filter((t) => fitsMode(t, mode)).concat(MODE_POOL[mode], MODE_POOL[mode]);
    }
    return p.length ? p : MODE_POOL[mode];
  }

  const brightness = (t) => t.filter((tok) => T.isMajorish(T.parseRoman(tok).q)).length / t.length;

  // Turn a template into a unit of whole bars: vamps of 1–3 chords are stretched to 4 bars.
  function unit(t) {
    const beats = t.length === 1 ? [8, 8] : t.length === 2 ? [8, 8] : t.length === 3 ? [4, 4, 8] : t.map(() => 4);
    const toks = t.length === 1 ? [t[0], t[0]] : t;
    return toks.map((tok, i) => Object.assign(T.parseRoman(tok), { beats: beats[i] }));
  }
  const clone = (u) => u.map((c) => Object.assign({}, c));

  // Same phrase with a turnaround on the last chord, to lead back to the top.
  function vary(u, fam) {
    const v = clone(u);
    const last = v[v.length - 1];
    const power = last.q === '5';
    const to = last.semi === 7 ? (fam === 'minor' ? 10 : 5) : 7;
    const rich = u.filter((c) => T.Q[c.q].iv.length > 3).length * 2 > u.length;
    v[v.length - 1] = { semi: to, q: power ? '5' : rich && to !== 5 ? '7' : rich ? 'maj7' : 'maj', beats: last.beats };
    if (to === 10) v[v.length - 1].fl = true;
    return v;
  }

  function assemble(pool, bars, fam, rng) {
    let short = pool.filter((t) => t.length <= 4);
    if (!short.length) short = MODE_POOL[fam];
    const eight = pool.filter((t) => t.length === 8);
    const twelve = pool.filter((t) => t.length === 12);

    if (bars === 12 && twelve.length && rng() < 0.8) return unit(pick(twelve, rng));
    if (bars === 8 && eight.length && rng() < 0.5) return unit(pick(eight, rng));
    if (bars === 16 && eight.length && rng() < 0.4) {
      const a = unit(pick(eight, rng));
      return a.concat(vary(a, fam));
    }
    const ta = pick(short, rng);
    const others = short.filter((t) => t !== ta);
    const a = unit(ta);
    const b = unit(others.length ? pick(others, rng) : ta);
    const a2 = vary(a, fam);
    if (bars === 4) return a;
    if (bars === 8) return rng() < 0.5 ? a.concat(a2) : a.concat(b);
    if (bars === 12) return a.concat(clone(a), b);
    return a.concat(a2, b, clone(a2));
  }

  const TRIAD = {
    maj7: 'maj', 7: 'maj', 6: 'maj', 69: 'maj', 9: 'maj', maj9: 'maj', 13: 'maj', add9: 'maj', '7#9': 'maj',
    '7b9': 'maj', m7: 'min', m9: 'min', m6: 'min', m11: 'min', mMaj7: 'min', madd9: 'min', m7b5: 'dim',
    dim7: 'dim', '7sus4': 'sus4',
  };

  function applyComplexity(list, cx, dom7, rng) {
    if (cx === 'typical') return;
    for (const c of list) {
      if (cx === 'triads') {
        if (TRIAD[c.q]) c.q = TRIAD[c.q];
        continue;
      }
      if (c.q === 'maj') c.q = c.semi === 7 || dom7 ? '7' : 'maj7';
      else if (c.q === 'min') c.q = 'm7';
      else if (c.q === 'dim') c.q = c.semi === 11 || c.semi === 2 ? 'm7b5' : 'dim7';
      if (cx === 'extended') {
        if (c.q === 'maj7') c.q = 'maj9';
        else if (c.q === 'm7') c.q = 'm9';
        else if (c.q === '7') c.q = rng() < 0.5 ? '9' : '13';
      }
    }
  }

  function applyMood(list, mood, fam, cx, rng) {
    const last = list[list.length - 1];
    if (mood === 'dreamy') {
      for (const c of list) {
        if (c.q === 'maj') c.q = pick(['maj7', 'add9', 'maj7', 'sus2'], rng);
        else if (c.q === 'min') c.q = pick(['m7', 'madd9', 'm7'], rng);
      }
    } else if (mood === 'nostalgic') {
      for (const c of list) if (c.q === 'maj' && c.semi === 0 && rng() < 0.6) c.q = pick(['maj7', '6'], rng);
      if (fam === 'major') {
        for (let i = list.length - 1; i > 0; i--) {
          if (list[i].semi === 5 && T.isMajorish(list[i].q) && list[i].q !== '5') {
            list[i].q = cx === 'triads' ? 'min' : 'm6';
            break;
          }
        }
      }
    } else if (mood === 'tense') {
      for (const c of list) if (c.semi === 7 && c.q === 'min') c.q = '7';
      if (last.q !== '5' && last.semi !== 0) {
        last.semi = 7;
        last.q = cx === 'triads' ? 'maj' : '7';
        delete last.fl;
      }
    }
  }

  function applySection(list, section, fam) {
    const last = list[list.length - 1];
    const power = last.q === '5';
    if (section === 'prechorus') {
      last.semi = 7;
      last.q = power ? '5' : 'maj';
      delete last.fl;
    } else if (section === 'outro') {
      last.semi = 0;
      last.q = power ? '5' : fam === 'minor' ? 'min' : 'maj';
      delete last.fl;
    }
  }

  // settings: { sub, keyRoot, mode, mood, section, bars, complexity }
  function generate(settings, rng) {
    rng = rng || Math.random;
    const { sub, mode, mood, section, bars } = settings;
    const fam = T.MODES[mode].family;
    let pool = candidatePool(sub, mode);

    let short = pool.filter((t) => t.length <= 4);
    if (short.length > 1 && (mood === 'uplifting' || mood === 'dark')) {
      const sorted = short.slice().sort((a, b) => brightness(b) - brightness(a));
      const half = Math.ceil(sorted.length / 2);
      short = mood === 'uplifting' ? sorted.slice(0, half) : sorted.slice(-half);
    }
    const startsOnTonic = (t) => T.parseRoman(t[0]).semi === 0;
    if (section === 'bridge' || section === 'prechorus') {
      const off = short.filter((t) => !startsOnTonic(t));
      // No off-tonic option: rotate a four-chord loop so it starts mid-phrase.
      short = off.length ? off : short.map((t) => (t.length === 4 ? t.slice(2).concat(t.slice(0, 2)) : t));
    } else if (section === 'chorus') {
      const on = short.filter((t) => [0, 5].includes(T.parseRoman(t[0]).semi));
      if (on.length) short = on;
    }
    pool = short.concat(pool.filter((t) => t.length > 4));

    const list = assemble(pool, bars, fam, rng);
    if (mode === 'harmonic') for (const c of list) if (c.semi === 7 && T.isMinorish(c.q)) c.q = c.q === 'm7' ? '7' : 'maj';
    applySection(list, section, fam);
    applyComplexity(list, settings.complexity, !!sub.dom7, rng);
    applyMood(list, mood, fam, settings.complexity, rng);

    return list.map((c) => {
      const out = { root: (settings.keyRoot + c.semi) % 12, q: c.q, beats: c.beats, locked: false };
      if (c.fl !== undefined) out.fl = c.fl;
      return out;
    });
  }

  // Replacement ideas for chords[i], grouped for the editor.
  function suggest(chords, i, keyRoot, mode, cx) {
    const c = chords[i];
    const next = chords[(i + 1) % chords.length];
    const fam = T.MODES[mode].family;
    const sev = cx === 'sevenths' || cx === 'extended' || T.Q[c.q].iv.length > 3;
    const out = [];
    const seen = new Set([c.root + ':' + c.q]);
    const add = (root, q, why, group, fl) => {
      root = ((root % 12) + 12) % 12;
      const k = root + ':' + q;
      if (seen.has(k)) return;
      seen.add(k);
      const s = { root, q, why, group };
      if (fl !== undefined) s.fl = fl;
      out.push(s);
    };

    for (const d of T.diatonic(mode, sev)) {
      const ch = { root: (keyRoot + d.semi) % 12, q: d.q };
      add(ch.root, d.q, T.roman(ch, keyRoot), 'In key');
    }

    if (T.isMajorish(c.q)) {
      add(c.root + 9, sev ? 'm7' : 'min', 'relative minor', 'Substitutes');
      add(c.root + 4, sev ? 'm7' : 'min', 'shares two notes', 'Substitutes');
    } else if (T.isMinorish(c.q)) {
      add(c.root + 3, sev ? 'maj7' : 'maj', 'relative major', 'Substitutes');
      add(c.root + 8, sev ? 'maj7' : 'maj', 'shares two notes', 'Substitutes');
    }
    if (T.isDominant(c.q)) add(c.root + 6, '7', 'tritone substitute', 'Substitutes');
    if (next && next !== c) {
      add(next.root + 7, '7', 'dominant of the next chord', 'Substitutes');
      add(next.root + 1, '7', 'slides down into the next chord', 'Substitutes', true);
      add(next.root + 11, 'dim7', 'passing diminished into the next chord', 'Substitutes');
    }
    if (fam === 'major') {
      add(keyRoot + 5, 'min', 'borrowed iv', 'Substitutes');
      add(keyRoot + 8, 'maj', 'borrowed ♭VI', 'Substitutes', true);
      add(keyRoot + 10, 'maj', 'borrowed ♭VII', 'Substitutes', true);
      add(keyRoot + 3, 'maj', 'borrowed ♭III', 'Substitutes', true);
    } else {
      add(keyRoot + 5, 'maj', 'Dorian IV', 'Substitutes');
      add(keyRoot + 7, '7', 'harmonic-minor V7', 'Substitutes');
      add(keyRoot + 1, 'maj', 'Neapolitan ♭II', 'Substitutes', true);
      add(keyRoot, 'maj', 'Picardy I', 'Substitutes');
    }

    const colours = T.isMinorish(c.q) ? ['m7', 'madd9', 'm9', 'm6', 'sus4', 'min']
      : T.isMajorish(c.q) ? ['maj7', 'add9', 'sus4', 'sus2', '6', '7', 'maj'] : ['min', 'maj', 'm7'];
    for (const q of colours) add(c.root, q, T.Q[q].name.toLowerCase(), 'Same root, new colour', c.fl);
    return out;
  }

  AP.generator = { generate, suggest, MODE_POOL };
})(globalThis.AP);
