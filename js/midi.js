// Standard MIDI file (format 1) export: tempo track, chords, bass, melody.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';
  const PPQ = 480;

  function vlq(n) {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  }
  const str = (s) => Array.from(s).map((ch) => ch.charCodeAt(0) & 0x7f);
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

  function chunk(id, data) {
    return str(id).concat(u32(data.length), data);
  }

  // notes: [{ beat, dur, midi, vel }]
  function track(name, channel, program, notes, meta) {
    const ev = [];
    for (const n of notes) {
      const on = Math.round(n.beat * PPQ), off = Math.max(on + 1, Math.round((n.beat + n.dur) * PPQ));
      ev.push({ tick: on, order: 1, bytes: [0x90 | channel, n.midi, n.vel] });
      ev.push({ tick: off, order: 0, bytes: [0x80 | channel, n.midi, 0] });
    }
    ev.sort((a, b) => a.tick - b.tick || a.order - b.order);
    let data = [0, 0xff, 0x03].concat(vlq(name.length), str(name));
    if (meta) data = data.concat(meta);
    if (program !== null) data = data.concat([0, 0xc0 | channel, program]);
    let last = 0;
    for (const e of ev) {
      data = data.concat(vlq(e.tick - last), e.bytes);
      last = e.tick;
    }
    return chunk('MTrk', data.concat([0, 0xff, 0x2f, 0]));
  }

  function build(st) {
    const us = Math.round(60000000 / st.tempo);
    const tempoMeta = [0, 0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255, 0, 0xff, 0x58, 4, 4, 2, 24, 8];
    const chords = [], bass = [], lead = [];
    let beat = 0;
    for (const c of st.chords) {
      for (const m of AP.audio.voicing(c)) chords.push({ beat, dur: c.beats, midi: m, vel: 80 });
      bass.push({ beat, dur: c.beats, midi: AP.audio.bassNote(c) + 12, vel: 90 });
      beat += c.beats;
    }
    if (st.melody) for (const n of st.melody.notes) lead.push({ beat: n.s / 4, dur: n.d / 4, midi: n.midi, vel: 96 });

    const tracks = [track('AutoProg', 0, null, [], tempoMeta), track('Chords', 0, 0, chords), track('Bass', 1, 33, bass)];
    if (lead.length) tracks.push(track('Melody', 2, 80, lead));
    const header = chunk('MThd', [0, 1, 0, tracks.length, (PPQ >> 8) & 255, PPQ & 255]);
    return new Uint8Array(header.concat(...tracks));
  }

  AP.midi = { build };
})(globalThis.AP);
