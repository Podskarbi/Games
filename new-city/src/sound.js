/* ============================================================
   sound.js — tiny, friendly sound effects made with the Web
   Audio API (no files to download). Everything is soft and
   cartoony. A mute toggle keeps it polite.
   ============================================================ */

window.Sound = (function () {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Play a quick tone with an envelope. type: 'sine'|'square'|'triangle'|'sawtooth'
  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur + 0.02);
  }

  // Soft noise burst for "poof" and "sweep".
  function noise(dur, gain, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq || 1200;
    const g = ac.createGain();
    g.gain.value = gain || 0.2;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
  }

  const effects = {
    smash() { noise(0.18, 0.25, 900); tone(220, 0.18, 'square', 0.12, 90); },
    sweep() { noise(0.15, 0.12, 2500); },
    place() { tone(540, 0.12, 'triangle', 0.16, 720); },
    remove() { tone(300, 0.1, 'sine', 0.12, 200); },
    tab() { tone(660, 0.07, 'sine', 0.1); },
    pick() { tone(880, 0.08, 'triangle', 0.12); },
    permission() { tone(520, 0.12, 'sine', 0.14, 660); tone(660, 0.14, 'sine', 0.12, 780); },
    done() { tone(523, 0.12, 'triangle', 0.16); tone(659, 0.12, 'triangle', 0.16); },
    movein() {
      // happy little arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => setTimeout(() => tone(n, 0.16, 'triangle', 0.18), i * 110));
    },
    sparkle() { tone(1320, 0.1, 'sine', 0.08, 1760); },
  };

  function play(name) {
    const fn = effects[name];
    if (fn) try { fn(); } catch (e) { /* ignore audio hiccups */ }
  }

  function setMuted(v) { muted = !!v; }
  function toggle() { muted = !muted; return muted; }
  function isMuted() { return muted; }

  return { play, setMuted, toggle, isMuted };
})();
