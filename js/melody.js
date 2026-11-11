// Melody / solo generator: rhythmic motifs that repeat across bars, chord tones on
// strong beats, stepwise scale motion in between. Deterministic for a given seed,
// so editing a chord re-fits the same idea rather than replacing it.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';
  const T = AP.theory;

  const SCALES = {
    majPent: { name: 'major pentatonic', pcs: [0, 2, 4, 7, 9] },
    minPent: { name: 'minor pentatonic', pcs: [0, 3, 5, 7, 10] },
    blues: { name: 'blues scale', pcs: [0, 3, 5, 6, 7, 10] },
  };
  for (const id in T.MODES) SCALES[id] = { name: id === 'minor' ? 'natural minor' : T.MODES[id].short, pcs: T.MODES[id].pcs };
  SCALES.major.name = 'major scale';

  function autoScale(mode, mel) {
    if (mel === 'blues') return 'blues';
    if (mel === 'pent') {
      if (['major', 'mixolydian', 'lydian'].includes(mode)) return 'majPent';
      if (['minor', 'dorian'].includes(mode)) return 'minPent';
    }
    return mode;
  }

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // One bar of rhythm on a 16th-note grid: [{ s: start step, d: length in steps }]
  function rhythm(rng, style, dens) {
    const unit = style === 'solo' ? 1 : 2;
    const on = [];
    for (let s = 0; s < 16; s += unit) {
      let p;
      if (s === 0) p = 0.92;
      else if (s % 8 === 0) p = 0.8;
      else if (s % 4 === 0) p = 0.6;
      else if (s % 2 === 0) p = style === 'solo' ? 0.6 : 0.34;
      else p = 0.36;
      if (s !== 0) p = Math.min(0.95, p * dens);
      if (rng() < p) on.push(s);
    }
    if (on.length < 2) {
      if (!on.includes(0)) on.push(0);
      if (!on.includes(8)) on.push(8);
      on.sort((a, b) => a - b);
    }
    return on.map((s, k) => {
      const gap = (k + 1 < on.length ? on[k + 1] : 16) - s;
      let d = gap;
      if (gap >= 4 && rng() < 0.3) d = gap / 2;
      return { s, d: Math.min(8, Math.max(1, Math.floor(d))) };
    });
  }

  function mutate(a, fresh) {
    const head = a.filter((n) => n.s < 8).map((n) => ({ s: n.s, d: Math.min(n.d, 8 - n.s) }));
    return head.concat(fresh.filter((n) => n.s >= 8));
  }

  function ending(a, style) {
    if (style !== 'solo') return [{ s: 0, d: 4 }, { s: 4, d: 4 }, { s: 8, d: 8 }];
    return a.filter((n) => n.s < 8).map((n) => ({ s: n.s, d: Math.min(n.d, 8 - n.s) })).concat([{ s: 8, d: 8 }]);
  }

  // opts: { keyRoot, mode, mel, scaleId ('auto' or a SCALES key), style, density (1–3) }
  function generate(chords, opts, seed) {
    const scaleId = opts.scaleId && opts.scaleId !== 'auto' ? opts.scaleId : autoScale(opts.mode, opts.mel);
    const scale = SCALES[scaleId];
    const style = opts.style === 'solo' ? 'solo' : 'melody';
    const dens = [0.65, 1, 1.4][(opts.density || 2) - 1];
    const lo = 60, hi = style === 'solo' ? 86 : 81, center = (lo + hi) / 2;

    const spans = [];
    let total = 0;
    for (const c of chords) {
      spans.push({ start: total, end: total + c.beats * 4, chord: c });
      total += c.beats * 4;
    }
    const chordAt = (step) => (spans.find((sp) => step >= sp.start && step < sp.end) || spans[spans.length - 1]).chord;

    const scaleNotes = [];
    for (let m = lo; m <= hi; m++) if (scale.pcs.includes((m - opts.keyRoot + 120) % 12)) scaleNotes.push(m);

    const rr = mulberry(seed * 2654435761);
    const A = rhythm(rr, style, dens);
    const motifs = [A, mutate(A, rhythm(rr, style, dens)), rhythm(rr, style, dens)];
    const plan = [0, 1, 0, 2];
    const bars = Math.ceil(total / 16);
    const notes = [];
    let prev = null;

    for (let b = 0; b < bars; b++) {
      const isLast = b === bars - 1 && bars > 1;
      const id = plan[b % 4];
      const R = isLast ? ending(A, style) : motifs[id];
      // Bars that share a motif share a decision stream, so their contours match.
      const prng = mulberry(seed * 7919 + (isLast ? 3 : id === 1 ? 0 : id) * 104729 + 13);
      let dir = prng() < 0.5 ? 1 : -1;

      for (const n of R) {
        const abs = b * 16 + n.s;
        if (abs >= total) break;
        const d = Math.min(n.d, total - abs);
        const chord = chordAt(abs);
        const pcs = T.chordPcs(chord);
        const iv = T.Q[chord.q].iv;
        const strong = n.s % 8 === 0 || d >= 6 || prev === null;
        let m;

        const tones = [];
        for (let x = lo; x <= hi; x++) if (pcs.includes(x % 12)) tones.push(x);
        const nearestTone = (t) => tones.reduce((best, x) => (Math.abs(x - t) < Math.abs(best - t) ? x : best), tones[0]);

        if (strong) {
          const target = prev === null ? center + (prng() - 0.5) * 6 : prev;
          const w = tones.map((x) => {
            const rel = (x - chord.root + 120) % 12;
            const guide = rel === iv[1] || (iv.length > 3 && rel === iv[3] % 12) ? 1.3 : 1;
            return (guide * (x === prev ? 0.15 : 1)) / Math.pow(1 + Math.abs(x - target), 1.1) / (1 + Math.abs(x - center) / 8);
          });
          let r = prng() * w.reduce((a, x) => a + x, 0);
          m = tones[tones.length - 1];
          for (let k = 0; k < tones.length; k++) {
            r -= w[k];
            if (r <= 0) { m = tones[k]; break; }
          }
        } else {
          if (prng() < 0.3) dir = -dir;
          if (prev > hi - 3) dir = -1;
          if (prev < lo + 3) dir = 1;
          const step = prng() < 0.78 ? 1 : 2;
          let idx = 0;
          for (let k = 1; k < scaleNotes.length; k++) if (Math.abs(scaleNotes[k] - prev) < Math.abs(scaleNotes[idx] - prev)) idx = k;
          idx = Math.max(0, Math.min(scaleNotes.length - 1, idx + dir * step));
          m = scaleNotes[idx];
          // A held note a semitone above a chord tone grates: resolve it.
          if (d >= 3 && !pcs.includes(m % 12) && pcs.includes((m + 11) % 12)) m = nearestTone(m);
        }
        notes.push({ s: abs, d, midi: m });
        prev = m;
      }
    }
    return { notes, total, scaleId, scale };
  }

  const TIPS = {
    majPent: 'Five notes that sit safely over every chord. Phrase in short call-and-response ideas and land on a shaded chord tone when the chord changes.',
    minPent: 'Five notes that sit safely over every chord. Phrase in short call-and-response ideas and land on a shaded chord tone when the chord changes.',
    blues: 'Use the ♭5 as a passing note rather than a resting point, and over the I chord bend the ♭3 up toward the major 3rd.',
    major: 'Aim for the 3rd of each chord on strong beats; the 4th and 7th work best as passing notes.',
    minor: 'Aim for the 3rd of each chord on strong beats; the ♭6 gives the minor sound its ache when it falls to the 5th.',
    dorian: 'The natural 6th is the Dorian colour note — feature it over the IV chord.',
    mixolydian: 'The ♭7 is the Mixolydian colour note — lean on it over the ♭VII chord.',
    lydian: 'The ♯4 is the Lydian colour note — let it ring instead of resolving it.',
    phrygian: 'The ♭2 is the Phrygian colour note — fall from it onto the root for the dark half-step pull.',
    harmonic: 'The raised 7th leads strongly up to the root; use it over the V chord.',
    phrygdom: 'Play up the ♭2 against the major 3rd — that augmented-second gap is the whole sound.',
  };

  // Scale advice for soloing over the progression.
  function advice(chords, opts, scaleId) {
    const fam = T.MODES[opts.mode].family;
    const flat = T.keyFlat(opts.keyRoot, opts.mode);
    const names = (id) => SCALES[id].pcs.map((pc) => T.spell(opts.keyRoot + pc, flat)).join(' ');
    const rel = (c) => (c.root - opts.keyRoot + 12) % 12;
    const has = (semi, test) => chords.some((c) => rel(c) === semi && test(c.q));
    const alts = [];
    const add = (id, why) => { if (id !== scaleId && !alts.some((a) => a.id === id)) alts.push({ id, name: SCALES[id].name, notes: names(id), why }); };

    if (fam === 'minor') {
      add('minPent', 'the safe choice over a minor key');
      add(opts.mode, 'the full scale of the key');
      if (has(5, T.isMajorish)) add('dorian', 'matches the major IV chord');
      if (has(7, T.isMajorish)) add('harmonic', 'matches the major V chord');
      add('blues', 'adds grit with the ♭5');
    } else {
      add('majPent', 'the safe choice over a major key');
      add(opts.mode, 'the full scale of the key');
      if (has(10, T.isMajorish) || has(0, T.isDominant)) add('mixolydian', 'matches the ♭VII or I7 chord');
      if (has(0, T.isDominant) || has(5, T.isDominant)) add('blues', 'the classic sound over dominant 7ths');
    }
    return {
      root: T.spell(opts.keyRoot, flat),
      name: SCALES[scaleId].name,
      notes: names(scaleId),
      tip: TIPS[scaleId],
      alts: alts.slice(0, 3),
    };
  }

  AP.melody = { SCALES, generate, advice, autoScale };
})(globalThis.AP);
