/* ============================================================
   Animal Rescue Adventure — game.js (the brain)
   Plain JavaScript. No libraries. Saves to localStorage.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Saved data ---------- */
  const SAVE_KEY = "animalRescueSave_v1";

  const defaultState = () => ({
    started: false,
    avatar: {
      skin: "#f3c39a",
      hairStyle: "short",
      hairColor: "#5a3a2a",
      shirt: "#ff8fb1",
      face: "happy",
    },
    solved: [],   // riddle ids the player has solved
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* ignore — start fresh */ }
    return defaultState();
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
    catch (e) { /* storage may be full or blocked; game still works this session */ }
  }

  /* ---------- Option lists for the avatar ---------- */
  const SKINS = ["#ffe0bd", "#f3c39a", "#d99a6c", "#a86b3c", "#7a4a23"];
  const HAIR_COLORS = ["#2b2b2b", "#5a3a2a", "#a8642a", "#e3b34d", "#d94f8a", "#5b8cff"];
  const SHIRTS = ["#ff8fb1", "#b58cff", "#ff9f4a", "#5bd1c0", "#6fc36b", "#ffd93b"];
  const HAIR_STYLES = [
    { id: "short", label: "Short" },
    { id: "long", label: "Long" },
    { id: "puffs", label: "Puffs" },
    { id: "bald", label: "None" },
  ];
  const FACES = [
    { id: "happy", label: "😊" },
    { id: "grin", label: "😁" },
    { id: "cool", label: "😎" },
  ];

  /* ============================================================
     SCREEN NAVIGATION
     ============================================================ */
  const screens = {};
  document.querySelectorAll(".screen").forEach((s) => { screens[s.id.replace("screen-", "")] = s; });

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    if (screens[name]) screens[name].classList.add("active");

    // Top bar only appears once the adventure has started, and not on title.
    const topbar = document.getElementById("topbar");
    const showBar = state.started && name !== "title" && name !== "avatar-first";
    topbar.classList.toggle("hidden", !showBar || name === "title");

    if (name === "map") renderMap();
    if (name === "badges") renderBadges();
    if (name === "game") renderRiddle();
    if (name === "ending") runEnding();
    if (name === "avatar") renderAvatar();

    updateRescueCount();
    window.scrollTo(0, 0);
  }

  // Nav buttons (top bar + back buttons)
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => show(btn.dataset.go));
  });

  /* ============================================================
     AVATAR — built from layered SVG shapes (no image files)
     ============================================================ */
  function avatarSVG(a, opts) {
    opts = opts || {};
    const faces = {
      happy: '<path d="M40 72 Q50 82 60 72" stroke="#3a2a2a" stroke-width="3" fill="none" stroke-linecap="round"/>',
      grin:  '<path d="M40 70 Q50 84 60 70 Z" fill="#fff" stroke="#3a2a2a" stroke-width="3"/>',
      cool:  '<rect x="34" y="60" width="32" height="9" rx="4" fill="#222"/>',
    };
    const eyes = (a.face === "cool")
      ? ""
      : '<circle cx="42" cy="60" r="3.2" fill="#3a2a2a"/><circle cx="58" cy="60" r="3.2" fill="#3a2a2a"/>';

    let hair = "";
    if (a.hairStyle === "short") {
      hair = `<path d="M28 52 Q50 20 72 52 Q72 40 50 34 Q28 40 28 52 Z" fill="${a.hairColor}"/>`;
    } else if (a.hairStyle === "long") {
      hair = `<path d="M26 50 Q50 18 74 50 L74 96 Q70 84 66 90 L66 54 Q50 30 34 54 L34 90 Q30 84 26 96 Z" fill="${a.hairColor}"/>`;
    } else if (a.hairStyle === "puffs") {
      hair = `<circle cx="30" cy="42" r="13" fill="${a.hairColor}"/><circle cx="70" cy="42" r="13" fill="${a.hairColor}"/><path d="M30 52 Q50 22 70 52 Q70 42 50 38 Q30 42 30 52 Z" fill="${a.hairColor}"/>`;
    } // bald = no hair

    return `
      <svg viewBox="0 0 100 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- shadow -->
        <ellipse cx="50" cy="126" rx="26" ry="5" fill="rgba(0,0,0,0.12)"/>
        <!-- legs -->
        <rect x="40" y="104" width="8" height="20" rx="4" fill="#3a3a4a"/>
        <rect x="52" y="104" width="8" height="20" rx="4" fill="#3a3a4a"/>
        <!-- body / shirt -->
        <path d="M30 92 Q30 74 50 74 Q70 74 70 92 L70 108 Q50 114 30 108 Z" fill="${a.shirt}"/>
        <!-- arms -->
        <rect x="22" y="78" width="9" height="28" rx="4.5" fill="${a.shirt}"/>
        <rect x="69" y="78" width="9" height="28" rx="4.5" fill="${a.shirt}"/>
        <circle cx="26.5" cy="106" r="5" fill="${a.skin}"/>
        <circle cx="73.5" cy="106" r="5" fill="${a.skin}"/>
        <!-- head -->
        <circle cx="50" cy="56" r="24" fill="${a.skin}"/>
        ${eyes}
        ${faces[a.face] || faces.happy}
        ${hair}
      </svg>`;
  }

  function renderAvatarInto(el, big) {
    if (el) el.innerHTML = avatarSVG(state.avatar, { big: big });
  }

  function renderAvatar() {
    renderAvatarInto(document.getElementById("avatar-preview"), true);

    buildSwatches("skin", SKINS);
    buildSwatches("hairColor", HAIR_COLORS);
    buildSwatches("shirt", SHIRTS);
    buildChips("hairStyle", HAIR_STYLES);
    buildChips("face", FACES);
  }

  function buildSwatches(part, colors) {
    const wrap = document.querySelector(`.swatches[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "swatch" + (state.avatar[part] === c ? " selected" : "");
      b.style.background = c;
      b.setAttribute("aria-label", part + " color");
      b.addEventListener("click", () => {
        state.avatar[part] = c;
        save();
        renderAvatar();
      });
      wrap.appendChild(b);
    });
  }

  function buildChips(part, options) {
    const wrap = document.querySelector(`.chips[data-part="${part}"]`);
    if (!wrap) return;
    wrap.innerHTML = "";
    options.forEach((o) => {
      const b = document.createElement("button");
      b.className = "chip" + (state.avatar[part] === o.id ? " selected" : "");
      b.textContent = o.label;
      b.addEventListener("click", () => {
        state.avatar[part] = o.id;
        save();
        renderAvatar();
      });
      wrap.appendChild(b);
    });
  }

  /* ============================================================
     RIDDLE ENGINE
     ============================================================ */
  const riddles = window.RIDDLES || [];

  function isSolved(id) { return state.solved.indexOf(id) !== -1; }
  function rescuedCount() { return state.solved.length; }
  function allDone() { return rescuedCount() >= riddles.length; }

  function currentRiddle() {
    return riddles.find((r) => !isSolved(r.id)) || null;
  }

  // Build 3 tappable choices: the right answer + 2 others, shuffled.
  // We pick the wrong choices from other riddles' answers so they're always
  // real, kid-friendly words. Stored on `currentChoices` so they stay put.
  let currentChoices = [];
  function buildChoices(r) {
    const others = riddles
      .filter((x) => x.id !== r.id)
      .map((x) => x.answer)
      .filter((a) => a.toLowerCase() !== r.answer.toLowerCase());
    // shuffle the distractor pool and take two unique ones
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    const wrongs = [];
    for (const w of others) {
      if (wrongs.length >= 2) break;
      if (!wrongs.some((x) => x.toLowerCase() === w.toLowerCase())) wrongs.push(w);
    }
    const choices = [{ text: r.answer, correct: true }]
      .concat(wrongs.map((w) => ({ text: w, correct: false })));
    // shuffle the final three
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }

  /* ============================================================
     ANIMATED CITY SCENE + DETECTIVE WHISKERS (drawn art)
     ============================================================ */
  function buildCityArt() {
    const W = 800, H = 240, horizon = 176, roadY = 206;
    // far skyline
    let far = "", x = 0, i = 0;
    const farCols = ["#c4d9ef", "#cfe1f3"];
    while (x < W) {
      const w = 46 + (i * 37) % 44, h = 50 + (i * 53) % 70;
      far += `<rect x="${x}" y="${horizon - h}" width="${w}" height="${h}" rx="3" fill="${farCols[i % 2]}"/>`;
      x += w + 7; i++;
    }
    // mid buildings with lit windows
    let mid = "", bx = 14, bi = 0;
    const cols = ["#eab0c3", "#a9c8f0", "#f4c98a", "#bfe3a8", "#d3b6ef", "#9fd8d0"];
    while (bx < W - 30) {
      const bw = 78 + (bi * 29) % 46, bh = 78 + (bi * 61) % 62, by = horizon - bh, col = cols[bi % cols.length];
      mid += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="${col}"/>`;
      mid += `<rect x="${bx}" y="${by}" width="${bw}" height="12" rx="6" fill="rgba(0,0,0,0.10)"/>`;
      for (let wy = by + 22; wy < horizon - 14; wy += 26)
        for (let wx = bx + 12; wx < bx + bw - 14; wx += 24)
          mid += `<rect x="${wx}" y="${wy}" width="13" height="16" rx="2" fill="${(wx + wy) % 3 === 0 ? "#fff4b8" : "#dcecff"}"/>`;
      bx += bw + 16; bi++;
    }
    // trees + lampposts along the sidewalk
    let fg = "";
    for (const tx of [70, 250, 430, 610, 770]) fg += sceneTree(tx, horizon + 6, 1);
    for (const lx of [160, 360, 560, 720]) fg += lamp(lx, horizon + 4);
    // sun rays
    let rays = "";
    for (let a = 0; a < 12; a++) rays += `<rect x="697" y="14" width="6" height="16" rx="3" fill="#ffe06b" transform="rotate(${a * 30} 700 46)"/>`;

    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="csky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#79c2ff"/><stop offset="0.65" stop-color="#bce6ff"/><stop offset="1" stop-color="#e6f6ff"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#csky)"/>
      <g class="cs-rays">${rays}</g>
      <circle cx="700" cy="46" r="28" fill="#ffe06b"/>
      ${far}
      <rect x="0" y="${horizon - 2}" width="${W}" height="14" fill="#cdeec4"/>
      ${mid}
      <rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="#8ddf6e"/>
      <rect x="0" y="${roadY}" width="${W}" height="${H - roadY}" fill="#9aa4b2"/>
      <rect x="0" y="${roadY}" width="${W}" height="4" fill="#838d9c"/>
      ${dashLine(roadY + 20, W)}
      ${fg}
    </svg>`;
  }
  function sceneTree(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <rect x="-5" y="-26" width="10" height="28" rx="4" fill="#8a5a35"/>
      <circle cx="0" cy="-40" r="22" fill="#5fb85a"/>
      <circle cx="-16" cy="-30" r="15" fill="#6cc466"/>
      <circle cx="16" cy="-30" r="15" fill="#54ad50"/></g>`;
  }
  function lamp(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="-2.5" y="-44" width="5" height="46" rx="2" fill="#5a6172"/>
      <circle cx="0" cy="-48" r="6" fill="#ffe78a"/></g>`;
  }
  function dashLine(y, W) {
    let s = "";
    for (let x = 10; x < W; x += 46) s += `<rect x="${x}" y="${y}" width="24" height="5" rx="2.5" fill="#ffd93b"/>`;
    return s;
  }

  // Detective Whiskers — a drawn cat detective with a deerstalker hat & magnifier.
  function buildDetective() {
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="114" rx="30" ry="5" fill="rgba(0,0,0,0.12)"/>
      <!-- coat/body -->
      <path d="M40 112 Q40 78 60 78 Q80 78 80 112 Z" fill="#b9742e"/>
      <path d="M60 80 L60 110" stroke="#9c5f22" stroke-width="2"/>
      <!-- tail -->
      <path class="cat-tail" d="M80 104 Q104 100 100 78" stroke="#9a9a9a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <!-- head -->
      <circle cx="60" cy="54" r="26" fill="#a9a9a9"/>
      <polygon points="40,38 36,18 56,32" fill="#a9a9a9"/>
      <polygon points="80,38 84,18 64,32" fill="#a9a9a9"/>
      <polygon points="41,34 39,23 51,31" fill="#f4b8c4"/>
      <polygon points="79,34 81,23 69,31" fill="#f4b8c4"/>
      <!-- deerstalker hat -->
      <path d="M34 40 Q60 12 86 40 Q86 30 60 26 Q34 30 34 40 Z" fill="#7a5230"/>
      <ellipse cx="60" cy="40" rx="28" ry="7" fill="#5f3f22"/>
      <circle cx="60" cy="24" r="5" fill="#8a5e38"/>
      <!-- face -->
      <circle cx="51" cy="54" r="4" fill="#2a2a2a"/>
      <circle cx="69" cy="54" r="4" fill="#2a2a2a"/>
      <circle cx="52.2" cy="52.6" r="1.3" fill="#fff"/>
      <circle cx="70.2" cy="52.6" r="1.3" fill="#fff"/>
      <path d="M56 62 Q60 66 64 62" stroke="#3a2a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <polygon points="57,59 63,59 60,63" fill="#f08a9a"/>
      <g stroke="#cfcfcf" stroke-width="1.5">
        <line x1="40" y1="58" x2="22" y2="55"/><line x1="40" y1="62" x2="23" y2="64"/>
        <line x1="80" y1="58" x2="98" y2="55"/><line x1="80" y1="62" x2="97" y2="64"/>
      </g>
      <!-- magnifying glass -->
      <g class="cat-glass">
        <line x1="84" y1="92" x2="98" y2="106" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>
        <circle cx="80" cy="86" r="13" fill="rgba(180,225,255,0.55)" stroke="#5a6172" stroke-width="4"/>
      </g>
    </svg>`;
  }

  function updateLocationStrip() {
    const el = document.getElementById("loc-now");
    if (!el) return;
    const total = riddles.length, done = rescuedCount();
    if (done === 0) el.textContent = "Detective Whiskers picks up the first trail…";
    else if (done >= total) el.textContent = "Every animal is home — hooray!";
    else el.textContent = `Searching Karandas — ${done} of ${total} animals rescued`;
  }

  function renderRiddle() {
    const r = currentRiddle();
    const fb = document.getElementById("answer-feedback");
    const hint = document.getElementById("hint-text");
    const optionsEl = document.getElementById("answer-options");

    renderAvatarInto(document.getElementById("game-avatar"));
    updateLocationStrip();
    fb.textContent = "";
    fb.className = "feedback";
    hint.textContent = "";
    hint.classList.remove("show");
    optionsEl.innerHTML = "";

    if (!r) {
      // Everything solved — go celebrate the ending.
      show("ending");
      return;
    }
    document.getElementById("riddle-progress").textContent =
      `Clue ${rescuedCount() + 1} of ${riddles.length}`;
    document.getElementById("riddle-text").textContent = r.riddleText;
    document.getElementById("btn-hint").textContent = "Need a hint? 🔎";

    // Build the three tap-to-answer buttons.
    currentChoices = buildChoices(r);
    currentChoices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = cap(c.text);
      btn.addEventListener("click", () => chooseAnswer(r, c, btn));
      optionsEl.appendChild(btn);
    });
  }

  function chooseAnswer(r, choice, btn) {
    const fb = document.getElementById("answer-feedback");
    if (choice.correct) {
      state.solved.push(r.id);
      save();
      celebrate(r);
    } else {
      // Gently mark the wrong choice and let them try another.
      btn.classList.add("wrong");
      btn.disabled = true;
      fb.textContent = pick(["Not quite — try again! 💪", "Oops, try another!", "Hmm, pick a different one!"]);
      fb.className = "feedback try";
    }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ============================================================
     CELEBRATION POPUP
     ============================================================ */
  const celebrateEl = document.getElementById("celebrate");

  function celebrate(r) {
    document.getElementById("celebrate-emoji").textContent = r.emoji;
    document.getElementById("celebrate-title").textContent = pick(["Correct! 🎉", "Hooray! 🎉", "You got it! ⭐"]);
    document.getElementById("celebrate-text").textContent = `You rescued the ${r.animal}!`;
    document.getElementById("celebrate-badge").textContent = "🏅 " + r.badge;
    const nextBtn = document.getElementById("btn-celebrate-next");
    nextBtn.textContent = allDone() ? "See the big surprise →" : "Next clue →";
    celebrateEl.classList.remove("hidden");
    updateRescueCount();
  }

  document.getElementById("btn-celebrate-next").addEventListener("click", () => {
    celebrateEl.classList.add("hidden");
    if (allDone()) show("ending");
    else { show("game"); }
  });

  /* ============================================================
     MAP
     ============================================================ */
  // Where each location sits on the city map + its landmark emoji.
  const LOC_LAYOUT = {
    park:      { x: 150, y: 120, emoji: "🌳" },
    bakery:    { x: 365, y: 95,  emoji: "🥐" },
    fountain:  { x: 590, y: 120, emoji: "⛲" },
    library:   { x: 690, y: 300, emoji: "📚" },
    market:    { x: 470, y: 285, emoji: "🎪" },
    treehouse: { x: 225, y: 300, emoji: "🛖" },
    garden:    { x: 360, y: 455, emoji: "🌷" },
    pond:      { x: 600, y: 455, emoji: "🪷" },
    forest:    { x: 130, y: 470, emoji: "🌲" },
    hill:      { x: 690, y: 500, emoji: "⛰️" },
  };
  const ROAD_EDGES = [
    ["park", "bakery"], ["bakery", "fountain"], ["fountain", "library"],
    ["park", "treehouse"], ["bakery", "market"], ["fountain", "market"],
    ["treehouse", "market"], ["treehouse", "forest"], ["market", "garden"],
    ["market", "library"], ["garden", "pond"], ["pond", "library"],
    ["garden", "forest"], ["pond", "hill"], ["library", "hill"],
  ];
  const DECO_TREES = [
    [60, 220, 1], [280, 175, 0.8], [500, 200, 0.9], [760, 180, 0.8],
    [70, 360, 0.9], [430, 380, 0.8], [770, 400, 0.9], [300, 540, 0.85],
    [520, 560, 0.8], [180, 560, 0.7], [660, 200, 0.7],
  ];
  const DECO_HOUSES = [
    [480, 150, "#f4b3c4"], [250, 210, "#a9c8f0"], [560, 350, "#f4c98a"],
    [150, 400, "#bfe3a8"], [430, 520, "#d6b8f0"],
  ];

  function mapTree(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <ellipse cx="0" cy="6" rx="20" ry="6" fill="rgba(0,0,0,0.08)"/>
      <rect x="-4" y="-16" width="8" height="20" rx="3" fill="#8a5a35"/>
      <circle cx="0" cy="-30" r="20" fill="#5fb85a"/>
      <circle cx="-14" cy="-22" r="14" fill="#6cc466"/>
      <circle cx="14" cy="-22" r="14" fill="#54ad50"/></g>`;
  }
  function mapHouse(x, y, color) {
    return `<g transform="translate(${x},${y})">
      <ellipse cx="0" cy="20" rx="26" ry="6" fill="rgba(0,0,0,0.08)"/>
      <rect x="-22" y="-6" width="44" height="26" rx="3" fill="${color}"/>
      <polygon points="-26,-6 0,-26 26,-6" fill="#c96a52"/>
      <rect x="-6" y="4" width="12" height="16" rx="2" fill="#7a5a3a"/>
      <rect x="-18" y="0" width="9" height="9" rx="1.5" fill="#fff3b0"/>
      <rect x="9" y="0" width="9" height="9" rx="1.5" fill="#fff3b0"/></g>`;
  }

  function drawMapNode(L, r, done, isCur) {
    const w = 94, h = 78, x0 = L.x - w / 2, y0 = L.y - h / 2 - 6;
    if (done) {
      return `<g>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#ffffff" stroke="#7ec77a" stroke-width="3"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#eafce3" opacity="0.6"/>
        <text x="${L.x - 6}" y="${L.y + 4}" font-size="40" text-anchor="middle">${L.emoji}</text>
        <text class="map-bounce" x="${L.x + 30}" y="${L.y - 14}" font-size="28" text-anchor="middle">${r.emoji}</text>
        <text x="${L.x}" y="${y0 + h + 17}" font-size="15" font-weight="800" text-anchor="middle" fill="#2c6e2c">${cap(L_name(r))}</text>
        <circle cx="${x0 + 16}" cy="${y0 + 16}" r="11" fill="#2bbe4e"/>
        <text x="${x0 + 16}" y="${y0 + 21}" font-size="15" fill="#fff" text-anchor="middle" font-weight="800">✓</text>
      </g>`;
    }
    if (isCur) {
      return `<g>
        <circle class="map-pulse" cx="${L.x}" cy="${L.y - 6}" r="40" fill="#ffd93b"/>
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#fffdf2" stroke="#ffb02e" stroke-width="4"/>
        <text x="${L.x}" y="${L.y + 8}" font-size="40" text-anchor="middle">🔎</text>
        <text x="${L.x}" y="${y0 + h + 17}" font-size="14" font-weight="800" text-anchor="middle" fill="#c77b00">Searching…</text>
      </g>`;
    }
    return `<g opacity="0.92">
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="15" fill="#d9d4cb" stroke="#b9b3a8" stroke-width="3"/>
      <text x="${L.x}" y="${L.y + 14}" font-size="42" text-anchor="middle" fill="#9a948a" font-weight="800">?</text>
    </g>`;
  }

  // Show the place name only once it's rescued (don't spoil the riddle).
  function L_name(r) { return r.location; }

  function buildCityMap() {
    let roads = "", roadsDash = "";
    ROAD_EDGES.forEach(([a, b]) => {
      const A = LOC_LAYOUT[a], B = LOC_LAYOUT[b];
      if (!A || !B) return;
      roads += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#c7b79a" stroke-width="18" stroke-linecap="round"/>`;
      roadsDash += `<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="#f6ecd4" stroke-width="3.5" stroke-dasharray="11 13" stroke-linecap="round"/>`;
    });
    let deco = "";
    DECO_HOUSES.forEach(([x, y, c]) => { deco += mapHouse(x, y, c); });
    DECO_TREES.forEach(([x, y, s]) => { deco += mapTree(x, y, s); });

    const cur = currentRiddle();
    let nodes = "";
    riddles.forEach((r) => {
      const L = LOC_LAYOUT[r.location];
      if (!L) return;
      nodes += drawMapNode(L, r, isSolved(r.id), cur && cur.id === r.id);
    });

    return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#aee68a"/><stop offset="1" stop-color="#8ed46b"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grass)"/>
      <ellipse cx="200" cy="200" rx="150" ry="90" fill="#9bdd78" opacity="0.5"/>
      <ellipse cx="600" cy="380" rx="170" ry="100" fill="#9bdd78" opacity="0.45"/>
      <ellipse cx="420" cy="540" rx="160" ry="70" fill="#9bdd78" opacity="0.4"/>
      <path d="M -20 250 Q 150 300 250 400 T 520 540 L 540 600 L -20 600 Z" fill="#7fc8e8" opacity="0.55"/>
      <ellipse cx="600" cy="455" rx="58" ry="30" fill="#7fc8e8"/>
      <ellipse cx="600" cy="455" rx="58" ry="30" fill="none" stroke="#bfe9f6" stroke-width="3"/>
      ${roads}${roadsDash}
      ${deco}
      ${nodes}
    </svg>`;
  }

  function renderMap() {
    document.getElementById("city-map").innerHTML = buildCityMap();
  }

  /* ============================================================
     BADGES
     ============================================================ */
  function renderBadges() {
    const grid = document.getElementById("badge-grid");
    grid.innerHTML = "";
    riddles.forEach((r) => {
      const done = isSolved(r.id);
      const card = document.createElement("div");
      card.className = "badge-card" + (done ? "" : " empty");
      card.innerHTML = `
        <span class="badge-emoji">${done ? r.emoji : "🔒"}</span>
        <div class="badge-name">${done ? r.badge : "???"}</div>`;
      grid.appendChild(card);
    });
  }

  /* ============================================================
     ENDING
     ============================================================ */
  function runEnding() {
    const parade = document.getElementById("ending-parade");
    parade.textContent = riddles.map((r) => r.emoji).join(" ");
    confetti();
  }

  function confetti() {
    const layer = document.getElementById("confetti");
    if (!layer) return;
    layer.innerHTML = "";
    const colors = ["#ffd93b", "#ff8fb1", "#b58cff", "#5bd1c0", "#ff9f4a", "#6fc36b"];
    for (let i = 0; i < 80; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 2.5) + "s";
      c.style.animationDelay = (Math.random() * 1.5) + "s";
      layer.appendChild(c);
    }
  }

  /* ============================================================
     HELPERS + WIRING
     ============================================================ */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function updateRescueCount() {
    const el = document.getElementById("rescue-count");
    if (el) el.textContent = `${rescuedCount()} / ${riddles.length} rescued`;
  }

  // Title screen buttons
  document.getElementById("btn-start").addEventListener("click", () => {
    state.started = true;
    save();
    // First time with no progress → meet the avatar maker; otherwise back to the game.
    show(state.solved.length ? "game" : "avatar");
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (confirm("Start the whole adventure over? Your badges will be cleared.")) {
      state = defaultState();
      save();
      show("title");
    }
  });

  document.getElementById("btn-avatar-done").addEventListener("click", () => show("game"));

  document.getElementById("btn-hint").addEventListener("click", () => {
    const r = currentRiddle();
    if (!r) return;
    const hint = document.getElementById("hint-text");
    hint.textContent = "🐱 Detective Whiskers says: " + r.hint;
    hint.classList.add("show");
  });

  const playAgain = document.getElementById("btn-play-again");
  if (playAgain) playAgain.addEventListener("click", () => {
    state.solved = [];
    save();
    show("game");
  });

  /* ---------- Start where the player left off ---------- */
  function boot() {
    renderAvatarInto(document.getElementById("avatar-preview"), true);
    document.getElementById("city-art").innerHTML = buildCityArt();
    document.getElementById("detective-art").innerHTML = buildDetective();
    if (!state.started) show("title");
    else if (allDone()) show("ending");
    else show("game");
    updateRescueCount();
  }

  boot();
})();
