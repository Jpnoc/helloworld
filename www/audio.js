// Void Shards audio engine: every sound is synthesized live with Web Audio (no asset files).
const Audio2 = (() => {
  let ctx = null, master, sfxBus, musicBus, reverb, comp;
  let musicOn = true, sfxOn = true;
  let musicTimer = null, nextNoteTime = 0, step = 0, intensity = 0;
  const BPM = 104;
  const STEP = 60 / BPM / 4; // 16th notes

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('vs_audio') || '{}');
      if (s.music === false) musicOn = false;
      if (s.sfx === false) sfxOn = false;
    } catch (e) {}
  }
  function save() { try { localStorage.setItem('vs_audio', JSON.stringify({ music: musicOn, sfx: sfxOn })); } catch (e) {} }
  load();

  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate, len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  let noiseBuf;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(3.2, 2.6);
    const revGain = ctx.createGain(); revGain.gain.value = 0.35;
    reverb.connect(revGain); revGain.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.8 : 0; sfxBus.connect(master); sfxBus.connect(reverb);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.42 : 0; musicBus.connect(master); musicBus.connect(reverb);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    startMusic();
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function env(g, t, a, peak, d, sustain = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  }

  function tone(freq, t, dur, { type = 'sine', vol = 0.3, attack = 0.005, bus, detune = 0, cutoff = 0, glide = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), t + dur);
    env(g, t, attack, vol, dur);
    let node = o;
    if (cutoff) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
    node.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + attack + dur + 0.05);
  }

  function noise(t, dur, { vol = 0.3, type = 'bandpass', freq = 1000, q = 1, sweep = 0, bus } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = ctx.createGain(); env(g, t, 0.005, vol, dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // A-minor pentatonic ladder for rising cascade chimes
  const LADDER = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91];

  const sfx = {
    select() { if (!ctx) return; const t = ctx.currentTime; tone(1320, t, 0.06, { type: 'triangle', vol: 0.12 }); },
    swap() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.18, { vol: 0.18, freq: 600, sweep: 3200, q: 2 }); },
    invalid() { if (!ctx) return; const t = ctx.currentTime; tone(180, t, 0.18, { type: 'square', vol: 0.12, cutoff: 900 }); tone(140, t + 0.09, 0.2, { type: 'square', vol: 0.12, cutoff: 900 }); },
    match(cascade, count) {
      if (!ctx) return; const t = ctx.currentTime;
      const base = Math.min(cascade * 2, LADDER.length - 3);
      const n = Math.min(3, 1 + Math.floor(count / 4));
      for (let i = 0; i < n; i++) {
        const m = LADDER[base + i];
        tone(mtof(m), t + i * 0.045, 0.45, { type: 'triangle', vol: 0.2 });
        tone(mtof(m + 12), t + i * 0.045, 0.3, { type: 'sine', vol: 0.08, detune: 7 });
      }
      noise(t, 0.12, { vol: 0.12, type: 'highpass', freq: 5000 });
    },
    special() {
      if (!ctx) return; const t = ctx.currentTime;
      [69, 76, 81, 88].forEach((m, i) => tone(mtof(m), t + i * 0.05, 0.5, { type: 'sawtooth', vol: 0.09, cutoff: 4000 }));
    },
    beam() { if (!ctx) return; const t = ctx.currentTime; tone(1800, t, 0.4, { type: 'sawtooth', vol: 0.12, glide: 0.1, cutoff: 6000 }); noise(t, 0.35, { vol: 0.25, freq: 3000, sweep: 300, q: 3 }); },
    boom(big = 1) {
      if (!ctx) return; const t = ctx.currentTime;
      tone(110 * big, t, 0.6, { type: 'sine', vol: 0.6, glide: 0.25 });
      tone(55, t, 0.9, { type: 'triangle', vol: 0.35, glide: 0.5 });
      noise(t, 0.7, { vol: 0.5, type: 'lowpass', freq: 3000, sweep: 120 });
    },
    prism() {
      if (!ctx) return; const t = ctx.currentTime;
      for (let i = 0; i < 12; i++) tone(mtof(LADDER[i]), t + i * 0.03, 0.6, { type: 'triangle', vol: 0.12 });
      tone(55, t, 1.4, { type: 'sawtooth', vol: 0.25, cutoff: 400 });
      noise(t, 1.2, { vol: 0.25, freq: 200, sweep: 8000, q: 1 });
    },
    crack() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.12, { vol: 0.3, type: 'highpass', freq: 3000 }); tone(2400, t, 0.08, { type: 'square', vol: 0.05 }); },
    stone() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.25, { vol: 0.4, type: 'lowpass', freq: 900 }); tone(90, t, 0.2, { vol: 0.3, glide: 0.5 }); },
    corrupt() { if (!ctx) return; const t = ctx.currentTime; tone(70, t, 0.8, { type: 'sawtooth', vol: 0.25, cutoff: 500, glide: 0.6 }); tone(73, t, 0.8, { type: 'sawtooth', vol: 0.2, cutoff: 500, glide: 0.6 }); noise(t, 0.6, { vol: 0.15, freq: 300, q: 8 }); },
    purge() { if (!ctx) return; const t = ctx.currentTime; tone(300, t, 0.3, { type: 'sine', vol: 0.2, glide: 3 }); },
    tick(urgent) { if (!ctx) return; const t = ctx.currentTime; tone(urgent ? 1760 : 880, t, 0.07, { type: 'square', vol: urgent ? 0.14 : 0.07, cutoff: 3000 }); if (urgent) tone(1760, t + 0.12, 0.07, { type: 'square', vol: 0.14, cutoff: 3000 }); },
    win() {
      if (!ctx) return; const t = ctx.currentTime;
      [69, 72, 76, 81, 84, 88].forEach((m, i) => { tone(mtof(m), t + i * 0.11, 0.9, { type: 'triangle', vol: 0.2 }); tone(mtof(m - 12), t + i * 0.11, 0.9, { type: 'sawtooth', vol: 0.06, cutoff: 2000 }); });
    },
    lose() {
      if (!ctx) return; const t = ctx.currentTime;
      [64, 63, 62, 57].forEach((m, i) => tone(mtof(m), t + i * 0.28, 0.6, { type: 'sawtooth', vol: 0.14, cutoff: 1200 }));
      tone(40, t, 2, { type: 'sine', vol: 0.4, glide: 0.5 });
    },
    star(i) { if (!ctx) return; const t = ctx.currentTime; tone(mtof(81 + i * 4), t, 0.5, { type: 'triangle', vol: 0.2 }); tone(mtof(93 + i * 4), t, 0.4, { vol: 0.08 }); },
  };

  // ---- generative music: dark minor groove, intensity rises when moves run low ----
  const CHORDS = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]]; // Am F C G
  const ARP = [0, 2, 4, 3, 1, 3, 4, 2];

  function scheduleStep(t) {
    const bar = Math.floor(step / 16) % CHORDS.length;
    const s = step % 16;
    const chord = CHORDS[bar];
    if (s === 0) {
      chord.slice(1).forEach((m, i) => {
        tone(mtof(m), t, STEP * 15, { type: 'sawtooth', vol: 0.05, attack: 0.6, bus: musicBus, detune: (i % 2 ? 9 : -9), cutoff: 700 + intensity * 900 });
      });
    }
    // bass
    if (s % 4 === 0 || (intensity > 0.5 && s % 4 === 3)) tone(mtof(chord[0] - 12), t, STEP * 2.5, { type: 'square', vol: 0.16, bus: musicBus, cutoff: 260 + intensity * 300 });
    // kick
    if (s % 4 === 0) { tone(150, t, 0.25, { vol: 0.5, glide: 0.25, bus: musicBus }); }
    // snare on 2 and 4
    if (s === 4 || s === 12) noise(t, 0.18, { vol: 0.18, freq: 1800, q: 0.8, bus: musicBus });
    // hats, more with intensity
    if (s % 2 === 1 || (intensity > 0.3 && Math.random() < 0.6)) noise(t, 0.04, { vol: 0.05 + intensity * 0.05, type: 'highpass', freq: 8000, bus: musicBus });
    // arpeggio
    const arpEvery = intensity > 0.6 ? 1 : 2;
    if (s % arpEvery === 0) {
      const m = chord[ARP[(s / arpEvery) % ARP.length] % chord.length] + 12;
      tone(mtof(m), t, STEP * 1.6, { type: 'triangle', vol: 0.06 + intensity * 0.03, bus: musicBus });
    }
    step++;
  }

  function startMusic() {
    if (musicTimer) return;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      while (nextNoteTime < ctx.currentTime + 0.15) { scheduleStep(nextNoteTime); nextNoteTime += STEP; }
    }, 30);
  }

  return {
    init, sfx,
    setIntensity(v) { intensity = Math.max(0, Math.min(1, v)); },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    toggleMusic() { musicOn = !musicOn; if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 0.42 : 0, ctx.currentTime, 0.1); save(); return musicOn; },
    toggleSfx() { sfxOn = !sfxOn; if (sfxBus) sfxBus.gain.setTargetAtTime(sfxOn ? 0.8 : 0, ctx.currentTime, 0.05); save(); return sfxOn; },
    suspend() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
  };
})();
