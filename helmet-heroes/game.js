/* ============================================================
   Helmet Heroes — Skate Park — game.js
   Plain JavaScript + <canvas>. No libraries. Saves to localStorage.

   The big idea: SAFE skating is how you win. Helmet on = points and
   stamina; helmet off = wipeouts and a police-skater chase.
   ============================================================ */

(function () {
  "use strict";

  // ---------- Tunable numbers ----------
  const CFG = {
    baseSpeed: 250,          // px/sec at level 1
    spacing: 1.45,           // seconds between obstacles
    skaterX: 0.30,           // skater horizontal position (fraction of width)
    reticleLead: 1.05,       // seconds before the tap the ring appears
    staminaStart: 100,
    staminaMissHelmet: 6,
    staminaMissNoHelmet: 22,
    helmetlessDrain: 2.0,    // stamina/sec lost while helmet is OFF (gentle pressure)
    landsPerLevel: 8,
    chaseStartDelay: 2.5,    // seconds helmetless before the cop appears
    chaseClose: 70,          // px/sec the cop gains while you're helmetless
    chaseFlee: 175,          // px/sec the cop drops back once helmet is back on
  };

  const LEVEL_TITLES = ["Mellow Lines", "Steeper Ramps!", "Rail Grind Run", "Pro Park", "Legend Lines"];

  // ---------- Save data ----------
  const SAVE_KEY = "helmetHeroesSave_v1";
  const defaultAvatar = () => ({ gender: "boy", skin: "#f3c39a", hairStyle: "short", hairColor: "#5a3a2a", shirt: "#ff7a3c", face: "happy", ride: "board" });
  const defaultSave = () => ({ best: 0, helmet: "starter", board: "maple", avatar: defaultAvatar() });
  let save = loadSave();
  function loadSave() {
    try {
      const r = localStorage.getItem(SAVE_KEY);
      if (r) { const s = Object.assign(defaultSave(), JSON.parse(r)); s.avatar = Object.assign(defaultAvatar(), s.avatar || {}); return s; }
    } catch (e) {}
    return defaultSave();
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

  const HELMETS = window.HELMETS, BOARDS = window.BOARDS, TRICKS = window.TRICKS, FACTS = window.FACTS;
  const helmetById = (id) => HELMETS.find((h) => h.id === id) || HELMETS[0];
  const boardById = (id) => BOARDS.find((b) => b.id === id) || BOARDS[0];

  // ---------- Avatar customization options ----------
  const GENDERS = [{ id: "boy", label: "🧒 Boy" }, { id: "girl", label: "👧 Girl" }];
  const RIDES = [{ id: "board", label: "🛹 Skateboard" }, { id: "scooter", label: "🛴 Scooter" }];
  const SKINS = ["#ffe0bd", "#f3c39a", "#e0ac82", "#c68642", "#8d5524", "#5c3a1e"];
  const HAIR_COLORS = ["#2b2b2b", "#5a3a2a", "#a8642a", "#e3b34d", "#d94f8a", "#5b8cff", "#e8e8e8"];
  const SHIRTS = ["#ff7a3c", "#ff8fb1", "#b58cff", "#5bd1c0", "#6fc36b", "#ffd93b", "#ff5a5a", "#4aa6f5"];
  const HAIR_STYLES = [
    { id: "short", label: "Short" }, { id: "swoosh", label: "Swoosh" }, { id: "curly", label: "Curly" },
    { id: "ponytail", label: "Ponytail" }, { id: "bun", label: "Bun" }, { id: "long", label: "Long" }, { id: "none", label: "Bald" },
  ];
  const FACES = [{ id: "happy", label: "😊" }, { id: "grin", label: "😁" }, { id: "cool", label: "😎" }];
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---------- Canvas ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, groundY = 0, skaterPX = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    groundY = H * 0.80;
    skaterPX = W * CFG.skaterX;
    buildSky();
  }
  window.addEventListener("resize", resize);

  let skyGrad = null;
  function buildSky() {
    skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, "#4aa6f5");
    skyGrad.addColorStop(0.55, "#86c9ff");
    skyGrad.addColorStop(1, "#d6f0ff");
  }

  // ---------- State machine ----------
  const S = { TITLE: "title", HOW: "how", GEAR: "gear", PLAY: "play", LEVEL: "level", OVER: "over" };
  let state = S.TITLE;
  const overlays = {};
  document.querySelectorAll(".overlay").forEach((o) => { overlays[o.id.replace("screen-", "")] = o; });
  const playControls = document.getElementById("play-controls");

  function showState(next) {
    state = next;
    Object.values(overlays).forEach((o) => o.classList.remove("active"));
    const map = { title: "title", how: "how", gear: "gear", level: "level", over: "over" };
    if (map[next]) overlays[map[next]].classList.add("active");
    playControls.classList.toggle("hidden", next !== S.PLAY);
    document.getElementById("control-hint").classList.toggle("hidden", next !== S.PLAY);
    if (next === S.TITLE) {
      document.getElementById("hi-title").textContent = save.best ? "Best score: " + save.best : "";
    }
  }

  // ---------- Run state ----------
  let run = null;
  function newRun() {
    return {
      cameraX: 0, speed: CFG.baseSpeed, windowScale: 1,
      score: 0, combo: 0, mult: 1, stamina: CFG.staminaStart,
      helmet: true, level: 1, lands: 0, landsThisLevel: 0,
      obstacles: [], nextSpawnX: W, lastTrickIdx: -1,
      noHelmetT: 0, cop: { active: false, gap: 0 },
      skater: { trickT: 0, trickKind: "ramp", wipeT: 0, bob: 0 },
      floats: [], flash: null, flashT: 0, paused: false,
      helmetData: helmetById(save.helmet), boardData: boardById(save.board),
      escapeMsgT: 0, particles: [], shake: 0,
      challenge: { active: false, timeLeft: 0, total: 0 },
      nextChallengeT: 9 + Math.random() * 7,
    };
  }

  // ---------- Particles (dust on landings, stars on wipeouts) ----------
  function spawnDust(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + (Math.random() - 0.5) * 1.6;
      const sp = 40 + Math.random() * 80;
      run.particles.push({
        x: x + (Math.random() - 0.5) * 16, y: y, vx: Math.cos(a) * sp, vy: -Math.random() * 70 - 10,
        life: 0.5 + Math.random() * 0.3, t: 0, r: 3 + Math.random() * 4, kind: "dust",
      });
    }
  }
  function spawnSparks(x, y) {
    for (let i = 0; i < 8; i++) {
      run.particles.push({
        x: x + 8, y: y - 6, vx: -(50 + Math.random() * 150), vy: -20 - Math.random() * 55,
        life: 0.3 + Math.random() * 0.2, t: 0, r: 2 + Math.random() * 2, kind: "spark", col: Math.random() > 0.5 ? "#ffd93b" : "#fff0a0",
      });
    }
  }
  function spawnStars(x, y) {
    const cols = ["#ffd93b", "#ff8fb1", "#5bd1c0", "#ff5a3c"];
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 140;
      run.particles.push({
        x: x, y: y - 30, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.7 + Math.random() * 0.4, t: 0, r: 4 + Math.random() * 4,
        kind: "star", col: cols[i % cols.length],
      });
    }
  }
  function updateParticles(dt) {
    for (const p of run.particles) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt; p.vx *= 0.96;
    }
    run.particles = run.particles.filter((p) => p.t < p.life);
  }

  // ---------- Audio (Web Audio beeps, no files) ----------
  let actx = null;
  function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return actx; }
  function beep(freq, dur, type, vol) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "square"; o.frequency.value = freq;
    g.gain.value = vol || 0.06;
    o.connect(g); g.connect(a.destination);
    const t = a.currentTime; o.start(t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.stop(t + dur);
  }
  function sndLand(perfect) { beep(perfect ? 880 : 660, 0.12, "square", 0.06); if (perfect) beep(1320, 0.12, "sine", 0.05); }
  function sndCombo(n) { beep(440 + n * 40, 0.1, "triangle", 0.06); }
  function sndWipe() { // funny descending "wah-wah"
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sawtooth"; o.connect(g); g.connect(a.destination);
    const t = a.currentTime; g.gain.value = 0.08;
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.start(t); o.stop(t + 0.55);
  }
  function sndSiren() { beep(700, 0.15, "sine", 0.05); }
  function sndAlert() { beep(880, 0.12, "square", 0.07); beep(660, 0.12, "square", 0.06); }

  // ============================================================
  //  GAMEPLAY
  // ============================================================
  function startRun() {
    audio();
    run = newRun();
    showState(S.PLAY);
    setHelmetButton();
  }

  function pickTrick() {
    let idx;
    do { idx = (Math.random() * TRICKS.length) | 0; } while (idx === run.lastTrickIdx && TRICKS.length > 1);
    run.lastTrickIdx = idx;
    return TRICKS[idx];
  }

  function spawnObstacles() {
    const aheadLimit = run.cameraX + W + 200;
    while (run.nextSpawnX < aheadLimit) {
      const trick = pickTrick();
      run.obstacles.push({ worldX: run.nextSpawnX, type: trick.obstacle, trick: trick, resolved: false, result: null });
      run.nextSpawnX += run.speed * CFG.spacing;
    }
  }

  function windowPxFor(o) { return run.speed * (o.trick.timingWindowMs / 1000) * run.windowScale; }

  function resolveTap() {
    if (state !== S.PLAY || run.paused || run.skater.wipeT > 0) return;
    // Find the most relevant unresolved obstacle near the skater.
    let best = null, bestAbs = Infinity;
    for (const o of run.obstacles) {
      if (o.resolved) continue;
      const idealCam = o.worldX - skaterPX;
      const delta = run.cameraX - idealCam;       // <0 not yet reached, >0 passed
      const showRange = run.speed * CFG.reticleLead;
      if (delta > -showRange && delta < windowPxFor(o) + 40) {
        if (Math.abs(delta) < bestAbs) { bestAbs = Math.abs(delta); best = o; }
      }
    }
    if (!best) return;
    const win = windowPxFor(best);
    const idealCam = best.worldX - skaterPX;
    const delta = run.cameraX - idealCam;
    if (Math.abs(delta) <= win) land(best, Math.abs(delta) / win);
    else miss(best, true); // tapped but out of window
  }

  function land(o, frac) {
    o.resolved = true; o.result = "land";
    const perfect = frac < 0.34;
    run.combo++;
    run.mult = 1 + Math.floor(run.combo / 3);
    const pts = Math.round(o.trick.points * run.mult * (perfect ? 1.5 : 1));
    run.score += pts;
    run.lands++; run.landsThisLevel++;
    run.skater.trickT = 0.5; run.skater.trickKind = o.type;
    if (o.type === "rail") spawnSparks(skaterPX, groundY - 10); else spawnDust(skaterPX, groundY + 2);
    if (run.helmet) run.stamina = Math.min(100, run.stamina + o.trick.staminaGain * (perfect ? 1.25 : 1));
    addFloat((perfect ? "PERFECT! " : "") + o.trick.name + "  +" + pts, perfect ? "#ffd93b" : "#ffffff");
    sndLand(perfect); if (run.combo >= 3) sndCombo(run.combo);
    // Second wind every 9 in a row
    if (run.combo > 0 && run.combo % 9 === 0) { run.stamina = 100; setFlash("SECOND WIND! 🔋", "#1fb3a6"); }
    else if (run.mult >= 2 && run.combo % 3 === 0) setFlash("x" + run.mult + " COMBO!", "#ffd93b");
    // Level up?
    if (run.landsThisLevel >= CFG.landsPerLevel) levelUp();
  }

  function miss(o, tapped) {
    if (o) { o.resolved = true; o.result = "miss"; }
    run.combo = 0; run.mult = 1;
    if (run.helmet) {
      run.stamina -= CFG.staminaMissHelmet;
      addFloat("Wobble!", "#ffd93b");
      run.skater.trickT = 0.25; run.skater.trickKind = "stumble";
    } else {
      run.stamina -= CFG.staminaMissNoHelmet;
      run.skater.wipeT = 1.0;
      run.shake = 0.5;
      spawnStars(skaterPX, groundY);
      addFloat("WIPEOUT! 💫", "#ff5a3c");
      sndWipe();
    }
    if (run.stamina <= 0) { run.stamina = 0; gameOver("wipeout"); }
  }

  function levelUp() {
    run.level++; run.landsThisLevel = 0;
    run.speed = CFG.baseSpeed * (1 + (run.level - 1) * 0.14);
    run.windowScale = Math.max(0.7, 1 - (run.level - 1) * 0.06);
    const ti = Math.min(run.level - 1, LEVEL_TITLES.length - 1);
    document.getElementById("level-badge").textContent = "Level " + run.level;
    document.getElementById("level-title").textContent = LEVEL_TITLES[ti];
    document.getElementById("level-fact").textContent = FACTS[(run.level - 2 + FACTS.length) % FACTS.length];
    showState(S.LEVEL);
  }

  function gameOver(kind) {
    showState(S.OVER);
    playControls.classList.add("hidden");
    document.getElementById("over-emoji").textContent = kind === "grounded" ? "🛋️" : "💫";
    document.getElementById("over-title").textContent = kind === "grounded" ? "GROUNDED!" : "Out of Stamina!";
    document.getElementById("over-text").textContent = kind === "grounded"
      ? "The police skater caught you. Keep your helmet on to stay in the game!"
      : "Your stamina ran out. Land clean tricks with your helmet on to keep it up!";
    document.getElementById("final-score").textContent = run.score;

    const prevBest = save.best;
    let unlockNote = "";
    if (run.score > save.best) {
      // figure newly unlocked gear between prevBest and new score
      const newly = [].concat(HELMETS, BOARDS).filter((g) => g.unlockScore > prevBest && g.unlockScore <= run.score);
      save.best = run.score; persist();
      document.getElementById("final-best").textContent = "🏆 New best!";
      if (newly.length) unlockNote = "🔓 Unlocked: " + newly.map((g) => g.name).join(", ");
    } else {
      document.getElementById("final-best").textContent = "Best: " + save.best;
    }
    document.getElementById("unlock-note").textContent = unlockNote;
  }

  // ---------- Floating text + flash ----------
  function addFloat(text, color) { run.floats.push({ text, color, x: skaterPX, y: groundY - 150, t: 0 }); }
  function setFlash(text, color) { run.flash = { text, color }; run.flashT = 1.1; }

  // ---------- Helmet button ----------
  function setHelmetButton() {
    const b = document.getElementById("helmet-toggle");
    if (!run) return;
    const ch = run.challenge.active;
    b.textContent = ch ? "🪖 PUT IT ON!" : (run.helmet ? "🪖 Helmet: ON" : "😣 Helmet: OFF");
    b.classList.toggle("off", !run.helmet && !ch);
    b.classList.toggle("alert", ch);
  }
  function toggleHelmet() {
    if (!run || state !== S.PLAY) return;
    // During a "helmet flew off" challenge, pressing it = the save.
    if (run.challenge.active) { succeedChallenge(); return; }
    run.helmet = !run.helmet;
    if (run.helmet) { run.noHelmetT = 0; if (run.cop.active) setFlash("Helmet on — escaping!", "#1fb3a6"); }
    setHelmetButton();
  }

  // ---------- "Helmet flew off!" reaction challenge ----------
  function startChallenge() {
    run.challenge.active = true;
    run.challenge.total = 2.6;
    run.challenge.timeLeft = 2.6;
    run.helmet = false;
    run.noHelmetT = 0;            // re-align the chase timer to this moment
    spawnHelmetPop();
    setFlash("⚠️ HELMET FLEW OFF!", "#ff5a3c");
    sndAlert();
    setHelmetButton();
  }
  function succeedChallenge() {
    const frac = Math.max(0, run.challenge.timeLeft / run.challenge.total);
    const reward = Math.round(8 + 22 * frac);   // faster reaction -> up to +30
    run.stamina = Math.min(100, run.stamina + reward);
    run.challenge.active = false;
    run.helmet = true; run.noHelmetT = 0;
    run.nextChallengeT = 11 + Math.random() * 9;
    addFloat("NICE SAVE! +" + reward + " ⚡", "#1fb3a6");
    setFlash((frac > 0.6 ? "LIGHTNING FAST! " : "Saved! ") + "+" + reward + " energy ⚡", "#1fb3a6");
    sndLand(true);
    setHelmetButton();
  }
  function failChallenge() {
    run.challenge.active = false;
    run.nextChallengeT = 11 + Math.random() * 9;
    setFlash("Too slow! Helmet still off! 😬", "#ff5a3c");
    sndWipe();
    setHelmetButton();
  }
  function spawnHelmetPop() {
    const cols = run.helmetData;
    run.particles.push({
      x: skaterPX, y: groundY - 78, vx: 120, vy: -240, life: 1.0, t: 0, r: 13,
      kind: "helmet", col: cols.shell,
    });
  }

  // ============================================================
  //  UPDATE
  // ============================================================
  function update(dt) {
    if (state !== S.PLAY || run.paused) return;
    run.cameraX += run.speed * dt;
    run.skater.bob += dt * 9;
    if (run.skater.trickT > 0) run.skater.trickT = Math.max(0, run.skater.trickT - dt);
    if (run.skater.wipeT > 0) run.skater.wipeT = Math.max(0, run.skater.wipeT - dt);
    if (run.flashT > 0) run.flashT -= dt;
    if (run.escapeMsgT > 0) run.escapeMsgT -= dt;
    if (run.shake > 0) run.shake = Math.max(0, run.shake - dt);
    updateParticles(dt);

    // "Helmet flew off!" reaction challenge
    if (run.challenge.active) {
      run.challenge.timeLeft -= dt;
      if (run.challenge.timeLeft <= 0) failChallenge();
    } else if (run.helmet && !run.cop.active) {
      // only schedule when calmly skating with the helmet on
      run.nextChallengeT -= dt;
      if (run.nextChallengeT <= 0) startChallenge();
    }

    spawnObstacles();

    // Auto-miss obstacles the skater rolls past untapped
    for (const o of run.obstacles) {
      if (o.resolved) continue;
      const idealCam = o.worldX - skaterPX;
      if (run.cameraX - idealCam > windowPxFor(o)) miss(o, false);
    }
    // Drop obstacles fully off-screen left
    run.obstacles = run.obstacles.filter((o) => (o.worldX - run.cameraX) > -160);

    // Helmetless consequences
    if (!run.helmet) {
      run.noHelmetT += dt;
      run.stamina -= CFG.helmetlessDrain * dt;
      if (run.stamina <= 0) { run.stamina = 0; gameOver("wipeout"); return; }
      if (!run.cop.active && run.noHelmetT >= CFG.chaseStartDelay) {
        run.cop.active = true; run.cop.gap = W * 0.62; setFlash("🚨 Put your helmet ON!", "#ff5a3c"); sndSiren();
      }
    }
    if (run.cop.active) {
      if (run.helmet) {
        run.cop.gap += CFG.chaseFlee * dt;
        if (run.cop.gap > W * 0.72) { run.cop.active = false; run.noHelmetT = 0; setFlash("ESCAPED! 🤙", "#1fb3a6"); }
      } else {
        run.cop.gap -= CFG.chaseClose * dt;
        if (Math.floor(run.cop.gap / 60) !== Math.floor((run.cop.gap + CFG.chaseClose * dt) / 60)) sndSiren();
        if (run.cop.gap <= 0) { gameOver("grounded"); return; }
      }
    }

    // Floats rise + fade
    for (const f of run.floats) { f.t += dt; f.y -= 28 * dt; }
    run.floats = run.floats.filter((f) => f.t < 1.3);
  }

  // ============================================================
  //  RENDER
  // ============================================================
  function render() {
    // Screen shake offset during wipeouts.
    let sx = 0, sy = 0;
    if (run && run.shake > 0) { const m = run.shake * 12; sx = (Math.random() - 0.5) * m; sy = (Math.random() - 0.5) * m; }
    ctx.setTransform(dpr, 0, 0, dpr, sx, sy);

    // Background sky + layered parallax city
    ctx.fillStyle = skyGrad || "#7fc8ff"; ctx.fillRect(-20, -20, W + 40, H + 40);
    drawSun();
    drawClouds();
    drawFarSkyline();
    drawMidBuildings();
    drawHills();
    drawRoadside();
    drawGround();

    if (run && (state === S.PLAY || state === S.LEVEL || state === S.OVER)) {
      if (state === S.PLAY && !run.paused) drawSpeedLines();
      drawObstacles();
      drawCop();
      drawSkaterRun();
      drawParticles();
      drawReticles();
      drawHUD();
      drawFloats();
      drawFlash();
      drawChallenge();
      if (run.paused) drawPaused();
    } else {
      // Idle skater on the title/menus background
      drawIdleSkater();
    }
  }

  // deterministic per-index pseudo-random in [0,1)
  function rnd(i) { const s = Math.sin(i * 127.1 + 11.7) * 43758.5453; return s - Math.floor(s); }
  function parScroll(factor) { return (run ? run.cameraX : performance.now() * 0.04) * factor; }

  function drawSpeedLines() {
    const n = 5;
    ctx.strokeStyle = "rgba(255,255,255,0.30)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const seed = Math.floor(run.cameraX / 60) + i * 53;
      const y = 40 + rnd(seed) * (groundY - 70);
      const x = W - ((run.cameraX * 2.2 + i * 220) % (W + 200));
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    for (const p of run.particles) {
      const a = Math.max(0, 1 - p.t / p.life);
      if (p.kind === "dust") {
        ctx.globalAlpha = a * 0.6; ctx.fillStyle = "#cfd6e0";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === "spark") {
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r * a), 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === "helmet") {
        ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 7);
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(0, 0, p.r, Math.PI, 0); ctx.fill();
        ctx.fillRect(-p.r, -2, p.r * 2, 4); ctx.restore();
      } else {
        ctx.globalAlpha = a; ctx.fillStyle = p.col;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 9);
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // Big on-screen prompt + countdown bar during the helmet challenge.
  function drawChallenge() {
    if (!run.challenge.active) return;
    const cw = Math.min(W - 40, 460), cx = W / 2, top = H * 0.20;
    // panel
    ctx.fillStyle = "rgba(255,90,60,0.95)"; roundRect(cx - cw / 2, top, cw, 92, 16); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = "800 22px Baloo 2, sans-serif";
    ctx.fillText("⚠️ Helmet flew off!", cx, top + 30);
    ctx.font = "800 16px Baloo 2, sans-serif";
    ctx.fillText("Tap 🪖 (or press H) — FAST!", cx, top + 54);
    // countdown bar (green -> red), wider = more time left
    const frac = Math.max(0, run.challenge.timeLeft / run.challenge.total);
    const barW = cw - 36, bx = cx - barW / 2, byy = top + 68;
    ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(bx, byy, barW, 12, 6); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? "#5dff8b" : frac > 0.25 ? "#ffd93b" : "#ffffff";
    roundRect(bx, byy, barW * frac, 12, 6); ctx.fill();
    ctx.textAlign = "left";
  }

  function drawSun() {
    const cx = W * 0.84, cy = H * 0.17;
    // glow
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
    g.addColorStop(0, "rgba(255,240,160,0.55)"); g.addColorStop(1, "rgba(255,240,160,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill();
    // rotating rays
    const rot = (run ? run.cameraX * 0.002 : performance.now() * 0.0004);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = "rgba(255,235,150,0.6)";
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.fillRect(46, -3, 18, 6); }
    ctx.restore();
    ctx.fillStyle = "#ffe06b"; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
  }
  function drawClouds() {
    const off = parScroll(0.05);
    for (const [bx, by, s, op] of [[120, 0.20, 1, 0.92], [520, 0.30, 0.8, 0.85], [820, 0.15, 0.9, 0.8], [340, 0.40, 0.7, 0.8]]) {
      const x = ((bx - off) % (W + 360) + W + 360) % (W + 360) - 120;
      cloud(x, H * by, s, op);
    }
  }
  function cloud(x, y, s, op) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = op || 0.9;
    ctx.fillStyle = "#ffffff";
    for (const [cx, cy, r] of [[0, 0, 26], [30, 6, 22], [-28, 8, 20], [4, -13, 21], [-12, -4, 18]]) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.12; ctx.fillStyle = "#9fb8d6"; ctx.fillRect(-30, 8, 64, 6);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // Far, pale skyline (slow parallax)
  function drawFarSkyline() {
    const off = parScroll(0.08), period = 86, base = groundY + 6;
    let i = Math.floor((off - 120) / period);
    for (; ; i++) {
      const x = i * period - off; if (x > W + 120) break;
      const w = 44 + rnd(i) * 38, h = 70 + rnd(i + 5) * 90;
      ctx.fillStyle = i % 2 ? "#b9cfe8" : "#c7dbef";
      ctx.fillRect(x, base - h, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(x, base - h, w, 5);
    }
  }
  // Mid, colored buildings with windows (medium parallax)
  function drawMidBuildings() {
    const off = parScroll(0.22), period = 150, base = groundY + 10;
    const cols = ["#9db8e8", "#b79fd6", "#e3a9bd", "#e8c089", "#9fccc4"];
    let i = Math.floor((off - 180) / period);
    for (; ; i++) {
      const x = i * period - off; if (x > W + 180) break;
      const w = 96 + rnd(i) * 60, h = 120 + rnd(i + 3) * 110, y = base - h;
      ctx.fillStyle = cols[Math.floor(rnd(i + 1) * cols.length)];
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.10)"; ctx.fillRect(x, y, w, 12); // roof shade
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x, y, 6, h); // left highlight
      for (let wy = y + 24; wy < base - 18; wy += 30)
        for (let wx = x + 14; wx < x + w - 16; wx += 28) {
          ctx.fillStyle = rnd(wx * 0.7 + wy) > 0.5 ? "#fff4b8" : "#cfe0f4";
          ctx.fillRect(wx, wy, 16, 20);
        }
    }
  }
  // Green hill/greenery band that hides the building bases (faster parallax)
  function drawHills() {
    const off = parScroll(0.42), period = 70, base = groundY + 4;
    ctx.fillStyle = "#7fbf63";
    ctx.beginPath(); ctx.moveTo(-20, base);
    let i = Math.floor((off - 80) / period);
    const startX = i * period - off;
    for (let x = startX, k = i; x < W + 80; x += period, k++) {
      ctx.quadraticCurveTo(x + period / 2, base - 18 - rnd(k) * 16, x + period, base);
    }
    ctx.lineTo(W + 40, groundY + 30); ctx.lineTo(-20, groundY + 30); ctx.closePath(); ctx.fill();
  }
  // Roadside skate-park objects (near parallax, just behind the action plane)
  function drawRoadside() {
    const off = parScroll(0.8), period = 150, base = groundY + 2;
    let i = Math.floor((off - 140) / period);
    for (; ; i++) {
      const x = i * period - off; if (x > W + 140) break;
      const kind = ((i % 7) + 7) % 7;
      if (kind === 0) prLamp(x, base);
      else if (kind === 1) prTree(x, base);
      else if (kind === 2) prBench(x, base);
      else if (kind === 3) prTrash(x, base);
      else if (kind === 4) prHydrant(x, base);
      else if (kind === 5) prPlanter(x, base);
      else prSign(x, base);
    }
  }
  function prLamp(x, base) {
    ctx.fillStyle = "#5a6172"; ctx.fillRect(x - 2.5, base - 56, 5, 56);
    ctx.fillStyle = "#ffe78a"; ctx.beginPath(); ctx.arc(x, base - 60, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,231,138,0.25)"; ctx.beginPath(); ctx.arc(x, base - 60, 14, 0, Math.PI * 2); ctx.fill();
  }
  function prTree(x, base) {
    ctx.fillStyle = "#7a5232"; ctx.fillRect(x - 5, base - 34, 10, 34);
    ctx.fillStyle = "#4e9c46"; ctx.beginPath(); ctx.arc(x, base - 44, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5cb255"; ctx.beginPath(); ctx.arc(x - 14, base - 36, 16, 0, Math.PI * 2); ctx.arc(x + 14, base - 36, 16, 0, Math.PI * 2); ctx.fill();
  }
  function prBench(x, base) {
    ctx.fillStyle = "#cf8a3e"; ctx.fillRect(x - 22, base - 22, 44, 5); ctx.fillStyle = "#b9742e"; ctx.fillRect(x - 22, base - 11, 44, 5);
    ctx.fillStyle = "#7a4a22"; ctx.fillRect(x - 18, base - 11, 4, 12); ctx.fillRect(x + 14, base - 11, 4, 12);
  }
  function prTrash(x, base) {
    ctx.fillStyle = "#3f6b8a"; ctx.fillRect(x - 9, base - 26, 18, 26);
    ctx.fillStyle = "#345b76"; ctx.fillRect(x - 10, base - 28, 20, 4);
    ctx.fillStyle = "rgba(255,255,255,0.14)"; ctx.fillRect(x - 5, base - 22, 3, 18);
  }
  function prHydrant(x, base) {
    ctx.fillStyle = "#d23b3b"; ctx.fillRect(x - 6, base - 22, 12, 22);
    ctx.beginPath(); ctx.arc(x, base - 23, 7, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#b02e2e"; ctx.fillRect(x - 10, base - 15, 20, 4); ctx.fillRect(x - 7, base - 2, 14, 3);
    ctx.fillStyle = "#ffd0c4"; ctx.beginPath(); ctx.arc(x, base - 27, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  function prPlanter(x, base) {
    ctx.fillStyle = "#4e9c46"; ctx.beginPath(); ctx.arc(x, base - 16, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5cb255"; ctx.beginPath(); ctx.arc(x - 7, base - 12, 8, 0, Math.PI * 2); ctx.arc(x + 7, base - 12, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ff7eb6"; ctx.beginPath(); ctx.arc(x - 4, base - 20, 2.4, 0, Math.PI * 2); ctx.fillStyle = "#ffd93b"; ctx.arc(x + 5, base - 18, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b07b4a"; ctx.fillRect(x - 12, base - 12, 24, 12); ctx.fillStyle = "#9a6a3f"; ctx.fillRect(x - 13, base - 13, 26, 3);
  }
  function prSign(x, base) {
    ctx.fillStyle = "#5a6172"; ctx.fillRect(x - 20, base - 30, 4, 30); ctx.fillRect(x + 16, base - 30, 4, 30);
    ctx.fillStyle = "#3a7bff"; roundRect(x - 27, base - 54, 54, 26, 5); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)"; roundRect(x - 27, base - 54, 54, 7, 5); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "800 10px Baloo 2, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("SKATE", x, base - 41); ctx.fillText("PARK", x, base - 31);
    ctx.textAlign = "left";
  }
  function drawGround() {
    // asphalt
    const ag = ctx.createLinearGradient(0, groundY, 0, H);
    ag.addColorStop(0, "#5b6472"); ag.addColorStop(1, "#454d59");
    ctx.fillStyle = ag; ctx.fillRect(0, groundY, W, H - groundY);
    // curb highlight
    ctx.fillStyle = "#caa15f"; ctx.fillRect(0, groundY - 4, W, 4);
    ctx.fillStyle = "#e8c98a"; ctx.fillRect(0, groundY - 4, W, 1.5);
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(0, groundY, W, 5);
    // speckle texture (stable, scrolling)
    const off = (run ? run.cameraX : 0);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let k = 0; k < 60; k++) {
      const px = ((k * 137.5 - off * 1) % (W + 40) + W + 40) % (W + 40) - 20;
      const py = groundY + 12 + rnd(k) * (H - groundY - 16);
      ctx.fillRect(px, py, 3, 3);
    }
    // moving dashed lane line
    ctx.fillStyle = "rgba(255,221,59,0.85)";
    const laneY = groundY + (H - groundY) * 0.55, seam = 70, o2 = off % seam;
    for (let x = -o2; x < W; x += seam) ctx.fillRect(x, laneY, 34, 5);
  }

  function obstacleScreenX(o) { return o.worldX - run.cameraX; }

  function drawObstacles() {
    for (const o of run.obstacles) {
      const x = obstacleScreenX(o);
      if (x < -160 || x > W + 160) continue;
      if (o.type === "ramp") drawRamp(x);
      else drawRail(x);
    }
  }
  function drawRamp(x) {
    const h = 66, w = 96;
    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath();
    ctx.ellipse(x, groundY + 6, w / 2 + 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    // wooden curved ramp face with gradient
    const g = ctx.createLinearGradient(x, groundY - h, x, groundY);
    g.addColorStop(0, "#e0a85a"); g.addColorStop(1, "#b87a30");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, groundY);
    ctx.lineTo(x + w / 2, groundY);
    ctx.quadraticCurveTo(x + w / 2, groundY - h, x + w / 2 - 32, groundY - h);
    ctx.quadraticCurveTo(x - w / 6, groundY - h * 0.5, x - w / 2, groundY - 8);
    ctx.closePath(); ctx.fill();
    // plank lines
    ctx.strokeStyle = "rgba(120,78,28,0.45)"; ctx.lineWidth = 2;
    for (let k = 1; k <= 4; k++) {
      const yy = groundY - (h * k / 5);
      ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2 - 32 + k * 4, yy); ctx.stroke();
    }
    // metal coping on top edge
    ctx.fillStyle = "#d8dde6"; ctx.fillRect(x + w / 2 - 34, groundY - h, 34, 6);
    ctx.fillStyle = "#f2f5fa"; ctx.fillRect(x + w / 2 - 34, groundY - h, 34, 2);
    // base trim
    ctx.fillStyle = "#8a5e26"; ctx.fillRect(x - w / 2, groundY - 6, w, 6);
  }
  function drawRail(x) {
    const h = 58, w = 124;
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath();
    ctx.ellipse(x, groundY + 6, w / 2, 6, 0, 0, Math.PI * 2); ctx.fill();
    // posts
    ctx.strokeStyle = "#5b626e"; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - w / 2, groundY); ctx.lineTo(x - w / 2 + 12, groundY - h);
    ctx.moveTo(x + w / 2, groundY); ctx.lineTo(x + w / 2 - 12, groundY - h);
    ctx.moveTo(x, groundY); ctx.lineTo(x, groundY - h + 4);
    ctx.stroke();
    // metallic rail bar
    const g = ctx.createLinearGradient(0, groundY - h - 6, 0, groundY - h + 6);
    g.addColorStop(0, "#eef2f7"); g.addColorStop(0.5, "#aeb6c2"); g.addColorStop(1, "#7b828f");
    ctx.strokeStyle = g; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 12, groundY - h); ctx.lineTo(x + w / 2 - 12, groundY - h); ctx.stroke();
    // shine
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 16, groundY - h - 2.5); ctx.lineTo(x + w / 2 - 16, groundY - h - 2.5); ctx.stroke();
    ctx.lineCap = "butt";
  }

  function drawReticles() {
    for (const o of run.obstacles) {
      if (o.resolved) continue;
      const idealCam = o.worldX - skaterPX;
      const delta = run.cameraX - idealCam;
      const showRange = run.speed * CFG.reticleLead;
      const win = windowPxFor(o);
      if (delta < -showRange || delta > win) continue;
      const x = obstacleScreenX(o);
      const y = groundY - (o.type === "ramp" ? 64 : 54) - 64;
      const R = 32;
      const inWin = Math.abs(delta) <= win;
      // target ring
      ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
      // shrinking ring
      const grow = Math.max(0, (idealCam - run.cameraX)) / showRange; // 1 far -> 0 at ideal
      const ir = R + grow * R * 2.4;
      ctx.strokeStyle = inWin ? "#5dff8b" : "#ffd93b"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, ir, 0, Math.PI * 2); ctx.stroke();
      if (inWin) {
        ctx.fillStyle = "#5dff8b"; ctx.font = "800 18px Baloo 2, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("TAP!", x, y - R - 10);
      }
    }
  }

  // ---------- Skater ----------
  // Cosmetic avatar fields (skin/hair/face/shirt) from the saved avatar.
  function avatarOpts() {
    const a = save.avatar;
    return {
      skin: a.skin, skinSh: shade(a.skin, -30), hair: a.hairColor, hairSh: shade(a.hairColor, -30),
      hairStyle: a.hairStyle, gender: a.gender, face: a.face, shirt: a.shirt, ride: a.ride,
    };
  }
  function rrC(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function drawSkaterRun() {
    const sk = run.skater;
    const bob = Math.sin(sk.bob) * 2;
    if (sk.wipeT > 0) { drawWipeout(skaterPX, groundY); return; }
    let spin = 0, lift = 0, grind = 0, fwd = 0;
    if (sk.trickT > 0) {
      const p = 1 - sk.trickT / 0.5;       // 0 → 1 over the trick
      const air = Math.sin(p * Math.PI);   // smooth up-then-down arc
      if (sk.trickKind === "ramp") {
        // launch up off the ramp, sail forward, flip in the air
        spin = p * Math.PI * 2; lift = air * 84; fwd = air * 26;
      } else if (sk.trickKind === "rail") {
        // grind: stay low on the rail and slide along it
        grind = 1; lift = 13; fwd = (p - 0.5) * 44;
      } else { lift = air * 10; } // stumble
    }
    drawSkater(ctx, skaterPX + fwd, groundY - lift + bob, Object.assign({
      helmet: run.helmet, shell: run.helmetData.shell, stripe: run.helmetData.stripe,
      deck: run.boardData.deck, wheels: run.boardData.wheels, spin: spin, grind: grind,
    }, avatarOpts()), groundY);
  }
  function drawIdleSkater() {
    const t = performance.now() / 500;
    const h = helmetById(save.helmet), b = boardById(save.board);
    drawSkater(ctx, W * 0.5, groundY + Math.sin(t) * 2, Object.assign({
      helmet: true, shell: h.shell, stripe: h.stripe, deck: b.deck, wheels: b.wheels, spin: 0, grind: 0,
    }, avatarOpts()), groundY);
  }

  // Draw the skater on context `c`. (x, y) = board contact; baseY = ground line for the shadow.
  function drawSkater(c, x, y, o, baseY) {
    if (baseY == null) baseY = groundY;
    // ground shadow
    const lift = Math.max(0, baseY - y);
    c.save();
    c.fillStyle = `rgba(0,0,0,${0.22 - Math.min(0.16, lift / 300)})`;
    c.beginPath(); c.ellipse(x, baseY + 6, 30 - lift * 0.08, 6, 0, 0, Math.PI * 2); c.fill();
    c.restore();

    c.save();
    c.translate(x, y);
    if (o.spin) { c.translate(0, -26); c.rotate(o.spin); c.translate(0, 26); }
    const scooter = o.ride === "scooter";
    if (scooter) {
      // Scooter: deck + wheels + stem + handlebar
      c.fillStyle = o.deck; rrC(c, -28, -8, 52, 9, 5); c.fill();
      c.fillStyle = "rgba(0,0,0,0.18)"; rrC(c, -26, -8, 48, 3.5, 3); c.fill();
      c.fillStyle = o.wheels;
      for (const wx of [-20, 18]) { c.beginPath(); c.arc(wx, 5, 5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.arc(wx, 5, 1.8, 0, Math.PI * 2); c.fill(); c.fillStyle = o.wheels; }
      c.strokeStyle = "#b6bdc9"; c.lineWidth = 4.5; c.lineCap = "round";
      c.beginPath(); c.moveTo(20, -6); c.lineTo(20, -52); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(10, -52); c.lineTo(30, -52); c.stroke();
      c.strokeStyle = "#2b2f45"; c.lineWidth = 5;
      c.beginPath(); c.moveTo(10, -52); c.lineTo(14.5, -52); c.moveTo(25.5, -52); c.lineTo(30, -52); c.stroke();
      // Legs (upright, both feet on deck)
      c.strokeStyle = "#2b3358"; c.lineWidth = 8; c.lineCap = "round";
      c.beginPath();
      c.moveTo(-5, -8); c.lineTo(-4, -22); c.lineTo(-3, -34);
      c.moveTo(7, -8); c.lineTo(5, -22); c.lineTo(4, -34); c.stroke();
      c.strokeStyle = "#e9edf4"; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-9, -7); c.lineTo(-1, -7); c.moveTo(3, -7); c.lineTo(10, -7); c.stroke();
    } else {
      // Skateboard: deck + grip + trucks + wheels
      c.fillStyle = o.deck; rrC(c, -36, -8, 72, 11, 6); c.fill();
      c.fillStyle = "rgba(0,0,0,0.18)"; rrC(c, -34, -8, 68, 4, 3); c.fill();
      c.fillStyle = "#9aa1ad"; c.fillRect(-24, 1, 4, 5); c.fillRect(20, 1, 4, 5);
      c.fillStyle = o.wheels;
      for (const wx of [-22, 22]) { c.beginPath(); c.arc(wx, 5, 5.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.arc(wx, 5, 2, 0, Math.PI * 2); c.fill(); c.fillStyle = o.wheels; }
      // Legs (knees bent)
      c.strokeStyle = "#2b3358"; c.lineWidth = 8; c.lineCap = "round";
      const stance = o.grind ? 17 : 12;
      c.beginPath();
      c.moveTo(-stance, -8); c.lineTo(-9, -22); c.lineTo(-5, -34);
      c.moveTo(stance, -8); c.lineTo(10, -22); c.lineTo(8, -34); c.stroke();
      c.strokeStyle = "#e9edf4"; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-stance - 3, -7); c.lineTo(-stance + 6, -7);
      c.moveTo(stance - 6, -7); c.lineTo(stance + 3, -7); c.stroke();
    }
    // Torso (shirt color from avatar)
    c.strokeStyle = o.shirt; c.lineWidth = 15;
    c.beginPath(); c.moveTo(1, -33); c.lineTo(1, -58); c.stroke();
    c.strokeStyle = "rgba(0,0,0,0.10)"; c.lineWidth = 5;
    c.beginPath(); c.moveTo(5, -34); c.lineTo(5, -56); c.stroke();
    // Arms (skin) + short sleeves (shirt)
    c.strokeStyle = o.skin; c.lineWidth = 6; c.lineCap = "round";
    if (scooter) {
      c.beginPath(); c.moveTo(0, -52); c.lineTo(19, -50); c.moveTo(0, -52); c.lineTo(-14, -45); c.stroke();
    } else {
      c.beginPath(); c.moveTo(0, -52); c.lineTo(o.grind ? 26 : 19, -46); c.moveTo(0, -52); c.lineTo(-16, -44); c.stroke();
    }
    c.strokeStyle = o.shirt; c.lineWidth = 7;
    c.beginPath(); c.moveTo(-3, -54); c.lineTo(-8, -49); c.moveTo(5, -54); c.lineTo(10, -49); c.stroke();
    // Head (skin) + ears
    c.fillStyle = o.skin; c.beginPath(); c.arc(2, -68, 11.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(0,0,0,0.06)"; c.beginPath(); c.arc(5.5, -66, 8.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = o.skin; c.beginPath(); c.arc(-9.5, -67, 2.6, 0, Math.PI * 2); c.arc(13.5, -67, 2.6, 0, Math.PI * 2); c.fill();
    // Face
    drawSkFace(c, o);
    // Helmet (covers hair) or hair
    if (o.helmet) {
      c.fillStyle = o.shell;
      c.beginPath(); c.arc(2, -70, 12.5, Math.PI, 0); c.fill();
      c.fillRect(-10.5, -71, 25, 3.5);
      c.fillStyle = "rgba(255,255,255,0.28)"; c.beginPath(); c.arc(-2, -74, 4.5, Math.PI, Math.PI * 1.5); c.fill();
      c.fillStyle = o.stripe; c.fillRect(-2.5, -82, 5, 13);
      c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(-10.5, -67.5, 25, 1.8);
    } else {
      drawSkHair(c, o);
    }
    c.restore();
  }

  function drawSkFace(c, o) {
    const cool = o.face === "cool";
    c.fillStyle = "rgba(255,130,150,0.35)";
    c.beginPath(); c.arc(-4, -62, 2.2, 0, Math.PI * 2); c.arc(8, -62, 2.2, 0, Math.PI * 2); c.fill();
    if (cool) {
      c.fillStyle = "#222"; rrC(c, -8, -69.5, 7.5, 5, 2); c.fill(); rrC(c, 2.5, -69.5, 7.5, 5, 2); c.fill();
      c.fillRect(-0.5, -68, 3, 1.6);
      c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-7, -69, 2, 1.4); c.fillRect(3.5, -69, 2, 1.4);
    } else {
      c.strokeStyle = o.hairSh; c.lineWidth = 1.2; c.lineCap = "round";
      c.beginPath(); c.moveTo(-4, -71); c.lineTo(-0.5, -71.4); c.moveTo(4.5, -71.4); c.lineTo(8, -71); c.stroke();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(-1.5, -67, 1.8, 2.2, 0, 0, Math.PI * 2); c.ellipse(5.5, -67, 1.8, 2.2, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#33271f"; c.beginPath(); c.arc(-1.1, -66.6, 1.05, 0, Math.PI * 2); c.arc(5.9, -66.6, 1.05, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(-0.7, -67.3, 0.4, 0, Math.PI * 2); c.arc(6.3, -67.3, 0.4, 0, Math.PI * 2); c.fill();
      if (o.gender === "girl") {
        c.strokeStyle = "#33271f"; c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(-3.5, -68.3); c.lineTo(-4.8, -69.3); c.moveTo(7.5, -68.3); c.lineTo(8.8, -69.3); c.stroke();
      }
    }
    c.strokeStyle = o.skinSh; c.lineWidth = 1; c.lineCap = "round";
    c.beginPath(); c.moveTo(2, -64.5); c.lineTo(2.9, -63.6); c.stroke();
    c.strokeStyle = o.gender === "girl" ? "#e06b80" : "#b85c5c"; c.lineWidth = 1.5;
    if (o.face === "grin") {
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(2.3, -60.5, 3, 2, 0, 0, Math.PI); c.fill();
      c.beginPath(); c.arc(2.3, -61.5, 3, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke();
    } else {
      c.beginPath(); c.arc(2.3, -62, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    }
  }

  function drawSkHair(c, o) {
    const hs = o.hairStyle;
    if (hs === "none") return;
    const H = o.hair, HS = o.hairSh;
    if (hs === "long") { c.fillStyle = HS; c.fillRect(-13, -70, 3.6, 17); c.fillRect(11.4, -70, 3.6, 17); }
    if (hs === "ponytail") { c.fillStyle = HS; c.save(); c.translate(15, -65); c.rotate(0.5); c.beginPath(); c.ellipse(0, 0, 4, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    if (hs === "bun") { c.fillStyle = HS; c.beginPath(); c.arc(2, -83, 4.6, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = H;
    if (hs === "curly") {
      for (const p of [[-8, -75, 5], [0, -79, 5.5], [8, -75, 5], [-11, -69, 4.5], [13, -69, 4.5]]) {
        c.beginPath(); c.arc(2 + p[0], p[1], p[2], 0, Math.PI * 2); c.fill();
      }
    } else {
      c.beginPath(); c.arc(2, -69, 12.5, Math.PI, 0); c.fill();
      c.fillRect(-10.5, -70, 25, 3);
      if (hs === "swoosh") {
        c.beginPath(); c.moveTo(-10.5, -70); c.quadraticCurveTo(4, -62.5, 14.5, -69);
        c.lineTo(14.5, -73); c.lineTo(-10.5, -73); c.closePath(); c.fill();
      }
    }
  }

  function drawWipeout(x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#e0a44a"; roundRect(-34, -8, 68, 11, 6); ctx.fill();
    // fallen body
    ctx.strokeStyle = "#2b3358"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(18, -16); ctx.stroke();
    ctx.fillStyle = "#ffd0a3"; ctx.beginPath(); ctx.arc(24, -20, 11, 0, Math.PI * 2); ctx.fill();
    // spinning stars
    const t = performance.now() / 120;
    ctx.fillStyle = "#ffd93b"; ctx.font = "20px sans-serif"; ctx.textAlign = "center";
    for (let i = 0; i < 3; i++) {
      const a = t + i * 2.1;
      ctx.fillText("✦", 18 + Math.cos(a) * 22, -44 + Math.sin(a) * 10);
    }
    ctx.restore();
  }

  function drawCop() {
    if (!run.cop.active) return;
    const x = skaterPX - run.cop.gap;
    if (x < -80) return;
    const t = performance.now() / 500;
    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath();
    ctx.ellipse(x, groundY + 6, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, groundY + Math.sin(t * 2) * 2);
    // board
    ctx.fillStyle = "#222"; roundRect(-30, -8, 60, 10, 5); ctx.fill();
    ctx.fillStyle = "#444"; ctx.beginPath(); ctx.arc(-20, 5, 4.5, 0, Math.PI * 2); ctx.arc(20, 5, 4.5, 0, Math.PI * 2); ctx.fill();
    // legs/torso
    ctx.strokeStyle = "#16306b"; ctx.lineWidth = 8; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(-4, -34); ctx.moveTo(10, -8); ctx.lineTo(6, -34); ctx.stroke();
    ctx.strokeStyle = "#2456b0"; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(1, -34); ctx.lineTo(1, -56); ctx.stroke();
    // badge
    ctx.fillStyle = "#ffd93b"; ctx.beginPath(); ctx.arc(-4, -48, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffd0a3"; ctx.beginPath(); ctx.arc(2, -66, 11, 0, Math.PI * 2); ctx.fill();
    // cap
    ctx.fillStyle = "#16306b"; ctx.beginPath(); ctx.arc(2, -68, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12, -69, 26, 4); ctx.fillRect(2, -71, 16, 4);
    ctx.fillStyle = "#ffd93b"; ctx.fillRect(-1, -75, 6, 3); // cap badge
    // siren + alert
    const flash = Math.sin(performance.now() / 90) > 0;
    ctx.fillStyle = flash ? "#ff3b3b" : "#3b6bff";
    ctx.beginPath(); ctx.arc(2, -82, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "800 22px Baloo 2, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("!", 26, -60);
    ctx.restore();
  }

  // ---------- HUD ----------
  function drawHUD() {
    // Stamina bar
    const bx = 16, by = 16, bw = Math.min(W - 120, 360), bh = 22;
    ctx.fillStyle = "rgba(0,0,0,0.25)"; roundRect(bx - 3, by - 3, bw + 6, bh + 6, 8); ctx.fill();
    ctx.fillStyle = "#2a3150"; roundRect(bx, by, bw, bh, 6); ctx.fill();
    const frac = Math.max(0, Math.min(1, run.stamina / 100));
    const col = run.stamina > 50 ? "#42d66a" : run.stamina > 20 ? "#ffd93b" : "#ff5a3c";
    ctx.fillStyle = col; roundRect(bx, by, bw * frac, bh, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "800 14px Baloo 2, sans-serif"; ctx.textAlign = "left";
    ctx.fillText("🔋 STAMINA", bx + 6, by + bh + 16);

    // Score + level (right)
    ctx.textAlign = "right";
    ctx.fillStyle = "#0b1026"; ctx.font = "800 26px Baloo 2, sans-serif";
    ctx.fillText(String(run.score), W - 14, by + 22);
    ctx.fillStyle = "#0b1026"; ctx.font = "800 14px Baloo 2, sans-serif";
    ctx.fillText("Lv " + run.level + (run.mult > 1 ? "   x" + run.mult : ""), W - 14, by + 42);

    // Combo
    if (run.combo >= 3) {
      ctx.textAlign = "center"; ctx.fillStyle = "#ffd93b";
      ctx.font = "800 22px Baloo 2, sans-serif";
      ctx.fillText(run.combo + " combo", W / 2, by + 24);
    }
  }

  function drawFloats() {
    ctx.textAlign = "center";
    for (const f of run.floats) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.3);
      ctx.fillStyle = f.color; ctx.font = "800 20px Baloo 2, sans-serif";
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
  function drawFlash() {
    if (run.flashT <= 0 || !run.flash) return;
    ctx.globalAlpha = Math.min(1, run.flashT);
    ctx.textAlign = "center"; ctx.fillStyle = run.flash.color;
    ctx.font = "800 34px Baloo 2, sans-serif";
    ctx.fillText(run.flash.text, W / 2, H * 0.34);
    ctx.globalAlpha = 1;
  }
  function drawPaused() {
    ctx.fillStyle = "rgba(8,12,30,0.6)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "800 34px Baloo 2, sans-serif";
    ctx.fillText("Paused", W / 2, H / 2 - 10);
    ctx.font = "600 18px Baloo 2, sans-serif";
    ctx.fillText("Tap ⏸ to keep skating", W / 2, H / 2 + 26);
  }

  // ---------- helpers ----------
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============================================================
  //  MAIN LOOP
  // ============================================================
  let last = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05; // clamp after tab switches
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ============================================================
  //  GEAR SCREEN
  // ============================================================
  const gearCanvas = document.getElementById("gear-canvas");
  const gctx = gearCanvas.getContext("2d");
  let tempHelmet = save.helmet, tempBoard = save.board;

  function renderGear() {
    tempHelmet = save.helmet; tempBoard = save.board;
    buildAvChips("gender", GENDERS);
    buildAvChips("ride", RIDES);
    buildAvSwatches("skin", SKINS);
    buildAvChips("hairStyle", HAIR_STYLES);
    buildAvSwatches("hairColor", HAIR_COLORS);
    buildAvSwatches("shirt", SHIRTS);
    buildAvChips("face", FACES);
    buildGearRow("helmet-row", HELMETS, "helmet");
    buildGearRow("board-row", BOARDS, "board");
    drawGearPreview();
  }
  function buildAvChips(part, options) {
    const wrap = document.querySelector(`.av-row[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    options.forEach((o) => {
      const b = document.createElement("button");
      b.className = "gear-chip" + (save.avatar[part] === o.id ? " selected" : "");
      b.textContent = o.label;
      b.addEventListener("click", () => { save.avatar[part] = o.id; persist(); renderGear(); });
      wrap.appendChild(b);
    });
  }
  function buildAvSwatches(part, colors) {
    const wrap = document.querySelector(`.av-swatches[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    colors.forEach((col) => {
      const b = document.createElement("button");
      b.className = "av-swatch" + (save.avatar[part] === col ? " selected" : "");
      b.style.background = col;
      b.addEventListener("click", () => { save.avatar[part] = col; persist(); renderGear(); });
      wrap.appendChild(b);
    });
  }
  function unlocked(g) { return save.best >= g.unlockScore; }
  function buildGearRow(rowId, items, kind) {
    const row = document.getElementById(rowId); row.innerHTML = "";
    items.forEach((g) => {
      const sel = (kind === "helmet" ? tempHelmet : tempBoard) === g.id;
      const lock = !unlocked(g);
      const chip = document.createElement("button");
      chip.className = "gear-chip" + (sel ? " selected" : "") + (lock ? " locked" : "");
      const color = kind === "helmet" ? g.shell : g.deck;
      chip.innerHTML = '<span class="dot" style="background:' + color + '"></span>' +
        g.name + (lock ? ' <span class="lock">🔒 ' + g.unlockScore + '</span>' : "");
      if (!lock) chip.addEventListener("click", () => {
        if (kind === "helmet") tempHelmet = g.id; else tempBoard = g.id;
        save.helmet = tempHelmet; save.board = tempBoard; persist();
        renderGear();
      });
      row.appendChild(chip);
    });
  }
  function drawGearPreview() {
    gctx.clearRect(0, 0, gearCanvas.width, gearCanvas.height);
    const h = helmetById(tempHelmet), b = boardById(tempBoard);
    const opts = Object.assign({
      helmet: true, shell: h.shell, stripe: h.stripe, deck: b.deck, wheels: b.wheels, spin: 0, grind: 0,
    }, avatarOpts());
    gctx.save();
    gctx.translate(gearCanvas.width / 2, gearCanvas.height - 18);
    gctx.scale(1.55, 1.55);
    drawSkater(gctx, 0, 0, opts, 0);
    gctx.restore();
  }

  // ============================================================
  //  INPUT + WIRING
  // ============================================================
  function onTap() {
    if (state === S.PLAY && run && !run.paused) resolveTap();
  }
  canvas.addEventListener("pointerdown", (e) => { onTap(); });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); onTap(); }
    else if (e.key === "h" || e.key === "H") toggleHelmet();
    else if (e.key === "p" || e.key === "P") togglePause();
  });

  document.getElementById("helmet-toggle").addEventListener("click", toggleHelmet);
  function togglePause() { if (state === S.PLAY && run) { run.paused = !run.paused; } }
  document.getElementById("pause-btn").addEventListener("click", togglePause);

  document.getElementById("btn-play").addEventListener("click", () => { renderGear(); showState(S.GEAR); });
  document.getElementById("btn-how").addEventListener("click", () => showState(S.HOW));
  document.getElementById("btn-start-run").addEventListener("click", startRun);
  document.getElementById("btn-level-go").addEventListener("click", () => { showState(S.PLAY); });
  document.getElementById("btn-again").addEventListener("click", startRun);
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
    const t = b.dataset.go;
    if (t === "gear") { renderGear(); showState(S.GEAR); } else showState(S[t.toUpperCase()] || S.TITLE);
  }));

  // ---------- boot ----------
  resize();
  showState(S.TITLE);
  requestAnimationFrame(frame);
})();
