// Web Audio playback: a small synth (chords, bass, lead) driven by a look-ahead scheduler.
globalThis.AP = globalThis.AP || {};
(function (AP) {
  'use strict';
  const T = AP.theory;
  let ctx = null, master = null, bus = null, timer = null, endTimer = null;
  let events = [], total = 0, idx = 0, loopStart = 0, spb = 0.5, getState = null, playing = false;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function newBus() {
    bus = ctx.createGain();
    bus.connect(master);
  }

  function killBus() {
    if (!bus) return;
    const old = bus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
    setTimeout(() => old.disconnect(), 200);
    bus = null;
  }

  const VOICES = {
    chord: { types: ['triangle', 'sawtooth'], mix: [0.5, 0.12], cutoff: 1700, attack: 0.012, release: 0.18, gain: 0.16 },
    bass: { types: ['sine', 'triangle'], mix: [0.7, 0.3], cutoff: 700, attack: 0.008, release: 0.1, gain: 0.34 },
    lead: { types: ['square', 'sawtooth'], mix: [0.22, 0.2], cutoff: 2600, attack: 0.008, release: 0.09, gain: 0.3 },
  };

  function tone(midi, t, dur, kind, vel) {
    const v = VOICES[kind];
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = v.cutoff;
    const g = ctx.createGain();
    const peak = v.gain * (vel || 1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + v.attack);
    g.gain.linearRampToValueAtTime(peak * 0.6, t + Math.max(v.attack + 0.01, dur));
    g.gain.linearRampToValueAtTime(0, t + dur + v.release);
    f.connect(g);
    g.connect(bus);
    v.types.forEach((type, i) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type;
      o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      if (i) o.detune.value = 6;
      og.gain.value = v.mix[i];
      o.connect(og);
      og.connect(f);
      o.start(t);
      o.stop(t + dur + v.release + 0.05);
    });
  }

  // Close-position voicing around middle C, so successive chords move smoothly.
  function voicing(chord) {
    let iv = T.Q[chord.q].iv;
    if (iv.length > 4) iv = iv.filter((i) => i !== 7);
    return iv.map((i) => 55 + ((chord.root + i - 7 + 120) % 12));
  }
  const bassNote = (chord) => 28 + ((chord.root - 4 + 12) % 12);

  // Flatten the song into timed events (beats). Also used by the MIDI export.
  function buildEvents(st) {
    const ev = [];
    let beat = 0;
    if (st.playChords) {
      for (const c of st.chords) {
        const v = voicing(c), b = bassNote(c), n = c.beats;
        const push = (at, dur, notes, kind, vel) => ev.push({ beat: beat + at, dur, notes, kind, vel });
        if (st.feel === 'pad') {
          push(0, n * 0.98, v, 'chord', 0.9);
          push(0, n * 0.98, [b], 'bass', 0.9);
        } else if (st.feel === 'eighth') {
          for (let k = 0; k < n * 2; k++) {
            push(k / 2, 0.36, v, 'chord', k % 2 ? 0.6 : 0.85);
            push(k / 2, 0.4, [b], 'bass', k % 2 ? 0.7 : 1);
          }
        } else if (st.feel === 'arp') {
          const up = v.slice().sort((x, y) => x - y);
          const pat = up.concat(up.slice(1, -1).reverse());
          for (let k = 0; k < n * 2; k++) push(k / 2, 0.7, [pat[k % pat.length] + 12], 'chord', 1.1);
          push(0, n * 0.95, [b], 'bass', 0.9);
        } else if (st.feel === 'offbeat') {
          for (let k = 0; k < n; k++) {
            push(k + 0.5, 0.3, v, 'chord', 0.95);
            if (k % 2 === 0) push(k, 0.8, [b], 'bass', 1);
          }
        } else {
          for (let k = 0; k < n; k++) push(k, 0.8, v, 'chord', k % 2 ? 0.65 : 0.9);
          for (let k = 0; k < n; k += 2) push(k, 1.6, [b], 'bass', 1);
        }
        beat += n;
      }
    }
    const totalBeats = st.chords.reduce((a, c) => a + c.beats, 0);
    if (st.playMelody && st.melody) {
      for (const n of st.melody.notes) ev.push({ beat: n.s / 4, dur: Math.max(0.2, n.d / 4 - 0.04), notes: [n.midi], kind: 'lead', vel: 1 });
    }
    if (st.swing) {
      for (const e of ev) {
        const fr = e.beat - Math.floor(e.beat);
        if (Math.abs(fr - 0.5) < 0.01) {
          e.beat += 1 / 6;
          e.dur = Math.max(0.15, e.dur - 1 / 6);
        }
      }
    }
    ev.sort((a, b) => a.beat - b.beat);
    return { events: ev, total: totalBeats };
  }

  function rebuild() {
    const st = getState();
    const b = buildEvents(st);
    events = b.events;
    total = b.total;
    spb = 60 / st.tempo;
    master.gain.value = st.vol;
  }

  function tick() {
    if (!playing) return;
    if (total <= 0) return stop();
    const horizon = ctx.currentTime + 0.15;
    for (;;) {
      if (idx >= events.length) {
        const end = loopStart + total * spb;
        if (end > horizon) break;
        if (!getState().loop) {
          clearInterval(timer);
          timer = null;
          endTimer = setTimeout(stop, Math.max(0, (end - ctx.currentTime) * 1000));
          break;
        }
        loopStart = end;
        idx = 0;
        rebuild();
        if (!events.length) break;
        continue;
      }
      const e = events[idx];
      const t = loopStart + e.beat * spb;
      if (t > horizon) break;
      for (const m of e.notes) tone(m, Math.max(t, ctx.currentTime), e.dur * spb, e.kind, e.vel);
      idx++;
    }
  }

  function start(stateGetter) {
    ensure();
    stop();
    getState = stateGetter;
    newBus();
    rebuild();
    loopStart = ctx.currentTime + 0.08;
    idx = 0;
    playing = true;
    timer = setInterval(tick, 25);
    tick();
  }

  function stop() {
    playing = false;
    clearInterval(timer);
    clearTimeout(endTimer);
    timer = endTimer = null;
    if (ctx) killBus();
  }

  // Current position in beats, or -1 when stopped.
  function beat() {
    if (!playing || total <= 0) return -1;
    const b = (ctx.currentTime - loopStart) / spb;
    return ((b % total) + total) % total;
  }

  // Re-read the song after an edit without restarting playback.
  function refresh() {
    if (!ctx) return;
    if (!playing) {
      if (getState) master.gain.value = getState().vol;
      return;
    }
    const cur = Math.max(0, (ctx.currentTime - loopStart) / spb);
    rebuild();
    if (cur >= total) {
      loopStart = ctx.currentTime + 0.03;
      idx = 0;
      return;
    }
    loopStart = ctx.currentTime - cur * spb;
    const now = ctx.currentTime + 0.16;
    idx = events.findIndex((e) => loopStart + e.beat * spb >= now);
    if (idx < 0) idx = events.length;
  }

  // Play one chord on its own (used when selecting or editing).
  function audition(chord, vol) {
    ensure();
    if (playing) return;
    if (!bus) newBus();
    master.gain.value = vol;
    const t = ctx.currentTime + 0.02;
    voicing(chord).forEach((m, i) => tone(m, t + i * 0.018, 0.9, 'chord', 1));
    tone(bassNote(chord), t, 0.9, 'bass', 0.9);
  }

  AP.audio = { start, stop, beat, refresh, audition, buildEvents, voicing, bassNote, isPlaying: () => playing };
})(globalThis.AP);
