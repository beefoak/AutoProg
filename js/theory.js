// Music theory primitives: notes, modes, chord qualities, Roman numerals.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';

  const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const KEY_LABELS = ['C', 'C♯ / D♭', 'D', 'E♭', 'E', 'F', 'F♯ / G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

  // rel = semitones from the mode's root down to its relative major (used for spelling).
  const MODES = {
    major: { name: 'Major (Ionian)', short: 'major', pcs: [0, 2, 4, 5, 7, 9, 11], family: 'major', rel: 0 },
    minor: { name: 'Minor (Aeolian)', short: 'minor', pcs: [0, 2, 3, 5, 7, 8, 10], family: 'minor', rel: 9 },
    dorian: { name: 'Dorian', short: 'Dorian', pcs: [0, 2, 3, 5, 7, 9, 10], family: 'minor', rel: 2 },
    mixolydian: { name: 'Mixolydian', short: 'Mixolydian', pcs: [0, 2, 4, 5, 7, 9, 10], family: 'major', rel: 7 },
    lydian: { name: 'Lydian', short: 'Lydian', pcs: [0, 2, 4, 6, 7, 9, 11], family: 'major', rel: 5 },
    phrygian: { name: 'Phrygian', short: 'Phrygian', pcs: [0, 1, 3, 5, 7, 8, 10], family: 'minor', rel: 4 },
    harmonic: { name: 'Harmonic minor', short: 'harmonic minor', pcs: [0, 2, 3, 5, 7, 8, 11], family: 'minor', rel: 9 },
    phrygdom: { name: 'Phrygian dominant', short: 'Phrygian dominant', pcs: [0, 1, 4, 5, 7, 8, 10], family: 'major', rel: 4 },
  };

  // label = suffix after the root, iv = intervals in semitones, g = editor group.
  const Q = {
    maj: { label: '', name: 'Major', iv: [0, 4, 7], g: 'Triads' },
    min: { label: 'm', name: 'Minor', iv: [0, 3, 7], g: 'Triads' },
    dim: { label: '°', name: 'Diminished', iv: [0, 3, 6], g: 'Triads' },
    aug: { label: '+', name: 'Augmented', iv: [0, 4, 8], g: 'Triads' },
    5: { label: '5', name: 'Power chord', iv: [0, 7], g: 'Triads' },
    sus2: { label: 'sus2', name: 'Suspended 2nd', iv: [0, 2, 7], g: 'Suspended & added' },
    sus4: { label: 'sus4', name: 'Suspended 4th', iv: [0, 5, 7], g: 'Suspended & added' },
    '7sus4': { label: '7sus4', name: 'Dominant 7 sus4', iv: [0, 5, 7, 10], g: 'Suspended & added' },
    add9: { label: 'add9', name: 'Major add 9', iv: [0, 4, 7, 14], g: 'Suspended & added' },
    madd9: { label: 'm(add9)', name: 'Minor add 9', iv: [0, 3, 7, 14], g: 'Suspended & added' },
    6: { label: '6', name: 'Major 6th', iv: [0, 4, 7, 9], g: 'Suspended & added' },
    m6: { label: 'm6', name: 'Minor 6th', iv: [0, 3, 7, 9], g: 'Suspended & added' },
    69: { label: '6/9', name: 'Six-nine', iv: [0, 4, 7, 9, 14], g: 'Suspended & added' },
    7: { label: '7', name: 'Dominant 7th', iv: [0, 4, 7, 10], g: 'Sevenths' },
    maj7: { label: 'maj7', name: 'Major 7th', iv: [0, 4, 7, 11], g: 'Sevenths' },
    m7: { label: 'm7', name: 'Minor 7th', iv: [0, 3, 7, 10], g: 'Sevenths' },
    mMaj7: { label: 'm(maj7)', name: 'Minor-major 7th', iv: [0, 3, 7, 11], g: 'Sevenths' },
    m7b5: { label: 'ø7', name: 'Half-diminished', iv: [0, 3, 6, 10], g: 'Sevenths' },
    dim7: { label: '°7', name: 'Diminished 7th', iv: [0, 3, 6, 9], g: 'Sevenths' },
    9: { label: '9', name: 'Dominant 9th', iv: [0, 4, 7, 10, 14], g: 'Extended & altered' },
    maj9: { label: 'maj9', name: 'Major 9th', iv: [0, 4, 7, 11, 14], g: 'Extended & altered' },
    m9: { label: 'm9', name: 'Minor 9th', iv: [0, 3, 7, 10, 14], g: 'Extended & altered' },
    m11: { label: 'm11', name: 'Minor 11th', iv: [0, 3, 7, 10, 14, 17], g: 'Extended & altered' },
    13: { label: '13', name: 'Dominant 13th', iv: [0, 4, 7, 10, 14, 21], g: 'Extended & altered' },
    '7#9': { label: '7♯9', name: 'Dominant 7 sharp 9', iv: [0, 4, 7, 10, 15], g: 'Extended & altered' },
    '7b9': { label: '7♭9', name: 'Dominant 7 flat 9', iv: [0, 4, 7, 10, 13], g: 'Extended & altered' },
  };

  const NUM = { i: 0, ii: 2, iii: 4, iv: 5, v: 7, vi: 9, vii: 11 };
  const RE = /^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/;
  const UP = {
    '': 'maj', 7: '7', maj7: 'maj7', maj9: 'maj9', 6: '6', 69: '69', 9: '9', 13: '13', sus2: 'sus2', sus4: 'sus4',
    5: '5', add9: 'add9', '7sus4': '7sus4', '7#9': '7#9', '7b9': '7b9', '+': 'aug', '°': 'dim', '°7': 'dim7',
  };
  const LOW = {
    '': 'min', 7: 'm7', 9: 'm9', 6: 'm6', 11: 'm11', maj7: 'mMaj7', add9: 'madd9', '°': 'dim', '°7': 'dim7',
    'ø': 'm7b5', 'ø7': 'm7b5', 5: '5', sus2: 'sus2', sus4: 'sus4',
  };

  // "bVII7" -> { semi: 10, q: '7', fl: true }. Numerals are always relative to the major scale.
  function parseRoman(tok) {
    const m = RE.exec(tok);
    if (!m) throw new Error('Bad numeral: ' + tok);
    const upper = m[2] === m[2].toUpperCase();
    const q = (upper ? UP : LOW)[m[3]];
    if (!q) throw new Error('Bad chord suffix: ' + tok);
    let semi = NUM[m[2].toLowerCase()];
    if (m[1] === 'b') semi -= 1;
    if (m[1] === '#') semi += 1;
    const out = { semi: (semi + 12) % 12, q };
    if (m[1] === 'b') out.fl = true;
    if (m[1] === '#') out.fl = false;
    return out;
  }

  const DEG = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  const ROMAN_SUFFIX = {
    maj: '', min: '', dim: '°', aug: '+', m7: '7', mMaj7: 'maj7', dim7: '°7', m7b5: 'ø7', m6: '6', m9: '9',
    m11: '11', madd9: 'add9',
  };

  const isMinorish = (q) => Q[q].iv.includes(3) && !Q[q].iv.includes(4);
  const isMajorish = (q) => Q[q].iv.includes(4);
  const isDominant = (q) => Q[q].iv.includes(4) && Q[q].iv.includes(10);

  function roman(chord, keyRoot) {
    const semi = (chord.root - keyRoot + 12) % 12;
    let n = semi === 6 && chord.fl ? '♭V' : DEG[semi];
    if (isMinorish(chord.q)) n = n.toLowerCase();
    const suf = chord.q in ROMAN_SUFFIX ? ROMAN_SUFFIX[chord.q] : Q[chord.q].label;
    return n + suf;
  }

  function keyFlat(root, mode) {
    const rel = (root - MODES[mode].rel + 12) % 12;
    return [5, 10, 3, 8, 1].includes(rel);
  }

  const spell = (pc, flat) => (flat ? FLAT : SHARP)[((pc % 12) + 12) % 12];
  const chordFlat = (chord, flat) => (chord.fl === undefined ? flat : chord.fl);
  const rootName = (chord, flat) => spell(chord.root, chordFlat(chord, flat));
  const chordName = (chord, flat) => rootName(chord, flat) + Q[chord.q].label;
  const chordPcs = (chord) => Q[chord.q].iv.map((i) => (chord.root + i) % 12);
  const chordNotes = (chord, flat) => chordPcs(chord).map((pc) => spell(pc, chordFlat(chord, flat)));
  const midiName = (m, flat) => spell(m % 12, flat) + (Math.floor(m / 12) - 1);

  // Chords built on each degree of a mode by stacking thirds.
  function diatonic(mode, sevenths) {
    const pcs = MODES[mode].pcs;
    return pcs.map((semi, i) => {
      const at = (k) => (pcs[(i + k) % 7] - semi + 12) % 12;
      const third = at(2), fifth = at(4), sev = at(6);
      let q = third === 4 ? (fifth === 8 ? 'aug' : 'maj') : fifth === 6 ? 'dim' : 'min';
      if (sevenths) {
        if (q === 'maj') q = sev === 11 ? 'maj7' : '7';
        else if (q === 'min') q = sev === 10 ? 'm7' : 'mMaj7';
        else if (q === 'dim') q = sev === 10 ? 'm7b5' : 'dim7';
      }
      return { semi, q };
    });
  }

  AP.theory = {
    SHARP, FLAT, KEY_LABELS, MODES, Q, parseRoman, roman, keyFlat, spell, rootName, chordName, chordPcs,
    chordNotes, midiName, diatonic, isMinorish, isMajorish, isDominant,
  };
})(globalThis.AP);
